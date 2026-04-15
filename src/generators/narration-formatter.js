/**
 * Narration Formatter
 * 台本からナレーション用テキストを整形（ElevenLabs向け）
 * セクションマーカー・ビジュアル指示を除去し、読みやすい音声テキストに変換
 */

import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getVoiceConfig } from "../../config/tools.js";
import { readInput, writeOutput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";

/**
 * 台本からナレーション用テキストを生成
 * @param {string} channelId - チャンネルID
 * @param {string} scriptPath - 台本ファイルパス
 * @returns {Promise<object>} { path, outputPath, narration, segments }
 */
export async function formatNarration(channelId, scriptPath) {
  channelId = validateChannelId(channelId);
  scriptPath = validateContentPath(scriptPath);
  const channel = getChannel(channelId);
  const voiceConfig = getVoiceConfig(channelId);
  const scriptContent = readInput(scriptPath);

  const lang = channel.language === "ja" ? "日本語" : "English";

  const systemPrompt = `You are a narration text formatter. You convert YouTube scripts into clean narration text optimized for AI text-to-speech (ElevenLabs).

## Voice Profile
- Language: ${lang}
- Style: ${voiceConfig.style}
- Description: ${voiceConfig.description}

## Formatting Rules
1. REMOVE all markers: [SECTION:], [B-ROLL:], [TEXT ON SCREEN:], [PAUSE], [SOURCE:], [INFO TYPE:], [INFO DATE:], [~Xs]
2. REMOVE frontmatter (--- blocks)
3. KEEP only spoken narration text
4. Add "..." for natural pauses (where [PAUSE] was)
5. Add line breaks between sections for pacing control
6. Ensure the text flows naturally when read aloud
7. ${channel.language === "ja" ? "漢字の読みが曖昧な場合はひらがなを括弧で補足" : "Include pronunciation hints for Japanese words in parentheses"}
8. Split into logical segments with clear section boundaries

Respond with valid JSON only — no markdown fences.`;

  const userPrompt = `Convert this YouTube script into narration-ready text.

## Script:
${scriptContent.slice(0, 6000)}

## Required JSON Output:
{
  "full_text": "complete narration text as one string, with ... for pauses and \\n for section breaks",
  "segments": [
    {
      "section": "hook",
      "text": "narration text for this section",
      "estimated_seconds": 15,
      "pacing_note": "energetic" or "calm" or "building"
    }
  ],
  "total_estimated_seconds": 120,
  "word_count": 500,
  "character_count": 1500
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.3,
    label: "narration",
    outputHint: `content/${channelId}/scripts/ 配下のナレーションテキスト`,
  });

  let narration;
  if (result === null) {
    // ハイブリッドモード: API未設定時はローカルフォールバックでマーカー除去
    narration = { full_text: cleanScriptForNarration(scriptContent), localFallback: true };
  } else {
    try {
      const cleaned = result
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      narration = JSON.parse(cleaned);
    } catch {
      narration = { full_text: cleanScriptForNarration(scriptContent), parseError: true };
    }
  }

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/metadata/${ts}_${slug}_narration.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(narration, null, 2));

  // プレーンテキスト版も保存（ElevenLabs直接投入用）
  const textPath = `content/${channelId}/scripts/${ts}_${slug}_narration.txt`;
  writeOutput(textPath, narration.full_text || "");

  return { path: fullPath, outputPath, textPath, narration };
}

/**
 * マーカーを除去するフォールバック関数（Claude API なしで動作）
 */
function cleanScriptForNarration(scriptContent) {
  return scriptContent
    .replace(/^---[\s\S]*?---\n*/m, "") // frontmatter
    .replace(/^#.*$/gm, "") // headings
    .replace(/\[SECTION:\s*[^\]]+\]/g, "") // section markers
    .replace(/\[B-ROLL:\s*[^\]]+\]/g, "") // b-roll markers
    .replace(/\[TEXT ON SCREEN:\s*[^\]]+\]/g, "") // text overlay markers
    .replace(/\[SOURCE:\s*[^\]]+\]/g, "") // source markers
    .replace(/\[INFO TYPE:\s*[^\]]+\]/g, "") // info type markers
    .replace(/\[INFO DATE:\s*[^\]]+\]/g, "") // info date markers
    .replace(/\[~\d+s?\]/g, "") // time annotations
    .replace(/\[PAUSE\]/g, "...") // pause markers → ellipsis
    .replace(/\n{3,}/g, "\n\n") // excessive newlines
    .trim();
}

/**
 * ナレーション結果を見やすく表示
 */
export function formatNarrationSummary(narration) {
  if (narration.parseError) {
    return `\n  Narration text extracted (fallback mode, ${narration.full_text.length} chars)\n`;
  }

  let output = "";
  output += `\n  --- Narration Summary ---\n`;
  output += `  Total: ~${narration.total_estimated_seconds}s | ${narration.character_count || narration.full_text.length} chars\n`;
  output += `  Segments: ${narration.segments?.length || 0}\n`;

  for (const seg of narration.segments || []) {
    output += `    [${seg.section}] ~${seg.estimated_seconds}s (${seg.pacing_note})\n`;
  }

  return output;
}
