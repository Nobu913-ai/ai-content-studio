/**
 * 収益化設定
 * アフィリエイト、デジタル商品、スポンサー、プラットフォーム別の収益管理
 */

export const monetization = {
  "genz-money": {
    priority: 1,
    revenueTarget: 50000, // 月額目標（円）
    affiliates: [
      { name: "SBI証券 口座開設", asp: "A8.net", cpa: 3000, url: "", category: "証券" },
      { name: "楽天証券", asp: "A8.net", cpa: 2000, url: "", category: "証券" },
      { name: "マネーフォワード ME", asp: "もしもアフィリエイト", cpa: 1000, url: "", category: "家計簿アプリ" },
      { name: "楽天カード", asp: "A8.net", cpa: 5000, url: "", category: "クレジットカード" },
      { name: "ふるさとチョイス", asp: "バリューコマース", cpa: 1500, url: "", category: "ふるさと納税" },
    ],
    digitalProducts: [
      { name: "Z世代の家計簿 Notionテンプレート", price: 980, platform: "BOOTH", url: "" },
      { name: "新NISA完全ガイド PDF", price: 1480, platform: "note.com", url: "" },
      { name: "投資スタートチェックリスト", price: 0, platform: "LINE公式", note: "リード獲得用無料配布" },
    ],
    descriptionTemplate: `
▼ 動画で紹介したサービス
{{AFFILIATE_LINKS}}

▼ 無料で使えるお金の管理ツール
{{DIGITAL_PRODUCTS}}

▼ チャンネル登録はこちら
{{CHANNEL_URL}}

※ 本動画は情報提供を目的としており、特定の金融商品の勧誘ではありません。投資は自己責任でお願いします。
※ 一部アフィリエイトリンクを含みます（PR）
`,
    compliance: [
      "「投資は自己責任」の免責事項を必ず含める",
      "景品表示法に基づき PR 表記を入れる",
      "特定の銘柄の推奨はしない",
      "金融庁の無登録業者にならないよう注意",
    ],
  },

  "chill-culture": {
    priority: 3,
    revenueTarget: 20000,
    affiliates: [
      { name: "Amazon アソシエイト", asp: "Amazon", commission: "2-8%", url: "", category: "シーシャ・カフェ用品" },
      { name: "楽天アフィリエイト", asp: "楽天", commission: "2-8%", url: "", category: "サウナグッズ" },
      { name: "サウナイキタイ", asp: "direct", cpa: 2000, url: "", category: "サウナ" },
    ],
    digitalProducts: [
      { name: "東京チルスポットマップ PDF", price: 500, platform: "BOOTH", url: "" },
      { name: "おうちチル環境セットアップガイド", price: 780, platform: "note.com", url: "" },
    ],
    descriptionTemplate: `
▼ 動画で紹介したアイテム
{{AFFILIATE_LINKS}}

▼ おすすめガイド
{{DIGITAL_PRODUCTS}}

▼ チャンネル登録・フォロー
{{CHANNEL_URL}}

#シーシャ #サウナ #カフェ #チル
※ リンクにはアフィリエイトを含みます
`,
    compliance: [
      "シーシャは「空間体験」として紹介。喫煙推奨にならない表現",
      "未成年の喫煙を助長しない",
      "PR 表記を入れる",
    ],
  },

  "japanese-mindset": {
    priority: 2,
    revenueTarget: 15000,
    affiliates: [
      { name: "Amazon Associates (US)", asp: "Amazon", commission: "1-4%", url: "", category: "Books" },
      { name: "Audible Free Trial", asp: "Amazon", cpa: 500, url: "", category: "Audiobooks" },
      { name: "Skillshare", asp: "Impact", cpa: 700, url: "", category: "Online Learning" },
      { name: "Headspace / Calm", asp: "direct", cpa: 1500, url: "", category: "Meditation" },
    ],
    digitalProducts: [
      { name: "30-Day Ikigai Journal (PDF)", price: 7, currency: "USD", platform: "Gumroad", url: "" },
      { name: "Wabi-Sabi Living Guide", price: 12, currency: "USD", platform: "Gumroad", url: "" },
    ],
    descriptionTemplate: `
▼ Resources Mentioned
{{AFFILIATE_LINKS}}

▼ Free & Paid Guides
{{DIGITAL_PRODUCTS}}

▼ Subscribe for more Japanese wisdom
{{CHANNEL_URL}}

Some links are affiliate links — they help support this channel at no cost to you.
`,
    compliance: [
      "FTC disclosure for affiliate links",
      "No cultural stereotyping or oversimplification",
    ],
  },
};

/**
 * プラットフォーム別の投稿設定
 */
export const platforms = {
  youtube: {
    longForm: { frequency: "2/week per channel", optimalLength: "8-15 min", bestDays: ["Tue", "Thu"] },
    shorts: { frequency: "2-3/day per channel", maxLength: 60, bestTimes: ["7:00", "12:00", "19:00"] },
  },
  tiktok: {
    frequency: "2-3/day per account",
    optimalLength: "60-180 sec (Creator Rewards requires 1min+)",
    monetization: { followers: 10000, views30d: 100000 },
    bestTimes: ["7:00", "12:00", "19:00", "22:00"],
    hashtags: {
      "genz-money": ["投資", "NISA", "お金の勉強", "Z世代", "資産形成", "節約"],
      "chill-culture": ["シーシャ", "サウナ", "カフェ巡り", "チル", "東京カフェ", "整う"],
      "japanese-mindset": ["japanesewisdom", "ikigai", "wabisabi", "japanculture", "mindset"],
    },
  },
  instagram: {
    reels: { frequency: "1-2/day per account", maxLength: 90 },
    carousel: { frequency: "2-3/week", slides: "5-10" },
  },
  twitter: {
    threads: { frequency: "1/day per account" },
    clips: { maxLength: "2:20" },
  },
};

/**
 * 月次収益目標のブレイクダウン
 */
export const revenueTargets = {
  month1: { total: 5000, breakdown: { affiliate: 3000, digital: 2000, ads: 0, sponsor: 0 } },
  month2: { total: 20000, breakdown: { affiliate: 10000, digital: 7000, ads: 0, sponsor: 3000 } },
  month3: { total: 50000, breakdown: { affiliate: 25000, digital: 10000, ads: 5000, sponsor: 10000 } },
  month4: { total: 80000, breakdown: { affiliate: 35000, digital: 15000, ads: 10000, sponsor: 20000 } },
};

export function getMonetization(channelId) {
  const config = monetization[channelId];
  if (!config) throw new Error(`No monetization config for channel: ${channelId}`);
  return config;
}
