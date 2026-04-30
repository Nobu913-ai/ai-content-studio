#!/usr/bin/env node
/**
 * genz-money Shorts 用音声生成スクリプト（汎用）
 *
 * 使い方:
 *   node scripts/generate-genz-audio.js <script-path> <output-wav-path>
 *
 * 例:
 *   node scripts/generate-genz-audio.js \
 *     content/genz-money/scripts/shorts-cardstack-02-compare.txt \
 *     content/genz-money/audio/shorts_cardstack_02-compare.wav
 *
 * - genz-money-shorts プリセット (四国めたん、speed 1.08 / gap 150ms / vol 1.10) を使用
 * - 発音辞書（NISA → ニーサ等）を自動適用
 */
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { generateNarration } from "../src/clients/voicevox-client.js";
import { voicevoxPresets } from "../config/tools.js";
import { applyPronunciationDictionary } from "./lib/pronunciation-loader.js";

const [, , scriptPathArg, outputWavArg] = process.argv;

if (!scriptPathArg || !outputWavArg) {
  console.error("Usage: node scripts/generate-genz-audio.js <script-path> <output-wav-path>");
  process.exit(1);
}

const rawText = readFileSync(scriptPathArg, "utf-8");
const text = applyPronunciationDictionary(rawText, "genz-money");

const segments = text
  .split(/\n\s*\n/)
  .map((s) => s.replace(/\n/g, "").trim())
  .filter(Boolean);

console.log(`Loaded script: ${scriptPathArg} (${text.length} chars, ${segments.length} segments)`);

const preset = voicevoxPresets["genz-money-shorts"];
console.log(`Preset: ${preset.name} (speed=${preset.speedScale}, gap=${preset.segmentGapMs}ms, vol=${preset.volumeScale})`);

const result = await generateNarration("genz-money", text, {
  speakerId: preset.speakerId,
  speedScale: preset.speedScale,
  pitchScale: preset.pitchScale,
  intonationScale: preset.intonationScale,
  volumeScale: preset.volumeScale,
  pauseLengthScale: preset.pauseLengthScale,
  prePhonemeLength: preset.prePhonemeLength,
  postPhonemeLength: preset.postPhonemeLength,
  enableInterrogativeUpspeak: preset.enableInterrogativeUpspeak,
  segmentGapMs: preset.segmentGapMs,
  segments,
});

const targetFull = resolve(outputWavArg);
mkdirSync(dirname(targetFull), { recursive: true });
copyFileSync(result.path, targetFull);

console.log(`\n[OK] Generated: ${result.outputPath}`);
console.log(`[OK] Copied to:  ${outputWavArg}`);
