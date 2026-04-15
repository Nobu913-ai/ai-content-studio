import Anthropic from "@anthropic-ai/sdk";
import { writeOutput, timestamp } from "./file-helpers.js";

let client = null;

/**
 * Anthropic API キーが設定されているか確認
 * @returns {boolean}
 */
export function hasAnthropicKey() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Claude API クライアントを取得（シングルトン）
 * 環境変数 ANTHROPIC_API_KEY が必要
 */
export function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY が設定されていません。\n" +
          "  1. cp .env.example .env\n" +
          "  2. .env ファイルに API キーを記入してください\n" +
          "  取得先: https://console.anthropic.com/",
      );
    }
    client = new Anthropic();
  }
  return client;
}

/**
 * プロンプトをファイルに書き出す（手動 Claude Code ワークフロー用）
 * API キー未設定時に、Claude Code で手動実行できるプロンプトを保存する
 *
 * @param {string} label - 用途ラベル（例: "script", "shot-plan"）
 * @param {string} systemPrompt - システムプロンプト
 * @param {string} userPrompt - ユーザープロンプト
 * @param {string} [outputHint] - 出力先ヒント
 * @returns {string} 保存先パス
 */
export function exportPrompt(label, systemPrompt, userPrompt, outputHint) {
  const ts = timestamp();
  const promptContent = `# Claude Code 手動実行プロンプト: ${label}
# 生成日時: ${ts}
# このファイルの使い方:
#   1. Claude Code で以下のプロンプトを実行してください
#   2. 出力を${outputHint || "適切なファイル"}に保存してください
#   3. 保存後、パイプラインの次のステップに進めます

## System Prompt
${systemPrompt}

## User Prompt
${userPrompt}
`;

  const promptPath = `content/_prompts/${ts}_${label}.md`;
  writeOutput(promptPath, promptContent);
  return promptPath;
}

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

/**
 * 指数バックオフで待機
 */
function backoff(attempt) {
  const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * リトライ可能なエラーかどうかを判定
 */
function isRetryable(error) {
  if (error.status === 429) return true; // Rate limit
  if (error.status === 529) return true; // Overloaded
  if (error.status >= 500 && error.status < 600) return true; // Server error
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") return true;
  return false;
}

/**
 * API エラーをわかりやすいメッセージに変換
 */
function formatApiError(error) {
  if (error.status === 401) {
    return "API キーが無効です。.env ファイルの ANTHROPIC_API_KEY を確認してください。";
  }
  if (error.status === 429) {
    return "API レート制限に達しました。しばらく待ってから再試行してください。";
  }
  if (error.status === 529) {
    return "Anthropic API が一時的に過負荷状態です。しばらく待ってから再試行してください。";
  }
  if (error.status === 400) {
    return `API リクエストが不正です: ${error.message}`;
  }
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
    return "ネットワーク接続エラーです。インターネット接続を確認してください。";
  }
  return `API エラー (${error.status || "unknown"}): ${error.message}`;
}

/**
 * Claude API を呼び出してテキストを生成（リトライ付き）
 *
 * ハイブリッドモード:
 * - ANTHROPIC_API_KEY 設定済み → API で自動生成
 * - ANTHROPIC_API_KEY 未設定 → プロンプトをファイルに書き出し、null を返す
 *
 * @param {string} systemPrompt - システムプロンプト
 * @param {string} userPrompt - ユーザープロンプト
 * @param {object} options
 * @param {number} [options.maxTokens=4096] - 最大トークン数
 * @param {number} [options.temperature=0.7] - 温度パラメータ
 * @param {string} [options.model] - モデル名（省略時はデフォルト）
 * @param {string} [options.label] - 手動モード時のプロンプトラベル
 * @param {string} [options.outputHint] - 手動モード時の出力先ヒント
 * @returns {Promise<string|null>} 生成されたテキスト、手動モード時は null
 */
export async function generate(
  systemPrompt,
  userPrompt,
  { maxTokens = 4096, temperature = 0.7, model, label, outputHint } = {},
) {
  // ハイブリッドモード: API キー未設定時はプロンプト書き出し
  if (!hasAnthropicKey()) {
    const promptLabel = label || "claude-prompt";
    const path = exportPrompt(promptLabel, systemPrompt, userPrompt, outputHint);
    console.log(`  [Manual] ANTHROPIC_API_KEY 未設定 → プロンプトを書き出しました: ${path}`);
    console.log(`  [Manual] Claude Code で上記プロンプトを実行し、結果を保存してください`);
    return null;
  }

  const anthropic = getClient();

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.error(`  [リトライ ${attempt}/${MAX_RETRIES}] 再試行中...`);
        await backoff(attempt - 1);
      }

      const response = await anthropic.messages.create({
        model: model || DEFAULT_MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      // レスポンス検証
      if (!response.content || response.content.length === 0) {
        throw new Error("API から空のレスポンスが返されました。");
      }

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock) {
        throw new Error("API レスポンスにテキストブロックが含まれていません。");
      }

      if (response.stop_reason === "max_tokens") {
        console.warn("  [警告] トークン上限に達したため、出力が途中で切れている可能性があります。");
      }

      return textBlock.text;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && isRetryable(error)) {
        continue;
      }
      break;
    }
  }

  throw new Error(formatApiError(lastError));
}
