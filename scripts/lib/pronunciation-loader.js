/**
 * 発音辞書ローダ。
 * config/pronunciation-dictionary.json を直接読み込み、
 * measure-segments.js / generate-genz-audio.js などのスクリプトから共通利用する。
 *
 * narration-formatter.js が独自に持っている辞書ロジックと辞書ソースは同一。
 * このローダは、shorts用音声生成系スクリプトが narration-formatter.js を経由せず
 * 同等の置換を行えるようにするための薄い層。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DICT_PATH = resolve(__dirname, "../../config/pronunciation-dictionary.json");

/**
 * 辞書を読み込み、entries を {original, reading} のペア配列で返す。
 * entries + categories.* + channel_overrides.<channel> を統合。
 */
export function loadPronunciationDictionary(channelId) {
  const raw = readFileSync(DICT_PATH, "utf-8");
  const dict = JSON.parse(raw);

  const merged = new Map();
  for (const [k, v] of Object.entries(dict.entries || {})) merged.set(k, v);
  for (const cat of Object.values(dict.categories || {})) {
    for (const [k, v] of Object.entries(cat.entries || {})) merged.set(k, v);
  }
  if (channelId && dict.channel_overrides?.[channelId]) {
    for (const [k, v] of Object.entries(dict.channel_overrides[channelId])) {
      merged.set(k, v);
    }
  }

  // 長い語句を先に置換するように長さでソート
  return [...merged.entries()].sort((a, b) => b[0].length - a[0].length);
}

/**
 * テキストに辞書を適用して返す。
 */
export function applyPronunciationDictionary(text, channelId) {
  const dict = loadPronunciationDictionary(channelId);
  let result = text;
  for (const [from, to] of dict) result = result.replaceAll(from, to);
  return result;
}

/**
 * 辞書置換を逆方向に適用 (kana読み → 元の漢字/英字表記)。
 *
 * 用途: measure-segments.js は applyPronunciationDictionary 後のテキストで音声を生成するため
 *       segment.text は kana 化された読み (例: "ニーサ口座") になる。
 *       これを caption 表示用に元の表記 (例: "NISA口座") に戻す。
 *
 * 注意: 1対多のマッピングがある場合は最初に登録された方が優先される (実用上問題ないはず)。
 */
export function reversePronunciationDictionary(text, channelId) {
  const dict = loadPronunciationDictionary(channelId);
  // reading -> original の逆引きマップを構築。長い reading から優先する。
  const reverse = [];
  const seen = new Set();
  for (const [from, to] of dict) {
    if (seen.has(to)) continue; // ambiguous reading: keep first
    seen.add(to);
    reverse.push([to, from]);
  }
  reverse.sort((a, b) => b[0].length - a[0].length);
  let result = text;
  for (const [reading, original] of reverse) result = result.replaceAll(reading, original);
  return result;
}
