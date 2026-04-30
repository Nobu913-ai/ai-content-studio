/**
 * 外部ツールスタック設定
 * 固定4ツール: Runway Standard / ElevenLabs Creator / DaVinci Resolve Free / Descript Creator
 */

/**
 * ツール別設定
 */
export const tools = {
  runway: {
    name: "Runway Standard",
    role: "動画生成ハブ",
    apiEndpoint: "https://api.dev.runwayml.com/v1",
    envKey: "RUNWAY_API_KEY",
    monthlyCost: "$12",
  },
  elevenlabs: {
    name: "ElevenLabs Creator",
    role: "音声基盤（日本語・英語ナレーション）",
    apiEndpoint: "https://api.elevenlabs.io/v1",
    envKey: "ELEVENLABS_API_KEY",
    monthlyCost: "$22",
    defaultModel: "eleven_multilingual_v2",
  },
  descript: {
    name: "Descript Creator",
    role: "AI補助編集（字幕・整音・ラフカット）",
    apiEndpoint: "https://api.descript.com/v1",
    envKey: "DESCRIPT_API_KEY",
    monthlyCost: "$24-$35",
  },
  davinci: {
    name: "DaVinci Resolve Free",
    role: "最終仕上げ（手動）",
    apiEndpoint: null,
    envKey: null,
    monthlyCost: "$0",
  },
  voicevox: {
    name: "VOICEVOX ENGINE",
    role: "日本語音声合成（比較検証用）",
    apiEndpoint: "http://127.0.0.1:50021",
    envKey: "VOICEVOX_ENGINE_URL",
    monthlyCost: "$0",
    note: "ローカル実行。商用利用可（クレジット表記必要・speaker別規約確認）",
  },
  remotion: {
    name: "Remotion",
    role: "動画本編レンダリング（React/TypeScriptベース）",
    apiEndpoint: null,
    envKey: null,
    monthlyCost: "$0",
    note: "ローカルレンダリング。個人・3人以下チームは無料。scene JSONからモーショングラフィックス動画を生成",
  },
};

/**
 * VOICEVOX Speaker プリセット（春日部つむぎ ノーマル基準）
 * 調整順: 話速 → 句読点の間 → 抑揚 → 音高
 */
export const voicevoxPresets = {
  "genz-money-shorts": {
    name: "四国めたん ショート用（メイン）",
    speakerId: 2,
    speedScale: 1.12,
    pitchScale: -0.02,
    intonationScale: 1.00,
    volumeScale: 1.16,
    prePhonemeLength: 0.04,
    postPhonemeLength: 0.07,
    pauseLengthScale: 0.75,
    segmentGapMs: 100,
    enableInterrogativeUpspeak: true,
  },
  "genz-money-longform": {
    name: "四国めたん 長尺用",
    speakerId: 2,
    speedScale: 0.98,
    pitchScale: -0.02,
    intonationScale: 1.00,
    volumeScale: 1.00,
    prePhonemeLength: 0.08,
    postPhonemeLength: 0.12,
    pauseLengthScale: 1.05,
    segmentGapMs: 400,
    enableInterrogativeUpspeak: true,
  },
  "genz-money-tsumugi-shorts": {
    name: "春日部つむぎ ショート用（サブ）",
    speakerId: 8,
    speedScale: 1.08,
    pitchScale: 0.00,
    intonationScale: 1.10,
    volumeScale: 1.00,
    prePhonemeLength: 0.08,
    postPhonemeLength: 0.12,
    pauseLengthScale: 0.90,
    segmentGapMs: 300,
    enableInterrogativeUpspeak: true,
  },
  "genz-money-mochiko-shorts": {
    name: "もち子さん ショート用（サブ）",
    speakerId: 20,
    speedScale: 1.08,
    pitchScale: 0.00,
    intonationScale: 1.10,
    volumeScale: 1.02,
    prePhonemeLength: 0.07,
    postPhonemeLength: 0.11,
    pauseLengthScale: 0.95,
    segmentGapMs: 300,
    enableInterrogativeUpspeak: true,
  },
};

/**
 * チャンネル別 Voice Routing 設定
 * voice_id はElevenLabsで作成/選択した音声のID
 */
