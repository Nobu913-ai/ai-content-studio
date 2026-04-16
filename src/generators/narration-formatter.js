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
  const cleaned = scriptContent
    .replace(/^---[\s\S]*?---\n*/m, "") // frontmatter
    .replace(/^#.*$/gm, "") // headings
    .replace(/\[SECTION:\s*[^\]]+\](\s*\[~\d+s?\])?/g, "") // section markers (with or without time)
    .replace(/\[B-ROLL:\s*[^\]]+\]/g, "") // b-roll markers
    .replace(/\[TEXT ON SCREEN:\s*[^\]]+\]/g, "") // text overlay markers
    .replace(/\[SOURCE:\s*[^\]]+\]/g, "") // source markers
    .replace(/\[INFO TYPE:\s*[^\]]+\]/g, "") // info type markers
    .replace(/\[INFO DATE:\s*[^\]]+\]/g, "") // info date markers
    .replace(/\[~\d+s?\]/g, "") // time annotations
    .replace(/\[PAUSE\]/g, "") // pause markers（TTS側で間を制御）
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **太字** → プレーンテキスト
    .replace(/^---+$/gm, "") // 区切り線を除去
    .replace(/^※.*$/gm, "") // 免責事項行を除去
    .replace(/\.\.\./g, "") // ... 省略記号を除去
    .replace(/^[Q][:：]\s*/gm, "") // Q: プレフィックスを除去（読み上げ不要）
    .replace(/^金融庁「[^」]+」.*$/gm, "") // 金融庁出典行を除去（本文中の「金融庁」は残す）
    .replace(/\n{3,}/g, "\n\n") // excessive newlines
    .trim();

  return addReadingHints(cleaned);
}

/**
 * TTS向け読み仮名変換
 * ElevenLabs が誤読しやすい漢字「だけ」をひらがなに置換
 *
 * 方針:
 * - 一般的な漢字はTTSが正しく読めるので変換しない（投資、動画、設定 等）
 * - 変換しすぎるとひらがなの羅列になり、単語境界が不明瞭になって
 *   イントネーション・区切りが崩壊するため、最小限に留める
 * - 多読文字（月=つき/げつ）や金融専門用語など、本当に誤読される語のみ対象
 */
function addReadingHints(text) {
  let result = text;

  // --- Phase 1: パターンベース変換（文脈依存の多読文字） ---

  // 「月X円」「月X,XXX円」→「つきX円」（毎月の意味。「1月」のがつ読みと区別）
  result = result.replace(/月([\d,]+円)/g, "つき$1");
  // 「Xつ目」→「Xつめ」
  result = result.replace(/(\d)つ目/g, "$1つめ");
  // 「%」→「パーセント」（記号の読み上げ対策）
  result = result.replace(/%/g, "パーセント");

  // --- Phase 2: 本当に誤読される語だけ変換 ---
  // ※ 一般的な漢字（投資、動画、設定、商品、証券、口座 等）は変換しない
  const readings = [
    // 金融専門用語（TTSが知らない可能性が高い語）
    ["非課税", "ひかぜい"],
    ["元本割れ", "がんぽんわれ"],
    ["個別株", "こべつかぶ"],
    ["売却", "ばいきゃく"],
    ["小額", "少額"],

    // 多読文字・誤読頻度の高い語
    ["見終わる", "み終わる"],
    ["今日中", "きょうじゅう"],
    ["翌営業日", "よくえいぎょうび"],
    ["翌年", "よくねん"],
    ["生涯", "しょうがい"],
    ["保有限度額", "保有 限度額"],
    ["儲かった", "もうかった"],
    ["儲かって", "もうかって"],
    ["拘束", "こうそく"],
  ];

  for (const [kanji, reading] of readings) {
    result = result.replaceAll(kanji, reading);
  }

  return result;
}

/**
 * ナレーションテキストをセクション単位で分割
 * ElevenLabs に個別送信してから結合するために使用
 *
 * 短い段落は前後と結合して、1セグメント200〜600文字程度にまとめる。
 * 短すぎるセグメントは音声の途切れ・不自然な間の原因になる。
 *
 * @param {string} text - クリーン済みナレーションテキスト
 * @param {number} [minChars=200] - セグメント最小文字数
 * @returns {string[]} セクション単位のテキスト配列
 */
export function splitNarrationSegments(text, minChars = 200) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (paragraphs.length === 0) return [];

  // 段落を結合してminChars以上のセグメントにまとめる
  const segments = [];
  let current = paragraphs[0];

  for (let i = 1; i < paragraphs.length; i++) {
    if (current.length < minChars) {
      current += "\n" + paragraphs[i];
    } else {
      segments.push(current);
      current = paragraphs[i];
    }
  }
  if (current) segments.push(current);

  return segments;
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
