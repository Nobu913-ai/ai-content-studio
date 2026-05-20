/**
 * takeout-gourmet (Nobuグルメ) チャンネル用 Remotion テーマ v2
 *
 * 設計方針:
 * - Instagram Reels に映えるブライト+ビビッド+ポップな暖色系
 * - 食欲をそそる赤・オレンジ・黄色のアクセント
 * - クリーム背景に濃いめのテキストで可読性最大化
 * - 紙袋・夜のテーブルではなく「明るい食卓・お店の照明」イメージ
 * - genzMoneyTheme と同じ構造を維持して既存コンポーネント互換利用可能
 */
export const takeoutGourmetTheme = {
  colors: {
    /** メイン背景: ウォームクリーム (明るい・食欲が湧く) */
    bgPrimary: "#FFF4E0",
    /** サブ背景: ピーチクリーム (グラデーション・カードベース) */
    bgSecondary: "#FFE4B5",
    /** ゴールデンゾーン: 強調シーン用の温かい黄色 */
    bgAccent: "#FFD27A",
    /** プライマリテキスト: ダークブラウン (高コントラスト) */
    textPrimary: "#2E1A0F",
    /** セカンダリテキスト: ソフトブラウン */
    textSecondary: "#6B4F3A",
    /** ポジティブ: 明るいゴールデンイエロー */
    positive: "#FFC93C",
    /** ネガティブ: 深い警告レッド */
    negative: "#C73E1D",
    /** ハイライト: 食欲をそそるトマトオレンジ */
    highlight: "#FF6B35",
    /** 警告: アンバーオレンジ */
    warning: "#FF9F43",
    /** アクセント: メインのビビッドオレンジ (CTA・強調) */
    accent: "#FF6B35",
    /** カード背景 (白で抜く時用) */
    cardBg: "#FFFFFF",
    /** カードボーダー */
    cardBorder: "#E8D5B0",
    /** シャドウ用 */
    shadowSoft: "rgba(46, 26, 15, 0.12)",
    shadowStrong: "rgba(46, 26, 15, 0.25)",
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
    xl: 32,
  },
  resolution: {
    width: 1080,
    height: 1920,
  },
} as const;

export type TakeoutGourmetTheme = typeof takeoutGourmetTheme;
