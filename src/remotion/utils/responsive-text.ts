import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";

const { width } = t.resolution;
const USABLE_WIDTH = width * 0.85;
const CHAR_WIDTH_RATIO = 0.55;

export function autoFontSize(text: string, maxFontSize: number, maxWidth: number = USABLE_WIDTH): number {
  const lines = text.split("\n");
  const longestLine = Math.max(...lines.map((l) => l.length));
  const charWidth = maxFontSize * CHAR_WIDTH_RATIO;
  const neededWidth = longestLine * charWidth;

  if (neededWidth <= maxWidth) return maxFontSize;
  return Math.max(24, Math.floor((maxWidth / longestLine) / CHAR_WIDTH_RATIO));
}

/**
 * 日本語対応の autoFontSize。
 * 全角文字（CJK / かな / 全角記号）は 1.0em、半角文字は 0.55em で幅を見積もる。
 * 全角混じり文字列で正確に幅を計算したい時に使う。
 */
const FULLWIDTH_RE = /[　-鿿＀-￯]/;

function emWidth(line: string): number {
  let total = 0;
  for (const ch of line) {
    total += FULLWIDTH_RE.test(ch) ? 1.0 : 0.55;
  }
  return total;
}

export function autoFontSizeJa(text: string, maxFontSize: number, maxWidth: number = USABLE_WIDTH): number {
  const lines = text.split("\n");
  const longestEm = Math.max(...lines.map(emWidth));
  if (longestEm === 0) return maxFontSize;
  const neededWidth = longestEm * maxFontSize;
  if (neededWidth <= maxWidth) return maxFontSize;
  return Math.max(24, Math.floor(maxWidth / longestEm));
}

/**
 * 日本語テキストを自然な区切りで2行に分割する。
 *
 * 原則:
 * - 既に改行を含むテキストは何もしない（手動指定を尊重）
 * - 1行で収まる長さなら何もしない（fontSize / maxWidth で判定）
 * - 1行に収まらない場合のみ、優先度の高い区切り（句読点 > 助詞 > 区切り記号）の中で
 *   中央に最も近い位置で改行を挿入する
 *
 * 優先度（高い順）:
 *   10  句読点 (、。) — 最強の意味区切り
 *    9  助詞 「は」 — 主題マーカー
 *    8  助詞 「を」「が」「も」 — 格助詞
 *    7  ` / ` (前後スペース付きスラッシュ) — 視覚的区切り
 *    6  助詞 「に」「で」「と」「から」「まで」
 *    5  助詞 「の」、接続助詞 「て」
 *    4  単独 `/`
 *
 * @param text 入力テキスト
 * @param fontSize 描画予定フォントサイズ (px)
 * @param maxWidth 入力可能幅 (px)
 * @param minFragmentRatio 改行後の各断片が全体に占める最小比率 (default 0.2)
 * @returns 改行が挿入された（またはされなかった）テキスト
 */
export function smartLineBreak(
  text: string,
  fontSize: number,
  maxWidth: number,
  minFragmentRatio = 0.2,
): string {
  if (text.includes("\n")) return text;
  const em = emWidth(text);
  // 0.90 倍の安全マージンを取る (フォントメトリクスのばらつき対応)。
  // 算出em幅が maxWidth*0.90 以下に確実に収まるなら 1行のまま、
  // それを超える場合は確実に2行になるよう改行を挿入する。
  if (em * fontSize <= maxWidth * 0.9) return text;

  const breakers: { str: string; priority: number }[] = [
    { str: "、", priority: 10 },
    { str: "。", priority: 10 },
    { str: "は", priority: 9 },
    { str: "を", priority: 8 },
    { str: "が", priority: 8 },
    { str: "も", priority: 8 },
    { str: " / ", priority: 7 },
    { str: "に", priority: 6 },
    { str: "で", priority: 6 },
    { str: "と", priority: 6 },
    { str: "から", priority: 6 },
    { str: "まで", priority: 6 },
    { str: "の", priority: 5 },
    { str: "て", priority: 5 },
    { str: "/", priority: 4 },
  ];

  const middle = text.length / 2;
  const minLen = Math.floor(text.length * minFragmentRatio);
  let best: { breakAt: number; score: number } | null = null;

  for (const { str, priority } of breakers) {
    let pos = 0;
    while (true) {
      pos = text.indexOf(str, pos);
      if (pos === -1) break;
      const breakAt = pos + str.length;
      const left = breakAt;
      const right = text.length - breakAt;
      pos = breakAt;
      // Skip too-short fragments
      if (left < minLen || right < minLen) continue;
      const dist = Math.abs(breakAt - middle);
      const score = priority * 100 - dist;
      if (!best || score > best.score) {
        best = { breakAt, score };
      }
    }
  }

  if (!best) return text;
  const left = text.slice(0, best.breakAt);
  const right = text.slice(best.breakAt).replace(/^\s+/, "");
  return `${left}\n${right}`;
}

export function splitOverlayLines(textOverlay: string): string[] {
  return textOverlay.split("\n").filter((l) => l.trim().length > 0);
}

export function extractNumber(text: string): number | null {
  const match = text.match(/([\d,]+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ""), 10);
}

export function hasNumber(text: string): boolean {
  return /[\d,]+万/.test(text) || /[\d,]+円/.test(text) || /[\d.]+%/.test(text);
}

export function isNegative(text: string): boolean {
  return text.includes("✕") || text.includes("×") || text.includes("NG") || text.includes("-") || text.includes("税金");
}

export function isPositive(text: string): boolean {
  return text.includes("⭕") || text.includes("✓") || text.includes("OK") || text.includes("✔") || text.includes("0%") || text.includes("ゼロ");
}
