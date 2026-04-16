/**
 * TTS Benchmark
 * Voice / Model / Script / Provider の A/B テスト用ベンチマーク
 *
 * 同一サンプルテキストで複数の voice / model / provider 組み合わせを生成し、
 * 比較結果を markdown レポートとして出力する
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { resolve, writeOutput, timestamp } from "../utils/file-helpers.js";
import { getVoiceConfig } from "../../config/tools.js";
import { generateNarration, listVoices, getUsage } from "../clients/elevenlabs-client.js";
import * as voicevoxClient from "../clients/voicevox-client.js";
import { splitNarrationSegments } from "./narration-formatter.js";

/**
 * Voice 比較ベンチマーク
 * 同一テキスト・同一モデルで複数 Voice を比較生成
 *
 * @param {string} channelId - チャンネルID
 * @param {string} sampleText - サンプルテキスト（30〜45秒分推奨）
 * @param {object} options
 * @param {string[]} options.voiceIds - 比較する Voice ID の配列
 * @param {string} [options.model] - モデル名（全 Voice 共通）
 * @param {string} [options.label] - テスト名ラベル
 * @returns {Promise<object>} ベンチマーク結果
 */
export async function benchmarkVoices(channelId, sampleText, options = {}) {
  const { voiceIds, model, label = "voice-benchmark" } = options;

  if (!voiceIds || voiceIds.length === 0) {
    throw new Error("voiceIds を1つ以上指定してください");
  }

  console.log(`\n  [Benchmark] Voice比較: ${voiceIds.length} voices × model: ${model || "default"}`);
  console.log(`  [Benchmark] サンプル: ${sampleText.length} chars`);

  // 残りクォータを確認
  let usageBefore;
  try {
    usageBefore = await getUsage();
    console.log(`  [Benchmark] クォータ残: ${usageBefore.remaining} chars`);
    const estimatedCost = sampleText.length * voiceIds.length;
    if (estimatedCost > usageBefore.remaining) {
      throw new Error(
        `クォータ不足: 必要 ${estimatedCost} chars, 残り ${usageBefore.remaining} chars`,
      );
    }
  } catch (e) {
    if (e.message.includes("クォータ不足")) throw e;
    console.log(`  [Benchmark] クォータ確認スキップ: ${e.message}`);
  }

  const segments = splitNarrationSegments(sampleText);
  const ts = timestamp();
  const results = [];

  for (let i = 0; i < voiceIds.length; i++) {
    const voiceId = voiceIds[i];
    console.log(`\n  [Benchmark] Voice ${i + 1}/${voiceIds.length}: ${voiceId}`);

    try {
      const startTime = Date.now();
      const audio = await generateNarration(channelId, sampleText, {
        voiceId,
        model,
        segments,
      });
      const elapsed = Date.now() - startTime;

      results.push({
        voiceId,
        model: model || "eleven_multilingual_v2",
        status: "ok",
        outputPath: audio.outputPath,
        fileSize: audio.metadata.text_length,
        segments: audio.metadata.segments,
        elapsedMs: elapsed,
      });
    } catch (e) {
      results.push({
        voiceId,
        model: model || "eleven_multilingual_v2",
        status: "error",
        error: e.message,
      });
    }
  }

  // レポート生成
  const report = generateBenchmarkReport({
    type: "voice",
    label,
    channelId,
    timestamp: ts,
    sampleLength: sampleText.length,
    segmentCount: segments.length,
    results,
  });

  const reportPath = `content/${channelId}/metadata/${ts}_${label}.md`;
  writeOutput(reportPath, report);

  console.log(`\n  [Benchmark] レポート: ${reportPath}`);
  return { reportPath, results };
}

/**
 * Model 比較ベンチマーク
 * 同一テキスト・同一 Voice で複数モデルを比較生成
 *
 * @param {string} channelId - チャンネルID
 * @param {string} sampleText - サンプルテキスト
 * @param {object} options
 * @param {string[]} options.models - 比較する Model ID の配列
 * @param {string} [options.voiceId] - Voice ID（省略時はチャンネル設定）
 * @param {string} [options.label] - テスト名ラベル
 * @returns {Promise<object>} ベンチマーク結果
 */
