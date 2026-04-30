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
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";

export interface IconGridItem {
  label: string;
  icon?: string;
  sublabel?: string;
  emphasis?: boolean;
  tone?: "positive" | "negative" | "neutral";
}

export interface IconGridProps {
  title?: string;
  subtitle?: string;
  items: IconGridItem[];
  columns?: number;
  staggerSec?: number;
  bgVariant?: BackgroundVariant;
}

const toneAccent = (tone: IconGridItem["tone"]) => {
  if (tone === "positive") return t.colors.positive;
  if (tone === "negative") return t.colors.negative;
  return t.colors.accent;
};

export const IconGrid: React.FC<IconGridProps> = ({
  title,
  subtitle,
  items,
  columns,
  staggerSec = 0.3,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  // Auto-pick columns if not specified
  const cols = columns ?? (items.length <= 4 ? items.length : items.length === 5 ? 5 : 3);
  const rows = Math.ceil(items.length / cols);

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 10], [-16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const staggerFrames = Math.round(staggerSec * fps);
  const baseDelay = 14;

  // Cell sizing
  const gridWidth = width * 0.88;
  const cellGap = t.spacing.sm;
  const cellSize = (gridWidth - cellGap * (cols - 1)) / cols;
  const iconSize = Math.min(cellSize * 0.55, 140);

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
          gap: t.spacing.lg,
        }}
      >
        {title && (
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${titleSlide}px)`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: autoFontSizeJa(title, Math.round(width * 0.06), width * 0.85),
              color: t.colors.textPrimary,
              textAlign: "center",
              lineHeight: 1.3,
              whiteSpace: "pre-wrap",
            }}
          >
            {smartLineBreak(title, Math.round(width * 0.06), width * 0.85)}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              opacity: titleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.038),
              color: t.colors.textSecondary,
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
        )}

        <div
          style={{
            width: gridWidth,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: cellGap,
          }}
        >
          {items.map((item, i) => {
            const itemDelay = baseDelay + i * staggerFrames;
            const opacity = interpolate(frame, [itemDelay, itemDelay + 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const scale = spring({
              frame: Math.max(0, frame - itemDelay),
              fps,
              config: { damping: 9, mass: 0.5, stiffness: 220 },
            });
            const accent = toneAccent(item.tone);
            const isEmphasis = item.emphasis;
            const labelFontSize = autoFontSizeJa(
              item.label,
              Math.round(width * 0.034),
              cellSize - 8,
            );
            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `scale(${scale})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: t.spacing.sm,
                  borderRadius: t.borderRadius.md,
                  backgroundColor: isEmphasis
                    ? `${accent}1f`
                    : "rgba(255,255,255,0.04)",
                  border: isEmphasis
                    ? `2px solid ${accent}`
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isEmphasis ? `0 0 30px ${accent}50` : "none",
                }}
              >
                <div
                  style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconSize / 2,
                    background: isEmphasis
                      ? `radial-gradient(circle, ${accent}, ${accent}AA)`
                      : `linear-gradient(135deg, ${t.colors.accent}40, ${t.colors.accent}20)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.round(iconSize * 0.45),
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.black,
                    color: isEmphasis ? "#fff" : t.colors.textPrimary,
                    textShadow: isEmphasis ? `0 0 16px ${accent}` : "none",
                  }}
                >
                  {item.icon || item.label.charAt(0)}
                </div>
                <div
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.bold,
                    fontSize: labelFontSize,
                    color: isEmphasis ? accent : t.colors.textPrimary,
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </div>
                {item.sublabel && (
                  <div
                    style={{
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.regular,
                      fontSize: Math.round(width * 0.026),
                      color: t.colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {item.sublabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
