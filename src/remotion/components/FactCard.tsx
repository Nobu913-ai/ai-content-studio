import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSize, autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";

export interface FactCardProps {
  headline: string;
  subheadline?: string;
  highlight?: string[];
  variant?: "default" | "punch" | "soft";
  tone?: "positive" | "negative" | "neutral";
  bgVariant?: BackgroundVariant;
}

const toneColor = (tone: FactCardProps["tone"]) => {
  if (tone === "positive") return t.colors.positive;
  if (tone === "negative") return t.colors.negative;
  return t.colors.textPrimary;
};

const accentByTone = (tone: FactCardProps["tone"]) => {
  if (tone === "positive") return t.colors.positive;
  if (tone === "negative") return t.colors.negative;
  return t.colors.accent;
};

export const FactCard: React.FC<FactCardProps> = ({
  headline,
  subheadline,
  highlight = [],
  variant = "default",
  tone = "neutral",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;
  const accent = accentByTone(tone);

  const headlineScale = spring({
    frame,
    fps,
    config: { damping: variant === "punch" ? 8 : 12, mass: 0.6, stiffness: variant === "punch" ? 220 : 140 },
  });
  const headlineOpacity = interpolate(frame, [0, variant === "punch" ? 6 : 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subSlide = interpolate(frame, [10, 22], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const baseHeadlineSize = variant === "punch"
    ? Math.round(width * 0.11)
    : variant === "soft"
      ? Math.round(width * 0.085)
      : Math.round(width * 0.095);
  const headlineMaxWidth = width * 0.85;
  const subMaxWidth = width * 0.78;
  const headlineFontSize = autoFontSizeJa(headline, baseHeadlineSize, headlineMaxWidth);
  // 自動改行（headline は手動 \n が多いので smartLineBreak は subheadline のみ）
  // 2-pass: smartLineBreak の判定 → 改行後の最長行で再フォントサイズ計算
  const subheadlineBase = Math.round(width * 0.046);
  const initialSubFontSize = subheadline
    ? autoFontSizeJa(subheadline, subheadlineBase, subMaxWidth)
    : 0;
  const wrappedSubheadline = subheadline
    ? smartLineBreak(subheadline, initialSubFontSize, subMaxWidth)
    : "";
  const subFontSize = subheadline
    ? autoFontSizeJa(wrappedSubheadline, subheadlineBase, subMaxWidth)
    : 0;

  const glow = variant === "punch" ? 1 : 0.6;

  return (
    <AnimatedBackground accent={accent} variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520,
            height: 520,
            borderRadius: 260,
            background: `radial-gradient(circle, ${accent}26 0%, transparent 70%)`,
            opacity: glow,
            filter: "blur(20px)",
          }}
        />

        <div
          style={{
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: headlineFontSize,
            color: toneColor(tone),
            textAlign: "center",
            lineHeight: 1.25,
            textShadow: `0 0 ${28 * glow}px ${accent}50, 0 0 ${60 * glow}px ${accent}20`,
            whiteSpace: "pre-wrap",
          }}
        >
          {renderWithHighlights(headline, highlight, accent)}
        </div>

        {subheadline && (
          <div
            style={{
              opacity: subOpacity,
              transform: `translateY(${subSlide}px)`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: subFontSize,
              color: t.colors.textSecondary,
              textAlign: "center",
              marginTop: t.spacing.lg,
              maxWidth: width * 0.8,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {wrappedSubheadline}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};

function renderWithHighlights(text: string, highlights: string[], accent: string): React.ReactNode {
  if (highlights.length === 0) return text;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    let earliest = remaining.length;
    let matched = "";
    for (const w of highlights) {
      const idx = remaining.indexOf(w);
      if (idx !== -1 && idx < earliest) {
        earliest = idx;
        matched = w;
      }
    }
    if (matched && earliest < remaining.length) {
      if (earliest > 0) parts.push(<span key={key++}>{remaining.slice(0, earliest)}</span>);
      parts.push(
        <span
          key={key++}
          style={{
            color: accent,
            textShadow: `0 0 24px ${accent}80, 0 0 50px ${accent}40`,
          }}
        >
          {matched}
        </span>,
      );
      remaining = remaining.slice(earliest + matched.length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }
  return <>{parts}</>;
}
