/**
 * Descript API クライアント
 * AI補助編集 — メディアインポート・文字起こし・字幕・整音・ラフカット
 *
 * API ドキュメント: https://developers.descript.com/
 * 環境変数: DESCRIPT_API_KEY
 *
 * 注意: Descript API は beta。export は手動前提で設計。
 */

import { writeOutput, timestamp } from "../utils/file-helpers.js";
import { fetchWithRetry } from "../utils/api-retry.js";

const API_BASE = "https://api.descript.com/v2";

/**
 * API キーを取得
 */
function getApiKey() {
  const key = process.env.DESCRIPT_API_KEY;
  if (!key) {
    throw new Error(
      "DESCRIPT_API_KEY が設定されていません。\n" +
        "  .env ファイルに DESCRIPT_API_KEY を追加してください。\n" +
        "  取得先: https://www.descript.com/",
    );
  }
  return key;
}

/**
 * Descript API にリクエストを送信
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
        ...options.headers,
      },
    },
    "Descript",
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Descript API エラー (${response.status}): ${body}`);
  }

  return response.json();
}

/**
 * プロジェクトを作成
 * @param {string} title - プロジェクトタイトル
 * @returns {Promise<object>} { id, title }
 */
export async function createProject(title) {
  console.log(`  [Descript] Creating project: "${title}" ...`);

  const result = await apiRequest("/projects", {
    method: "POST",
    body: JSON.stringify({ name: title }),
  });

  return { id: result.id, title: result.name };
}

/**
 * メディアをプロジェクトにインポート
 * @param {string} projectId - プロジェクトID
 * @param {Array<string>} mediaUrls - メディアURL配列（動画・音声）
 * @returns {Promise<object>} インポート結果
 */
export async function importMedia(projectId, mediaUrls) {
  console.log(`  [Descript] Importing ${mediaUrls.length} media files ...`);

  const results = [];
  for (const url of mediaUrls) {
    const result = await apiRequest(`/projects/${projectId}/media`, {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    results.push(result);
  }

  return { projectId, imported: results.length, media: results };
}

/**
 * AI編集を適用（Underlord edit）
 * @param {string} projectId - プロジェクトID
 * @param {object} options
 * @param {boolean} [options.captions] - 字幕を追加
 * @param {boolean} [options.studioSound] - Studio Sound を適用
 * @param {boolean} [options.removeFiller] - フィラーワードを除去
 * @param {string} [options.editPrompt] - AI編集プロンプト
 * @returns {Promise<object>} 編集結果
 */
export async function applyAIEdit(projectId, options = {}) {
  const actions = [];
  if (options.captions) actions.push("add_captions");
  if (options.studioSound) actions.push("studio_sound");
  if (options.removeFiller) actions.push("remove_filler_words");

  console.log(`  [Descript] Applying AI edits: ${actions.join(", ")} ...`);

  const result = await apiRequest(`/projects/${projectId}/edits`, {
    method: "POST",
    body: JSON.stringify({
      actions,
      ...(options.editPrompt && { prompt: options.editPrompt }),
    }),
  });

  return result;
}

/**
 * 制作パイプラインの Descript ステップを一括実行
 * プロジェクト作成 → メディアインポート → AI編集適用
 *
 * @param {string} channelId - チャンネルID
 * @param {string} title - エピソードタイトル
 * @param {Array<string>} mediaUrls - メディアURL配列
 * @param {object} [editOptions] - AI編集オプション
 * @returns {Promise<object>} パイプライン結果
 */
export async function runDescriptPipeline(channelId, title, mediaUrls, editOptions = {}) {
  const project = await createProject(title);
  const importResult = await importMedia(project.id, mediaUrls);

  const defaultEditOptions = {
    captions: true,
    studioSound: true,
    removeFiller: true,
    ...editOptions,
  };
  await applyAIEdit(project.id, defaultEditOptions);

  const ts = timestamp();
  const summary = {
    channel: channelId,
    generated: ts,
    projectId: project.id,
    title,
    mediaImported: importResult.imported,
    editsApplied: Object.keys(defaultEditOptions).filter((k) => defaultEditOptions[k]),
    note: "export は Descript アプリから手動で行ってください",
  };

  const outputPath = `content/${channelId}/metadata/${ts}_descript_project.json`;
  writeOutput(outputPath, JSON.stringify(summary, null, 2));

  console.log(`  [Descript] [OK] Project ready: ${project.id}`);
  console.log(`  [Descript] Note: 最終エクスポートは Descript アプリから手動で行ってください`);

  return { ...summary, outputPath };
}
