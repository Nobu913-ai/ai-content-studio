import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "fs";
import { dirname, join, basename, resolve as pathResolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = pathResolve(__dirname, "..", "..");

/**
 * プロジェクトルートからの相対パスを解決
 */
export function resolve(...segments) {
  return join(ROOT, ...segments);
}

/**
 * ファイルを書き込み（ディレクトリがなければ作成）
 */
export function writeOutput(relativePath, content) {
  const fullPath = resolve(relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf-8");
  return fullPath;
}

/**
 * ファイルを読み込み
 */
export function readInput(relativePath) {
  const fullPath = resolve(relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`ファイルが見つかりません: ${fullPath}`);
  }
  return readFileSync(fullPath, "utf-8");
}

/**
 * ファイルが存在するか確認
 */
export function fileExists(relativePath) {
  return existsSync(resolve(relativePath));
}

/**
 * ファイルをコピー（ディレクトリがなければ作成）
 * @param {string} srcRelative - コピー元の相対パス
 * @param {string} destRelative - コピー先の相対パス
 * @returns {string|null} コピー先のフルパス（コピー元が存在しない場合は null）
 */
export function copyAsset(srcRelative, destRelative) {
  const srcFull = resolve(srcRelative);
  if (!existsSync(srcFull)) return null;
  const destFull = resolve(destRelative);
  mkdirSync(dirname(destFull), { recursive: true });
  copyFileSync(srcFull, destFull);
  return destFull;
}

/**
 * パスからファイル名を取得
 */
export function getBasename(filePath) {
  return basename(filePath);
}

/**
 * 現在の日時をファイル名に使える形式で返す
 */
export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}
