import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { writeOutput, readInput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";

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
- Titles: 50-60 characters max. Use power words. Include primary keyword near the start.
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
    {"text": "Primary title option", "ctr_reason": "why this title works"},
    {"text": "Alternative title A", "ctr_reason": "why"},
    {"text": "Alternative title B", "ctr_reason": "why"}
  ],
  "description": "Full YouTube description with timestamps and CTAs",
  "tags": ["tag1", "tag2", "..."],
  "thumbnail_ideas": [
    {"concept": "description of thumbnail", "text_overlay": "big text on thumbnail"}
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
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    seoData = JSON.parse(cleaned);
  } catch {
    seoData = { raw: result, parseError: true };
  }

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/metadata/${ts}_${slug}_seo.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(seoData, null, 2));

  return { path: fullPath, outputPath, seo: seoData };
}
