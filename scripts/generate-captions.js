#!/usr/bin/env node
/**
 * shot plan の各 shot に captionSegments[] を自動生成する。
 *
 * モード:
 *   simple : narration を句読点 (。、) で分割し、文字数比例で時刻を割り当てる。
 *   smart  : measure-segments.js のJSON出力 (--segments) を併用し、実音声の段境界を尊重する。
 *
 * 使い方:
 *   node scripts/generate-captions.js <shot-plan.json> [--out <out.json>] [--segments <segments.json>] [--in-place] [--max-len 22]
 *
 * 例:
 *   # simple モード、別ファイル出力
 *   node scripts/generate-captions.js content/genz-money/handoff/shorts-nisa/shot-plan-01-hook-v8.json \
 *     --out shot-plan-01-hook-v8-with-captions.json
 *
 *   # smart モード、shot plan を上書き
 *   node scripts/generate-captions.js content/genz-money/handoff/shorts-nisa/shot-plan-02.json \
 *     --segments content/genz-money/metadata/shorts-02_segments.json \
 *     --in-place
 *
 * 仕様:
 * - 既に captionSegments を持つ shot はスキップ（後段で手動微調整した結果を保護）
 * - 1フレーズしかない narration は静的 caption のままにする
 * - 重要語（数字＋単位、強調記号）は highlight に自動抽出
 */
import { readFileSync, writeFileSync } from "node:fs";
import { reversePronunciationDictionary } from "./lib/pronunciation-loader.js";

const args = process.argv.slice(2);
const shotPlanPath = args[0];
let outPath = null;
let segmentsPath = null;
let inPlace = false;
let maxLen = 22;
let preview = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--out") outPath = args[++i];
  else if (args[i] === "--segments") segmentsPath = args[++i];
  else if (args[i] === "--in-place") inPlace = true;
  else if (args[i] === "--max-len") maxLen = parseInt(args[++i], 10);
  else if (args[i] === "--preview") preview = true;
}

if (!shotPlanPath) {
  console.error(
    "Usage: node scripts/generate-captions.js <shot-plan.json> [--out <path>|--in-place] [--segments <segments.json>] [--max-len 22] [--preview]",
  );
  process.exit(1);
}

if (!outPath && !inPlace && !preview) {
  console.error("Error: specify --out <path> or --in-place or --preview");
  process.exit(1);
}

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * narration を句読点で分割し、トリムして空白を除いたサブフレーズ配列を返す。
 * 「。」優先で分割し、各フレーズが maxLen より長ければ「、」でも分割する。
 */
