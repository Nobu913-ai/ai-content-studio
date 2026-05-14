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
  variant?: "circle" | "card" | "badge";
  brandColor?: string;
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
  const badgeSizeShared = Math.min(iconSize * 1.25, cellSize - 16);

  // Shared font size across badge siblings.
  // Use the LONGEST LINE across all badges (after \n splits) so multi-line
  // text gets larger font while still fitting horizontally.
  const longestBadgeLines = items
    .filter((item) => item.variant === "badge")
    .map((item) => {
      const text = item.icon || item.label;
      return text.split("\n").reduce((a, b) => (a.length >= b.length ? a : b), "");
    });
  const badgeFontSizes = longestBadgeLines.map((line) =>
    autoFontSizeJa(
      line,
      Math.round(badgeSizeShared * 0.36),
      badgeSizeShared * 0.82,
    ),
  );
  const sharedBadgeFontSize =
    badgeFontSizes.length > 0 ? Math.min(...badgeFontSizes) : 0;

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
            const isCard = item.variant === "card";
            const isBadge = item.variant === "badge";
            const brandColor = item.brandColor;
            const cardWidth = Math.min(iconSize * 1.45, cellSize - 16);
            const cardHeight = cardWidth * 0.63;
            const badgeSize = badgeSizeShared;
            const badgeText = item.icon || item.label;
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
                {isCard ? (
                  <div
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                      borderRadius: cardWidth * 0.08,
                      background: brandColor
                        ? `linear-gradient(135deg, ${brandColor}, ${brandColor}CC)`
                        : `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                      boxShadow: `0 4px 18px ${(brandColor || accent)}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: cardHeight * 0.14,
                        left: cardWidth * 0.1,
                        width: cardWidth * 0.16,
                        height: cardHeight * 0.18,
                        borderRadius: 4,
                        background: "linear-gradient(135deg, #F0D27A, #C9A24A)",
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: cardHeight * 0.12,
                        left: cardWidth * 0.1,
                        right: cardWidth * 0.1,
                        height: 2,
                        background: "rgba(255,255,255,0.35)",
                        borderRadius: 2,
                      }}
                    />
                    <div
                      style={{
                        fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                        fontWeight: t.fontWeights.black,
                        fontSize: Math.round(cardHeight * 0.38),
                        color: "#FFFFFF",
                        letterSpacing: 1,
                        textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        marginTop: cardHeight * 0.06,
                      }}
                    >
                      {item.icon || item.label.charAt(0)}
                    </div>
                  </div>
                ) : isBadge ? (
                  <div
                    style={{
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: badgeSize * 0.22,
                      background: brandColor
                        ? `linear-gradient(135deg, ${brandColor}, ${brandColor}DD)`
                        : `linear-gradient(135deg, ${accent}, ${accent}DD)`,
                      boxShadow: `0 6px 20px ${(brandColor || accent)}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                      padding: badgeSize * 0.08,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "50%",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0))",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                        fontWeight: t.fontWeights.black,
                        fontSize: sharedBadgeFontSize,
                        color: "#FFFFFF",
                        letterSpacing: 0.5,
                        textShadow: "0 2px 6px rgba(0,0,0,0.25)",
                        textAlign: "center",
                        lineHeight: 1.15,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {badgeText.includes("\n")
                        ? badgeText
                        : smartLineBreak(badgeText, sharedBadgeFontSize, badgeSize * 0.82)}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: iconSize,
                      height: iconSize,
                      borderRadius: iconSize / 2,
                      background: brandColor
                        ? `radial-gradient(circle, ${brandColor}, ${brandColor}CC)`
                        : isEmphasis
                          ? `radial-gradient(circle, ${accent}, ${accent}AA)`
                          : `linear-gradient(135deg, ${t.colors.accent}40, ${t.colors.accent}20)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: Math.round(iconSize * 0.45),
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.black,
                      color: isEmphasis || brandColor ? "#fff" : t.colors.textPrimary,
                      textShadow: isEmphasis ? `0 0 16px ${accent}` : "none",
                    }}
                  >
                    {item.icon || item.label.charAt(0)}
                  </div>
                )}
                {!isBadge && (
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
                )}
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
