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
import { autoFontSizeJa, smartLineBreak } from "../../utils/responsive-text";

export interface WarmTeaserCardProps {
  /** ラベル (例: 「次回予告」) */
  label: string;
  /** メインタイトル */
  headline: string;
  /** サブタイトル (例: 「3つの見方を紹介」) */
  subheadline?: string;
  /** 大きな絵文字 (ラベルとヘッドラインの間に表示) */
  emoji?: string;
  /** チェックポイント (例: 3つの見方) */
  hintItems?: { icon?: string; text: string }[];
  /** 締めのテキスト */
  footnote?: string;
  bgVariant?: WarmBackgroundVariant;
}

/**
 * 次回予告カード。
 * 「次回: Uber Eatsで失敗しない店選び3つの見方」のように、
 * 視聴者の期待感を引き出すための専用シーン用。
 */
export const WarmTeaserCard: React.FC<WarmTeaserCardProps> = ({
  label,
  headline,
  subheadline,
  emoji,
  hintItems = [],
  footnote,
  bgVariant = "hero",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const labelOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelScale = spring({
    frame,
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });
  const headlineScale = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 160 },
  });
  const headlineOpacity = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelFontSize = Math.round(width * 0.046);
  const headlineFontSize = autoFontSizeJa(headline, Math.round(width * 0.092), width * 0.86);
  const headlineWrapped = smartLineBreak(headline, headlineFontSize, width * 0.86);
  const subheadlineFontSize = subheadline
    ? autoFontSizeJa(subheadline, Math.round(width * 0.052), width * 0.85)
    : 0;
  const hintFontSize = Math.round(width * 0.054);
  const footFontSize = Math.round(width * 0.034);
  const hintIconSize = Math.round(width * 0.085);
  const emojiSize = Math.round(width * 0.14);
  const emojiPop = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });
  const emojiWobble = Math.sin((frame / fps) * 2.5) * 5;
  const subheadlineOpacity = interpolate(frame, [20, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hintStaggerFrames = Math.round(0.22 * fps);
  const hintBase = 22;

  const footStart = hintBase + hintItems.length * hintStaggerFrames + 8;
  const footOpacity = interpolate(frame, [footStart, footStart + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 矢印 (期待感の動き)
  const arrowBounce = Math.sin((frame / fps) * 4) * 6;

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
          gap: t.spacing.md,
        }}
      >
        <div
          style={{
            opacity: labelOpacity,
            transform: `scale(${labelScale})`,
            display: "flex",
            alignItems: "center",
            gap: t.spacing.xs,
            backgroundColor: t.colors.accent,
            color: "#FFFFFF",
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: labelFontSize,
            padding: `${t.spacing.sm}px ${t.spacing.xl}px`,
            borderRadius: 999,
            letterSpacing: 2,
            boxShadow: `0 10px 24px rgba(255,107,53,0.45)`,
          }}
        >
          <span style={{ fontSize: labelFontSize * 1.1, transform: `translateY(${arrowBounce / 4}px)` }}>▶</span>
          <span>{label}</span>
        </div>

        {emoji && (
          <div
            style={{
              fontSize: emojiSize,
              transform: `scale(${emojiPop}) translateY(${emojiWobble}px)`,
              filter: `drop-shadow(0 8px 16px ${t.colors.shadowStrong})`,
              lineHeight: 1,
              marginTop: t.spacing.sm,
            }}
          >
            {emoji}
          </div>
        )}

        <div
          style={{
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: headlineFontSize,
            color: t.colors.textPrimary,
            textAlign: "center",
            lineHeight: 1.25,
            whiteSpace: "pre-wrap",
            textShadow: `0 4px 12px ${t.colors.shadowStrong}`,
            marginTop: t.spacing.sm,
            padding: `0 ${t.spacing.md}px`,
          }}
        >
          {headlineWrapped}
        </div>

        {subheadline && (
          <div
            style={{
              opacity: subheadlineOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: subheadlineFontSize,
              color: t.colors.accent,
              textAlign: "center",
              lineHeight: 1.4,
              marginTop: t.spacing.sm,
              textShadow: `0 2px 6px ${t.colors.shadowSoft}`,
            }}
          >
            {subheadline}
          </div>
        )}

        {hintItems.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: t.spacing.sm,
              marginTop: t.spacing.md,
              width: "92%",
            }}
          >
            {hintItems.map((hint, i) => {
              const delay = hintBase + i * hintStaggerFrames;
              const op = interpolate(frame, [delay, delay + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const slide = interpolate(frame, [delay, delay + 14], [50, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={i}
                  style={{
                    opacity: op,
                    transform: `translateX(${slide}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: t.spacing.md,
                    backgroundColor: t.colors.cardBg,
                    border: `3px solid ${t.colors.warning}`,
                    borderRadius: t.borderRadius.lg,
                    padding: `${t.spacing.md}px ${t.spacing.lg}px`,
                    boxShadow: `0 8px 20px ${t.colors.shadowSoft}, 0 2px 6px ${t.colors.shadowSoft}`,
                    minHeight: hintIconSize * 1.4,
                  }}
                >
                  <div
                    style={{
                      fontSize: hintIconSize,
                      lineHeight: 1,
                      flexShrink: 0,
                      width: hintIconSize * 1.2,
                      textAlign: "center",
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))",
                    }}
                  >
                    {hint.icon || "✨"}
                  </div>
                  <div
                    style={{
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.black,
                      fontSize: hintFontSize,
                      color: t.colors.textPrimary,
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hint.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {footnote && (
          <div
            style={{
              opacity: footOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: footFontSize,
              color: t.colors.textSecondary,
              textAlign: "center",
              marginTop: t.spacing.md,
            }}
          >
            {footnote}
          </div>
        )}
      </AbsoluteFill>
    </WarmBackground>
  );
};
