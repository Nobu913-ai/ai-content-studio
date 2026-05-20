#!/usr/bin/env node
/**
 * takeout-gourmet チャンネル用音声生成スクリプト
 *
 * 使い方:
 *   node scripts/generate-takeout-audio.js <script-path> <output-wav-path> [--gap-ms <ms>]
 *
 * 例:
 *   node scripts/generate-takeout-audio.js \
 *     content/takeout-gourmet/scripts/reel-01-concept-v1.txt \
 *     content/takeout-gourmet/audio/reel_01-concept-v1.wav
 *
 * - takeout-gourmet-shorts プリセット（春日部つむぎ ノーマル）を使用
 * - 発音辞書は channel_overrides.takeout-gourmet を適用（存在すれば）
 */
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { generateNarration } from "../src/clients/voicevox-client.js";
import { voicevoxPresets } from "../config/tools.js";
import { applyPronunciationDictionary } from "./lib/pronunciation-loader.js";

const [, , scriptPathArg, outputWavArg, ...optionArgs] = process.argv;

if (!scriptPathArg || !outputWavArg) {
  console.error("Usage: node scripts/generate-takeout-audio.js <script-path> <output-wav-path> [--gap-ms <ms>]");
  process.exit(1);
}

let gapMsOverride = null;
for (let i = 0; i < optionArgs.length; i++) {
  if (optionArgs[i] === "--gap-ms") gapMsOverride = Number(optionArgs[++i]);
}

const CHANNEL_ID = "takeout-gourmet";

const rawText = readFileSync(scriptPathArg, "utf-8");
const text = applyPronunciationDictionary(rawText, CHANNEL_ID);

const segments = text
  .split(/\n\s*\n/)
  .map((s) => s.replace(/\n/g, "").trim())
  .filter(Boolean);

console.log(`Loaded script: ${scriptPathArg} (${text.length} chars, ${segments.length} segments)`);

const preset = voicevoxPresets["takeout-gourmet-shorts"];
const segmentGapMs = Number.isFinite(gapMsOverride) ? gapMsOverride : preset.segmentGapMs;
console.log(`Preset: ${preset.name} (speed=${preset.speedScale}, gap=${segmentGapMs}ms, vol=${preset.volumeScale})`);

const result = await generateNarration(CHANNEL_ID, text, {
  speakerId: preset.speakerId,
  speedScale: preset.speedScale,
  pitchScale: preset.pitchScale,
  intonationScale: preset.intonationScale,
  volumeScale: preset.volumeScale,
  pauseLengthScale: preset.pauseLengthScale,
  prePhonemeLength: preset.prePhonemeLength,
  postPhonemeLength: preset.postPhonemeLength,
  enableInterrogativeUpspeak: preset.enableInterrogativeUpspeak,
  segmentGapMs,
  segments,
});

const targetFull = resolve(outputWavArg);
mkdirSync(dirname(targetFull), { recursive: true });
copyFileSync(result.path, targetFull);

console.log(`\n[OK] Generated: ${result.outputPath}`);
console.log(`[OK] Copied to:  ${outputWavArg}`);
