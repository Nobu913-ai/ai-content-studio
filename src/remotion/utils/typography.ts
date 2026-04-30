import { genzMoneyTheme } from "../theme/genzMoneyTheme";

const { width } = genzMoneyTheme.resolution;

export const textStyles = {
  headline: {
    fontFamily: `"${genzMoneyTheme.fonts.main}", ${genzMoneyTheme.fonts.fallback}`,
    fontWeight: genzMoneyTheme.fontWeights.black,
    fontSize: Math.round(width * 0.08),
    color: genzMoneyTheme.colors.textPrimary,
    lineHeight: 1.3,
    textAlign: "center" as const,
  },
  subheadline: {
    fontFamily: `"${genzMoneyTheme.fonts.main}", ${genzMoneyTheme.fonts.fallback}`,
    fontWeight: genzMoneyTheme.fontWeights.bold,
    fontSize: Math.round(width * 0.055),
    color: genzMoneyTheme.colors.textSecondary,
    lineHeight: 1.4,
    textAlign: "center" as const,
  },
  body: {
    fontFamily: `"${genzMoneyTheme.fonts.main}", ${genzMoneyTheme.fonts.fallback}`,
    fontWeight: genzMoneyTheme.fontWeights.regular,
    fontSize: Math.round(width * 0.045),
    color: genzMoneyTheme.colors.textPrimary,
    lineHeight: 1.5,
    textAlign: "center" as const,
  },
  number: {
    fontFamily: `"${genzMoneyTheme.fonts.main}", ${genzMoneyTheme.fonts.fallback}`,
    fontWeight: genzMoneyTheme.fontWeights.black,
    fontSize: Math.round(width * 0.12),
    color: genzMoneyTheme.colors.highlight,
    lineHeight: 1.1,
    textAlign: "center" as const,
  },
  label: {
    fontFamily: `"${genzMoneyTheme.fonts.main}", ${genzMoneyTheme.fonts.fallback}`,
    fontWeight: genzMoneyTheme.fontWeights.bold,
    fontSize: Math.round(width * 0.04),
    color: genzMoneyTheme.colors.textSecondary,
    lineHeight: 1.3,
    textAlign: "center" as const,
  },
} as const;
