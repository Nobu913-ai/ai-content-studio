import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { takeoutGourmetTheme as t } from "../../theme/takeoutGourmetTheme";

export type WarmBackgroundVariant = "hero" | "warm" | "highlight" | "soft" | "alert" | "golden";

export interface WarmBackgroundProps {
  variant?: WarmBackgroundVariant;
  children?: React.ReactNode;
}

/**
 * takeout-gourmet 用の明るく食欲をそそる背景。
 * - hero: 鮮やかなオレンジ→クリームのグラデで強い導入
 * - warm: クリーム基調の落ち着いた背景 (本文用)
 * - highlight: ゴールデンイエロー → クリームで強調
 * - soft: 一番淡い、リラックス用
 * - alert: トマトレッドのアクセント (注意喚起・警告系)
 * - golden: 黄金色全面 (TOP表示系)
 */
export const WarmBackground: React.FC<WarmBackgroundProps> = ({ variant = "warm", children }) => {
  const frame = useCurrentFrame();

  // 緩やかな脈動 (動きをつけて飽きさせない)
  const pulse = interpolate(frame % 180, [0, 90, 180], [0.7, 1, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = interpolate(frame % 240, [0, 120, 240], [-30, 30, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  type Cfg = { from: string; to: string; glow: string; sparkle: string };
  const variantConfig: Record<WarmBackgroundVariant, Cfg> = {
    hero: {
      from: "#FFB45A", // 鮮やかオレンジ
      to: "#FFF4E0",
      glow: t.colors.accent,
      sparkle: t.colors.positive,
    },
    warm: {
      from: t.colors.bgSecondary,
      to: t.colors.bgPrimary,
      glow: t.colors.warning,
      sparkle: t.colors.positive,
    },
    highlight: {
      from: t.colors.bgAccent,
      to: t.colors.bgSecondary,
      glow: t.colors.highlight,
      sparkle: t.colors.positive,
    },
    soft: {
      from: t.colors.bgPrimary,
      to: "#FFFAEC",
      glow: t.colors.bgAccent,
      sparkle: t.colors.warning,
    },
    alert: {
      from: "#FFD0B5",
      to: t.colors.bgSecondary,
      glow: t.colors.negative,
      sparkle: t.colors.warning,
    },
    golden: {
      from: "#FFCB47",
      to: t.colors.bgAccent,
      glow: t.colors.accent,
      sparkle: "#FFFFFF",
    },
  };

  const cfg = variantConfig[variant];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${cfg.from} 0%, ${cfg.to} 100%)`,
      }}
    >
      {/* メインの食欲グロー (中央から上にかけて) */}
      <div
        style={{
          position: "absolute",
          width: "180%",
          height: "120%",
          top: "-15%",
          left: `${-40 + drift / 20}%`,
          background: `radial-gradient(ellipse at 50% 40%, ${cfg.glow}55 0%, transparent 55%)`,
          opacity: pulse,
        }}
      />
      {/* セカンダリグロー (右下) */}
      <div
        style={{
          position: "absolute",
          width: "120%",
          height: "100%",
          bottom: "-10%",
          right: `${-20 - drift / 30}%`,
          background: `radial-gradient(ellipse at 60% 60%, ${cfg.sparkle}33 0%, transparent 60%)`,
          opacity: 0.8,
        }}
      />
      {/* 装飾ドット (食卓のテクスチャ感) — 大きめ・はっきり見える */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 15%, ${cfg.glow}55 8px, transparent 9px), radial-gradient(circle at 80% 25%, ${cfg.sparkle}66 9px, transparent 10px), radial-gradient(circle at 70% 75%, ${cfg.glow}55 7px, transparent 8px), radial-gradient(circle at 25% 85%, ${cfg.sparkle}66 8px, transparent 9px), radial-gradient(circle at 50% 50%, ${cfg.glow}33 5px, transparent 6px), radial-gradient(circle at 90% 60%, ${cfg.sparkle}44 6px, transparent 7px)`,
          backgroundSize: "240px 240px, 280px 280px, 260px 260px, 220px 220px, 200px 200px, 300px 300px",
          opacity: 0.9,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
