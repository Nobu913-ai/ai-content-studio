import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { takeoutGourmetTheme as t } from "../../theme/takeoutGourmetTheme";
import { WarmBackground, WarmBackgroundVariant } from "./WarmBackground";
import { autoFontSizeJa } from "../../utils/responsive-text";

export interface WarmFoodRevealProps {
  /** タイトル (上部) */
  title?: string;
  /** 表示する料理絵文字とラベル (3-6個推奨) */
  foods: { emoji: string; label?: string }[];
  /** サブテキスト (下部) */
  subtitle?: string;
  /** 各 food の表示間隔 (秒) */
  staggerSec?: number;
  bgVariant?: WarmBackgroundVariant;
}

/**
 * 料理絵文字がポップに次々登場するコンポーネント。
 * 「ハンバーガー、カレー、ラーメン、ピザ。なんでも家で楽しめる」のような
 * バラエティ訴求シーン用。
 */
export const WarmFoodReveal: React.FC<WarmFoodRevealProps> = ({
  title,
  foods,
  subtitle,
  staggerSec = 0.3,
  bgVariant = "golden",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const staggerFrames = Math.round(staggerSec * fps);
  const baseDelay = 6;

  const titleOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 16], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleStart = baseDelay + foods.length * staggerFrames + 6;
  const subtitleOpacity = interpolate(frame, [subtitleStart, subtitleStart + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleFontSize = title
    ? autoFontSizeJa(title, Math.round(width * 0.07), width * 0.88)
    : 0;
  const subtitleFontSize = Math.round(width * 0.05);
  const emojiSize = Math.round(width * 0.16);
  const labelFontSize = Math.round(width * 0.034);

  // グリッドレイアウト
  const cols = foods.length <= 4 ? 2 : 3;
  const rows = Math.ceil(foods.length / cols);
  const cellSize = Math.min(width * 0.32, (width * 0.8) / cols);

  return (
    <WarmBackground variant={bgVariant}>
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
              fontSize: titleFontSize,
              color: t.colors.textPrimary,
              textAlign: "center",
              lineHeight: 1.3,
              textShadow: `0 2px 6px ${t.colors.shadowSoft}`,
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            gap: t.spacing.md,
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          {foods.map((food, i) => {
            const itemDelay = baseDelay + i * staggerFrames;
            const scale = spring({
              frame: Math.max(0, frame - itemDelay),
              fps,
              config: { damping: 7, mass: 0.5, stiffness: 220 },
            });
            const opacity = interpolate(frame, [itemDelay, itemDelay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const rotate = interpolate(
              frame,
              [itemDelay, itemDelay + 18],
              [-15, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const wobble = Math.sin(((frame - itemDelay) / fps) * 2.5 + i) * 4;

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `scale(${scale}) rotate(${rotate}deg) translateY(${wobble}px)`,
                  width: cellSize,
                  height: cellSize,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: t.spacing.xs,
                  backgroundColor: t.colors.cardBg,
                  border: `3px solid ${t.colors.accent}`,
                  borderRadius: t.borderRadius.lg,
                  boxShadow: `0 8px 20px ${t.colors.shadowSoft}`,
                }}
              >
                <div
                  style={{
                    fontSize: emojiSize,
                    lineHeight: 1,
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))",
                  }}
                >
                  {food.emoji}
                </div>
                {food.label && (
                  <div
                    style={{
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.bold,
                      fontSize: labelFontSize,
                      color: t.colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {food.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {subtitle && (
          <div
            style={{
              opacity: subtitleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: subtitleFontSize,
              color: t.colors.accent,
              textAlign: "center",
              lineHeight: 1.4,
              marginTop: t.spacing.md,
              textShadow: `0 2px 6px ${t.colors.shadowSoft}`,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>
    </WarmBackground>
  );
};