export async function benchmarkModels(channelId, sampleText, options = {}) {
  const { models, voiceId, label = "model-benchmark" } = options;
  const voiceConfig = getVoiceConfig(channelId);
  const useVoiceId = voiceId || voiceConfig.voice_id;

  if (!models || models.length === 0) {
    throw new Error("models を1つ以上指定してください");
  }

  console.log(`\n  [Benchmark] Model比較: voice: ${useVoiceId} × ${models.length} models`);
  console.log(`  [Benchmark] サンプル: ${sampleText.length} chars`);

  const segments = splitNarrationSegments(sampleText);
  const ts = timestamp();
  const results = [];

  for (let i = 0; i < models.length; i++) {
    const modelId = models[i];
    console.log(`\n  [Benchmark] Model ${i + 1}/${models.length}: ${modelId}`);

    try {
      const startTime = Date.now();
      const audio = await generateNarration(channelId, sampleText, {
        voiceId: useVoiceId,
        model: modelId,
        segments,
      });
      const elapsed = Date.now() - startTime;

      results.push({
        voiceId: useVoiceId,
        model: modelId,
        status: "ok",
        outputPath: audio.outputPath,
        fileSize: audio.metadata.text_length,
        segments: audio.metadata.segments,
        elapsedMs: elapsed,
      });
    } catch (e) {
      results.push({
        voiceId: useVoiceId,
        model: modelId,
        status: "error",
        error: e.message,
      });
    }
  }

  const report = generateBenchmarkReport({
    type: "model",
    label,
    channelId,
    timestamp: ts,
    sampleLength: sampleText.length,
    segmentCount: segments.length,
    results,
  });

  const reportPath = `content/${channelId}/metadata/${ts}_${label}.md`;
  writeOutput(reportPath, report);

  console.log(`\n  [Benchmark] レポート: ${reportPath}`);
  return { reportPath, results };
}

/**
 * Script 比較ベンチマーク
 * 同一 Voice・同一 Model で複数の原稿ファイルを比較生成
 *
 * @param {string} channelId - チャンネルID
 * @param {string[]} scriptPaths - 比較する原稿ファイルパスの配列
 * @param {object} options
 * @param {string} [options.voiceId] - Voice ID（省略時はチャンネル設定）
 * @param {string} [options.model] - モデル名
 * @param {string} [options.label] - テスト名ラベル
 * @returns {Promise<object>} ベンチマーク結果
 */
export async function benchmarkScripts(channelId, scriptPaths, options = {}) {
  const { voiceId, model, label = "script-benchmark" } = options;
  const voiceConfig = getVoiceConfig(channelId);
  const useVoiceId = voiceId || voiceConfig.voice_id;
  const useModel = model || "eleven_multilingual_v2";

  if (!scriptPaths || scriptPaths.length === 0) {
    throw new Error("scriptPaths を1つ以上指定してください");
  }

  console.log(`\n  [Benchmark] Script比較: ${scriptPaths.length} scripts`);
  console.log(`  [Benchmark] Voice: ${useVoiceId} / Model: ${useModel}`);

  const { readFileSync } = await import("fs");
  const ts = timestamp();
  const results = [];

  for (let i = 0; i < scriptPaths.length; i++) {
    const scriptPath = scriptPaths[i];
    const scriptName = scriptPath.split("/").pop().split("\\").pop();
    console.log(`\n  [Benchmark] Script ${i + 1}/${scriptPaths.length}: ${scriptName}`);

    try {
      const text = readFileSync(resolve(scriptPath), "utf-8").trim();
      const segments = splitNarrationSegments(text);
      const startTime = Date.now();
      const audio = await generateNarration(channelId, text, {
        voiceId: useVoiceId,
        model: useModel,
        segments,
      });
      const elapsed = Date.now() - startTime;

      results.push({
        scriptPath: scriptName,
        voiceId: useVoiceId,
        model: useModel,
        status: "ok",
        outputPath: audio.outputPath,
        textLength: text.length,
        segments: audio.metadata.segments,
        elapsedMs: elapsed,
      });
    } catch (e) {
      results.push({
        scriptPath: scriptName,
        voiceId: useVoiceId,
        model: useModel,
        status: "error",
        error: e.message,
      });
    }
  }

  const report = generateScriptBenchmarkReport({
    label,
    channelId,
    timestamp: ts,
    voiceId: useVoiceId,
    model: useModel,
    results,
  });

  const reportPath = `content/${channelId}/metadata/${ts}_${label}.md`;
  writeOutput(reportPath, report);

  console.log(`\n  [Benchmark] レポート: ${reportPath}`);
  return { reportPath, results };
}

