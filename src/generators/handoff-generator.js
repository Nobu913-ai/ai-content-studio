/**
 * DaVinci Resolve Handoff Note Generator
 * 最終仕上げ用の編集指示書を生成（手動編集前提）
 */

import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getShotStyle, exportPresets } from "../../config/tools.js";
import { readInput, writeOutput, timestamp } from "../utils/file-helpers.js";
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
