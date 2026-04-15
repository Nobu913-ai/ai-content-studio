/**
 * 外部API共通のリトライ・エラーハンドリングユーティリティ
 * 指数バックオフ + リトライ可能エラー判定
 */

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
 * HTTPステータスコードからリトライ可能か判定
 */
function isRetryableStatus(status) {
  if (status === 429) return true; // Rate limit
  if (status === 503) return true; // Service unavailable
  if (status >= 500 && status < 600) return true; // Server error
  return false;
}

/**
 * エラーオブジェクトからリトライ可能か判定
 */
function isRetryableError(error) {
  if (error.status && isRetryableStatus(error.status)) return true;
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") return true;
  if (error.message && error.message.includes("fetch failed")) return true;
  return false;
}

/**
 * リトライ付き fetch ラッパー
 * @param {string} url - リクエストURL
 * @param {object} options - fetch オプション
 * @param {string} serviceName - サービス名（ログ表示用）
 * @returns {Promise<Response>} fetch レスポンス
 */
export async function fetchWithRetry(url, options, serviceName = "API") {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.error(`  [${serviceName}] リトライ ${attempt}/${MAX_RETRIES} ...`);
        await backoff(attempt - 1);
      }

      const response = await fetch(url, options);

      // 成功 or リトライ不可能なエラー → そのまま返す
      if (response.ok || !isRetryableStatus(response.status)) {
        return response;
      }

      // リトライ可能なHTTPエラー
      const body = await response.text().catch(() => "");
      lastError = new Error(`${serviceName} API エラー (${response.status}): ${body}`);
      lastError.status = response.status;

      if (attempt < MAX_RETRIES) continue;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && isRetryableError(error)) continue;
      break;
    }
  }

  throw lastError;
}
