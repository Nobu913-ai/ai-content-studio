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
import { autoFontSizeJa } from "../utils/responsive-text";

export interface BrokerScreenRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface BrokerScreenMockupProps {
  brokerName: string;
  tagline?: string;
  rows: BrokerScreenRow[];
  /** ハイライト数値（例: 還元率 1.1%） */
  highlightLabel?: string;
  highlightValue?: string;
  /** ブランドカラー (ヘッダー背景) */
  brandColor?: string;
  bgVariant?: BackgroundVariant;
}

/**
 * 証券会社の NISA設定画面風モックアップ。
 * クレカ積立比較などで「実際にこういう画面で設定できる」を視覚化する。
 */
export const BrokerScreenMockup: React.FC<BrokerScreenMockupProps> = ({
  brokerName,
  tagline,
  rows,
  highlightLabel,
  highlightValue,
  brandColor,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const accent = brandColor || t.colors.accent;

  const cardOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 180 },
  });

  const cardWidth = 720;
  const screenInset = 14;

  // Highlight pulse
  const highlightPulse = highlightValue
    ? Math.sin(Math.max(0, frame - 30) * 0.08) * 0.06 + 0.94
    : 1;

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
            width: cardWidth,
            opacity: cardOpacity,
            transform: `scale(${cardScale})`,
            borderRadius: 36,
            backgroundColor: "#0a0a0a",
            border: "4px solid #2a2a2a",
            boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 80px ${accent}40`,
            padding: screenInset,
            overflow: "hidden",
          }}
        >
          {/* Status bar imitation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 20px",
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: 700,
              fontSize: 18,
              color: "#fff",
            }}
          >
            <span>9:41</span>
            <span>📶 100%</span>
          </div>

          {/* Brand header */}
          <div
            style={{
              backgroundColor: accent,
              padding: "20px 28px",
              borderRadius: t.borderRadius.md,
              color: "#fff",
            }}
          >
            <div
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.black,
                fontSize: autoFontSizeJa(brokerName, 56, cardWidth - 80),
                letterSpacing: 0.5,
              }}
            >
              {brokerName}
            </div>
            {tagline && (
              <div
                style={{
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.regular,
                  fontSize: 24,
                  marginTop: 4,
                  opacity: 0.95,
                }}
              >
                {tagline}
              </div>
            )}
          </div>

          {/* Highlight metric */}
          {highlightValue && (
            <div
              style={{
                padding: "24px 28px",
                marginTop: 18,
                backgroundColor: `${accent}15`,
                border: `2px solid ${accent}`,
                borderRadius: t.borderRadius.md,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: interpolate(frame, [16, 28], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                boxShadow: `0 0 ${24 * highlightPulse}px ${accent}80`,
              }}
            >
              {highlightLabel && (
                <span
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.bold,
                    fontSize: 30,
                    color: t.colors.textPrimary,
                  }}
                >
                  {highlightLabel}
                </span>
              )}
              <span
                style={{
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.black,
                  fontSize: 56,
                  color: accent,
                  textShadow: `0 0 ${20 * highlightPulse}px ${accent}`,
                  whiteSpace: "nowrap",
                }}
              >
                {highlightValue}
              </span>
            </div>
          )}

          {/* Detail rows */}
          <div
            style={{
              padding: "20px 0 24px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {rows.map((row, i) => {
              const delay = 28 + i * 5;
              const op = interpolate(frame, [delay, delay + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const slideX = interpolate(frame, [delay, delay + 12], [16, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });
              return (
                <div
                  key={i}
                  style={{
                    opacity: op,
                    transform: `translateX(${slideX}px)`,
                    padding: "16px 28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom:
                      i < rows.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.regular,
                      fontSize: 26,
                      color: t.colors.textSecondary,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: row.emphasis ? t.fontWeights.black : t.fontWeights.bold,
                      fontSize: row.emphasis ? 34 : 28,
                      color: row.emphasis ? accent : t.colors.textPrimary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
