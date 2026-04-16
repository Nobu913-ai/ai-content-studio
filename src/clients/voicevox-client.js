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
 * @param {object} [options]
 * @param {boolean} [options.enableInterrogativeUpspeak] - 疑問文の語尾自動持ち上げ（default: true）
 * @returns {Promise<Buffer>} WAV 音声データ
 */
export async function synthesize(audioQuery, speakerId, options = {}) {
  const enableUpspeak = options.enableInterrogativeUpspeak ?? true;
  const params = new URLSearchParams({
    speaker: speakerId,
    enable_interrogative_upspeak: enableUpspeak,
  });
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
 * @param {number} [options.pauseLengthScale] - ポーズ長倍率（default: 1.0）
 * @param {number} [options.prePhonemeLength] - 音声前の無音長（default: 0.1）
 * @param {number} [options.postPhonemeLength] - 音声後の無音長（default: 0.1）
 * @param {boolean} [options.enableInterrogativeUpspeak] - 疑問文の語尾自動持ち上げ（default: true）
 * @param {string[]} [options.segments] - セグメント分割済みテキスト配列
 * @param {number} [options.segmentGapMs] - セグメント間の無音挿入（ミリ秒、default: 0）
 * @returns {Promise<object>} { path, outputPath, metadata }
 */
export async function generateNarration(channelId, text, options = {}) {
  const speakerId = options.speakerId || getDefaultSpeakerId();
  const speedScale = options.speedScale ?? 1.0;
  const pitchScale = options.pitchScale ?? 0.0;
  const intonationScale = options.intonationScale ?? 1.0;
  const volumeScale = options.volumeScale ?? 1.0;
  const pauseLengthScale = options.pauseLengthScale ?? 1.0;
  const prePhonemeLength = options.prePhonemeLength ?? 0.1;
  const postPhonemeLength = options.postPhonemeLength ?? 0.1;
  const enableInterrogativeUpspeak = options.enableInterrogativeUpspeak ?? true;
  const segmentGapMs = options.segmentGapMs ?? 0;

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
    query.pauseLengthScale = pauseLengthScale;
    query.prePhonemeLength = prePhonemeLength;
    query.postPhonemeLength = postPhonemeLength;

    // 音声合成
    const buf = await synthesize(query, speakerId, { enableInterrogativeUpspeak });
    audioBuffers.push(buf);
  }

  const audioBuffer = concatWavBuffers(audioBuffers, segmentGapMs);

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
    pauseLengthScale,
    prePhonemeLength,
    postPhonemeLength,
    enableInterrogativeUpspeak,
    segmentGapMs,
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

/**
 * 複数の WAV バッファを正しく結合する
 * WAV ヘッダーのデータ長を更新し、PCM データ部分のみ結合する
 * セグメント間に指定ミリ秒の無音を挿入可能
 *
 * @param {Buffer[]} buffers - WAV バッファの配列
 * @param {number} [gapMs=0] - セグメント間に挿入する無音（ミリ秒）
 * @returns {Buffer} 結合された WAV バッファ
 */
function concatWavBuffers(buffers, gapMs = 0) {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  // 最初の WAV からヘッダー情報を取得（44バイトが標準 WAV ヘッダー）
  const WAV_HEADER_SIZE = 44;
  const header = Buffer.from(buffers[0].subarray(0, WAV_HEADER_SIZE));

  // VOICEVOX は 24000Hz 16bit mono
  const SAMPLE_RATE = 24000;
  const BYTES_PER_SAMPLE = 2;
  const silence =
    gapMs > 0
      ? Buffer.alloc(Math.round((SAMPLE_RATE * gapMs) / 1000) * BYTES_PER_SAMPLE, 0)
      : null;

  // 各バッファから PCM データ部分のみ抽出し、間に無音を挿入して結合
  const parts = [];
  for (let i = 0; i < buffers.length; i++) {
    parts.push(buffers[i].subarray(WAV_HEADER_SIZE));
    if (silence && i < buffers.length - 1) {
      parts.push(silence);
    }
  }
  const totalDataSize = parts.reduce((sum, part) => sum + part.length, 0);

  // ヘッダーの ChunkSize (offset 4) と Subchunk2Size (offset 40) を更新
  header.writeUInt32LE(36 + totalDataSize, 4); // RIFF ChunkSize
  header.writeUInt32LE(totalDataSize, 40); // data Subchunk2Size

  return Buffer.concat([header, ...parts]);
}
