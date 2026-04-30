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
import { autoFontSizeJa } from "../utils/responsive-text";

/**
 * TaxFlowDemo
 *
 * 5段階の "お金の流れ" を時系列で見せるシーン。
 *
 * 比較表ではなく **手元に残る金額がどう変わるか** を視覚化することで、
 * 初心者にも理解の負荷が軽い1カット1メッセージ構成になる。
 *
 * 想定タイムライン (durationSec = 7.7s 基準, fps=30):
 *   stage1: 0.0–1.0s  principalLabel + principalValue を中央表示
 *   stage2: 1.0–2.8s  税金 -tax が赤く差し引かれる
 *   stage3: 2.8–4.2s  普通口座カード (左) に手元金額固定
 *   stage4: 4.2–5.8s  NISAカード (右) に元本まるごと表示
 *   stage5: 5.8–end   差額 diff を中央バッジで強調
 */

export interface TaxFlowDemoProps {
  /** 元になる利益・元本など (例: 100) */
  principal: number;
  /** 引かれる税金額 (例: 20) */
  tax: number;
  unit?: string;
  /** stage1 で見せるラベル (例: "利益100万円") */
  principalLabel?: string;
  /** 普通口座側のラベル */
  regularLabel?: string;
  /** 普通口座側の手元 (省略時 principal-tax) */
  regularTakeHome?: number;
  regularTakeHomeLabel?: string;
  /** NISA側ラベル */
  nisaLabel?: string;
  nisaTakeHomeLabel?: string;
  /** 差額バッジ前文言 (例: "差額") */
  diffPrefix?: string;
  /** 差額の "約" を入れたいときのプレフィックス */
  diffApprox?: string;
  /** 最終バッジ文言。指定時はprefix+approx+diff+unitフォーマットを上書き。複数行可 (\n)。 */
  diffMessage?: string;
  bgVariant?: BackgroundVariant;
}

const FPS = 30;

