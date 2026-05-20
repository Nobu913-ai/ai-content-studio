/**
 * takeout-gourmet (Nobuグルメ) チャンネル用 Remotion テーマ
 *
 * デザイン方針:
 * - 暖色系 (クリーム / アンバー / 紙袋ブラウン) で食欲・温度感を表現
 * - calm-trust ではなく warm-friendly トーン
 * - スマホUI風・チェックリスト・架空デリバリーアプリ画面に合う配色
 * - genzMoneyTheme と同じ構造を維持して既存コンポーネントを互換利用可能に
 */
export const takeoutGourmetTheme = {
  colors: {
    /** メイン背景: 焙煎ブラウン (深い暖色) */
    bgPrimary: "#2A1810",
    /** サブ背景: グラデーション用の少し明るい焙煎 */
    bgSecondary: "#3D2817",
    /** プライマリテキスト: クリーム白 (温かみのある白) */
    textPrimary: "#FFFAF0",
    /** セカンダリテキスト: タン (紙袋色) */
    textSecondary: "#D4C5B0",
    /** ポジティブ: 黄金 (おすすめ・○マーク) */
    positive: "#FFD93D",
    /** ネガティブ: トマトレッド (注意喚起・×マーク) */
    negative: "#FF6B35",
    /** ハイライト: アンバー (重要ポイント) */
    highlight: "#FFB627",
    /** 警告: 深いオレンジレッド (やや控えめな注意) */
    warning: "#C73E1D",
    /** アクセント: ウォームオレンジ (CTA・主要要素) */
    accent: "#FF9F43",
  },
  fonts: {
    main: "Noto Sans JP",
    fallback: "sans-serif",
  },
  fontWeights: {
    regular: 400,
    bold: 700,
    black: 900,
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  resolution: {
    width: 1080,
    height: 1920,
  },
} as const;

export type TakeoutGourmetTheme = typeof takeoutGourmetTheme;
