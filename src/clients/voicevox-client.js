/**
 * VOICEVOX ENGINE API クライアント
 * 日本語音声合成 — ローカル HTTP サーバー経由
 *
 * API ドキュメント: https://voicevox.hiroshiba.jp/
 * 環境変数: VOICEVOX_ENGINE_URL (default: http://127.0.0.1:50021)
 *           VOICEVOX_SPEAKER_ID (default: 1)
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { resolve, writeOutput, timestamp } from "../utils/file-helpers.js";

/**
 * VOICEVOX ENGINE の URL を取得
 */
function getEngineUrl() {
  return process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021";
}

/**
 * デフォルトの speaker ID を取得
 */
function getDefaultSpeakerId() {
  return parseInt(process.env.VOICEVOX_SPEAKER_ID || "1", 10);
}

/**
 * VOICEVOX ENGINE にリクエストを送信
 */
async function apiRequest(path, options = {}) {
  const base = getEngineUrl();
  const url = `${base}${path}`;

  let response;
  try {
    response = await fetch(url, options);
  } catch (e) {
    throw new Error(
      `VOICEVOX ENGINE に接続できません (${base})。\n` +
        "  VOICEVOX ENGINE が起動しているか確認してください。\n" +
        "  起動方法: VOICEVOX アプリを起動、または docker run voicevox/voicevox_engine\n" +
        `  エラー: ${e.message}`,
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`VOICEVOX API エラー (${response.status}): ${body}`);
  }

  return response;
}

/**
 * 利用可能な Speaker 一覧を取得
 * @returns {Promise<Array>} Speaker 一覧
 */
export async function listSpeakers() {
  const response = await apiRequest("/speakers");
  return response.json();
}

/**
 * 音声クエリを生成（テキスト → アクセント句データ）
 * @param {string} text - 読み上げテキスト
 * @param {number} speakerId - Speaker ID
 * @returns {Promise<object>} audio_query レスポンス
 */
export async function createAudioQuery(text, speakerId) {
  const params = new URLSearchParams({ text, speaker: speakerId });
  const response = await apiRequest(`/audio_query?${params}`, {
    method: "POST",
  });
  return response.json();
}

/**
 * 音声クエリから音声を合成
 * @param {object} audioQuery - createAudioQuery の戻り値
 * @param {number} speakerId - Speaker ID
 * @returns {Promise<Buffer>} WAV 音声データ
 */
export async function synthesize(audioQuery, speakerId) {
  const params = new URLSearchParams({ speaker: speakerId });
  const response = await apiRequest(`/synthesis?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(audioQuery),
  });
  return Buffer.from(await response.arrayBuffer());
}

/**
 * テキストから音声を生成（audio_query → synthesis の一括実行）
 *
 * @param {string} channelId - チャンネルID
 * @param {string} text - ナレーションテキスト
 * @param {object} [options]
 * @param {number} [options.speakerId] - Speaker ID
 * @param {number} [options.speedScale] - 話速（default: 1.0）
 * @param {number} [options.pitchScale] - ピッチ（default: 0.0）
 * @param {number} [options.intonationScale] - イントネーション（default: 1.0）
 * @param {number} [options.volumeScale] - 音量（default: 1.0）
 * @param {string[]} [options.segments] - セグメント分割済みテキスト配列
 * @returns {Promise<object>} { path, outputPath, metadata }
 */
export async function generateNarration(channelId, text, options = {}) {
  const speakerId = options.speakerId || getDefaultSpeakerId();
  const speedScale = options.speedScale ?? 1.0;
  const pitchScale = options.pitchScale ?? 0.0;
  const intonationScale = options.intonationScale ?? 1.0;
  const volumeScale = options.volumeScale ?? 1.0;

  const segments = options.segments || [text];
  const segmentCount = segments.length;

  console.log(
    `  [VOICEVOX] Generating narration (speaker: ${speakerId}, segments: ${segmentCount}, speed: ${speedScale}) ...`,
  );

  const audioBuffers = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i].trim();
    if (!seg) continue;
    if (segmentCount > 1) {
      console.log(`  [VOICEVOX] Segment ${i + 1}/${segmentCount} (${seg.length} chars) ...`);
    }

    // audio_query で読み・アクセント解析
    const query = await createAudioQuery(seg, speakerId);

    // パラメータ調整
    query.speedScale = speedScale;
    query.pitchScale = pitchScale;
    query.intonationScale = intonationScale;
    query.volumeScale = volumeScale;

    // 音声合成
    const buf = await synthesize(query, speakerId);
    audioBuffers.push(buf);
  }

  const audioBuffer = Buffer.concat(audioBuffers);

  const ts = timestamp();
  const outputPath = `content/${channelId}/audio/${ts}_voicevox_narration.wav`;
  const fullPath = resolve(outputPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, audioBuffer);

  const metaPath = `content/${channelId}/metadata/${ts}_voicevox_narration_meta.json`;
  const metadata = {
    provider: "voicevox",
    channel: channelId,
    generated: ts,
    speaker_id: speakerId,
    text_length: text.length,
    segments: segmentCount,
    speedScale,
    pitchScale,
    intonationScale,
    volumeScale,
    outputPath,
  };
  writeOutput(metaPath, JSON.stringify(metadata, null, 2));

  console.log(`  [VOICEVOX] [OK] Audio saved: ${outputPath} (${segmentCount} segment(s), ${audioBuffer.length} bytes)`);
  return { path: fullPath, outputPath, metadata };
}

/**
 * VOICEVOX ENGINE の接続状態を確認
 * @returns {Promise<object>} { connected, version, url }
 */
export async function getStatus() {
  const base = getEngineUrl();
  try {
    const response = await fetch(`${base}/version`);
    const version = await response.text();
    return { connected: true, version: version.replace(/"/g, ""), url: base };
  } catch {
    return { connected: false, version: null, url: base };
  }
}
