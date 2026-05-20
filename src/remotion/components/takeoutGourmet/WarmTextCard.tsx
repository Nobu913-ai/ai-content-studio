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

export interface WarmTextCardProps {
  /** 大きく表示するメインテキスト */
  headline: string;
  /** サブテキスト (任意) */
  subheadline?: string;
  /** 小さな冠詞 (バッジ風) */
  badge?: string;
  /** 大きな絵文字 (見出しの上) */
  emoji?: string;
  /** 装飾アイコン (見出しの左右に小さく漂う、最大4個) */
  floatingEmojis?: string[];
  /** variant: hook = フック型, concept = 共感型, highlight = アクセント強調, soft = やさしめ */
  variant?: "hook" | "concept" | "highlight" | "soft";
  /** 背景バリアント */
  bgVariant?: WarmBackgroundVariant;
}

/**
 * takeout-gourmet 用の明るい暖色テキストカード v2。
 * - クリーム背景にダークブラウン文字で高コントラスト
 * - 大きな絵文字を見出し上に配置可能
 * - 浮遊する小さな絵文字でリッチな装飾
 */
export const WarmTextCard: React.FC<WarmTextCardProps> = ({
  headline,
  subheadline,
  badge,
  emoji,
  floatingEmojis = [],
  variant = "concept",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = t.resolution;

  const resolvedBg: WarmBackgroundVariant =
    bgVariant ?? (variant === "hook" ? "hero" : variant === "highlight" ? "highlight" : "warm");

  // entrance animation
  const headlineScale = spring({
    frame,
    fps,
    config: {
      damping: variant === "hook" ? 8 : 12,
      mass: 0.6,
      stiffness: variant === "hook" ? 210 : 140,
    },
  });
  const headlineOpacity = interpolate(frame, [0, variant === "hook" ? 6 : 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [12, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emojiPop = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });
  const emojiWobble = Math.sin((frame / fps) * 3) * 5;

  // sizing
  const maxFontByVariant: Record<NonNullable<WarmTextCardProps["variant"]>, number> = {
    hook: Math.round(width * 0.118),
    concept: Math.round(width * 0.082),
    highlight: Math.round(width * 0.092),
    soft: Math.round(width * 0.075),
  };
  const maxHeadlineWidth = width * 0.85;
  const headlineFontSize = autoFontSizeJa(headline, maxFontByVariant[variant], maxHeadlineWidth);
  const headlineWrapped = smartLineBreak(headline, headlineFontSize, maxHeadlineWidth);

  const subFontSize = Math.round(width * 0.04);
  const subWrapped = subheadline
    ? smartLineBreak(subheadline, autoFontSizeJa(subheadline, subFontSize, maxHeadlineWidth), maxHeadlineWidth)
    : null;

  const emojiFontSize = Math.round(width * (variant === "hook" ? 0.18 : 0.14));

  // colors (light bg なので濃いめ)
  const headlineColor = variant === "highlight" ? t.colors.highlight : t.colors.textPrimary;
  const headlineShadow =
    variant === "hook"
      ? `0 4px 12px ${t.colors.shadowStrong}, 0 0 24px rgba(255,107,53,0.25)`
      : variant === "highlight"
        ? `0 3px 10px ${t.colors.shadowStrong}`
        : `0 2px 6px ${t.colors.shadowSoft}`;

  // floating emojis (大きさバラバラで漂わせる)
  const floatPositions: { x: string; y: string; size: number; delay: number }[] = [
    { x: "8%", y: "18%", size: width * 0.06, delay: 0 },
    { x: "82%", y: "22%", size: width * 0.07, delay: 6 },
    { x: "12%", y: "72%", size: width * 0.055, delay: 10 },
    { x: "84%", y: "78%", size: width * 0.065, delay: 14 },
  ];

  return (
    <WarmBackground variant={resolvedBg}>
      {/* Floating emojis (装飾) */}
      {floatingEmojis.slice(0, 4).map((em, i) => {
        const cfg = floatPositions[i];
        const op = interpolate(frame, [cfg.delay, cfg.delay + 12], [0, 0.85], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const float = Math.sin((frame / fps) * 1.5 + i) * 12;
        const rotate = Math.sin((frame / fps) * 1.2 + i * 0.5) * 8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: cfg.y,
              left: cfg.x,
              fontSize: cfg.size,
              opacity: op,
              transform: `translateY(${float}px) rotate(${rotate}deg)`,
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
            }}
          >
            {em}
          </div>
        );
      })}

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
        {badge && (
          <div
            style={{
              opacity: badgeOpacity,
              backgroundColor: t.colors.accent,
              color: "#FFFFFF",
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.046),
              padding: `${t.spacing.sm}px ${t.spacing.xl}px`,
              borderRadius: 999,
              letterSpacing: 2,
              boxShadow: `0 8px 20px rgba(255,107,53,0.4)`,
            }}
          >
            {badge}
          </div>
        )}

        {emoji && (
          <div
            style={{
              fontSize: emojiFontSize,
              transform: `scale(${emojiPop}) translateY(${emojiWobble}px)`,
              filter: `drop-shadow(0 8px 16px ${t.colors.shadowStrong})`,
              marginBottom: t.spacing.sm,
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
            color: headlineColor,
            textAlign: "center",
            lineHeight: 1.25,
            whiteSpace: "pre",
            textShadow: headlineShadow,
            letterSpacing: 0.5,
            padding: `0 ${t.spacing.md}px`,
          }}
        >
          {headlineWrapped}
        </div>

        {subWrapped && (
          <div
            style={{
              opacity: subOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: subFontSize,
              color: t.colors.textSecondary,
              textAlign: "center",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              maxWidth: maxHeadlineWidth,
            }}
          >
            {subWrapped}
          </div>
        )}
      </AbsoluteFill>
    </WarmBackground>
  );
};
