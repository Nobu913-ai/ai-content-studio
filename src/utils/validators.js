import { resolve } from "./file-helpers.js";
import { getChannelIds } from "../../config/channels.js";
import { normalize } from "path";

/**
 * チャンネルIDを検証
 * @param {string} channelId
 * @returns {string} 検証済みのチャンネルID
 */
export function validateChannelId(channelId) {
  if (!channelId || typeof channelId !== "string" || channelId.trim() === "") {
    throw new Error("チャンネルIDを指定してください。");
  }
  const id = channelId.trim();
  const validIds = getChannelIds();
  if (!validIds.includes(id)) {
    throw new Error(`不明なチャンネル: "${id}"\n  有効なチャンネル: ${validIds.join(", ")}`);
  }
  return id;
}

/**
 * トピック文字列を検証
 * @param {string} topic
 * @returns {string} 検証済みのトピック
 */
export function validateTopic(topic) {
  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    throw new Error("トピックを指定してください。");
  }
  const t = topic.trim();
  if (t.length > 200) {
    throw new Error("トピックは200文字以内で指定してください。");
  }
  return t;
}

/**
 * ファイルパスを検証（content/ ディレクトリ内に制限）
 * パストラバーサル攻撃を防止
 * @param {string} inputPath
 * @returns {string} 検証済みの相対パス
 */
export function validateContentPath(inputPath) {
  if (!inputPath || typeof inputPath !== "string" || inputPath.trim() === "") {
    throw new Error("ファイルパスを指定してください。");
  }

  const contentRoot = normalize(resolve("content"));
  const resolved = normalize(resolve(inputPath));

  if (!resolved.startsWith(contentRoot)) {
    throw new Error(`パスは content/ ディレクトリ内を指定してください。\n  指定されたパス: ${inputPath}`);
  }

  return inputPath.trim();
}

/**
 * 週数を検証
 * @param {string|number} weeks
 * @returns {number} 検証済みの週数
 */
export function validateWeeks(weeks) {
  const n = parseInt(weeks, 10);
  if (isNaN(n) || n < 1 || n > 12) {
    throw new Error("週数は 1〜12 の間で指定してください。");
  }
  return n;
}
