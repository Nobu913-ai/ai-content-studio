/**
 * Shot Plan Generator
 * 台本からショットリスト（Runway用プロンプト群）をJSON生成
 * Claude API を使い、チャンネル別のスタイルに沿ったショットプランを作成
 */

import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getShotStyle } from "../../config/tools.js";
import { readInput, writeOutput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";

/**
 * 台本からショットプランを生成
 * @param {string} channelId - チャンネルID
 * @param {string} scriptPath - 台本ファイルパス
 * @param {object} [options]
 * @param {string} [options.format] - "shorts" | "longform"
 * @returns {Promise<object>} { path, outputPath, shotPlan }
 */
export async function generateShotPlan(channelId, scriptPath, options = {}) {
  channelId = validateChannelId(channelId);
  scriptPath = validateContentPath(scriptPath);
  const channel = getChannel(channelId);
  const shotStyle = getShotStyle(channelId);
  const scriptContent = readInput(scriptPath);
  const format = options.format || "shorts";

  const systemPrompt = `You are a video production shot planner. You convert YouTube scripts into structured shot plans for AI video generation (Runway).

## Channel Visual Style
- Channel: ${channel.name}
- Style: ${shotStyle.style}
- Motion: ${shotStyle.motionNote}
- Default Aspect Ratio: ${shotStyle.defaultAspectRatio}
- Duration Range: ${shotStyle.durationRange.min}-${shotStyle.durationRange.max} seconds per shot
- Notes: ${shotStyle.description}

## Rules
1. Each shot must have a clear, specific visual prompt suitable for Runway AI video generation.
2. Avoid prompts that include text rendering (AI is bad at text) — use [TEXT ON SCREEN] markers in the script for post-production overlays instead.
3. Keep prompts concise (1-2 sentences) but visually specific.
4. Include motion direction when relevant (zoom in, pan left, dolly forward, etc.).
5. Match the emotional tone of the script section.
6. For finance content (genz-money): prefer infographic/diagram style over photorealistic faces.
7. For culture content (japanese-mindset): maintain consistent cinematic atmosphere.
8. For chill content (chill-culture): warm, ambient, lo-fi aesthetic.

Respond with valid JSON only — no markdown fences.`;

  const userPrompt = `Generate a shot plan from this script. Format: ${format} (${format === "shorts" ? "9:16, 30-60sec total" : "16:9 or 9:16, full video"}).

## Script:
${scriptContent.slice(0, 5000)}

## Required JSON Output:
{
  "shots": [
    {
      "shot_id": "${channelId.slice(0, 2)}_001",
      "sequence": 1,
      "section": "hook",
      "duration_sec": ${shotStyle.durationRange.min},
      "aspect_ratio": "${shotStyle.defaultAspectRatio}",
      "prompt": "specific visual description for Runway generation",
      "motion": "camera motion description",
      "purpose": "what this shot achieves in the video",
      "overlay_text": "text to add in post (if any, otherwise null)"
    }
  ],
  "total_duration_sec": 45,
  "production_notes": "overall notes for the editor"
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.5,
  });

  let shotPlan;
  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    shotPlan = JSON.parse(cleaned);
  } catch {
    shotPlan = { raw: result, parseError: true };
  }

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/metadata/${ts}_${slug}_shotplan.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(shotPlan, null, 2));

  return { path: fullPath, outputPath, shotPlan };
}

/**
 * ショットプランを見やすく表示
 */
export function formatShotPlan(shotPlan) {
  if (shotPlan.parseError) return shotPlan.raw;

  let output = "";
  output += `\n  --- Shot Plan (${shotPlan.shots?.length || 0} shots) ---\n`;
  if (shotPlan.total_duration_sec) {
    output += `  Total duration: ~${shotPlan.total_duration_sec}s\n`;
  }

  for (const shot of shotPlan.shots || []) {
    output += `\n  [${shot.shot_id}] ${shot.section} (${shot.duration_sec}s, ${shot.aspect_ratio})\n`;
    output += `    Prompt: ${shot.prompt}\n`;
    if (shot.motion) output += `    Motion: ${shot.motion}\n`;
    if (shot.overlay_text) output += `    Overlay: ${shot.overlay_text}\n`;
  }

  if (shotPlan.production_notes) {
    output += `\n  Notes: ${shotPlan.production_notes}\n`;
  }

  return output;
}
