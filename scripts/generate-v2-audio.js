#!/usr/bin/env node
/**
 * Phase B v2 用音声生成スクリプト
 * 新VOICEVOXプリセット（speed 1.08 / gap 150ms / vol 1.10）で音声を再生成
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { generateNarration } from "../src/clients/voicevox-client.js";
import { voicevoxPresets } from "../config/tools.js";

const SCRIPT_PATH = "content/genz-money/scripts/shorts-nisa-01-hook-v2.txt";
const TARGET_AUDIO = "content/genz-money/audio/shorts_nisa_01-hook-v2.wav";

// VOICEVOXの誤読対策（pronunciation-dictionary.jsonと同等の最小辞書）
const PRONUNCIATION = [
  ["新NISA", "新ニーサ"],
  ["NISA口座", "ニーサ口座"],
  ["NISA", "ニーサ"],
];

const applyDictionary = (input) => {
  let out = input;
  for (const [from, to] of PRONUNCIATION) out = out.replaceAll(from, to);
  return out;
};

const rawText = readFileSync(SCRIPT_PATH, "utf-8");
const text = applyDictionary(rawText);

// 段落単位でセグメント分割（VOICEVOXは長文を一度に処理できないため）
const segments = text
  .split(/\n\s*\n/)
  .map((s) => s.replace(/\n/g, "").trim())
  .filter(Boolean);

console.log(`Loaded script: ${SCRIPT_PATH} (${text.length} chars, ${segments.length} segments)`);

const preset = voicevoxPresets["genz-money-shorts"];
console.log(`Using preset: ${preset.name}`);
console.log(`  speedScale=${preset.speedScale}, segmentGapMs=${preset.segmentGapMs}, volumeScale=${preset.volumeScale}`);

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

// 固定パスにもコピー（shot plan の audio フィールドが参照する場所）
const targetFull = resolve(TARGET_AUDIO);
mkdirSync(dirname(targetFull), { recursive: true });
copyFileSync(result.path, targetFull);

console.log(`\n[OK] Generated: ${result.outputPath}`);
console.log(`[OK] Copied to:  ${TARGET_AUDIO}`);
