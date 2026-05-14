import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { splitNarrationSegments, clearDictionaryCache } from "../generators/narration-formatter.js";

// =========================================================================
// 内部関数の再現（テスト用）
// =========================================================================

function cleanScriptForNarration(scriptContent) {
  return scriptContent
    .replace(/^---[\s\S]*?---\n*/m, "")
    .replace(/^#.*$/gm, "")
    .replace(/\[SECTION:\s*[^\]]+\](\s*\[~\d+s?\])?/g, "")
    .replace(/\[B-ROLL:\s*[^\]]+\]/g, "")
    .replace(/\[TEXT ON SCREEN:\s*[^\]]+\]/g, "")
    .replace(/\[SOURCE:\s*[^\]]+\]/g, "")
    .replace(/\[INFO TYPE:\s*[^\]]+\]/g, "")
    .replace(/\[INFO DATE:\s*[^\]]+\]/g, "")
    .replace(/\[~\d+s?\]/g, "")
    .replace(/\[PAUSE\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/^※.*$/gm, "")
    .replace(/\.\.\./g, "")
    .replace(/^[Q][:：]\s*/gm, "")
    .replace(/^金融庁「[^」]+」.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function optimizeForTTS(text) {
  let result = text;
  result = result.replace(/[:：]\s*/g, "。\n");
  result = result.replace(/^(ステップ\d+)。\n/gm, "$1。\n");
  result = result
    .split("\n")
    .map((line) => splitLongSentence(line, 35))
    .join("\n");
  result = result.replace(/%/g, "パーセント");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}

function splitLongSentence(line, maxChars) {
  line = line.trim();
  if (!line || line.length <= maxChars) return line;
  const parts = [];
  let remaining = line;
  while (remaining.length > maxChars) {
    let splitAt = -1;
    for (let i = Math.min(maxChars, remaining.length) - 1; i >= 0; i--) {
      if (remaining[i] === "、") { splitAt = i; break; }
    }
    if (splitAt === -1) {
      for (let i = Math.min(maxChars, remaining.length) - 1; i >= 0; i--) {
        if (remaining[i] === "。") { splitAt = i; break; }
      }
    }
    if (splitAt === -1) break;
    const part = remaining.slice(0, splitAt + 1).trim();
    parts.push(part.endsWith("、") ? part.slice(0, -1) + "。" : part);
    remaining = remaining.slice(splitAt + 1).trim();
  }
  if (remaining) parts.push(remaining);
  return parts.join("\n");
}

// =========================================================================
// Phase 1: マーカー除去テスト
// =========================================================================

describe("cleanScriptForNarration", () => {
  it("should remove frontmatter", () => {
    const input = `---\nchannel: test\ntopic: test\n---\n\nHello, this is narration.`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("---"));
    assert.ok(result.includes("Hello, this is narration."));
  });

  it("should remove section markers with and without time", () => {
    assert.ok(!cleanScriptForNarration("[SECTION: hook] [~30s] テスト").includes("[SECTION:"));
    assert.ok(!cleanScriptForNarration("[SECTION: disclaimer] テスト").includes("[SECTION:"));
  });

  it("should remove B-ROLL markers", () => {
    const result = cleanScriptForNarration("[B-ROLL: Tokyo skyline] 東京の夜景");
    assert.ok(!result.includes("[B-ROLL:"));
    assert.ok(result.includes("東京の夜景"));
  });

  it("should remove TEXT ON SCREEN markers", () => {
    const result = cleanScriptForNarration("[TEXT ON SCREEN: 投資枠] これが上限");
    assert.ok(!result.includes("[TEXT ON SCREEN:"));
  });

  it("should remove SOURCE markers", () => {
    const result = cleanScriptForNarration("事実 [SOURCE: https://example.com]");
    assert.ok(!result.includes("[SOURCE:"));
  });

  it("should remove INFO TYPE and INFO DATE markers", () => {
    const result = cleanScriptForNarration("[INFO TYPE: fact]\n[INFO DATE: 2025-01-01]\nテスト");
    assert.ok(!result.includes("[INFO TYPE:"));
    assert.ok(!result.includes("[INFO DATE:"));
  });

  it("should remove PAUSE markers (not convert to ellipsis)", () => {
    const result = cleanScriptForNarration("ここで [PAUSE] 次へ");
    assert.ok(!result.includes("[PAUSE]"));
    assert.ok(!result.includes("..."));
  });

  it("should remove bold markdown", () => {
    const result = cleanScriptForNarration("**ステップ1：口座開設**");
    assert.ok(!result.includes("**"));
    assert.ok(result.includes("ステップ1"));
  });

  it("should remove separator lines", () => {
    const result = cleanScriptForNarration("段落1\n\n---\n\n段落2");
    assert.ok(!result.match(/^---+$/m));
  });

  it("should remove disclaimer lines", () => {
    const result = cleanScriptForNarration("本文\n※ 免責事項です");
    assert.ok(!result.includes("※"));
  });

  it("should remove Q: prefixes", () => {
    const result = cleanScriptForNarration("Q: 損することある？");
    assert.ok(!result.includes("Q:"));
    assert.ok(result.includes("損することある？"));
  });

  it("should remove source description lines", () => {
    const result = cleanScriptForNarration('金融庁「新しいNISA」特設ページ — 制度概要');
    assert.equal(result, "");
  });

  it("should handle empty input", () => {
    assert.equal(cleanScriptForNarration(""), "");
  });
});

// =========================================================================
// Phase 2: TTS向け短文化テスト
// =========================================================================

describe("optimizeForTTS", () => {
  it("should convert colons to line breaks", () => {
    const result = optimizeForTTS("ステップ1：証券口座を開設する");
    assert.ok(result.includes("ステップ1。"));
    assert.ok(result.includes("証券口座を開設する"));
  });

  it("should split long sentences at commas", () => {
    const long = "月100円から投資を始められて、しかも利益に税金がかからない制度があるんだけど。";
    const result = optimizeForTTS(long);
    const lines = result.split("\n").filter((l) => l.trim());
    assert.ok(lines.length >= 2, `should split into 2+ lines, got ${lines.length}`);
    lines.forEach((l) => {
      assert.ok(l.length <= 40, `line too long (${l.length}): ${l}`);
    });
  });

  it("should not split short sentences", () => {
    const short = "ねえ、知ってた？";
    const result = optimizeForTTS(short);
    assert.equal(result, short);
  });

  it("should convert % to パーセント", () => {
    const result = optimizeForTTS("約20%が税金です");
    assert.ok(result.includes("パーセント"));
    assert.ok(!result.includes("%"));
  });
});

// =========================================================================
// セグメント分割テスト
// =========================================================================

describe("splitNarrationSegments", () => {
  it("should merge short paragraphs into segments", () => {
    const text = "短い段落1\n\n短い段落2\n\n短い段落3";
    const segments = splitNarrationSegments(text, 20);
    assert.ok(segments.length < 3, "short paragraphs should be merged");
  });

  it("should keep long paragraphs as separate segments", () => {
    const longPara = "あ".repeat(250);
    const text = `${longPara}\n\n${longPara}`;
    const segments = splitNarrationSegments(text, 200);
    assert.equal(segments.length, 2);
  });

  it("should handle empty text", () => {
    assert.deepEqual(splitNarrationSegments(""), []);
  });
});

// =========================================================================
// 回帰テスト: 新NISA原稿
// =========================================================================

const NISA_SAMPLE_SCRIPT = `---
channel: お金の初期設定
topic: "新NISAの始め方"
generated: 2026-04-16T01-05-16
language: ja
---

# 新NISAの始め方

[SECTION: hook] [~30s]

ねえ、知ってた？

[TEXT ON SCREEN: 月100円から投資できる]

月100円から投資を始められて、しかも利益に税金がかからない制度があるんだけど。

[B-ROLL: スマホで証券アプリを開いている手元]

マジでこれ、知らないだけで年間何万円も損してる可能性あるよ。

[PAUSE]

今日は「新NISA」の始め方を、投資ゼロの人でもわかるように全部説明する。

---

[SECTION: disclaimer]

[TEXT ON SCREEN: 免責事項]

※ 本動画は情報提供を目的としており、特定の金融商品の勧誘ではありません。

---

[SECTION: sources]

[SOURCE: https://www.fsa.go.jp/policy/nisa2/, accessed 2026-04-16]
金融庁「新しいNISA」特設ページ — 制度概要、投資枠、非課税保有限度額の情報`;

describe("regression: 新NISA原稿", () => {
  it("should remove all markers from NISA script", () => {
    const result = cleanScriptForNarration(NISA_SAMPLE_SCRIPT);
    assert.ok(!result.includes("[SECTION:"), "SECTION markers should be removed");
    assert.ok(!result.includes("[TEXT ON SCREEN:"), "TEXT ON SCREEN should be removed");
    assert.ok(!result.includes("[B-ROLL:"), "B-ROLL should be removed");
    assert.ok(!result.includes("[PAUSE]"), "PAUSE should be removed");
    assert.ok(!result.includes("[SOURCE:"), "SOURCE should be removed");
    assert.ok(!result.includes("※"), "disclaimer should be removed");
    assert.ok(!result.includes("金融庁「"), "source desc line should be removed");
    assert.ok(!result.includes("---"), "separator lines should be removed");
  });

  it("should keep narration text from NISA script", () => {
    const result = cleanScriptForNarration(NISA_SAMPLE_SCRIPT);
    assert.ok(result.includes("ねえ、知ってた？"));
    assert.ok(result.includes("月100円から投資を始められて"));
    assert.ok(result.includes("新NISA"));
  });

  it("should produce short sentences after TTS optimization", () => {
    const cleaned = cleanScriptForNarration(NISA_SAMPLE_SCRIPT);
    const optimized = optimizeForTTS(cleaned);
    const lines = optimized.split("\n").filter((l) => l.trim());
    const longLines = lines.filter((l) => l.length > 45);
    assert.ok(
      longLines.length <= 1,
      `Too many long lines (${longLines.length}): ${longLines.join(" | ")}`,
    );
  });
});
