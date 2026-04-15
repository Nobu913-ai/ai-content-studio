/**
 * Runway API クライアント
 * 動画生成ハブ — テキスト/画像からショート動画クリップを生成
 *
 * API ドキュメント: https://docs.dev.runwayml.com/
 * 環境変数: RUNWAY_API_KEY
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { resolve, writeOutput, timestamp } from "../utils/file-helpers.js";
import { fetchWithRetry } from "../utils/api-retry.js";

const API_BASE = "https://api.dev.runwayml.com/v1";
const POLL_INTERVAL_MS = 10000;
const MAX_POLL_ATTEMPTS = 60;

/**
 * API キーを取得
 */
function getApiKey() {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) {
    throw new Error(
      "RUNWAY_API_KEY が設定されていません。\n" +
        "  .env ファイルに RUNWAY_API_KEY を追加してください。\n" +
        "  取得先: https://app.runwayml.com/",
    );
  }
  return key;
}

/**
 * Runway API にリクエストを送信
 */
async function apiRequest(path, options = {}) {
  const apiKey = getApiKey();
  const url = `${API_BASE}${path}`;

  const response = await fetchWithRetry(
    url,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": "2024-11-06",
        ...options.headers,
      },
    },
    "Runway",
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Runway API エラー (${response.status}): ${body}`);
  }

  return response.json();
}

/**
 * 動画生成タスクを作成
 * @param {object} params
 * @param {string} params.prompt - 生成プロンプト
 * @param {number} [params.duration] - 秒数 (5 or 10)
 * @param {string} [params.ratio] - アスペクト比 ("16:9", "9:16")
 * @param {string} [params.imageUrl] - 入力画像URL (Image-to-Video)
 * @returns {Promise<object>} タスク情報 { id }
 */
export async function createGeneration(params) {
  const body = {
    promptText: params.prompt,
    ...(params.duration && { seconds: params.duration }),
    ...(params.ratio && { ratio: params.ratio }),
    ...(params.imageUrl && { promptImage: params.imageUrl }),
  };

  const result = await apiRequest("/image_to_video", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return { id: result.id };
}

/**
 * タスクのステータスをポーリングして完了を待つ
 * @param {string} taskId - タスクID
 * @returns {Promise<object>} { id, status, outputUrl }
 */
export async function waitForCompletion(taskId) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const result = await apiRequest(`/tasks/${taskId}`);

    if (result.status === "SUCCEEDED") {
      return {
        id: taskId,
        status: "SUCCEEDED",
        outputUrl: result.output?.[0] || result.artifacts?.[0]?.url,
      };
    }

    if (result.status === "FAILED") {
      throw new Error(`Runway 生成失敗 (task: ${taskId}): ${result.failure || "unknown error"}`);
    }

    // THROTTLED, RUNNING, PENDING — 待機
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Runway 生成タイムアウト (task: ${taskId}): ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}秒経過`);
}

/**
 * 動画URLをローカルにダウンロード
 * @param {string} url - 動画URL
 * @param {string} outputRelPath - 保存先の相対パス
 * @returns {Promise<string>} 保存先フルパス
 */
async function downloadVideo(url, outputRelPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ダウンロード失敗 (${response.status}): ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const fullPath = resolve(outputRelPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, buffer);
  return fullPath;
}

/**
 * ショットプランの1ショットを生成し、完了まで待つ。ローカル保存付き。
 * @param {object} shot - ショット定義 { shot_id, prompt, duration_sec, aspect_ratio }
 * @param {string} [channelId] - チャンネルID（ローカル保存先に使用）
 * @returns {Promise<object>} { shotId, taskId, outputUrl, localPath, status }
 */
export async function generateShot(shot, channelId) {
  console.log(`  [Runway] Generating shot: ${shot.shot_id} ...`);

  const task = await createGeneration({
    prompt: shot.prompt,
    duration: shot.duration_sec <= 5 ? 5 : 10,
    ratio: shot.aspect_ratio,
  });

  const result = await waitForCompletion(task.id);

  // ローカルにダウンロード
  let localPath = null;
  if (result.outputUrl && channelId) {
    try {
      const ts = timestamp();
      const savePath = `content/${channelId}/assets/video/${ts}_${shot.shot_id}.mp4`;
      await downloadVideo(result.outputUrl, savePath);
      localPath = savePath;
      console.log(`  [Runway] Downloaded: ${savePath}`);
    } catch (err) {
      console.error(`  [Runway] ダウンロード失敗 (${shot.shot_id}): ${err.message}`);
    }
  }

  return {
    shotId: shot.shot_id,
    taskId: task.id,
    outputUrl: result.outputUrl,
    localPath,
    status: result.status,
  };
}

/**
 * ショットプラン全体を順次生成
 * @param {Array<object>} shotPlan - ショットプラン配列
 * @param {string} channelId - チャンネルID
 * @returns {Promise<object>} 生成結果のサマリー
 */
export async function generateShotPlan(shotPlan, channelId) {
  const results = [];
  const failures = [];

  for (const shot of shotPlan) {
    try {
      const result = await generateShot(shot, channelId);
      results.push(result);
      console.log(
        `  [Runway] [OK] ${shot.shot_id} → ${result.outputUrl}${result.localPath ? ` (local: ${result.localPath})` : ""}`,
      );
    } catch (err) {
      console.error(`  [Runway] [NG] ${shot.shot_id}: ${err.message}`);
      failures.push({ shotId: shot.shot_id, error: err.message });
    }
  }

  const ts = timestamp();
  const summary = {
    channel: channelId,
    generated: ts,
    total: shotPlan.length,
    succeeded: results.length,
    failed: failures.length,
    shots: results,
    failures,
  };

  const outputPath = `content/${channelId}/metadata/${ts}_runway_shots.json`;
  writeOutput(outputPath, JSON.stringify(summary, null, 2));

  return { ...summary, outputPath };
}