/**
 * Script ベンチマークレポート生成
 */
function generateScriptBenchmarkReport(data) {
  const lines = [];
  lines.push("# TTS Script Benchmark");
  lines.push("");
  lines.push(`- Label: ${data.label}`);
  lines.push(`- Channel: ${data.channelId}`);
  lines.push(`- Date: ${data.timestamp}`);
  lines.push(`- Voice: ${data.voiceId}`);
  lines.push(`- Model: ${data.model}`);
  lines.push("");
  lines.push("## Results");
  lines.push("");
  lines.push("| # | Script | Status | Chars | Segments | File | Time |");
  lines.push("|---|--------|--------|-------|----------|------|------|");

  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    const time = r.elapsedMs ? `${(r.elapsedMs / 1000).toFixed(1)}s` : "-";
    const file = r.outputPath || r.error || "-";
    const chars = r.textLength || "-";
    const segs = r.segments || "-";
    lines.push(`| ${i + 1} | ${r.scriptPath} | ${r.status} | ${chars} | ${segs} | ${file} | ${time} |`);
  }

  lines.push("");
  lines.push("## 評価スコアシート（各項目 1〜5）");
  lines.push("");

  const colHeaders = data.results.map((_, i) => `#${i + 1}`);
  const colSep = colHeaders.map(() => "---");
  lines.push(`| 評価項目 | ${colHeaders.join(" | ")} |`);
  lines.push(`|----------|${colSep.join("|")}|`);

  const criteria = [
    "誤読率（少ないほど高得点）",
    "明瞭さ・聞き取りやすさ",
    "間・ポーズの自然さ",
    "信頼感・説明向きか",
    "総合評価",
  ];

  for (const label of criteria) {
    const cells = colHeaders.map(() => "  ");
    lines.push(`| ${label} | ${cells.join(" | ")} |`);
  }

  lines.push("");
  lines.push("### メモ");
  lines.push("");
  for (let i = 0; i < data.results.length; i++) {
    lines.push(`- **#${i + 1}** (${data.results[i].scriptPath}): `);
  }

  lines.push("");
  lines.push("## 採用判定");
  lines.push("");
  lines.push("- 採用 Script: ");
  lines.push("- 理由: ");
  lines.push("");
  return lines.join("\n");
}

/**
 * Provider 比較ベンチマーク
 * 同一テキストで ElevenLabs と VOICEVOX を比較生成
 *
 * @param {string} channelId - チャンネルID
 * @param {string} sampleText - サンプルテキスト
 * @param {object} options
 * @param {Array<object>} options.entries - 比較エントリの配列
 *   各エントリ: { provider, voiceId?, speakerId?, model?, label }
 * @param {string} [options.label] - テスト名ラベル
 * @returns {Promise<object>} ベンチマーク結果
 */