function splitPhrases(narration, maxLen) {
  const sentences = narration
    .split(/[。]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const result = [];
  for (const sent of sentences) {
    if (sent.length <= maxLen || !sent.includes("、")) {
      result.push(sent);
    } else {
      // Split further on commas, recombining short pieces
      const parts = sent.split(/[、]/).map((s) => s.trim()).filter(Boolean);
      let buf = "";
      for (const p of parts) {
        if (!buf) buf = p;
        else if (buf.length + p.length + 1 <= maxLen) buf = `${buf} ${p}`;
        else {
          result.push(buf);
          buf = p;
        }
      }
      if (buf) result.push(buf);
    }
  }
  return result;
}

/**
 * フレーズから highlight 候補を抽出（数字+単位、％、英大文字頭の名詞風）
 */
function extractHighlights(phrase) {
  const candidates = [];
  // 数字+単位 (e.g., 100万円, 360万, 20%, 月100円)
  const numericRe = /[\d,]+(万円|万|円|%|％|年|時間|日|株|本|件|社)/g;
  let m;
  while ((m = numericRe.exec(phrase)) !== null) candidates.push(m[0]);
  // NISA / iDeCo etc — common product/scheme abbreviations
  const productRe = /(新NISA|NISA|iDeCo|IDECO|S&P|S&P500)/g;
  while ((m = productRe.exec(phrase)) !== null) candidates.push(m[0]);
  // dedupe preserving order
  return [...new Set(candidates)];
}

/**
 * Build captionSegments from narration text only (simple mode).
 * 文字数比例で shot.duration_sec 内に時刻を割り当てる。
 */
function buildCaptionSegmentsSimple(narration, durationSec, maxLen) {
  const phrases = splitPhrases(narration, maxLen);
  if (phrases.length <= 1) return null;

  const totalChars = phrases.reduce((s, p) => s + p.length, 0);
  if (totalChars === 0) return null;
  let cursor = 0;
  const segments = [];
  for (let i = 0; i < phrases.length; i++) {
    const p = phrases[i];
    const dur = (p.length / totalChars) * durationSec;
    const startSec = round1(cursor);
    const endSec = i === phrases.length - 1 ? round1(durationSec) : round1(cursor + dur);
    const seg = { text: p, startSec, endSec };
    const highlights = extractHighlights(p);
    if (highlights.length > 0) seg.highlight = highlights;
    segments.push(seg);
    cursor += dur;
  }
  return segments;
}

/**
 * 文字列から空白・読み辞書置換差を吸収するための正規化
 * (例: "新NISA" は audio segments では "しんニーサ" になるので、両方含めて比較できるよう片仮名は共通化しない;
 *      ここでは VOICEVOX側の置換テキストが narration に含まれていなくても OK にする目的で、
 *      narration内の "NISA" を "ニーサ" にも置き換えたバージョンを比較対象に追加する。)
 */
function normalizeForMatching(s) {
  return s
    .replace(/[\s、。「」『』]/g, "")
    .replace(/新NISA/g, "新ニーサ")
    .replace(/NISA口座/g, "ニーサ口座")
    .replace(/NISA/g, "ニーサ");
}

/**
 * Build captionSegments using measured audio segment boundaries (smart mode).
 * 各 measurement の text が shot.narration に部分文字列として含まれるか判定し、
 * マッチしたものだけを収集する（時間オーバーラップ判定は使わない）。
 */
function buildCaptionSegmentsSmart(narration, durationSec, shotStartSec, measurements, maxLen) {
  const narrNorm = normalizeForMatching(narration);
  // Find audio segments whose normalized text is a substring of normalized narration
  const matched = measurements.filter((m) => {
    const segNorm = normalizeForMatching(m.text);
    return segNorm.length > 0 && narrNorm.includes(segNorm);
  });
  if (matched.length === 0) return buildCaptionSegmentsSimple(narration, durationSec, maxLen);

  const segments = [];
  for (const m of matched) {
    // measure-segments.js は発音辞書置換後のテキストで音声を生成するため、
    // segment.text は kana 化された読み (例: "ニーサ口座") になっている。
    // caption 表示用には元の表記 (例: "NISA口座") に戻す。
    const text = reversePronunciationDictionary(m.text.trim(), "genz-money");
    const phrases = splitPhrases(text, maxLen);
    if (phrases.length === 0) continue;
    const segCharTotal = phrases.reduce((s, p) => s + p.length, 0);
    const segStart = Math.max(0, m.start - shotStartSec);
    const segEnd = Math.min(durationSec, m.end - shotStartSec);
    const segDur = Math.max(0.1, segEnd - segStart);
    let inner = 0;
    for (const p of phrases) {
      const dur = phrases.length === 1 ? segDur : (p.length / segCharTotal) * segDur;
      const startSec = round1(segStart + inner);
      const endSec = round1(segStart + inner + dur);
      const seg = { text: p, startSec, endSec };
      const highlights = extractHighlights(p);
      if (highlights.length > 0) seg.highlight = highlights;
      segments.push(seg);
      inner += dur;
    }
  }
  if (segments.length > 0) segments[segments.length - 1].endSec = round1(durationSec);
  if (segments.length <= 1) return null;
  return segments;
}

const shotPlan = JSON.parse(readFileSync(shotPlanPath, "utf-8"));
let measurements = null;
if (segmentsPath) {
  const m = JSON.parse(readFileSync(segmentsPath, "utf-8"));
  measurements = m.segments;
}

let modified = 0;
let skipped = 0;
for (const shot of shotPlan.shots) {
  if (shot.captionSegments && shot.captionSegments.length > 0) {
    skipped++;
    continue;
  }
  if (!shot.narration || shot.narration.trim().length === 0) {
    skipped++;
    continue;
  }
  const segments = measurements
    ? buildCaptionSegmentsSmart(
        shot.narration,
        shot.duration_sec,
        shot.start_sec ?? 0,
        measurements,
        maxLen,
      )
    : buildCaptionSegmentsSimple(shot.narration, shot.duration_sec, maxLen);
  if (segments && segments.length > 1) {
    shot.captionSegments = segments;
    modified++;
  } else {
    skipped++;
  }
}

console.log(`Modified: ${modified} shots / Skipped: ${skipped} shots`);
console.log(`Mode: ${measurements ? "smart (measured)" : "simple (proportional)"}`);

if (preview) {
  for (const shot of shotPlan.shots) {
    if (shot.captionSegments) {
      console.log(`\n[${shot.shot_id}]`);
      for (const s of shot.captionSegments) {
        const hl = s.highlight ? ` [${s.highlight.join(",")}]` : "";
        console.log(`  ${s.startSec.toFixed(1)}-${s.endSec.toFixed(1)}: ${s.text}${hl}`);
      }
    }
  }
}

if (inPlace) {
  writeFileSync(shotPlanPath, JSON.stringify(shotPlan, null, 2) + "\n");
  console.log(`\n[OK] In-place updated: ${shotPlanPath}`);
} else if (outPath) {
  writeFileSync(outPath, JSON.stringify(shotPlan, null, 2) + "\n");
  console.log(`\n[OK] Output: ${outPath}`);
}
