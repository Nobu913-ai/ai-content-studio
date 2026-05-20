#!/usr/bin/env node
/**
 * VOICEVOX で台本を1セグメントずつ生成し、各セグメントの実音声長 (秒) を計測する。
 *
 * 用途:
 *   - shot plan の duration_sec を実測値で揃えるための事前計測
 *   - shot plan generator が読み込めるJSON出力
 *   - 最終ナレーションwavとセグメント累積尺の差分検証
 *
 * 使い方:
 *   node scripts/measure-segments.js <script-path> [--json <out.json>] [--final-wav <wav>] [--gap-ms <ms>]
 *
 * オプション:
 *   --json <path>      測定結果を JSON で出力（shot plan generator向け）
 *   --final-wav <path> 最終wavのファイルパス。指定すると累積尺との差分を検証
 *
 * 例:
 *   node scripts/measure-segments.js content/genz-money/scripts/shorts-nisa-01-hook-v6.txt \
 *     --json content/genz-money/metadata/shorts-nisa-01-hook-v6_segments.json \
 *     --final-wav content/genz-money/audio/shorts_nisa_01-hook-v6.wav
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { createAudioQuery, synthesize } from "../src/clients/voicevox-client.js";
import { voicevoxPresets } from "../config/tools.js";
import { applyPronunciationDictionary } from "./lib/pronunciation-loader.js";

const args = process.argv.slice(2);
const scriptPath = args[0];
let jsonOutPath = null;
let finalWavPath = null;
let gapMsOverride = null;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--json") jsonOutPath = args[++i];
  else if (args[i] === "--final-wav") finalWavPath = args[++i];
  else if (args[i] === "--gap-ms") gapMsOverride = Number(args[++i]);
}

if (!scriptPath) {
  console.error("Usage: node scripts/measure-segments.js <script-path> [--json <out.json>] [--final-wav <wav>] [--gap-ms <ms>]");
  process.exit(1);
}

const wavDurationSec = (buf) => {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.length);
  const sampleRate = dv.getUint32(24, true);
  const numChannels = dv.getUint16(22, true);
  const bitsPerSample = dv.getUint16(34, true);
  const dataSize = dv.getUint32(40, true);
  return dataSize / (sampleRate * numChannels * (bitsPerSample / 8));
};

const text = applyPronunciationDictionary(readFileSync(scriptPath, "utf-8"), "genz-money");
const segments = text.split(/\n\s*\n/).map((s) => s.replace(/\n/g, "").trim()).filter(Boolean);

const preset = voicevoxPresets["genz-money-shorts"];
const segmentGapMs = Number.isFinite(gapMsOverride) ? gapMsOverride : preset.segmentGapMs;
const gapSec = segmentGapMs / 1000;

console.log(`Measuring ${segments.length} segments... (gap=${gapSec}s, speed=${preset.speedScale})`);

let cumulative = 0;
const rows = [];
for (let i = 0; i < segments.length; i++) {
  const seg = segments[i];
  const query = await createAudioQuery(seg, preset.speakerId);
  query.speedScale = preset.speedScale;
  query.pitchScale = preset.pitchScale;
  query.intonationScale = preset.intonationScale;
  query.volumeScale = preset.volumeScale;
  query.pauseLengthScale = preset.pauseLengthScale;
  query.prePhonemeLength = preset.prePhonemeLength;
  query.postPhonemeLength = preset.postPhonemeLength;
  const buf = await synthesize(query, preset.speakerId, {
    enableInterrogativeUpspeak: preset.enableInterrogativeUpspeak,
  });
  const dur = wavDurationSec(buf);
  const start = cumulative;
  const end = cumulative + dur;
  rows.push({
    idx: i + 1,
    start: Number(start.toFixed(3)),
    end: Number(end.toFixed(3)),
    dur: Number(dur.toFixed(3)),
    text: seg,
  });
  cumulative = end + (i < segments.length - 1 ? gapSec : 0);
}

const cumulativeFinal = cumulative;

console.log("\n=== Segment Timeline (actual audio) ===");
console.log("idx | start →   end  | dur  | text");
for (const r of rows) {
  console.log(
    `${String(r.idx).padStart(2)}  | ${r.start.toFixed(2).padStart(5)} → ${r.end.toFixed(2).padStart(5)} | ${r.dur.toFixed(2)} | ${r.text.slice(0, 40)}`,
  );
}
console.log(`\nCumulative end: ${cumulativeFinal.toFixed(2)}s`);

// 最終wavとの差分検証
let diffWarning = null;
if (finalWavPath) {
  if (!existsSync(finalWavPath)) {
    console.warn(`[WARN] Final wav not found: ${finalWavPath}`);
  } else {
    const finalBuf = readFileSync(finalWavPath);
    const finalDur = wavDurationSec(finalBuf);
    const diff = Math.abs(finalDur - cumulativeFinal);
    console.log(`\n=== Final WAV diff check ===`);
    console.log(`  Cumulative measured: ${cumulativeFinal.toFixed(3)}s`);
    console.log(`  Final wav duration:  ${finalDur.toFixed(3)}s`);
    console.log(`  Difference:          ${diff.toFixed(3)}s`);
    if (diff >= 0.5) {
      diffWarning = "fail";
      console.log(`  [FAIL] difference >= 0.5s — manual investigation required`);
      process.exitCode = 2;
    } else if (diff >= 0.2) {
      diffWarning = "warning";
      console.log(`  [WARNING] difference >= 0.2s — review timing accuracy`);
    } else {
      console.log(`  [OK] difference < 0.2s`);
    }
  }
}

// JSON output
if (jsonOutPath) {
  const out = {
    scriptPath,
    measuredAt: new Date().toISOString(),
    preset: {
      name: preset.name,
      speakerId: preset.speakerId,
      speedScale: preset.speedScale,
      segmentGapMs,
      volumeScale: preset.volumeScale,
    },
    cumulativeFinalSec: Number(cumulativeFinal.toFixed(3)),
    segments: rows,
    finalWav: finalWavPath
      ? {
          path: finalWavPath,
          diffStatus: diffWarning || "ok",
        }
      : null,
  };
  mkdirSync(dirname(jsonOutPath), { recursive: true });
  writeFileSync(jsonOutPath, JSON.stringify(out, null, 2));
  console.log(`\n[OK] JSON output: ${jsonOutPath}`);
}
