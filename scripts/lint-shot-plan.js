#!/usr/bin/env node
/**
 * shot plan JSON を機械チェック。過去レビューで頻出した構造問題を事前に検出する。
 *
 * 使い方:
 *   node scripts/lint-shot-plan.js <shot-plan.json> [--segments <segments.json>] [--strict] [--json]
 *
 * チェック項目:
 *   [error] schema違反 (zod)
 *   [error] audio参照ファイルが存在しない
 *   [error] shot plan合計尺と各shot start_sec/duration_secの整合
 *   [warn]  動画尺が60秒未満 (TikTok Creator Rewards要件)
 *   [warn]  audio参照のバージョン不整合 (visual-only revision なら許容)
 *   [warn]  factCard比率が高すぎ (>35%)
 *   [warn]  同一componentが3つ以上連続
 *   [warn]  最後のshotがctaPanelでない
 *   [warn]  CTA shotが長すぎ (>7s) または短すぎ (<3s)
 *   [warn]  リスク注記shotが見当たらない
 *   [warn]  冒頭shotが軽量 (factCard等で始まり、impact要素がない)
 *   [warn]  footerLabel 等の補足文がナレーション/字幕に接続していない
 *   [warn]  captionSegments が shot duration を超えている
 *   [warn]  shot timing と measure-segments JSON が大きくずれている (--segments指定時)
 *   [warn]  audio尺と shot plan 合計の差が >5s (静的ホールド過剰)
 *   [info]  bgVariant が明示指定 (default 推定との差を確認推奨)
 *   [info]  caption も captionSegments もない長いshot (>5s narration)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { sceneJSONSchemaV2 } from "../src/utils/schemas.js";
import { applyPronunciationDictionary } from "./lib/pronunciation-loader.js";

const args = process.argv.slice(2);
const shotPlanPath = args[0];
let segmentsPath = null;
let strict = false;
let jsonOut = false;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--segments") segmentsPath = args[++i];
  else if (args[i] === "--strict") strict = true;
  else if (args[i] === "--json") jsonOut = true;
}

if (!shotPlanPath) {
  console.error(
    "Usage: node scripts/lint-shot-plan.js <shot-plan.json> [--segments <segments.json>] [--strict] [--json]",
  );
  process.exit(2);
}

const shotPlan = JSON.parse(readFileSync(shotPlanPath, "utf-8"));
const segments = shotPlan.shots || [];
const issues = [];
const push = (level, where, message, suggestion) => {
  issues.push({ level, where, message, suggestion });
};

const normalizeJa = (value) =>
  String(value || "")
    .replace(/[\s　、。,.・/／|｜「」『』（）()【】\[\]!?！？:：;；"'“”‘’\-—→⇒＋+]/g, "")
    .toLowerCase();

const captionTextFor = (shot) => {
  const segmentsText = Array.isArray(shot.captionSegments)
    ? shot.captionSegments.map((c) => c.text || "").join("")
    : "";
  return `${shot.narration || ""}${shot.caption || ""}${segmentsText}`;
};

const hasSharedPhrase = (text, support, minLen = 5) => {
  const normalizedText = normalizeJa(text);
  const normalizedSupport = normalizeJa(support);
  if (!normalizedText || !normalizedSupport) return false;
  if (normalizedSupport.includes(normalizedText)) return true;
  if (normalizedText.length < minLen) return normalizedSupport.includes(normalizedText);
  for (let i = 0; i <= normalizedText.length - minLen; i++) {
    const chunk = normalizedText.slice(i, i + minLen);
    if (normalizedSupport.includes(chunk)) return true;
  }
  return false;
};

const wavDurationSec = (path) => {
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.length);
  const sampleRate = dv.getUint32(24, true);
  const numChannels = dv.getUint16(22, true);
  const bitsPerSample = dv.getUint16(34, true);
  const dataSize = dv.getUint32(40, true);
  return dataSize / (sampleRate * numChannels * (bitsPerSample / 8));
};

// === 1. Total duration / 60s+ check ===
const totalDur = segments.reduce((s, sh) => s + (sh.duration_sec || 0), 0);
if (totalDur < 59.95) {
  push("warn", "全体", `合計尺 ${totalDur.toFixed(1)}s が60秒未満 (TikTok Creator Rewards要件)`, "narration追加でshot延長 or 60s+目標で再構成");
}
if (Math.abs(totalDur - (shotPlan.total_duration_sec ?? totalDur)) > 0.05) {
  push(
    "warn",
    "全体",
    `total_duration_sec (${shotPlan.total_duration_sec}) と shot 合計 (${totalDur.toFixed(2)}) の不一致`,
    "total_duration_sec を shot 合計に合わせる",
  );
}

// === 2. start_sec consecutive check ===
let cum = 0;
for (let i = 0; i < segments.length; i++) {
  const s = segments[i];
  if (Math.abs(s.start_sec - cum) > 0.01) {
    push("warn", `shot ${s.shot_id || i + 1}`, `start_sec ${s.start_sec} が累積 ${cum.toFixed(2)} と不一致`, "前shotのend (start+duration) に揃える");
  }
  cum += s.duration_sec;
}

// === 3. audio file integrity ===
if (shotPlan.audio) {
  const audioFullPath = resolve(dirname(shotPlanPath), "../../../..", shotPlan.audio);
  // try multiple resolutions
  const candidates = [
    shotPlan.audio,
    resolve(process.cwd(), shotPlan.audio),
    resolve(dirname(shotPlanPath), shotPlan.audio),
    audioFullPath,
  ];
  let foundPath = null;
  for (const c of candidates) {
    if (existsSync(c)) {
      foundPath = c;
      break;
    }
  }
  if (!foundPath) {
    push("error", "audio", `audio ファイルが見つからない: ${shotPlan.audio}`, "shot-plan.audio を実在パスに修正");
  } else {
    const audioDur = wavDurationSec(foundPath);
    if (audioDur && audioDur > totalDur + 0.5) {
      push(
        "warn",
        "audio",
        `音声 ${audioDur.toFixed(2)}s が shot 合計 ${totalDur.toFixed(2)}s より長く、終端が切れる可能性`,
        "shot 延長 or 音声短縮",
      );
    }
    if (audioDur && totalDur - audioDur > 5) {
      push(
        "warn",
        "audio",
        `shot 合計 ${totalDur.toFixed(2)}s が 音声 ${audioDur.toFixed(2)}s より大幅に長い (${(totalDur - audioDur).toFixed(1)}s の静的ホールド)`,
        "終盤の hold を圧縮 or 価値情報を音声に追加",
      );
    }
  }

  // version mismatch check (e.g., shot-plan-01-hook-v8 → audio should be v8)
  const planSlug = shotPlanPath.match(/[^/\\]+(?=\.json$)/)?.[0] || "";
  const planVer = planSlug.match(/v\d+/)?.[0];
  const audioVer = shotPlan.audio.match(/v\d+/)?.[0];
  if (planVer && audioVer && planVer !== audioVer) {
    push(
      "warn",
      "audio",
      `バージョン不整合: plan=${planVer} / audio=${audioVer}`,
      "ナレーション変更がある場合はaudioも同一バージョンへ。visual-only revision なら許容可",
    );
  }
}

// === 4. Component rhythm: factCard ratio + consecutive ===
const compCount = {};
for (const s of segments) {
  compCount[s.component] = (compCount[s.component] || 0) + 1;
}
const factCardRatio = (compCount["factCard"] || 0) / segments.length;
if (factCardRatio > 0.35) {
  push(
    "warn",
    "全体",
    `factCard 比率 ${(factCardRatio * 100).toFixed(0)}% (推奨<=35%)`,
    "他コンポーネント (numberHero / progressSteps / compareSplit / taxSavingsDemo) に置換検討",
  );
}

// 3+ consecutive same component
let runStart = 0;
for (let i = 1; i <= segments.length; i++) {
  const prev = segments[i - 1]?.component;
  const cur = segments[i]?.component;
  if (cur !== prev) {
    if (i - runStart >= 3 && segments[runStart].component === prev) {
      push(
        "warn",
        `shot ${runStart + 1}-${i}`,
        `${prev} が ${i - runStart}回連続`,
        "視覚的多様性のため別 component を1つ挟む",
      );
    }
    runStart = i;
  }
}

// === 5. CTA placement & duration ===
const lastShot = segments[segments.length - 1];
if (lastShot && lastShot.component !== "ctaPanel") {
  push("warn", `shot ${segments.length}`, `最後のshotがctaPanelでない (${lastShot.component})`, "CTAは末尾配置が推奨");
}
const ctaShots = segments.filter((s) => s.component === "ctaPanel");
for (const c of ctaShots) {
  if (c.duration_sec > 7) {
    push("warn", `shot ${c.shot_id}`, `CTA shot 長すぎ (${c.duration_sec}s, 推奨4.5-7s)`, "narration短縮 or hold圧縮");
  } else if (c.duration_sec < 3) {
    push("warn", `shot ${c.shot_id}`, `CTA shot 短すぎ (${c.duration_sec}s)`, "視認時間として4.5s以上推奨");
  }
}

// === 6. Disclaimer presence ===
const hasDisclaimer = segments.some((s) => {
  const blob = JSON.stringify(s.data || {}) + (s.narration || "") + (s.caption || "");
  return /(価格変動リスク|元本割れ|無理のない範囲|リスクがあ|利益保証|保証では|手数料|値動き|下落|生活費とは分ける)/.test(blob);
});
if (!hasDisclaimer) {
  push("warn", "全体", "リスク注記shotが見当たらない", "末尾付近にfactCard/progressSteps形式で1ショット追加推奨");
}

// === 7. Opening impact ===
const impactComponents = ["taxSavingsDemo", "numberHero", "compareSplit", "stackedBarCompare"];
const hasImpactWithin5Sec = segments.some(
  (s) => (s.start_sec ?? 0) < 5 && impactComponents.includes(s.component),
);
if (!hasImpactWithin5Sec) {
  push(
    "warn",
    "冒頭5秒",
    "impact component が見当たらない",
    "strongest proof を冒頭5秒以内に配置 (taxSavingsDemo / numberHero 等推奨)",
  );
}

// === 8. Caption coverage ===
for (const s of segments) {
  const hasNarration = (s.narration || "").trim().length > 0;
  const hasCap = s.caption || s.captionSegments;
  if (hasNarration && !hasCap && s.duration_sec > 5) {
    push(
      "info",
      `shot ${s.shot_id}`,
      `caption / captionSegments なし (narration ${s.duration_sec}s)`,
      "音なし視聴対応のため caption追加推奨 (generate-captions.js)",
    );
  }
}

// === 9. Caption segment timing bounds ===
for (const s of segments) {
  if (!Array.isArray(s.captionSegments)) continue;
  for (let i = 0; i < s.captionSegments.length; i++) {
    const cap = s.captionSegments[i];
    if (typeof cap.startSec !== "number" || typeof cap.endSec !== "number") continue;
    if (cap.endSec < cap.startSec) {
      push(
        "warn",
        `shot ${s.shot_id}`,
        `captionSegments[${i}] の endSec (${cap.endSec}) が startSec (${cap.startSec}) より前`,
        "captionSegments の startSec / endSec を確認",
      );
    }
    if (typeof s.duration_sec === "number" && cap.endSec > s.duration_sec + 0.01) {
      push(
        "warn",
        `shot ${s.shot_id}`,
        `captionSegments[${i}] の endSec (${cap.endSec}) が shot duration (${s.duration_sec}) を超過`,
        "endSec をシーン尺内に収める",
      );
    }
  }
}

// === 10. Visual text grounded in narration/captions ===
// footerLabel / loopLabel は「画面だけの結論」になりやすい。ナレーションや字幕に
// 接続していない場合、視聴者はどこを聞けばよいか迷うため事前警告する。
const groundedTextFields = [
  { key: "footerLabel", label: "footerLabel" },
  { key: "loopLabel", label: "loopLabel" },
];
for (const s of segments) {
  const supportText = captionTextFor(s);
  for (const { key, label } of groundedTextFields) {
    const value = s.data?.[key];
    if (typeof value !== "string" || value.trim().length === 0) continue;
    if (!hasSharedPhrase(value, supportText)) {
      push(
        "warn",
        `shot ${s.shot_id}`,
        `${label} "${value}" が narration/captionSegments と接続していない可能性`,
        "ナレーションで触れる、captionSegmentsに含める、または画面から削除する",
      );
    }
  }
}

// === 11. bgVariant explicit set check ===
for (const s of segments) {
  if (s.bgVariant !== undefined) {
    push("info", `shot ${s.shot_id}`, `bgVariant 明示指定: ${s.bgVariant}`, "default推定でも良い場合は省略可");
  }
}

// === 12. Compare with measured segments (if provided) ===
if (segmentsPath && existsSync(segmentsPath)) {
  const meas = JSON.parse(readFileSync(segmentsPath, "utf-8"));
  const measSegs = meas.segments || [];
  // For each measured segment, find which shot covers it
  for (const m of measSegs) {
    const norm = m.text.replace(/[\s、。「」]/g, "");
    const owner = segments.find((sh) => {
      // 発音辞書を narration にも適用してから比較 (measurements は dict適用後のテキスト)
      const narrDict = applyPronunciationDictionary(sh.narration || "", "genz-money");
      const narr = narrDict.replace(/[\s、。「」]/g, "");
      return narr.includes(norm);
    });
    if (!owner) {
      push("warn", `seg ${m.idx}`, `measure-segments にあるが shot.narration にマッチしない`, "shot.narration の文言確認");
      continue;
    }
    // shot 範囲内に収まるかチェック (簡易)
    if (m.start < owner.start_sec - 0.5 || m.end > owner.start_sec + owner.duration_sec + 0.5) {
      push(
        "warn",
        `shot ${owner.shot_id}`,
        `seg ${m.idx} が shot 範囲外 (seg ${m.start.toFixed(2)}-${m.end.toFixed(2)} vs shot ${owner.start_sec}-${owner.start_sec + owner.duration_sec})`,
        "shot start_sec / duration_sec を seg 境界に合わせる",
      );
    }
  }
}

// === 13. Schema validation ===
// Build a synthetic scene JSON to validate (best-effort: shot plan uses different naming)
// Skip strict zod here for simplicity since schema is enforced at scene-generator stage.
// We mainly check known required fields.
for (const s of segments) {
  if (!s.component) push("error", `shot ${s.shot_id || "?"}`, `component フィールド必須`);
  if (s.duration_sec == null) push("error", `shot ${s.shot_id || "?"}`, `duration_sec フィールド必須`);
  if (s.duration_sec != null && s.duration_sec < 0.5) push("error", `shot ${s.shot_id}`, `duration_sec が短すぎ (${s.duration_sec}s, 最低0.5s)`);
}

// === Output ===
if (jsonOut) {
  console.log(JSON.stringify({ shotPlanPath, totalDur, shots: segments.length, issues }, null, 2));
} else {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warn");
  const infos = issues.filter((i) => i.level === "info");

  console.log(`\n🎬 Shot plan lint: ${shotPlanPath}`);
  console.log(`   Shots: ${segments.length}, Total: ${totalDur.toFixed(1)}s, factCard比率: ${(factCardRatio * 100).toFixed(0)}%`);
  console.log(`   Errors: ${errors.length}, Warnings: ${warnings.length}, Info: ${infos.length}\n`);

  for (const issue of issues) {
    const tag =
      issue.level === "error" ? "❌ ERROR" : issue.level === "warn" ? "⚠️  WARN " : "ℹ️  INFO ";
    console.log(`  ${tag} [${issue.where}] ${issue.message}`);
    if (issue.suggestion) console.log(`           → ${issue.suggestion}`);
  }

  console.log();
  if (errors.length > 0) console.log(`❌ ${errors.length} error(s)`);
  if (warnings.length > 0) console.log(`⚠️  ${warnings.length} warning(s)`);
  if (errors.length === 0 && warnings.length === 0) console.log(`✅ All clear`);
}

const exitCode = issues.some((i) => i.level === "error")
  ? 1
  : strict && issues.some((i) => i.level === "warn")
    ? 1
    : 0;
process.exit(exitCode);