export const voiceRouting = {
  "genz-money": {
    language: "ja",
    provider: "voicevox",
    preset: "genz-money-shorts",
    style: "clear, calm, credible",
    description: "四国めたん ノーマル — 芯のある落ち着いた日本語ナレーション",
  },
  "japanese-mindset": {
    language: "en",
    voice_id: "voice_en_docu_01",
    style: "warm, thoughtful, explanatory",
    stability: 0.65,
    similarity_boost: 0.75,
    description: "ドキュメンタリー調の温かみある英語ナレーション",
  },
  "chill-culture": {
    language: "ja",
    voice_id: "voice_ja_soft_01",
    style: "gentle, relaxed",
    stability: 0.7,
    similarity_boost: 0.7,
    description: "リラックスした穏やかな日本語ナレーション",
  },
};

/**
 * チャンネル別 Shot スタイル設定
 * Runway へのプロンプト生成に使用
 */
export const shotStyles = {
  "genz-money": {
    defaultAspectRatio: "9:16",
    style: "clean infographic style, modern typography, data visualization, no human face",
    motionNote: "simple motion, smooth transitions",
    durationRange: { min: 4, max: 8 },
    description: "図解寄り・説明寄り。写実生成より情報可視化を優先",
  },
  "japanese-mindset": {
    defaultAspectRatio: "16:9",
    style: "cinematic Japanese scenery, calligraphy, conceptual art, respectful documentary tone",
    motionNote: "calm pacing, subtle motion, slow zoom",
    durationRange: { min: 6, max: 10 },
    description: "シリーズ一貫性を意識。同じ雰囲気のプロンプト群",
  },
  "chill-culture": {
    defaultAspectRatio: "9:16",
    style: "warm ambient lighting, cozy interiors, steam, soft bokeh, lo-fi aesthetic",
    motionNote: "gentle movement, relaxed pacing",
    durationRange: { min: 4, max: 8 },
    description: "実写優位。AIは補助的に使う。雰囲気重視",
  },
};

/**
 * DaVinci Resolve 書き出しプリセット
 */
export const exportPresets = {
  shorts: {
    name: "shorts_1080x1920_h264",
    resolution: "1080x1920",
    codec: "H.264",
    fps: 30,
    aspectRatio: "9:16",
  },
  longform_16_9: {
    name: "longform_1920x1080_h264",
    resolution: "1920x1080",
    codec: "H.264",
    fps: 30,
    aspectRatio: "16:9",
  },
  longform_9_16: {
    name: "longform_1080x1920_h264",
    resolution: "1080x1920",
    codec: "H.264",
    fps: 30,
    aspectRatio: "9:16",
  },
};

/**
 * 保留ツール一覧（参考用）
 */
export const deferredTools = [
  { name: "Adobe Firefly", priority: "高", condition: "genz-money の図解品質が課題になった時" },
  { name: "Vertex AI Veo 3.1", priority: "高", condition: "ショット単位の従量最適化を本格化する時" },
  { name: "FLUX系API", priority: "中", condition: "サムネABテストを大量に回したくなった時" },
  { name: "OpusClip", priority: "中", condition: "長尺→Shorts切り出し工数が重くなった時" },
  { name: "Midjourney", priority: "中", condition: "ブランド世界観の強化が必要になった時" },
  { name: "HeyGen", priority: "低〜中", condition: "英語講師キャラ型に寄せる時" },
];

/**
 * ツール設定を取得
 */
export function getTool(toolId) {
  const tool = tools[toolId];
  if (!tool) {
    throw new Error(`不明なツール: "${toolId}". 有効なツール: ${Object.keys(tools).join(", ")}`);
  }
  return tool;
}

/**
 * Voice routing を取得
 */
export function getVoiceConfig(channelId) {
  const config = voiceRouting[channelId];
  if (!config) {
    throw new Error(`Voice routing が未設定: "${channelId}"`);
  }
  return config;
}

/**
 * Shot スタイルを取得
 */
export function getShotStyle(channelId) {
  const style = shotStyles[channelId];
  if (!style) {
    throw new Error(`Shot style が未設定: "${channelId}"`);
  }
  return style;
}
