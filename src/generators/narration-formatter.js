/**
 * Narration Formatter
 * 台本からナレーション用テキストを整形（ElevenLabs向け）
 *
 * 整形パイプライン:
 *   1. マーカー除去 (cleanScriptForNarration)
 *   2. TTS向け短文化 (optimizeForTTS)
 *   3. 読み辞書適用 (applyPronunciationDictionary)
 */

import { readFileSync, existsSync } from "fs";
import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getVoiceConfig } from "../../config/tools.js";
import { readInput, writeOutput, timestamp, resolve } from "../utils/file-helpers.js";
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

  const systemPrompt = `You are a narration text formatter for AI text-to-speech (ElevenLabs).
You convert YouTube scripts into TTS-optimized narration text.

## Voice Profile
- Language: ${lang}
- Style: ${voiceConfig.style}
- Description: ${voiceConfig.description}

## TTS最適化ルール
1. REMOVE all markers: [SECTION:], [B-ROLL:], [TEXT ON SCREEN:], [PAUSE], [SOURCE:], [INFO TYPE:], [INFO DATE:], [~Xs]
2. REMOVE frontmatter (--- blocks), headings, disclaimers (※行)
3. KEEP only spoken narration text
4. **1文を20〜35文字以内に短くする**（TTSの区切り・イントネーション安定のため）
5. 長い文は「、」の位置で分割し、それぞれ独立した文にする
6. 数字や制度名を含む文は特に短く区切る
7. 強調したい箇所の前後に空行を入れる
8. コロン（：）は使わず改行に置き換える
9. カギ括弧の連続使用は簡略化する
10. ${channel.language === "ja" ? "漢字はそのまま残す。ひらがな化はしない" : "Keep natural English phrasing"}
11. Split into logical segments with clear section boundaries

Respond with valid JSON only — no markdown fences.`;

  const userPrompt = `Convert this YouTube script into TTS-optimized narration text.

## Script:
${scriptContent.slice(0, 6000)}

## Required JSON Output:
{
  "full_text": "complete narration text. Each sentence should be 20-35 chars max. Use \\n for line breaks between sentences, \\n\\n for section breaks.",
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
    // ハイブリッドモード: API未設定時はローカルフォールバックで整形
    const cleaned = cleanScriptForNarration(scriptContent);
    const optimized = optimizeForTTS(cleaned);
    const withDict = applyPronunciationDictionary(optimized, channelId);
    narration = { full_text: withDict, localFallback: true };
  } else {
    try {
      const cleaned = result
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      narration = JSON.parse(cleaned);
      // Claude API の出力にも読み辞書を適用
      if (narration.full_text) {
        narration.full_text = applyPronunciationDictionary(narration.full_text, channelId);
      }
    } catch {
      const cleaned = cleanScriptForNarration(scriptContent);
      const optimized = optimizeForTTS(cleaned);
      const withDict = applyPronunciationDictionary(optimized, channelId);
      narration = { full_text: withDict, parseError: true };
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

// =========================================================================
// Phase 1: マーカー除去
// =========================================================================

/**
 * 台本からマーカー・メタデータを除去（Claude API なしで動作）
 */
function cleanScriptForNarration(scriptContent) {
  return scriptContent
    .replace(/^---[\s\S]*?---\n*/m, "") // frontmatter
    .replace(/^#.*$/gm, "") // headings
    .replace(/\[SECTION:\s*[^\]]+\](\s*\[~\d+s?\])?/g, "") // section markers
    .replace(/\[B-ROLL:\s*[^\]]+\]/g, "")
    .replace(/\[TEXT ON SCREEN:\s*[^\]]+\]/g, "")
    .replace(/\[SOURCE:\s*[^\]]+\]/g, "")
    .replace(/\[INFO TYPE:\s*[^\]]+\]/g, "")
    .replace(/\[INFO DATE:\s*[^\]]+\]/g, "")
    .replace(/\[~\d+s?\]/g, "")
    .replace(/\[PAUSE\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **太字** → プレーン
    .replace(/^---+$/gm, "")
    .replace(/^※.*$/gm, "") // 免責事項行
    .replace(/\.\.\./g, "")
    .replace(/^[Q][:：]\s*/gm, "") // Q: プレフィックス
    .replace(/^金融庁「[^」]+」.*$/gm, "") // 出典行
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// =========================================================================
// Phase 2: TTS向け短文化・句読点最適化
// =========================================================================

/**
 * テキストをTTS向けに最適化
 * - 長文を短文に分割（目安: 1文35字以内）
 * - コロン・ステップ番号を改行に変換
 * - 句読点を整理
 */
function optimizeForTTS(text) {
  let result = text;

  // コロン（：/:）→ 改行（TTSで不安定になるため）
  result = result.replace(/[:：]\s*/g, "。\n");

  // 「ステップX。」→ 独立行に
  result = result.replace(/^(ステップ\d+)。\n/gm, "$1。\n");

  // 長い文を「、」で分割（35字超の文を対象）
  result = result
    .split("\n")
    .map((line) => splitLongSentence(line, 35))
    .join("\n");

  // %→パーセント（記号読み上げ対策）
  result = result.replace(/%/g, "パーセント");

  // 連続空行を整理
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/**
 * 1文が maxChars を超える場合、「、」の位置で分割して複数文にする
 */
function splitLongSentence(line, maxChars) {
  line = line.trim();
  if (!line || line.length <= maxChars) return line;

  // 「、」で分割候補を探す
  const parts = [];
  let remaining = line;

  while (remaining.length > maxChars) {
    // maxChars 以内で最後の「、」を探す
    let splitAt = -1;
    for (let i = Math.min(maxChars, remaining.length) - 1; i >= 0; i--) {
      if (remaining[i] === "、") {
        splitAt = i;
        break;
      }
    }

    if (splitAt === -1) {
      // 「、」がない場合は「。」を探す
      for (let i = Math.min(maxChars, remaining.length) - 1; i >= 0; i--) {
        if (remaining[i] === "。") {
          splitAt = i;
          break;
        }
      }
    }

    if (splitAt === -1) {
      // 分割点がない場合はそのまま
      break;
    }

    const part = remaining.slice(0, splitAt + 1).trim();
    // 「、」で終わる場合は「。」に変えて文を閉じる
    if (part.endsWith("、")) {
      parts.push(part.slice(0, -1) + "。");
    } else {
      parts.push(part);
    }
    remaining = remaining.slice(splitAt + 1).trim();
  }

  if (remaining) {
    parts.push(remaining);
  }

  return parts.join("\n");
}

// =========================================================================
// Phase 3: 読み辞書適用
// =========================================================================

/** 辞書キャッシュ（channelId → entries） */
const _dictionaryCache = new Map();

/**
 * pronunciation-dictionary.json を読み込む
 * entries + categories（全カテゴリ） + channel_overrides を統合して返す
 *
 * @param {string} [channelId] - チャンネルID（channel_overrides 適用用）
 * @returns {Array<[string, string]>} [元表記, 読み] のペア配列（長い語句順）
 */
function loadDictionary(channelId) {
  const cacheKey = channelId || "__default__";
  if (_dictionaryCache.has(cacheKey)) return _dictionaryCache.get(cacheKey);

  const dictPath = resolve("config/pronunciation-dictionary.json");
  if (!existsSync(dictPath)) {
    _dictionaryCache.set(cacheKey, []);
    return [];
  }

  try {
    const raw = JSON.parse(readFileSync(dictPath, "utf-8"));

    // 1. ベース entries
    const merged = { ...(raw.entries || {}) };

    // 2. カテゴリ辞書を統合（全カテゴリ）
    if (raw.categories) {
      for (const cat of Object.values(raw.categories)) {
        if (cat.entries) {
          Object.assign(merged, cat.entries);
        }
      }
    }

    // 3. チャンネル別オーバーライド（最優先）
    if (channelId && raw.channel_overrides && raw.channel_overrides[channelId]) {
      Object.assign(merged, raw.channel_overrides[channelId]);
    }

    // 長い語句から順にマッチさせるためソート
    const entries = Object.entries(merged);
    entries.sort((a, b) => b[0].length - a[0].length);
    _dictionaryCache.set(cacheKey, entries);
    return entries;
  } catch (e) {
    console.warn(`  [Warning] 読み辞書の読み込みに失敗: ${e.message}`);
    _dictionaryCache.set(cacheKey, []);
    return [];
  }
}

/**
 * テキストに読み辞書を適用
 * 辞書に登録された語句のみ置換する（ピンポイント方式）
 * @param {string} text
 * @param {string} [channelId] - チャンネルID（channel_overrides 適用用）
 */
function applyPronunciationDictionary(text, channelId) {
  const dict = loadDictionary(channelId);
  if (dict.length === 0) return text;

  let result = text;
  for (const [original, reading] of dict) {
    result = result.replaceAll(original, reading);
  }
  return result;
}

/**
 * 辞書キャッシュをクリア（テスト用）
 */
export function clearDictionaryCache() {
  _dictionaryCache.clear();
}

// =========================================================================
// TTS向けリライト（台本→TTS短文版への一括変換）
// =========================================================================

/**
 * 台本テキストをTTS向け短文版に変換する
 * cleanScriptForNarration → optimizeForTTS → applyPronunciationDictionary の全パイプライン
 *
 * @param {string} scriptContent - 台本テキスト（マーカー付きでもOK）
 * @param {object} [options]
 * @param {number} [options.maxChars=25] - 1文の最大文字数目安
 * @returns {string} TTS用に最適化されたテキスト
 */
export function rewriteForTTS(scriptContent, options = {}) {
  const { maxChars = 25 } = options;

  // Phase 1: マーカー除去
  let text = cleanScriptForNarration(scriptContent);

  // Phase 2: TTS向け短文化（カスタム maxChars 対応）
  // コロン→改行
  text = text.replace(/[:：]\s*/g, "。\n");
  text = text.replace(/^(ステップ\d+)。\n/gm, "$1。\n");

  // 短文分割（指定 maxChars で分割）
  text = text
    .split("\n")
    .map((line) => splitLongSentence(line, maxChars))
    .join("\n");

  // %→パーセント
  text = text.replace(/%/g, "パーセント");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  // Phase 3: 読み辞書適用
  text = applyPronunciationDictionary(text);

  return text;
}

// =========================================================================
// セグメント分割・表示
// =========================================================================

/**
 * ナレーションテキストをセグメント単位で分割
 * ElevenLabs に個別送信してから結合するために使用
 *
 * 短い段落は前後と結合して、1セグメント200〜600文字程度にまとめる。
 *
 * @param {string} text - 整形済みナレーションテキスト
 * @param {number} [minChars=200] - セグメント最小文字数
 * @returns {string[]} セクション単位のテキスト配列
 */
export function splitNarrationSegments(text, minChars = 200) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (paragraphs.length === 0) return [];

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
  if (narration.parseError || narration.localFallback) {
    return `\n  Narration text extracted (${narration.parseError ? "parse error" : "local"} fallback, ${narration.full_text.length} chars)\n`;
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
