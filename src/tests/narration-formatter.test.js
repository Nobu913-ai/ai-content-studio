import { describe, it } from "node:test";
import assert from "node:assert/strict";

// cleanScriptForNarration のロジックを直接テスト（内部関数の再現）
function cleanScriptForNarration(scriptContent) {
  return scriptContent
    .replace(/^---[\s\S]*?---\n*/m, "") // frontmatter
    .replace(/^#.*$/gm, "") // headings
    .replace(/\[SECTION:\s*[^\]]+\]/g, "") // section markers
    .replace(/\[B-ROLL:\s*[^\]]+\]/g, "") // b-roll markers
    .replace(/\[TEXT ON SCREEN:\s*[^\]]+\]/g, "") // text overlay markers
    .replace(/\[SOURCE:\s*[^\]]+\]/g, "") // source markers
    .replace(/\[INFO TYPE:\s*[^\]]+\]/g, "") // info type markers
    .replace(/\[INFO DATE:\s*[^\]]+\]/g, "") // info date markers
    .replace(/\[~\d+s?\]/g, "") // time annotations
    .replace(/\[PAUSE\]/g, "...") // pause markers → ellipsis
    .replace(/\n{3,}/g, "\n\n") // excessive newlines
    .trim();
}

describe("cleanScriptForNarration", () => {
  it("should remove frontmatter", () => {
    const input = `---
channel: test
topic: test
---

Hello, this is narration.`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("---"));
    assert.ok(result.includes("Hello, this is narration."));
  });

  it("should remove section markers", () => {
    const input = `[SECTION: Hook] さあ始めよう`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[SECTION:"));
    assert.ok(result.includes("さあ始めよう"));
  });

  it("should remove B-ROLL markers", () => {
    const input = `[B-ROLL: Tokyo skyline at sunset] 東京の夜景が広がります`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[B-ROLL:"));
    assert.ok(result.includes("東京の夜景が広がります"));
  });

  it("should remove TEXT ON SCREEN markers", () => {
    const input = `[TEXT ON SCREEN: 年間投資枠 360万円] これが上限です`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[TEXT ON SCREEN:"));
    assert.ok(result.includes("これが上限です"));
  });

  it("should remove SOURCE markers", () => {
    const input = `事実です [SOURCE: https://example.com, accessed 2025-01-10]`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[SOURCE:"));
    assert.ok(result.includes("事実です"));
  });

  it("should remove INFO TYPE markers", () => {
    const input = `[INFO TYPE: fact] これは事実です`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[INFO TYPE:"));
    assert.ok(result.includes("これは事実です"));
  });

  it("should remove INFO DATE markers", () => {
    const input = `[INFO DATE: 2025-01-01] 最新の制度では`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[INFO DATE:"));
    assert.ok(result.includes("最新の制度では"));
  });

  it("should convert PAUSE to ellipsis", () => {
    const input = `ここで一息 [PAUSE] 次に進みましょう`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[PAUSE]"));
    assert.ok(result.includes("..."));
  });

  it("should remove time annotations", () => {
    const input = `[~30s] フック部分です`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("[~30s]"));
    assert.ok(result.includes("フック部分です"));
  });

  it("should remove headings", () => {
    const input = `# タイトル\n\n本文です`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("# タイトル"));
    assert.ok(result.includes("本文です"));
  });

  it("should collapse excessive newlines", () => {
    const input = `段落1\n\n\n\n\n段落2`;
    const result = cleanScriptForNarration(input);
    assert.ok(!result.includes("\n\n\n"));
    assert.ok(result.includes("段落1\n\n段落2"));
  });

  it("should handle empty input", () => {
    const result = cleanScriptForNarration("");
    assert.equal(result, "");
  });
});
