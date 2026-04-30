export const genzMoneyTheme = {
  colors: {
    bgPrimary: "#1A237E",
    bgSecondary: "#0D1452",
    textPrimary: "#FFFFFF",
    textSecondary: "#B0BEC5",
    positive: "#00E676",
    negative: "#FF5252",
    highlight: "#FFD600",
    warning: "#FFD600",
    accent: "#448AFF",
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

export type GenzMoneyTheme = typeof genzMoneyTheme;
