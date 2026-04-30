import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSize } from "../utils/responsive-text";

export interface DataSourceCardProps {
  title?: string;
  sources: { name: string; date?: string; url?: string }[];
  asOfDate?: string;
  disclaimer?: string;
  bgVariant?: BackgroundVariant;
}

export const DataSourceCard: React.FC<DataSourceCardProps> = ({
  title = "情報源",
  sources,
  asOfDate,
  disclaimer,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 10], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AnimatedBackground accent={t.colors.accent} variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
          gap: t.spacing.md,
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            display: "flex",
            alignItems: "center",
            gap: t.spacing.sm,
            marginBottom: t.spacing.sm,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: `${t.colors.accent}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📑
          </div>
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.045),
              color: t.colors.textSecondary,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            width: "88%",
            display: "flex",
            flexDirection: "column",
            gap: t.spacing.sm,
          }}
        >
          {sources.map((src, i) => {
            const delay = 12 + i * 8;
            const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const slideX = interpolate(frame, [delay, delay + 12], [40, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${slideX}px)`,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: t.borderRadius.sm,
                  borderLeft: `4px solid ${t.colors.accent}`,
                  padding: `${t.spacing.sm}px ${t.spacing.md}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.bold,
                    fontSize: autoFontSize(src.name, Math.round(width * 0.04), width * 0.78),
                    color: t.colors.textPrimary,
                    lineHeight: 1.4,
                  }}
                >
                  {src.name}
                </div>
                {(src.date || src.url) && (
                  <div
                    style={{
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.regular,
                      fontSize: Math.round(width * 0.028),
                      color: t.colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    {src.date && <span>📅 {src.date}　</span>}
                    {src.url && <span>🔗 {src.url}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {asOfDate && (
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.regular,
              fontSize: Math.round(width * 0.03),
              color: t.colors.textSecondary,
              marginTop: t.spacing.sm,
              opacity: interpolate(frame, [30, 40], [0, 0.8], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            ※ {asOfDate} 時点の情報
          </div>
        )}

        {disclaimer && (
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.regular,
              fontSize: Math.round(width * 0.026),
              color: t.colors.textSecondary,
              opacity: interpolate(frame, [35, 50], [0, 0.7], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              width: "82%",
              textAlign: "center",
              lineHeight: 1.5,
              marginTop: t.spacing.xs,
            }}
          >
            {disclaimer}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