export const TaxFlowDemo: React.FC<TaxFlowDemoProps> = ({
  principal,
  tax,
  unit = "万円",
  principalLabel,
  regularLabel = "普通の口座",
  regularTakeHome,
  regularTakeHomeLabel = "手元",
  nisaLabel = "新NISA",
  nisaTakeHomeLabel = "手元",
  diffPrefix = "差額",
  diffApprox = "約",
  diffMessage,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = t.resolution;

  const takeHome = regularTakeHome ?? principal - tax;
  const diff = principal - takeHome;

  const stage = (sec: number) => Math.round(sec * fps);
  const s1 = stage(0);
  const s2 = stage(1.0);
  const s3 = stage(2.8);
  const s4 = stage(4.2);
  const s5 = stage(5.8);

  const principalScale = spring({
    frame: Math.max(0, frame - s1),
    fps,
    config: { damping: 9, mass: 0.7, stiffness: 200 },
  });
  const principalOpacity = interpolate(frame, [s1, s1 + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const principalShrink = interpolate(frame, [s3 - 6, s3 + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Stage2 は2フェーズ:
  //   2a (s2 ~ s2+10): -20万円 が中央に入ってくる (上から落下)
  //   2b (s2+18 ~ s3): -20万円 が右下に剥がれて飛び出す (大きい移動 + 縮小フェード)
  const taxAppearOpacity = interpolate(frame, [s2, s2 + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taxScale = spring({
    frame: Math.max(0, frame - s2),
    fps,
    config: { damping: 9, mass: 0.6, stiffness: 220 },
  });
  const flyStart = s2 + 18;
  const flyEnd = s3;
  const taxFlyX = interpolate(frame, [flyStart, flyEnd], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const taxFlyY = interpolate(frame, [flyStart, flyEnd], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const taxFlyRotate = interpolate(frame, [flyStart, flyEnd], [0, 25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taxFlyOpacity = interpolate(frame, [flyStart, flyEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leftCardOpacity = interpolate(frame, [s3, s3 + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leftCardSlide = interpolate(frame, [s3, s3 + 18], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const rightCardOpacity = interpolate(frame, [s4, s4 + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightCardSlide = interpolate(frame, [s4, s4 + 18], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rightGlowPulse = Math.sin(Math.max(0, frame - s4) * 0.1) * 0.15 + 0.85;

  const diffOpacity = interpolate(frame, [s5, s5 + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const diffScale = spring({
    frame: Math.max(0, frame - s5),
    fps,
    config: { damping: 8, mass: 0.6, stiffness: 220 },
  });
  const diffPulse = Math.sin(Math.max(0, frame - s5 - 8) * 0.12) * 0.06 + 0.94;

  const headlineLabel = principalLabel ?? `${principal}${unit}`;
  const principalSize = autoFontSizeJa(headlineLabel, Math.round(width * 0.16), width * 0.85);

  return (
    <AnimatedBackground accent={t.colors.positive} variant={bgVariant}>
      <AbsoluteFill
        style={{
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Stage1+Stage2: 中央の元本+税金引かれ */}
        <div
          style={{
            position: "absolute",
            top: "32%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${principalScale * principalShrink || 0.0001})`,
            opacity: principalOpacity * principalShrink,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: t.spacing.sm,
          }}
        >
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: principalSize,
              color: t.colors.highlight,
              textShadow: `0 0 30px ${t.colors.highlight}80`,
              textAlign: "center",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {headlineLabel}
          </div>

          {/* 税金が赤く差し引かれる: 落下 → 中央滞在 → 右下に剥がれて飛ぶ */}
          <div
            style={{
              opacity: taxAppearOpacity * taxFlyOpacity,
              transform: `translate(${taxFlyX}px, ${taxFlyY}px) rotate(${taxFlyRotate}deg) scale(${taxScale * (1 - taxFlyY / 800)})`,
              padding: `${t.spacing.sm}px ${t.spacing.lg}px`,
              backgroundColor: `${t.colors.negative}33`,
              border: `3px solid ${t.colors.negative}`,
              borderRadius: t.borderRadius.md,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.09),
              color: t.colors.negative,
              textShadow: `0 0 24px ${t.colors.negative}, 0 0 60px ${t.colors.negative}80`,
              whiteSpace: "nowrap",
              boxShadow: `0 8px 30px ${t.colors.negative}80`,
            }}
          >
            −{tax}{unit} 税金
          </div>
        </div>

        {/* Stage3+4: 左右カード */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "row",
            gap: t.spacing.md,
            width: width - t.spacing.xl * 2,
            height: 520,
            alignItems: "stretch",
          }}
        >
          <ResultCard
            label={regularLabel}
            takeLabel={regularTakeHomeLabel}
            value={takeHome}
            unit={unit}
            tone="negative"
            opacity={leftCardOpacity}
            translateY={leftCardSlide}
            glow={0}
          />
          <ResultCard
            label={nisaLabel}
            takeLabel={nisaTakeHomeLabel}
            value={principal}
            unit={unit}
            tone="positive"
            taxNote="税金0円"
            opacity={rightCardOpacity}
            translateY={rightCardSlide}
            glow={rightGlowPulse}
          />
        </div>

        {/* Stage5: 差額バッジ。diffMessage 指定時は複数行可。 */}
        <div
          style={{
            position: "absolute",
            bottom: 280,
            left: "50%",
            transform: `translateX(-50%) scale(${diffScale * diffPulse || 0.0001})`,
            opacity: diffOpacity,
            padding: `${t.spacing.md}px ${t.spacing.lg}px`,
            backgroundColor: `${t.colors.highlight}26`,
            border: `3px solid ${t.colors.highlight}`,
            borderRadius: t.borderRadius.lg,
            boxShadow: `0 0 50px ${t.colors.highlight}99`,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: autoFontSizeJa(diffMessage ?? `${diffPrefix} ${diffApprox}${diff}${unit}`, Math.round(width * 0.07), width * 0.78),
            color: t.colors.highlight,
            textAlign: "center",
            lineHeight: 1.25,
            whiteSpace: "pre-line",
            textShadow: `0 0 18px ${t.colors.highlight}`,
          }}
        >
          {diffMessage ?? `${diffPrefix} ${diffApprox}${diff}${unit}`}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};

const ResultCard: React.FC<{
  label: string;
  takeLabel: string;
  value: number;
  unit: string;
  tone: "positive" | "negative";
  taxNote?: string;
  opacity: number;
  translateY: number;
  glow: number;
}> = ({ label, takeLabel, value, unit, tone, taxNote, opacity, translateY, glow }) => {
  const { width } = t.resolution;
  const accent = tone === "positive" ? t.colors.positive : t.colors.negative;
  const valueText = `${value}${unit}`;
  const valueSize = autoFontSizeJa(valueText, Math.round(width * 0.11), width * 0.36);
  const labelSize = autoFontSizeJa(label, Math.round(width * 0.042), width * 0.36);

  return (
    <div
      style={{
        flex: 1,
        opacity,
        transform: `translateY(${translateY}px)`,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: t.borderRadius.lg,
        border: `2px solid ${accent}${tone === "positive" ? "80" : "50"}`,
        boxShadow: `0 6px 30px ${accent}${tone === "positive" ? "60" : "30"}, inset 0 0 40px ${accent}${tone === "positive" ? "20" : "10"}`,
        padding: t.spacing.md,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: t.spacing.sm,
        position: "relative",
      }}
    >
      {tone === "positive" && glow > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: t.borderRadius.lg,
            boxShadow: `0 0 ${40 * glow}px ${accent}80`,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.bold,
          fontSize: labelSize,
          color: t.colors.textSecondary,
          textAlign: "center",
        }}
      >
        {label}
      </div>
      {taxNote && (
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: Math.round(width * 0.034),
            color: accent,
            textAlign: "center",
          }}
        >
          {taxNote}
        </div>
      )}
      <div
        style={{
          marginTop: t.spacing.xs,
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.regular,
          fontSize: Math.round(width * 0.03),
          color: t.colors.textSecondary,
        }}
      >
        {takeLabel}
      </div>
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.black,
          fontSize: valueSize,
          color: accent,
          textShadow: `0 0 24px ${accent}`,
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {valueText}
      </div>
    </div>
  );
};
