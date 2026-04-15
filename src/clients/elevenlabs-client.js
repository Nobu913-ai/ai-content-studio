/**
 * ElevenLabs API クライアント
 * 音声基盤 — 日本語・英語ナレーション生成
 *
 * API ドキュメント: https://elevenlabs.io/docs/api-reference
 * 環境変数: ELEVENLABS_API_KEY
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { resolve, writeOutput, timestamp } from "../utils/file-helpers.js";
import { getVoiceConfig } from "../../config/tools.js";
import { fetchWithRetry } from "../utils/api-retry.js";

const API_BASE = "https://api.elevenlabs.io/v1";

/**
 * API キーを取得
 */
function getApiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error(
      "ELEVENLABS_API_KEY が設定されていません。\n" +
        "  .env ファイルに ELEVENLABS_API_KEY を追加してください。\n" +
        "  取得先: https://elevenlabs.io/",
    );
  }
  return key;
}

/**
 * ElevenLabs API にリクエストを送信
 */
async function apiRequest(path, options = {}) {
  const apiKey = getApiKey();
  const url = `${API_BASE}${path}`;

  const response = await fetchWithRetry(
    url,
    {
      ...options,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    },
    "ElevenLabs",
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`ElevenLabs API エラー (${response.status}): ${body}`);
  }

  return response;
}

/**
 * テキストから音声を生成
 * @param {string} channelId - チャンネルID（voice routing に使用）
 * @param {string} text - ナレーションテキスト
 * @param {object} [options]
 * @param {string} [options.voiceId] - voice_id を直接指定（省略時はチャンネル設定を使用）
 * @param {string} [options.model] - モデル名
 * @returns {Promise<object>} { path, outputPath, duration }
 */
export async function generateNarration(channelId, text, options = {}) {
  const voiceConfig = getVoiceConfig(channelId);
  const voiceId = options.voiceId || voiceConfig.voice_id;
  const model = options.model || "eleven_multilingual_v2";

  console.log(`  [ElevenLabs] Generating narration (voice: ${voiceId}, model: ${model}) ...`);

  const response = await apiRequest(`/text-to-speech/${voiceId}`, {
    method: "POST",
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability: voiceConfig.stability,
        similarity_boost: voiceConfig.similarity_boost,
      },
    }),
  });

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  const ts = timestamp();
  const outputPath = `content/${channelId}/audio/${ts}_narration.mp3`;
  const fullPath = resolve(outputPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, audioBuffer);

  // メタデータを保存
  const metaPath = `content/${channelId}/metadata/${ts}_narration_meta.json`;
  const metadata = {
    channel: channelId,
    generated: ts,
    voice_id: voiceId,
    model,
    text_length: text.length,
    style: voiceConfig.style,
    outputPath,
  };
  writeOutput(metaPath, JSON.stringify(metadata, null, 2));

  console.log(`  [ElevenLabs] [OK] Audio saved: ${outputPath}`);
  return { path: fullPath, outputPath, metadata };
}

/**
 * 利用可能な Voice 一覧を取得
 * @returns {Promise<Array>} Voice 一覧
 */
export async function listVoices() {
  const response = await apiRequest("/voices");
  const data = await response.json();
  return data.voices || [];
}

/**
 * 残りクォータ（文字数）を確認
 * @returns {Promise<object>} { character_count, character_limit }
 */
export async function getUsage() {
  const response = await apiRequest("/user/subscription");
  const data = await response.json();
  return {
    character_count: data.character_count,
    character_limit: data.character_limit,
    remaining: data.character_limit - data.character_count,
  };
}
