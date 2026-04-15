import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { writeOutput, readInput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";
import { seoSchema, validateOutput } from "../utils/schemas.js";

/**
 * 台本ファイルからSEOメタデータ（タイトル・説明文・タグ）を生成
 */
export async function generateSEO(channelId, scriptPath) {
  channelId = validateChannelId(channelId);
  scriptPath = validateContentPath(scriptPath);
  const channel = getChannel(channelId);
  const scriptContent = readInput(scriptPath);

  const lang = channel.language === "ja" ? "日本語" : "English";

  const systemPrompt = `You are a YouTube SEO specialist. You optimize metadata in ${lang}.

Your goal: maximize Click-Through Rate (CTR) and discoverability while accurately representing the content.

## Rules
- Titles: Generate 10 options. 50-60 characters max. Use power words. Include primary keyword near the start. Mix styles: question, number, how-to, surprising fact.
- Thumbnail text: Generate 5 options. 3-5 words max, large readable text. Must create curiosity gap.
- Description: First 2 lines are critical (shown in search). Include CTA and timestamps.
- Tags: 15-20 tags ordered by relevance. Mix broad and long-tail keywords.
- Respond in valid JSON only — no markdown fences, no explanation.`;

  const userPrompt = `Analyze this YouTube script and generate optimized SEO metadata.

Channel SEO tags for context: ${channel.seoTags.join(", ")}

## Script Content:
${scriptContent.slice(0, 4000)}

## Required JSON Output Format:
{
  "titles": [
    {"text": "Title option 1 (primary)", "ctr_reason": "why this title works"},
    {"text": "Title option 2", "ctr_reason": "why"},
    {"text": "Title option 3", "ctr_reason": "why"},
    {"text": "Title option 4", "ctr_reason": "why"},
    {"text": "Title option 5", "ctr_reason": "why"},
    {"text": "Title option 6", "ctr_reason": "why"},
    {"text": "Title option 7", "ctr_reason": "why"},
    {"text": "Title option 8", "ctr_reason": "why"},
    {"text": "Title option 9", "ctr_reason": "why"},
    {"text": "Title option 10", "ctr_reason": "why"}
  ],
  "thumbnail_texts": [
    {"text": "3-5 word overlay text 1", "why": "why this creates curiosity"},
    {"text": "3-5 word overlay text 2", "why": "why this creates curiosity"},
    {"text": "3-5 word overlay text 3", "why": "why this creates curiosity"},
    {"text": "3-5 word overlay text 4", "why": "why this creates curiosity"},
    {"text": "3-5 word overlay text 5", "why": "why this creates curiosity"}
  ],
  "description": "Full YouTube description with timestamps and CTAs",
  "tags": ["tag1", "tag2", "...up to 20 tags"],
  "thumbnail_ideas": [
    {"concept": "description of thumbnail visual", "text_overlay": "big text on thumbnail"}
  ],
  "shorts_hooks": [
    "30-second hook clip idea for Shorts/Reels #1",
    "30-second hook clip idea for Shorts/Reels #2"
  ]
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 2048,
    temperature: 0.5,
  });

  let seoData;
  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    seoData = JSON.parse(cleaned);
  } catch {
    seoData = { raw: result, parseError: true };
  }

  // スキーマ検証
  let schemaWarnings = [];
  if (!seoData.parseError) {
    const validation = validateOutput(seoSchema, seoData, "SEO");
    schemaWarnings = validation.warnings;
    if (schemaWarnings.length > 0) {
      seoData._schemaWarnings = schemaWarnings;
      console.warn(schemaWarnings.join("\n"));
    }
  }

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/metadata/${ts}_${slug}_seo.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(seoData, null, 2));

  return { path: fullPath, outputPath, seo: seoData, schemaWarnings };
}
