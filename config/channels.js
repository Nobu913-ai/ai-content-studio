/**
 * 3チャンネルの設定定義
 * 各チャンネルのトーン、ターゲット、トピック、SEOキーワードを管理
 */

export const channels = {
  "japanese-mindset": {
    name: "Japanese Mindset",
    language: "en",
    description: "Introducing Japanese philosophy and mindset to the world",
    target:
      "English-speaking audience interested in self-improvement, productivity, and Japanese culture (25-45 age group)",
    tone: "Calm, insightful, storytelling-driven. Use a warm narrator voice. Avoid stereotyping — present concepts with depth and nuance.",
    videoStyle: "Faceless narration with AI-generated imagery of Japanese scenery, calligraphy, and conceptual art",
    estimatedCPM: "$10-20",
    uploadFrequency: "2 videos/week",
    videoLength: { min: 8, max: 15, unit: "minutes" },
    categories: [
      {
        id: "philosophy",
        name: "Japanese Philosophy",
        topics: [
          {
            title: "Ikigai — Finding Your Reason to Live",
            keywords: ["ikigai", "japanese purpose", "meaning of life japan"],
          },
          {
            title: "Wabi-Sabi — The Beauty of Imperfection",
            keywords: ["wabi sabi", "japanese aesthetics", "imperfection philosophy"],
          },
          {
            title: "Mono no Aware — The Gentle Sadness of Things",
            keywords: ["mono no aware", "japanese emotions", "cherry blossom philosophy"],
          },
          { title: "Mushin — The Mind Without Mind", keywords: ["mushin", "zen mind", "flow state japan"] },
          {
            title: "Shoganai — The Power of Letting Go",
            keywords: ["shoganai", "japanese acceptance", "letting go philosophy"],
          },
          {
            title: "Kintsugi — Turning Brokenness Into Gold",
            keywords: ["kintsugi", "japanese repair", "resilience philosophy"],
          },
        ],
      },
      {
        id: "work-ethic",
        name: "Japanese Work & Discipline",
        topics: [
          {
            title: "Kaizen — Why 1% Daily Improvement Changes Everything",
            keywords: ["kaizen", "continuous improvement", "japanese productivity"],
          },
          {
            title: "Gaman — The Japanese Art of Enduring the Unbearable",
            keywords: ["gaman", "japanese perseverance", "mental toughness japan"],
          },
          {
            title: "Omotenashi — The Mindset Behind World-Class Japanese Service",
            keywords: ["omotenashi", "japanese hospitality", "customer service japan"],
          },
          {
            title: "Monozukuri — Why Japan Obsesses Over Craftsmanship",
            keywords: ["monozukuri", "japanese craftsmanship", "manufacturing philosophy"],
          },
          {
            title: "Nemawashi — How Japanese Teams Make Decisions Without Conflict",
            keywords: ["nemawashi", "japanese decision making", "consensus building"],
          },
        ],
      },
      {
        id: "daily-life",
        name: "Japanese Daily Wisdom",
        topics: [
          {
            title: "Why Japanese Homes Are So Minimalist — It's a Philosophy",
            keywords: ["japanese minimalism", "japanese home", "less is more japan"],
          },
          {
            title: "Mottainai — The Mindset That Could Save the Planet",
            keywords: ["mottainai", "japanese waste", "sustainability japan"],
          },
          {
            title: "Hara Hachi Bu — Why Japanese People Stop Eating at 80% Full",
            keywords: ["hara hachi bu", "japanese diet", "longevity japan"],
          },
          {
            title: "How Japan Thinks About Silence Differently",
            keywords: ["japanese silence", "ma concept", "japanese communication"],
          },
          {
            title: "Shinrin-yoku — The Science Behind Japanese Forest Bathing",
            keywords: ["shinrin yoku", "forest bathing", "japanese nature therapy"],
          },
        ],
      },
    ],
    seoTags: [
      "japanese philosophy",
      "japanese mindset",
      "self improvement",
      "ikigai",
      "wabi sabi",
      "japanese culture",
      "life lessons from japan",
      "zen philosophy",
    ],
  },

  "genz-money": {
    name: "Z世代マネー教室",
    language: "ja",
    description: "Z世代向けに金融リテラシーをカジュアルに楽しく伝える",
    target: "日本の18-28歳。投資初心者、社会人1-5年目、大学生。SNSネイティブ世代",
    tone: "カジュアルでテンポが速い。敬語は最小限。若者言葉OK。「ぶっちゃけ」「マジで」等を適度に使用。ただし正確性は維持。",
    videoStyle: "ポップなアニメーション + テンポの速い編集 + AI音声ナレーション",
    estimatedCPM: "$10-20 (金融系高CPM)",
    uploadFrequency: "2-3 videos/week",
    videoLength: { min: 8, max: 12, unit: "minutes" },
    categories: [
      {
        id: "investment-basics",
        name: "投資の基礎",
        topics: [
          { title: "新NISAを5分で完全理解する動画", keywords: ["新NISA", "NISA 始め方", "投資 初心者"] },
          { title: "手取り20万でも月3万投資する具体的な方法", keywords: ["少額投資", "手取り20万", "投資 始め方"] },
          {
            title: "S&P500 vs オルカン、結局どっちがいいの？",
            keywords: ["S&P500", "オルカン", "インデックス投資 比較"],
          },
          { title: "iDeCoって何がお得なの？20代で始めるべき理由", keywords: ["iDeCo", "確定拠出年金", "節税"] },
          { title: "複利の魔法 — 25歳から始めると65歳でいくらになる？", keywords: ["複利", "長期投資", "資産形成"] },
        ],
      },
      {
        id: "money-management",
        name: "お金の管理術",
        topics: [
          { title: "推し活しながら貯金する最強テクニック", keywords: ["推し活 節約", "貯金 方法", "Z世代 お金"] },
          { title: "一人暮らしの固定費、ここ削れます", keywords: ["固定費 削減", "一人暮らし 節約", "生活費"] },
          { title: "クレカ沼にハマらないためのルール3つ", keywords: ["クレジットカード", "リボ払い 危険", "借金"] },
          { title: "ふるさと納税やらない人、損してます", keywords: ["ふるさと納税", "節税", "お得"] },
          { title: "サブスク月いくら使ってる？見直し完全ガイド", keywords: ["サブスク 節約", "固定費", "家計見直し"] },
        ],
      },
      {
        id: "career-money",
        name: "キャリア×お金",
        topics: [
          { title: "転職で年収100万上げた人がやったこと", keywords: ["転職 年収", "年収アップ", "キャリア"] },
          { title: "副業バレずに月5万稼ぐ方法【2026年版】", keywords: ["副業", "副収入", "会社にバレない"] },
          { title: "社会人1年目の給与明細、全部解説します", keywords: ["給与明細", "手取り", "社会人 お金"] },
          { title: "フリーランスvs会社員、手取りで比較してみた", keywords: ["フリーランス", "会社員 比較", "働き方"] },
        ],
      },
    ],
    seoTags: ["お金 勉強", "投資 初心者", "新NISA", "Z世代", "金融リテラシー", "貯金 方法", "資産形成", "20代 投資"],
  },

  "chill-culture": {
    name: "チルカルチャーガイド",
    language: "ja",
    description: "Z世代のための「整う」カルチャー総合ガイド。シーシャ、カフェ、サウナ、音楽、瞑想",
    target: "日本の18-30歳。都市部在住。リラックス・チル系カルチャーに興味がある層",
    tone: "落ち着いているがカジュアル。ASMRっぽい雰囲気。「エモい」「チルい」「整う」等の若者言葉を自然に使用。",
    videoStyle: "シネマティックな映像 + LoFi BGM + 落ち着いたAI音声ナレーション",
    estimatedCPM: "$3-8",
    uploadFrequency: "1-2 videos/week",
    videoLength: { min: 5, max: 10, unit: "minutes" },
    categories: [
      {
        id: "shisha",
        name: "シーシャ・カフェ",
        topics: [
          {
            title: "初めてのシーシャカフェ — 入り方から楽しみ方まで",
            keywords: ["シーシャ 初心者", "水タバコ", "シーシャカフェ"],
          },
          { title: "東京のチルすぎるシーシャスポット5選", keywords: ["シーシャ 東京", "おすすめ", "カフェ"] },
          { title: "シーシャのフレーバー選び完全ガイド", keywords: ["シーシャ フレーバー", "おすすめ", "味"] },
          {
            title: "作業が捗るカフェの選び方 — Wi-Fi・電源・雰囲気",
            keywords: ["作業カフェ", "ノマド", "Wi-Fi カフェ"],
          },
        ],
      },
      {
        id: "sauna-wellness",
        name: "サウナ・ウェルネス",
        topics: [
          { title: "サウナで「整う」を科学的に解説する", keywords: ["サウナ 整う", "ととのう", "サウナ 効果"] },
          {
            title: "初心者向けサウナの入り方 — 整うための3ステップ",
            keywords: ["サウナ 初心者", "入り方", "サウナ 始め方"],
          },
          { title: "瞑想を30日続けて起きた変化", keywords: ["瞑想", "マインドフルネス", "メンタルヘルス"] },
          { title: "夜のルーティンで睡眠の質を上げる方法", keywords: ["睡眠", "ナイトルーティン", "睡眠の質"] },
        ],
      },
      {
        id: "music-space",
        name: "音楽・空間",
        topics: [
          { title: "作業用LoFi — 集中力が上がる音楽の科学", keywords: ["LoFi", "作業用BGM", "集中 音楽"] },
          {
            title: "Z世代のサードプレイス図鑑 — 家でも職場でもない場所",
            keywords: ["サードプレイス", "居場所", "Z世代"],
          },
          { title: "お香・アロマで部屋をチルい空間にする方法", keywords: ["お香", "アロマ", "部屋 リラックス"] },
          { title: "一人時間の過ごし方 — ソロチルのすすめ", keywords: ["一人時間", "ソロ活", "おひとりさま"] },
        ],
      },
    ],
    seoTags: ["シーシャ", "チル", "サウナ", "整う", "カフェ", "リラックス", "Z世代", "LoFi", "サードプレイス"],
    contentWarning:
      "シーシャ関連コンテンツは「空間体験」にフォーカスし、喫煙の推奨と取られない表現を使用すること。YouTubeのタバコ関連ポリシーに注意。",
  },
};

/**
 * チャンネルIDからチャンネル設定を取得
 */
export function getChannel(channelId) {
  const channel = channels[channelId];
  if (!channel) {
    const validIds = Object.keys(channels).join(", ");
    throw new Error(`Unknown channel: "${channelId}". Valid channels: ${validIds}`);
  }
  return channel;
}

/**
 * 全チャンネルIDの一覧を取得
 */
export function getChannelIds() {
  return Object.keys(channels);
}