export async function benchmarkProviders(channelId, sampleText, options = {}) {
  const { entries, label = "provider-benchmark" } = options;

  if (!entries || entries.length === 0) {
    throw new Error("entries を1つ以上指定してください");
  }

  console.log(`\n  [Benchmark] Provider比較: ${entries.length} entries`);
  console.log(`  [Benchmark] サンプル: ${sampleText.length} chars`);

  const segments = splitNarrationSegments(sampleText);
  const ts = timestamp();
  const results = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const entryLabel = entry.label || `${entry.provider}#${i + 1}`;
    console.log(`\n  [Benchmark] Entry ${i + 1}/${entries.length}: ${entryLabel} (${entry.provider})`);

    try {
      const startTime = Date.now();
      let audio;

      if (entry.provider === "voicevox") {
        audio = await voicevoxClient.generateNarration(channelId, sampleText, {
          speakerId: entry.speakerId,
          speedScale: entry.speedScale,
          segments,
        });
      } else {
        audio = await generateNarration(channelId, sampleText, {
          voiceId: entry.voiceId,
          model: entry.model,
          segments,
        });
      }

      const elapsed = Date.now() - startTime;

      results.push({
        label: entryLabel,
        provider: entry.provider,
        voiceId: entry.voiceId || entry.speakerId,
        model: entry.model || "voicevox_engine",
        status: "ok",
        outputPath: audio.outputPath,
        textLength: sampleText.length,
        segments: audio.metadata.segments,
        elapsedMs: elapsed,
      });
    } catch (e) {
      results.push({
        label: entryLabel,
        provider: entry.provider,
        voiceId: entry.voiceId || entry.speakerId,
        model: entry.model || "voicevox_engine",
        status: "error",
        error: e.message,
      });
    }
  }

  // レポート生成
  const report = generateProviderBenchmarkReport({
    label,
    channelId,
    timestamp: ts,
    sampleLength: sampleText.length,
    segmentCount: segments.length,
    results,
  });

  const reportPath = `content/${channelId}/metadata/${ts}_${label}.md`;
  writeOutput(reportPath, report);

  // Comparison manifest 保存
  const manifest = {
    type: "provider-comparison",
    label,
    channelId,
    timestamp: ts,
    sampleLength: sampleText.length,
    entries: results.map((r) => ({
      label: r.label,
      provider: r.provider,
      voiceId: r.voiceId,
      model: r.model,
      status: r.status,
      outputPath: r.outputPath,
      elapsedMs: r.elapsedMs,
    })),
    evaluation: {
      misread_score: {},
      clarity_score: {},
      natural_pause_score: {},
      trustworthiness_score: {},
      overall_score: {},
      memo: {},
      adopted: null,
      reason: null,
    },
  };

  const manifestPath = `content/${channelId}/metadata/${ts}_${label}_manifest.json`;
  writeOutput(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n  [Benchmark] レポート: ${reportPath}`);
  console.log(`  [Benchmark] Manifest: ${manifestPath}`);
  return { reportPath, manifestPath, results };
}

/**
 * Provider ベンチマークレポート生成
 */
function generateProviderBenchmarkReport(data) {
  const lines = [];
  lines.push("# TTS Provider Benchmark");
  lines.push("");
  lines.push(`- Label: ${data.label}`);
  lines.push(`- Channel: ${data.channelId}`);
  lines.push(`- Date: ${data.timestamp}`);
  lines.push(`- Sample: ${data.sampleLength} chars / ${data.segmentCount} segments`);
  lines.push("");
  lines.push("## Results");
  lines.push("");
  lines.push("| # | Label | Provider | Voice/Speaker | Model | Status | File | Time |");
  lines.push("|---|-------|----------|---------------|-------|--------|------|------|");

  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    const time = r.elapsedMs ? `${(r.elapsedMs / 1000).toFixed(1)}s` : "-";
    const file = r.outputPath || r.error || "-";
    lines.push(`| ${i + 1} | ${r.label} | ${r.provider} | ${r.voiceId} | ${r.model} | ${r.status} | ${file} | ${time} |`);
  }

  lines.push("");
  lines.push("## 評価スコアシート（各項目 1〜5）");
  lines.push("");
  lines.push("各音声ファイルを聴いて、1（悪い）〜 5（優秀）で評価してください。");
  lines.push("");

  const colHeaders = data.results.map((r) => r.label);
  const colSep = colHeaders.map(() => "---");
  lines.push(`| 評価項目 | ${colHeaders.join(" | ")} |`);
  lines.push(`|----------|${colSep.join("|")}|`);

  const criteria = [
    "誤読率（少ないほど高得点）",
    "明瞭さ・聞き取りやすさ",
    "間・ポーズの自然さ",
    "数字・制度語の安定性",
    "信頼感・説明向きか",
    "Shorts向けの抜け感",
    "総合評価",
  ];

  for (const c of criteria) {
    const cells = colHeaders.map(() => "  ");
    lines.push(`| ${c} | ${cells.join(" | ")} |`);
  }

  lines.push("");
  lines.push("### メモ");
  lines.push("");
  for (const r of data.results) {
    lines.push(`- **${r.label}** (${r.provider}): `);
  }

  lines.push("");
  lines.push("## 採用判定");
  lines.push("");
  lines.push("- 採用 Provider/Voice: ");
  lines.push("- 理由: ");
  lines.push("");
  lines.push("### 判定ルール");
  lines.push("- 日本語の説明品質が明確にVOICEVOX優位 → genz-moneyで採用");
  lines.push("- 大差なし → 運用統一性のためElevenLabs継続");
  lines.push("- ElevenLabsが自然さで勝ち、誤読だけ辞書で潰せる → ElevenLabs継続");
  lines.push("");
  return lines.join("\n");
}

/**
 * 日本語向け Voice 候補を取得
 * ElevenLabs API から Voice 一覧を取得し、日本語対応のものをフィルタ
 *
 * @returns {Promise<Array>} 日本語 Voice の候補リスト
 */
export async function listJapaneseVoices() {
  const voices = await listVoices();
  // labels に "Japanese" を含む、または多言語対応の Voice をフィルタ
  return voices.filter((v) => {
    const labels = v.labels || {};
    const lang = labels.language || "";
    const desc = (v.description || "").toLowerCase();
    return (
      lang === "ja" ||
      lang === "Japanese" ||
      desc.includes("japanese") ||
      desc.includes("multilingual") ||
      labels.use_case === "narration"
    );
  });
}

/**
 * ベンチマークレポートを markdown で生成
 */
function generateBenchmarkReport(data) {
  const lines = [];
  lines.push(`# TTS ${data.type === "voice" ? "Voice" : "Model"} Benchmark`);
  lines.push("");
  lines.push(`- Label: ${data.label}`);
  lines.push(`- Channel: ${data.channelId}`);
  lines.push(`- Date: ${data.timestamp}`);
  lines.push(`- Sample: ${data.sampleLength} chars / ${data.segmentCount} segments`);
  lines.push("");
  lines.push("## Results");
  lines.push("");
  lines.push("| # | Voice ID | Model | Status | File | Time |");
  lines.push("|---|----------|-------|--------|------|------|");

  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    const time = r.elapsedMs ? `${(r.elapsedMs / 1000).toFixed(1)}s` : "-";
    const file = r.outputPath || r.error || "-";
    lines.push(`| ${i + 1} | ${r.voiceId} | ${r.model} | ${r.status} | ${file} | ${time} |`);
  }

  lines.push("");
  lines.push("## 評価スコアシート（各項目 1〜5）");
  lines.push("");
  lines.push("各音声ファイルを聴いて、1（悪い）〜 5（優秀）で評価してください。");
  lines.push("");

  // 動的にカラム生成
  const colHeaders = data.results.map((_, i) => `#${i + 1}`);
  const colSep = colHeaders.map(() => "---");
  lines.push(`| 評価項目 | ${colHeaders.join(" | ")} |`);
  lines.push(`|----------|${colSep.join("|")}|`);

  const criteria = [
    ["misread_score", "誤読率（少ないほど高得点）"],
    ["clarity_score", "明瞭さ・聞き取りやすさ"],
    ["natural_pause_score", "間・ポーズの自然さ"],
    ["trustworthiness_score", "信頼感・説明向きか"],
    ["overall_score", "総合評価"],
  ];

  for (const [, label] of criteria) {
    const cells = colHeaders.map(() => "  ");
    lines.push(`| ${label} | ${cells.join(" | ")} |`);
  }

  lines.push("");
  lines.push("### メモ");
  lines.push("");
  for (let i = 0; i < data.results.length; i++) {
    const r = data.results[i];
    const id = data.type === "voice" ? r.voiceId : r.model;
    lines.push(`- **#${i + 1}** (${id}): `);
  }

  lines.push("");
  lines.push("## 採用判定");
  lines.push("");
  lines.push("- 採用 Voice/Model: ");
  lines.push("- 理由: ");
  lines.push("");

  return lines.join("\n");
}
