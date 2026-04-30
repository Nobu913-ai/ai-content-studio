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
