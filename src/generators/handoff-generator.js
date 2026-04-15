/**
 * DaVinci Resolve Handoff Note Generator
 * 最終仕上げ用の編集指示書を生成（手動編集前提）
 */

import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getShotStyle, exportPresets } from "../../config/tools.js";
import { readInput, writeOutput, timestamp, fileExists } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";

/**
 * DaVinci Resolve 用のハンドオフノートを生成
 * @param {string} channelId - チャンネルID
 * @param {string} scriptPath - 台本ファイルパス
 * @param {object} [options]
 * @param {string} [options.format] - "shorts" | "longform"
 * @param {string} [options.shotPlanPath] - ショットプランJSONパス
 * @param {string} [options.narrationPath] - ナレーションJSONパス
 * @returns {Promise<object>} { path, outputPath, handoff }
 */
export async function generateHandoff(channelId, scriptPath, options = {}) {
  channelId = validateChannelId(channelId);
  scriptPath = validateContentPath(scriptPath);
  const channel = getChannel(channelId);
  const shotStyle = getShotStyle(channelId);
  const scriptContent = readInput(scriptPath);
  const format = options.format || "shorts";

  // ショットプランがあれば読み込み
  let shotPlanContext = "";
  if (options.shotPlanPath) {
    try {
      const spContent = readInput(options.shotPlanPath);
      const sp = JSON.parse(spContent);
      shotPlanContext = `\n## Shot Plan (${sp.shots?.length || 0} shots, ~${sp.total_duration_sec}s total):\n${sp.shots?.map((s) => `- ${s.shot_id}: ${s.section} (${s.duration_sec}s) — ${s.purpose}`).join("\n") || "N/A"}`;
    } catch {
      // ショットプラン読み込み失敗は無視
    }
  }

  const preset = format === "shorts" ? exportPresets.shorts : exportPresets.longform_16_9;

  const systemPrompt = `You are a video editor assistant. You create structured handoff notes for DaVinci Resolve editors.
The notes should be clear, actionable, and follow standard post-production terminology.
Respond in the same language as the script content.`;

  const userPrompt = `Create a DaVinci Resolve edit handoff note for this production.

## Channel: ${channel.name}
## Format: ${format} (${preset.aspectRatio})
## Export Preset: ${preset.name} (${preset.resolution}, ${preset.codec}, ${preset.fps}fps)
## Visual Style: ${shotStyle.style}

## Script (summary):
${scriptContent.slice(0, 3000)}
${shotPlanContext}

## Generate a handoff note in this markdown format:
- Timeline name suggestion
- Target duration and aspect ratio
- Shot-by-shot edit notes (trim points, transitions)
- Title card / text overlay instructions
- Audio mix notes (LUFS target for speech, BGM level, sound effects)
- Color grading notes (mood, reference LUT if applicable)
- Export settings
- Quality checklist (final review items)

Write the handoff note as clean markdown.`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 3072,
    temperature: 0.4,
  });

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/metadata/${ts}_${slug}_handoff.md`;
  const fullPath = writeOutput(outputPath, formatHandoffHeader(channelId, format, preset, ts) + result);

  return { path: fullPath, outputPath, handoff: result };
}

/**
 * ハンドオフパッケージを生成
 * 編集ノート + アセットマニフェストを1つのディレクトリにまとめる
 *
 * @param {string} channelId
 * @param {string} scriptPath
 * @param {object} [options]
 * @param {string} [options.format]
 * @param {string} [options.shotPlanPath]
 * @param {string} [options.narrationPath]
 * @param {string} [options.narrationTextPath]
 * @param {string} [options.runwayShotsPath]
 * @param {string} [options.audioPath]
 * @returns {Promise<object>}
 */
export async function generateHandoffPackage(channelId, scriptPath, options = {}) {
  // まずハンドオフノートを生成
  const handoffResult = await generateHandoff(channelId, scriptPath, options);

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const pkgDir = `content/${channelId}/handoff/${ts}_${slug}`;

  // アセット参照を収集
  const assets = [];
  const addAsset = (type, path) => {
    if (path && fileExists(path)) {
      assets.push({ type, path, exists: true });
    } else if (path) {
      assets.push({ type, path, exists: false, note: "ファイル未生成 — 手動で配置してください" });
    }
  };

  addAsset("script", scriptPath);
  addAsset("handoff_note", handoffResult.outputPath);
  addAsset("shot_plan", options.shotPlanPath);
  addAsset("narration_json", options.narrationPath);
  addAsset("narration_text", options.narrationTextPath);
  addAsset("runway_shots", options.runwayShotsPath);
  addAsset("audio", options.audioPath);

  const format = options.format || "shorts";
  const preset = format === "shorts" ? exportPresets.shorts : exportPresets.longform_16_9;

  const packageManifest = {
    type: "davinci_handoff_package",
    channel: channelId,
    format,
    generated: ts,
    export_preset: preset,
    handoff_note: handoffResult.outputPath,
    assets,
    checklist: [
      { item: "全クリップをタイムラインに配置", done: false },
      { item: "ナレーション音声を同期", done: false },
      { item: "テキストオーバーレイを追加", done: false },
      { item: "BGMを配置・音量調整", done: false },
      { item: "色調整・LUT適用", done: false },
      { item: "LUFS確認（speech-first）", done: false },
      { item: "書き出し・プレビュー確認", done: false },
    ],
  };

  const manifestPath = `${pkgDir}/package.json`;
  writeOutput(manifestPath, JSON.stringify(packageManifest, null, 2));

  // ハンドオフノートもパッケージ内にコピー
  const notePath = `${pkgDir}/handoff.md`;
  writeOutput(notePath, readInput(handoffResult.outputPath));

  console.log(`  [Handoff] Package created: ${pkgDir}/`);
  console.log(`  [Handoff] Assets: ${assets.filter((a) => a.exists).length}/${assets.length} available`);

  return {
    path: pkgDir,
    manifestPath,
    handoff: handoffResult,
    package: packageManifest,
  };
}

/**
 * ハンドオフノートのヘッダーを生成
 */
function formatHandoffHeader(channelId, format, preset, ts) {
  return `---
type: davinci_handoff
channel: ${channelId}
format: ${format}
export_preset: ${preset.name}
resolution: ${preset.resolution}
generated: ${ts}
---

`;
}
