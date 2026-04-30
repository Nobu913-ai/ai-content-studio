#!/usr/bin/env node
/**
 * 台本 (.txt) を機械チェック。過去のフィードバックでよく出た問題を事前に検出する。
 *
 * 使い方:
 *   node scripts/lint-script.js <script-path> [--strict] [--json]
 *
 * 終了コード:
 *   0  errors なし
 *   1  errors あり (--strict 時は warnings ありでも 1)
 *
 * チェック項目:
 *   [error]   読み事故になる文字列パターン (例: "年120" → "ねん"でなく"とし"と読まれがち)
 *   [error]   セグメントが長すぎる (>60c) — 一度に読めない
 *   [error]   セグメントが空
 *   [warn]    推奨断定 (「〜が安心」「〜が大事」「絶対に」など)
 *   [warn]    専門用語の単独使用 (インデックス投信、ETF、リバランス、IPO等)
 *   [warn]    時間依存表現 (「2024年に」など、再投稿で陳腐化する)
 *   [warn]    重複表現 (同一フレーズの近接出現)
 *   [warn]    リスク注記の不在 (Shortsでは推奨)
 *   [info]    NISA / iDeCo 等の英字表記 (発音辞書に含まれているか確認推奨)
 *   [info]    強調記号 (★・「」) を含むセグメント
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const scriptPath = args[0];
const strict = args.includes("--strict");
const jsonOut = args.includes("--json");

if (!scriptPath) {
  console.error("Usage: node scripts/lint-script.js <script-path> [--strict] [--json]");
  process.exit(2);
}

const text = readFileSync(scriptPath, "utf-8");
const segments = text
  .split(/\n\s*\n/)
  .map((s) => s.replace(/\n/g, "").trim())
  .filter(Boolean);

const issues = [];
const push = (level, segIdx, message, suggestion) => {
  issues.push({ level, segment: segIdx, message, suggestion });
};

// === 1. Pronunciation hazard patterns (VOICEVOX 読み事故) ===
const pronHazards = [
  {
    pattern: /(?<![間ヶか])年[0-9]/g,
    message: '「年」+数字パターンが「とし」と読まれる可能性',
    suggestion: '「年間」または「ねん」に変更を検討',
  },
  {
    pattern: /時(?!間|代|計|刻|期|差|候|効)/g,
    message: '単独「時」が「とき」「じ」どちらか曖昧',
    suggestion: '前後を明確化 (例: 1時間, この時, 約1時)',
  },
  {
    pattern: /[0-9]+本/g,
    message: '「本」の読みが「ほん/ぼん/ぽん」で揺れる可能性',
    suggestion: 'カタカナ表記または「個」「件」など別単位を検討',
  },
];

// === 2. 推奨断定パターン (金融コンプラ) ===
const certaintyPatterns = [
  /(?:が安心|が大事|が大切)です?。?$/,
  /絶対(に|の)/,
  /確実に/,
  /必ず.*できる/,
  /誰でも(簡単に|稼げる|儲かる)/,
  /おすすめです[。！]?$/,
  /やるべき|やったほうがいい/,
];

// === 3. 専門用語 (初心者向けに要解説) ===
const jargonTerms = [
  "インデックス投信",
  "アクティブ投信",
  "ETF",
  "リバランス",
  "ドルコスト平均法",
  "IPO",
  "ロールオーバー",
  "信託報酬",
  "経費率",
  "シャープレシオ",
];

// === 4. 時間依存表現 ===
const dateDependent = [
  /20[0-9]{2}年(?:に|から)?/g,
  /(?:今年|来年|去年|昨年)/g,
];

// === 5. 重複表現検出 (同フレーズが近接) ===
function findDuplicatePhrases(segs) {
  const phrases = new Map(); // phrase -> [segment indices]
  for (let i = 0; i < segs.length; i++) {
    // 7文字以上の連続した部分文字列を抽出
    const text = segs[i];
    for (let j = 0; j < text.length - 6; j++) {
      const sub = text.slice(j, j + 7);
      if (!/[ぁ-んァ-ヶ一-龥]/.test(sub)) continue; // skip non-japanese
      if (!phrases.has(sub)) phrases.set(sub, []);
      phrases.get(sub).push(i);
    }
  }
  const dupes = [];
  for (const [phrase, locations] of phrases) {
    if (locations.length >= 2 && new Set(locations).size >= 2) {
      const unique = [...new Set(locations)];
      if (unique.length >= 2) dupes.push({ phrase, segments: unique });
    }
  }
  return dupes;
}

// === 6. リスク注記の存在 ===
const hasRiskNote = segments.some(
  (s) => /(価格変動リスク|元本割れ|リスク).*(あ|あります|あるので)/.test(s),
);

// Run checks
segments.forEach((seg, i) => {
  // Pronunciation hazards
  for (const { pattern, message, suggestion } of pronHazards) {
    const matches = [...seg.matchAll(pattern)];
    if (matches.length > 0) {
      push("error", i + 1, `${message}: "${matches[0][0]}"`, suggestion);
    }
  }

  // Length
  if (seg.length > 60) {
    push("error", i + 1, `セグメントが長すぎる (${seg.length}c, 推奨<=60c)`, "句点で複数セグメントに分割");
  }

  // Empty (already filtered, but double-check)
  if (seg.length === 0) {
    push("error", i + 1, `空のセグメント`);
  }

  // Certainty
  for (const pat of certaintyPatterns) {
    if (pat.test(seg)) {
      push("warn", i + 1, `推奨断定の可能性: "${seg.match(pat)[0]}"`, "「〜する人も多い」「〜が一般的」など中立化");
      break;
    }
  }

  // Jargon
  for (const term of jargonTerms) {
    if (seg.includes(term)) {
      push("warn", i + 1, `専門用語: "${term}"`, "やさしい言い換えを検討 (例: インデックス投信→値動きが穏やかな投信)");
    }
  }

  // Date dependence
  for (const pat of dateDependent) {
    const matches = [...seg.matchAll(pat)];
    for (const m of matches) {
      push("warn", i + 1, `時間依存表現: "${m[0]}"`, "「いま使える」など時間非依存の表現に");
    }
  }

  // English product name (info)
  if (/\b(NISA|iDeCo|S&P|ETF|REIT|IPO)\b/i.test(seg)) {
    push("info", i + 1, `英字表記: 発音辞書 (config/pronunciation-dictionary.json) を確認推奨`);
  }
});

// Duplicate phrases
const dupes = findDuplicatePhrases(segments);
for (const { phrase, segments: locs } of dupes) {
  push("warn", null, `重複フレーズ "${phrase}" が seg ${locs.map((i) => i + 1).join(",")} に出現`, "言い換えで情報密度を上げる");
}

// Risk note
if (!hasRiskNote) {
  push("warn", null, "リスク注記が見つからない (「価格変動リスクがあります」等)", "末尾近くに1セグメント追加推奨");
}

// === Output ===
if (jsonOut) {
  console.log(JSON.stringify({ scriptPath, segments: segments.length, issues }, null, 2));
} else {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warn");
  const infos = issues.filter((i) => i.level === "info");

  console.log(`\n📝 Script lint: ${scriptPath}`);
  console.log(`   Segments: ${segments.length}, Total chars: ${text.length}`);
  console.log(`   Errors: ${errors.length}, Warnings: ${warnings.length}, Info: ${infos.length}\n`);

  for (const issue of issues) {
    const tag =
      issue.level === "error" ? "❌ ERROR" : issue.level === "warn" ? "⚠️  WARN " : "ℹ️  INFO ";
    const seg = issue.segment ? `[seg ${issue.segment}]` : `[全体]   `;
    console.log(`  ${tag} ${seg} ${issue.message}`);
    if (issue.suggestion) console.log(`           → ${issue.suggestion}`);
  }

  console.log();
  if (errors.length > 0) console.log(`❌ ${errors.length} error(s) — 制作前に修正推奨`);
  if (warnings.length > 0) console.log(`⚠️  ${warnings.length} warning(s) — レビュー推奨`);
  if (errors.length === 0 && warnings.length === 0) console.log(`✅ All clear`);
}

const exitCode = issues.some((i) => i.level === "error")
  ? 1
  : strict && issues.some((i) => i.level === "warn")
    ? 1
    : 0;
process.exit(exitCode);
