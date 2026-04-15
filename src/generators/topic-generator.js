/**
 * Topic Generator
 * Claude API を使い、チャンネルの方向性に沿った新しい動画トピック案を生成
 * 5つの切り口: トレンド連動 / 既存ヒット派生 / 対決比較 / ランキング / 反常識
 */

import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { writeOutput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId } from "../utils/validators.js";

const ANGLES = [
  { id: "trend", name: "トレンド連動", desc: "現在話題のニュース・イベントに絡めたネタ" },
  { id: "derivative", name: "既存ヒットの派生", desc: "人気が出そうな既存トピックの続編・深掘り" },
  { id: "comparison", name: "対決・比較系", desc: "「A vs B」形式で視聴者の関心を引くネタ" },
  { id: "ranking", name: "ランキング・リスト系", desc: "「○○ベスト5」「知らないと損する○○3選」" },
  { id: "contrarian", name: "反常識・意外性", desc: "「実は○○は間違い」「○○の本当の意味」" },
];

/**
 * チャンネルに合った新しいトピック案をAIで生成
 * @param {string} channelId - チャンネルID
 * @param {object} [options]
 * @param {number} [options.count] - 各切り口のアイデア数 (default: 2)
 * @returns {Promise<object>} { path, outputPath, topics }
 */
export async function generateTopics(channelId, options = {}) {
  channelId = validateChannelId(channelId);
  const channel = getChannel(channelId);
  const count = options.count || 2;

  const lang = channel.language === "ja" ? "日本語" : "English";

  // 既存トピックを収集（重複回避用）
  const existingTopics = [];
  for (const cat of channel.categories) {
    for (const t of cat.topics) {
      existingTopics.push(t.title);
    }
  }

  const systemPrompt = `You are a YouTube content strategist. Respond in ${lang}.

## Channel Profile
- Channel: ${channel.name}
- Description: ${channel.description}
- Target: ${channel.target}
- Tone: ${channel.tone}
- SEO Tags: ${channel.seoTags.join(", ")}

## Goal
Generate fresh, high-potential video topic ideas that:
1. Align with this channel's audience and tone
2. Have strong search/discovery potential
3. Can be turned into both Shorts (30-60s) and long-form (8-15min)
4. Don't overlap with existing topics

Respond in valid JSON only — no markdown fences.`;

  const anglesDesc = ANGLES.map((a) => `- ${a.name}: ${a.desc}`).join("\n");

  const userPrompt = `Generate ${count} topic ideas for EACH of these 5 angles:

${anglesDesc}

## Existing topics (DO NOT duplicate these):
${existingTopics.map((t) => `- ${t}`).join("\n")}

## Required JSON Output:
{
  "channel": "${channelId}",
  "topics": [
    {
      "title": "Video title idea",
      "angle": "trend|derivative|comparison|ranking|contrarian",
      "angle_name": "切り口名",
      "search_volume": "high|medium|low",
      "viral_potential": "high|medium|low",
      "difficulty": "low|medium|high",
      "shorts_hook": "30-second hook for Shorts version",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "why": "Why this topic works for this channel"
    }
  ]
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.8,
    label: "topic-gen",
    outputHint: `content/${channelId}/metadata/ 配下のトピック案ファイル`,
  });

  // ハイブリッドモード: API未設定時は手動ワークフロー
  if (result === null) {
    return { path: null, outputPath: null, topics: null, manual: true };
  }

  let topics;
  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    topics = JSON.parse(cleaned);
  } catch {
    topics = { raw: result, parseError: true };
  }

  const ts = timestamp();
  const outputPath = `content/${channelId}/metadata/${ts}_topic_ideas.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(topics, null, 2));

  return { path: fullPath, outputPath, topics };
}

/**
 * トピック案を見やすく表示
 */
export function formatTopicIdeas(topics) {
  if (topics.parseError) return topics.raw;

  let output = "";
  output += `\n  === Topic Ideas (${topics.topics?.length || 0} ideas) ===\n`;

  // 切り口ごとにグループ化
  const grouped = {};
  for (const t of topics.topics || []) {
    const key = t.angle_name || t.angle;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  for (const [angle, items] of Object.entries(grouped)) {
    output += `\n  --- ${angle} ---\n`;
    for (const t of items) {
      const viral = t.viral_potential === "high" ? "[!!]" : t.viral_potential === "medium" ? "[++]" : "[--]";
      output += `  ${viral} ${t.title}\n`;
      output += `    Search: ${t.search_volume} | Viral: ${t.viral_potential} | Difficulty: ${t.difficulty}\n`;
      output += `    Shorts hook: "${t.shorts_hook}"\n`;
      if (t.keywords) output += `    Keywords: ${t.keywords.join(", ")}\n`;
      if (t.why) output += `    Why: ${t.why}\n`;
    }
  }

  return output;
}
