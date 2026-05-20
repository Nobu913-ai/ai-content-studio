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

export interface WarmBulletItem {
  /** メインテキスト */
  text: string;
  /** 絵文字 or アイコン (左に大きく表示) */
  icon?: string;
}

export interface WarmBulletListProps {
  title?: string;
  emoji?: string;
  items: WarmBulletItem[];
  /** 各 item の表示間隔 (秒) */
  staggerSec?: number;
  bgVariant?: WarmBackgroundVariant;
}

/**
 * 暖色系のリストカード v3 (ライト背景・絵文字対応・折り返し回避・安定レイアウト)。
 *
 * 設計原則:
 * - 全 item のテキストを 1 行に強制 (whiteSpace nowrap)
 * - フォントサイズは最長 item を基準に統一 (sharedFontSize)
 * - 開始時の opacity アニメは scale を使わない (位置ズレ回避)
 * - paddingBottom を Subtitle safe zone (240px) より厳密に確保
 */
export const WarmBulletList: React.FC<WarmBulletListProps> = ({
  title,
  emoji,
  items,
  staggerSec = 0.45,
  bgVariant = "warm",
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
  const emojiPop = spring({
    frame,
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });

  // 共有フォントサイズ計算: 最長 item のテキストを基準に nowrap で全 item が収まる font を算出
  const cardHorizPadding = t.spacing.lg * 2; // 80px
  const iconSize = Math.round(width * 0.085);
  const iconBoxWidth = iconSize * 1.2;
  const itemGap = t.spacing.md;
  const cardWidthRatio = 0.92;
  const cardOuterWidth = width * cardWidthRatio;
  const textAvailWidth = cardOuterWidth - cardHorizPadding - iconBoxWidth - itemGap - 12; // 12px buffer

  const baseItemFontSize = Math.round(width * 0.054);
  const sharedItemFontSize = Math.min(
    ...items.map((it) =>
      autoFontSizeJa(it.text, baseItemFontSize, textAvailWidth),
    ),
  );

  const titleFontSize = title
    ? autoFontSizeJa(title, Math.round(width * 0.062), width * 0.85)
    : 0;

  return (
    <WarmBackground variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.lg,
          paddingBottom: t.spacing.lg + 280,
          gap: t.spacing.sm,
        }}
      >
        {emoji && (
          <div
            style={{
              fontSize: Math.round(width * 0.1),
              transform: `scale(${emojiPop})`,
              filter: `drop-shadow(0 8px 16px ${t.colors.shadowStrong})`,
              lineHeight: 1,
              marginBottom: t.spacing.xs,
            }}
          >
            {emoji}
          </div>
        )}

        {title && (
          <div
            style={{
              opacity: titleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: titleFontSize,
              color: t.colors.textPrimary,
              textAlign: "center",
              marginBottom: t.spacing.sm,
              textShadow: `0 2px 6px ${t.colors.shadowSoft}`,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: t.spacing.sm,
            width: `${cardWidthRatio * 100}%`,
          }}
        >
          {items.map((item, i) => {
            const itemDelay = baseDelay + i * staggerFrames;
            const opacity = interpolate(frame, [itemDelay, itemDelay + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const slide = interpolate(frame, [itemDelay, itemDelay + 16], [60, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            // 位置ズレ防止のため scale は使わず、translate のみ
            const iconWobble = Math.sin(((frame - itemDelay) / fps) * 4) * 3;

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${slide}px)`,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: itemGap,
                  padding: `${t.spacing.md}px ${t.spacing.lg}px`,
                  borderRadius: t.borderRadius.lg,
                  backgroundColor: t.colors.cardBg,
                  border: `3px solid ${t.colors.accent}`,
                  boxShadow: `0 8px 20px ${t.colors.shadowSoft}, 0 2px 6px ${t.colors.shadowSoft}`,
                  minHeight: iconSize * 1.4,
                }}
              >
                <div
                  style={{
                    fontSize: iconSize,
                    flexShrink: 0,
                    width: iconBoxWidth,
                    textAlign: "center",
                    transform: `translateY(${iconWobble}px)`,
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))",
                    lineHeight: 1,
                  }}
                >
                  {item.icon || "✨"}
                </div>
                <div
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.black,
                    fontSize: sharedItemFontSize,
                    color: t.colors.textPrimary,
                    lineHeight: 1.25,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "clip",
                    flex: 1,
                  }}
                >
                  {item.text}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </WarmBackground>
  );
};
