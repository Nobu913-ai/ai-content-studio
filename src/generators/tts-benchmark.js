/**
 * TTS Benchmark
 * Voice / Model の A/B テスト用ベンチマーク
 *
 * 同一サンプルテキストで複数の voice / model 組み合わせを生成し、
 * 比較結果を markdown レポートとして出力する
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { resolve, writeOutput, timestamp } from "../utils/file-helpers.js";
import { getVoiceConfig } from "../../config/tools.js";
import { generateNarration, listVoices, getUsage } from "../clients/elevenlabs-client.js";
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
  lines.push("## 評価チェックリスト");
  lines.push("");
  lines.push("各音声ファイルを聴いて以下を評価してください:");
  lines.push("");
  lines.push("| 観点 | Voice/Model 1 | Voice/Model 2 | Voice/Model 3 |");
  lines.push("|------|---------------|---------------|---------------|");
  lines.push("| 誤読率 | | | |");
  lines.push("| イントネーション | | | |");
  lines.push("| 文末の自然さ | | | |");
  lines.push("| 数字・制度語の安定性 | | | |");
  lines.push("| Shorts向けの抜け感 | | | |");
  lines.push("| 総合評価 | | | |");
  lines.push("");
  lines.push("## 採用判定");
  lines.push("");
  lines.push("- 採用 Voice/Model: ");
  lines.push("- 理由: ");
  lines.push("");

  return lines.join("\n");
}
