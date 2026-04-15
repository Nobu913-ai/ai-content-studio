import Anthropic from "@anthropic-ai/sdk";

let client = null;

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
 * @param {string} systemPrompt - システムプロンプト
 * @param {string} userPrompt - ユーザープロンプト
 * @param {object} options
 * @param {number} [options.maxTokens=4096] - 最大トークン数
 * @param {number} [options.temperature=0.7] - 温度パラメータ
 * @param {string} [options.model] - モデル名（省略時はデフォルト）
 * @returns {Promise<string>} 生成されたテキスト
 */
export async function generate(systemPrompt, userPrompt, { maxTokens = 4096, temperature = 0.7, model } = {}) {
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
