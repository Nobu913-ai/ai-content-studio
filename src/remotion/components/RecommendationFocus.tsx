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
import { autoFontSize, autoFontSizeJa } from "../utils/responsive-text";

/**
 * RecommendationFocus
 *
 * 「複数の選択肢のうち、どれに注目すべきか」を示すシーン。
 *
 * compareSplit のような左右並列ではなく、focus 側を主役に、secondary を薄く沈めることで
 * "1カット1メッセージ" を担保する。証券会社レコメンド・カードレコメンド等にも転用可。
 *
 * 想定タイムライン (durationSec = 3.2s 基準, fps=30):
 *   stage1: 0.0–0.6s  両カードを同等に表示
 *   stage2: 0.6–1.4s  focus 拡大 / secondary フェード (opacity → 0.35)
 *   stage3: 1.4–end   focus 上に "まずはこっち" バッジ (グロー)
 */

type Tone = "positive" | "negative" | "neutral";

interface FocusItem {
  label: string;
  value?: string;
  badge?: string;
  tone?: Tone;
  /** focus 拡大ピーク (省略時 1.10)。1.15-1.20 で強い主役感 */
  scale?: number;
}

interface SecondaryItem {
  label: string;
  value?: string;
  /** dim 後の opacity (0-1)。省略時 0.35。0.2 まで下げると "ほぼ補足" 扱い */
  opacity?: number;
  /** dim 後の scale (省略時 0.92)。0.7-0.8 で完全に脇役化 */
  scale?: number;
}

export interface RecommendationFocusProps {
  title?: string;
  focus: FocusItem;
  secondary: SecondaryItem;
  /** secondary を focus の右に置く ("right") / 左に置く ("left")。省略時 right */
  secondarySide?: "left" | "right";
  bgVariant?: BackgroundVariant;
}

const toneColor = (tone?: Tone) => {
  if (tone === "positive") return t.colors.positive;
  if (tone === "negative") return t.colors.negative;
  return t.colors.highlight;
};

export const RecommendationFocus: React.FC<RecommendationFocusProps> = ({
  title,
  focus,
  secondary,
  secondarySide = "right",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const accent = toneColor(focus.tone);
  const dimTarget = secondary.opacity ?? 0.35;
  const focusScalePeak = focus.scale ?? 1.10;
  const secondaryScalePeak = secondary.scale ?? 0.92;

  const stage = (sec: number) => Math.round(sec * fps);
  const s1 = stage(0);
  const s2 = stage(0.6);
  const s3 = stage(1.4);

  const titleOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // stage1: 両カードフェードイン
  const cardsOpacity = interpolate(frame, [s1, s1 + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // stage2: focus 拡大 / secondary 沈める
  const focusScale = interpolate(frame, [s2, s2 + 18], [1, focusScalePeak], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const secondaryOpacity = interpolate(frame, [s2, s2 + 18], [1, dimTarget], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const secondaryScale = interpolate(frame, [s2, s2 + 18], [1, secondaryScalePeak], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // stage3: バッジ出現 — 上から落ちて overshoot scale (主役性をさらに強調)
  const badgeScale = spring({
    frame: Math.max(0, frame - s3),
    fps,
    config: { damping: 7, mass: 0.5, stiffness: 240 },
  });
  const badgeDropY = interpolate(frame, [s3, s3 + 14], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.bounce),
  });
  const badgeOpacity = interpolate(frame, [s3, s3 + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgePulse = Math.sin(Math.max(0, frame - s3 - 8) * 0.1) * 0.10 + 0.90;
  // focus card glow: 軽くもう一段強める (badgePulse の上限を引き上げ)
  const focusGlow = badgePulse * 1.25;

  const focusCard = (
    <FocusCard
      key="focus"
      label={focus.label}
      value={focus.value}
      accent={accent}
      scale={focusScale}
      opacity={cardsOpacity}
      isFocus
      glow={focusGlow}
    />
  );
  const secondaryCard = (
    <FocusCard
      key="secondary"
      label={secondary.label}
      value={secondary.value}
      accent={t.colors.textSecondary}
      scale={secondaryScale}
      opacity={cardsOpacity * secondaryOpacity}
      isFocus={false}
      glow={0}
    />
  );

  const cards = secondarySide === "right" ? [focusCard, secondaryCard] : [secondaryCard, focusCard];
  const badgeText = focus.badge ?? "まずはこっち";

  return (
    <AnimatedBackground accent={accent} variant={bgVariant}>
      <AbsoluteFill
        style={{
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: t.spacing.lg,
        }}
      >
        {title && (
          <div
            style={{
              opacity: titleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: autoFontSize(title, Math.round(width * 0.055), width * 0.85),
              color: t.colors.textPrimary,
              textAlign: "center",
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: t.spacing.md,
            width: "100%",
            height: 560,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {cards}

          {/* Badge: focus card position — 上から落下 + overshoot scale で主役性強調 */}
          <div
            style={{
              position: "absolute",
              top: -45,
              left: secondarySide === "right" ? "25%" : "75%",
              transform: `translate(-50%, ${badgeDropY}px) scale(${badgeScale * badgePulse || 0.0001})`,
              opacity: badgeOpacity,
              padding: `${t.spacing.sm}px ${t.spacing.md}px`,
              backgroundColor: t.colors.highlight,
              border: `3px solid ${t.colors.highlight}`,
              borderRadius: 100,
              boxShadow: `0 6px 50px ${t.colors.highlight}`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.05),
              color: t.colors.bgPrimary,
              whiteSpace: "nowrap",
            }}
          >
            {badgeText}
          </div>
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};

const FocusCard: React.FC<{
  label: string;
  value?: string;
  accent: string;
  scale: number;
  opacity: number;
  isFocus: boolean;
  glow: number;
}> = ({ label, value, accent, scale, opacity, isFocus, glow }) => {
  const { width } = t.resolution;
  // カード実幅は (1080 - padding xl×2 - gap md) / 2 = ~464、内側 padding lg×2 = 80 → 実content幅 ≈ 380px。
  // safety margin として width * 0.32 (=346px) を maxWidth に。さらに whiteSpace: nowrap で auto-wrap を抑止。
  const labelMaxWidth = width * 0.32;
  const labelSize = autoFontSizeJa(label, Math.round(width * (isFocus ? 0.062 : 0.05)), labelMaxWidth);
  const valueSize = value ? autoFontSizeJa(value, Math.round(width * (isFocus ? 0.045 : 0.038)), labelMaxWidth) : 0;

  return (
    <div
      style={{
        flex: 1,
        opacity,
        transform: `scale(${scale})`,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: t.borderRadius.lg,
        border: `${isFocus ? 3 : 2}px solid ${accent}${isFocus ? "" : "40"}`,
        boxShadow: isFocus
          ? `0 8px ${30 + glow * 30}px ${accent}80, inset 0 0 40px ${accent}20`
          : `0 4px 16px rgba(0,0,0,0.2)`,
        padding: t.spacing.lg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: t.spacing.sm,
      }}
    >
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.black,
          fontSize: labelSize,
          color: isFocus ? accent : t.colors.textSecondary,
          textShadow: isFocus ? `0 0 24px ${accent}80` : "none",
          textAlign: "center",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      {value && (
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: valueSize,
            color: isFocus ? t.colors.textPrimary : t.colors.textSecondary,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
};
