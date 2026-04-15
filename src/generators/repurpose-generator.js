import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getMonetization } from "../../config/monetization.js";
import { writeOutput, readInput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";
import { repurposeSchema, validateOutput } from "../utils/schemas.js";

/**
 * 長尺台本から全プラットフォーム用コンテンツを一括生成
 * YouTube説明文（アフィリエイト入り）、Twitter/Xスレッド、Instagramキャプション
 */
export async function generateRepurpose(channelId, scriptPath) {
  channelId = validateChannelId(channelId);
  scriptPath = validateContentPath(scriptPath);
  const channel = getChannel(channelId);
  const monetConfig = getMonetization(channelId);
  const scriptContent = readInput(scriptPath);

  const lang = channel.language === "ja" ? "日本語" : "English";

  const formatPrice = (price, currency) => (currency === "USD" ? `$${price}` : `¥${price.toLocaleString()}`);

  const affiliateList = monetConfig.affiliates
    .map((a) => `- ${a.name} (${a.asp}, ${a.cpa ? "CPA: " + formatPrice(a.cpa, a.currency) : a.commission})`)
    .join("\n");

  const productList = monetConfig.digitalProducts
    .map((p) => `- ${p.name} (${formatPrice(p.price, p.currency)}, ${p.platform})`)
    .join("\n");

  const systemPrompt = `You are a multi-platform content strategist. Write in ${lang}.

## Monetization Context
This channel monetizes through:
- Affiliate links (include relevant ones naturally in YouTube description)
- Digital products (mention where appropriate)

Available affiliates:
${affiliateList}

Available digital products:
${productList}

## Compliance
${monetConfig.compliance.join("\n")}

Respond in valid JSON only — no markdown fences.`;

  const userPrompt = `From this YouTube script, generate content for ALL platforms.

## Source Script:
${scriptContent.slice(0, 5000)}

## YouTube Description Template:
${monetConfig.descriptionTemplate}

## Required JSON Output:
{
  "youtube_description": "Full YouTube description with affiliate links, timestamps, CTA, and compliance disclaimers. Replace {{AFFILIATE_LINKS}} with relevant affiliate mentions. Replace {{DIGITAL_PRODUCTS}} with relevant products. Replace {{CHANNEL_URL}} with placeholder.",
  "twitter_thread": [
    "Tweet 1 (hook — must work standalone as a tweet)",
    "Tweet 2 (key insight #1)",
    "Tweet 3 (key insight #2)",
    "Tweet 4 (surprising fact or stat)",
    "Tweet 5 (CTA with link to video)"
  ],
  "instagram_caption": "Instagram post caption with hashtags (for carousel or Reel)",
  "instagram_carousel_slides": [
    "Slide 1: Hook text",
    "Slide 2: Key point 1",
    "Slide 3: Key point 2",
    "Slide 4: Key point 3",
    "Slide 5: CTA"
  ],
  "affiliate_recommendations": [
    {
      "product": "Product name",
      "placement": "Where in the video to mention it",
      "cta_script": "Exact words to say in the video"
    }
  ]
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.6,
  });

  let repurposeData;
  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    repurposeData = JSON.parse(cleaned);
  } catch {
    repurposeData = { raw: result, parseError: true };
  }

  if (!repurposeData.parseError) {
    const validation = validateOutput(repurposeSchema, repurposeData, "Repurpose");
    if (validation.warnings.length > 0) {
      repurposeData._schemaWarnings = validation.warnings;
      console.warn(validation.warnings.join("\n"));
    }
  }

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/metadata/${ts}_${slug}_repurpose.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(repurposeData, null, 2));

  return { path: fullPath, outputPath, repurpose: repurposeData };
}
