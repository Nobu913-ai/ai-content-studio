import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { platforms } from "../../config/monetization.js";
import { writeOutput, readInput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath, validateTopic } from "../utils/validators.js";

/**
 * 長尺台本から Shorts/TikTok/Reels 用のショートスクリプトを3本生成
 */
export async function generateShorts(channelId, scriptPath) {
  channelId = validateChannelId(channelId);
  scriptPath = validateContentPath(scriptPath);
  const channel = getChannel(channelId);
  const scriptContent = readInput(scriptPath);
  const tiktokTags = platforms.tiktok.hashtags[channelId] || [];

  const lang = channel.language === "ja" ? "日本語" : "English";

  const systemPrompt = `You are a viral short-form content specialist. Write in ${lang}.

## Rules
- Each Short MUST hook in the first 1-2 seconds — no intros, no greetings
- Length: 60-90 seconds when read aloud (TikTok Creator Rewards requires 1min+)
- Structure: HOOK (1-2s) → TENSION (10s) → VALUE (40s) → TWIST/PAYOFF (10s) → CTA (5s)
- Use pattern interrupts: "But here's what nobody tells you..." "Wait, it gets worse..."
- End with a cliffhanger or CTA that drives to the long-form video
- Include [TEXT ON SCREEN] markers for key text overlays
- Respond in valid JSON only — no markdown fences.`;

  const userPrompt = `From this long-form YouTube script, extract 3 viral Short scripts (60-90 seconds each).

Each Short should be a self-contained piece that works standalone but teases the full video.

## Source Script:
${scriptContent.slice(0, 5000)}

## TikTok Hashtags for this channel: ${tiktokTags.map((t) => "#" + t).join(" ")}

## Required JSON Output:
{
  "shorts": [
    {
      "title": "Short title for internal tracking",
      "hook": "The exact first words (must stop the scroll)",
      "script": "Full short script with [TEXT ON SCREEN] markers",
      "cta": "Call-to-action driving to long-form",
      "estimated_seconds": 65,
      "hashtags": {
        "youtube": ["#tag1", "#Shorts"],
        "tiktok": ["#tag1", "#tag2"],
        "instagram": ["#tag1", "#tag2"]
      },
      "viral_score": "high|medium",
      "viral_reason": "Why this has viral potential"
    }
  ]
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.8,
  });

  let shortsData;
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    shortsData = JSON.parse(cleaned);
  } catch {
    shortsData = { raw: result, parseError: true };
  }

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/scripts/${ts}_${slug}_shorts.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(shortsData, null, 2));

  return { path: fullPath, outputPath, shorts: shortsData };
}

/**
 * Shorts先行戦略: トピックから直接Shorts台本を3本生成（長尺台本なし）
 * 仮説検証用 — 反応がよいテーマのみ長尺化する
 */
export async function generateShortsFromTopic(channelId, topic) {
  channelId = validateChannelId(channelId);
  topic = validateTopic(topic);
  const channel = getChannel(channelId);
  const tiktokTags = platforms.tiktok.hashtags[channelId] || [];

  const lang = channel.language === "ja" ? "日本語" : "English";

  const systemPrompt = `You are a viral short-form content specialist. Write in ${lang}.

You create Shorts/TikTok/Reels scripts for hypothesis testing — these are standalone videos to validate a topic's appeal before investing in a long-form video.

## Rules
- Each Short MUST hook in the first 1-2 seconds — no intros, no greetings
- Length: 60-90 seconds when read aloud (TikTok Creator Rewards requires 1min+)
- Structure: HOOK (1-2s) → TENSION (10s) → VALUE (40s) → TWIST/PAYOFF (10s) → CTA (5s)
- Use pattern interrupts: "But here's what nobody tells you..." "Wait, it gets worse..."
- Each Short should explore a DIFFERENT angle on the topic
- Include [TEXT ON SCREEN] markers for key text overlays
- End with engagement bait: question, poll, or "Part 2?" tease
- Respond in valid JSON only — no markdown fences.`;

  const userPrompt = `Create 3 standalone Shorts scripts (60-90 seconds each) for hypothesis testing.

## Channel: ${channel.name}
## Channel tone: ${channel.description}
## Topic: ${topic}
## Target audience: ${channel.target}

## TikTok Hashtags: ${tiktokTags.map((t) => "#" + t).join(" ")}

Each Short should test a DIFFERENT angle on this topic to find the best-performing hook.

## Required JSON Output:
{
  "topic": "${topic}",
  "strategy": "Brief explanation of why these 3 angles were chosen",
  "shorts": [
    {
      "title": "Short title",
      "angle": "The specific angle this tests",
      "hook": "The exact first words (must stop the scroll)",
      "script": "Full short script with [TEXT ON SCREEN] markers",
      "cta": "Engagement CTA (comment, follow, part 2 tease)",
      "estimated_seconds": 65,
      "hashtags": {
        "youtube": ["#tag1", "#Shorts"],
        "tiktok": ["#tag1", "#tag2"],
        "instagram": ["#tag1", "#tag2"]
      },
      "viral_score": "high|medium",
      "viral_reason": "Why this angle has viral potential",
      "longform_potential": "How this could expand into a 10-15min video if it performs well"
    }
  ]
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.8,
  });

  let shortsData;
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    shortsData = JSON.parse(cleaned);
  } catch {
    shortsData = { raw: result, parseError: true };
  }

  const ts = timestamp();
  const slug = topic.replace(/[^a-zA-Z0-9\u3040-\u30FF\u4E00-\u9FFF]+/g, "_").slice(0, 30);
  const outputPath = `content/${channelId}/scripts/${ts}_${slug}_shorts_test.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(shortsData, null, 2));

  return { path: fullPath, outputPath, shorts: shortsData };
}
