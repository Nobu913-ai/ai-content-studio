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

export interface WarmEndCardProps {
  /** バッジテキスト (例: "リール開始") */
  badge?: string;
  /** メインタイトル */
  headline: string;
  /** 補足の予告テキスト */
  subtext?: string;
  /** 紹介するシリーズトピック (pill 表示) */
  topics?: string[];
  /** CTA 行 (例: 「フォローして次回をお楽しみに」) */
  cta?: string;
  /** 大きな絵文字 (上部) */
  emoji?: string;
  bgVariant?: WarmBackgroundVariant;
}

/**
 * シリーズ予告 + CTA 用の暖色系エンドカード v2 (ライト背景)。
 */
export const WarmEndCard: React.FC<WarmEndCardProps> = ({
  badge,
  headline,
  subtext,
  topics = [],
  cta,
  emoji,
  bgVariant = "hero",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const badgeOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const emojiPop = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });
  const headlineScale = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 150 },
  });
  const headlineOpacity = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextOpacity = interpolate(frame, [22, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headlineFontSize = autoFontSizeJa(headline, Math.round(width * 0.092), width * 0.86);
  const headlineWrapped = smartLineBreak(headline, headlineFontSize, width * 0.86);

  const subtextFontSize = Math.round(width * 0.04);
  const subtextWrapped = subtext
    ? smartLineBreak(subtext, autoFontSizeJa(subtext, subtextFontSize, width * 0.86), width * 0.86)
    : null;

  const topicStaggerFrames = Math.round(0.2 * fps);
  const topicBaseDelay = 36;

  const ctaStart = topicBaseDelay + topics.length * topicStaggerFrames + 8;
  const ctaOpacity = interpolate(frame, [ctaStart, ctaStart + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaPulse = 1 + Math.sin(((frame - ctaStart) / fps) * 4) * 0.05;

  const emojiWobble = Math.sin((frame / fps) * 2.5) * 5;

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
          gap: t.spacing.sm,
        }}
      >
        {badge && (
          <div
            style={{
              opacity: badgeOpacity,
              backgroundColor: t.colors.highlight,
              color: "#FFFFFF",
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.038),
              padding: `${t.spacing.xs}px ${t.spacing.lg}px`,
              borderRadius: 999,
              letterSpacing: 2,
              boxShadow: `0 6px 16px rgba(255,107,53,0.4)`,
            }}
          >
            {badge}
          </div>
        )}

        {emoji && (
          <div
            style={{
              fontSize: Math.round(width * 0.14),
              transform: `scale(${emojiPop}) translateY(${emojiWobble}px)`,
              filter: `drop-shadow(0 8px 16px ${t.colors.shadowStrong})`,
              marginTop: t.spacing.xs,
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

        {subtextWrapped && (
          <div
            style={{
              opacity: subtextOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: subtextFontSize,
              color: t.colors.textSecondary,
              textAlign: "center",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              maxWidth: width * 0.86,
              marginTop: t.spacing.xs,
            }}
          >
            {subtextWrapped}
          </div>
        )}

        {topics.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: t.spacing.sm,
              maxWidth: width * 0.86,
              marginTop: t.spacing.md,
            }}
          >
            {topics.map((topic, i) => {
              const delay = topicBaseDelay + i * topicStaggerFrames;
              const op = interpolate(frame, [delay, delay + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const slide = interpolate(frame, [delay, delay + 12], [12, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={i}
                  style={{
                    opacity: op,
                    transform: `translateY(${slide}px)`,
                    backgroundColor: t.colors.cardBg,
                    border: `2px solid ${t.colors.accent}`,
                    color: t.colors.textPrimary,
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.black,
                    fontSize: Math.round(width * 0.034),
                    padding: `${t.spacing.xs}px ${t.spacing.md}px`,
                    borderRadius: 999,
                    boxShadow: `0 4px 12px ${t.colors.shadowSoft}`,
                  }}
                >
                  {topic}
                </div>
              );
            })}
          </div>
        )}

        {cta && (
          <div
            style={{
              opacity: ctaOpacity,
              transform: `scale(${ctaPulse})`,
              backgroundColor: t.colors.accent,
              color: "#FFFFFF",
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.042),
              padding: `${t.spacing.sm}px ${t.spacing.xl}px`,
              borderRadius: 999,
              letterSpacing: 1,
              boxShadow: `0 10px 24px rgba(255,107,53,0.4)`,
              marginTop: t.spacing.lg,
              textAlign: "center",
            }}
          >
            {cta}
          </div>
        )}
      </AbsoluteFill>
    </WarmBackground>
  );
};
