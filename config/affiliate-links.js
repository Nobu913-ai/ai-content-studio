/**
 * アフィリエイトリンク・送客導線管理
 *
 * - 各動画のCTAで自動差し込みされる
 * - キャンペーン期間や条件はASP管理画面で更新するため、ここはURLとラベルのみ管理
 * - URLは将来の置き換え用にプレースホルダ可（実IDは環境変数で上書き）
 */

const env = (key, fallback) => process.env[key] || fallback;

/**
 * 証券会社（NISA口座開設）
 */
export const brokers = {
  sbi: {
    id: "sbi",
    name: "SBI証券",
    shortName: "SBI",
    creditCard: "三井住友カード",
    creditCardRate: "0.5%〜3.0%（カード種類による）",
    minMonthlyAmount: 100,
    affiliateUrl: env("AFF_SBI_URL", "https://example.com/aff/sbi"),
    pinnedCommentText: "📌 SBI証券（三井住友カード積立）→ {url}",
  },
  rakuten: {
    id: "rakuten",
    name: "楽天証券",
    shortName: "楽天",
    creditCard: "楽天カード",
    creditCardRate: "0.5%〜1.0%",
    minMonthlyAmount: 100,
    affiliateUrl: env("AFF_RAKUTEN_URL", "https://example.com/aff/rakuten"),
    pinnedCommentText: "📌 楽天証券（楽天カード積立）→ {url}",
  },
  monex: {
    id: "monex",
    name: "マネックス証券",
    shortName: "マネックス",
    creditCard: "マネックスカード",
    creditCardRate: "1.1%",
    minMonthlyAmount: 100,
    affiliateUrl: env("AFF_MONEX_URL", "https://example.com/aff/monex"),
    pinnedCommentText: "📌 マネックス証券（マネックスカード積立）→ {url}",
  },
  aukabu: {
    id: "aukabu",
    name: "au カブコム証券",
    shortName: "auカブコム",
    creditCard: "au PAYカード",
    creditCardRate: "1.0%",
    minMonthlyAmount: 100,
    affiliateUrl: env("AFF_AUKABU_URL", "https://example.com/aff/aukabu"),
    pinnedCommentText: "📌 auカブコム証券（au PAYカード積立）→ {url}",
  },
  matsui: {
    id: "matsui",
    name: "松井証券",
    shortName: "松井",
    creditCard: "MATSUI SECURITIES CARD",
    creditCardRate: "0.5%〜1.0%",
    minMonthlyAmount: 100,
    affiliateUrl: env("AFF_MATSUI_URL", "https://example.com/aff/matsui"),
    pinnedCommentText: "📌 松井証券（MATSUIカード積立）→ {url}",
  },
};

/**
 * クレジットカード単体の案件（証券口座と独立に紹介する場合）
 */
export const creditCards = {
  smbcCardNL: {
    id: "smbcCardNL",
    name: "三井住友カード（NL）",
    affiliateUrl: env("AFF_CARD_SMBC_NL", "https://example.com/aff/smbc-nl"),
  },
  rakutenCard: {
    id: "rakutenCard",
    name: "楽天カード",
    affiliateUrl: env("AFF_CARD_RAKUTEN", "https://example.com/aff/rakuten-card"),
  },
};

/**
 * Owned 導線（LINE / ブログ / プロフィール固定リンク）
 */
export const ownedDestinations = {
  lineOfficial: {
    id: "lineOfficial",
    name: "公式LINE",
    description: "新NISA・クレカ積立の無料チェックリスト配布中",
    url: env("OWNED_LINE_URL", "https://lin.ee/example"),
  },
  blog: {
    id: "blog",
    name: "ブログ",
    description: "保存版の比較表・チェックリスト",
    url: env("OWNED_BLOG_URL", "https://example.com/genz-money"),
  },
  profileLinkHub: {
    id: "profileLinkHub",
    name: "プロフィールリンク",
    description: "全リンクまとめ",
    url: env("OWNED_LINKHUB_URL", "https://lit.link/example"),
  },
};

/**
 * 動画の主訴求テーマに応じて使うリンクのプリセット
 */
export const ctaPresets = {
  nisaIntro: {
    primary: "lineOfficial",
    secondary: "profileLinkHub",
    label: "NISAの始め方は固定コメント / プロフィールへ",
  },
  cardCompare: {
    primary: "lineOfficial",
    secondary: "blog",
    label: "おすすめのクレカ積立は固定コメント / ブログへ",
  },
  startupChecklist: {
    primary: "lineOfficial",
    secondary: "profileLinkHub",
    label: "PDFは公式LINEで無料配布中",
  },
};

/**
 * shotPlan の ctaPanel.preset を解決して、destinations配列とsubtextを返す
 */
export function resolveCtaPreset(presetName) {
  const preset = ctaPresets[presetName];
  if (!preset) return null;

  const map = {
    lineOfficial: "pinnedComment",
    blog: "profileLink",
    profileLinkHub: "profileLink",
  };

  const destinations = [
    map[preset.primary],
    preset.secondary ? map[preset.secondary] : null,
  ].filter(Boolean);

  return {
    destinations,
    subtext: preset.label,
  };
}
