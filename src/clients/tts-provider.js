/**
 * TTS Provider 抽象化レイヤー
 * ElevenLabs / VOICEVOX を統一インターフェースで切り替える
 *
 * 使い方:
 *   import { generateNarration, listVoices } from "./tts-provider.js";
 *   await generateNarration(channelId, text, { provider: "voicevox" });
 */

import * as elevenlabs from "./elevenlabs-client.js";
import * as voicevox from "./voicevox-client.js";

const PROVIDERS = {
  elevenlabs: {
    name: "ElevenLabs",
    generateNarration: elevenlabs.generateNarration,
    listVoices: elevenlabs.listVoices,
    getStatus: async () => {
      try {
        const usage = await elevenlabs.getUsage();
        return { connected: true, remaining: usage.remaining };
      } catch {
        return { connected: false, remaining: null };
      }
    },
  },
  voicevox: {
    name: "VOICEVOX",
    generateNarration: voicevox.generateNarration,
    listVoices: async () => {
      const speakers = await voicevox.listSpeakers();
      // Speaker → Voice 形式に変換（ElevenLabs 互換）
      const voices = [];
      for (const speaker of speakers) {
        for (const style of speaker.styles || []) {
          voices.push({
            voice_id: String(style.id),
            name: `${speaker.name} (${style.name})`,
            labels: { language: "ja", use_case: style.name },
            description: speaker.name,
          });
        }
      }
      return voices;
    },
    getStatus: voicevox.getStatus,
  },
};

/**
 * 利用可能な provider ID 一覧
 */
export const providerIds = Object.keys(PROVIDERS);

/**
 * provider を取得
 * @param {string} providerId - "elevenlabs" or "voicevox"
 */
export function getProvider(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error(
      `不明な TTS provider: "${providerId}"。有効な provider: ${providerIds.join(", ")}`,
    );
  }
  return provider;
}

/**
 * チャンネルのデフォルト provider を判定
 * 日本語チャンネルで VOICEVOX が利用可能なら voicevox、それ以外は elevenlabs
 *
 * @param {string} channelId
 * @returns {string} provider ID
 */
export function getDefaultProvider(channelId) {
  // 明示的に指定されていなければ elevenlabs（従来互換）
  return "elevenlabs";
}

/**
 * 統一インターフェースで音声生成
 *
 * @param {string} channelId
 * @param {string} text
 * @param {object} options - provider 固有オプション + { provider: "elevenlabs" | "voicevox" }
 */
export async function generateNarration(channelId, text, options = {}) {
  const providerId = options.provider || getDefaultProvider(channelId);
  const provider = getProvider(providerId);
  return provider.generateNarration(channelId, text, options);
}

/**
 * 統一インターフェースで Voice/Speaker 一覧取得
 */
export async function listVoices(providerId = "elevenlabs") {
  const provider = getProvider(providerId);
  return provider.listVoices();
}

/**
 * 全 provider の接続状態を確認
 * @returns {Promise<object>} { elevenlabs: {...}, voicevox: {...} }
 */
export async function getAllProviderStatus() {
  const result = {};
  for (const [id, provider] of Object.entries(PROVIDERS)) {
    try {
      result[id] = { name: provider.name, ...(await provider.getStatus()) };
    } catch {
      result[id] = { name: provider.name, connected: false };
    }
  }
  return result;
}
