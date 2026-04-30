import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { CountUpNumber } from "./AnimatedText";

interface SideData {
  label: string;
  profit: number;
  tax: number;
  takeHome: number;
}

export interface TaxSavingsDemoProps {
  scenarioLabel: string;
  left: SideData;
  right: SideData;
  unit?: string;
  revealMode?: "parallel" | "staged";
  showDiff?: boolean;
  bgVariant?: BackgroundVariant;
}

const Side: React.FC<{
  data: SideData;
  delay: number;
  isPositive: boolean;
  unit: string;
}> = ({ data, delay, isPositive, unit }) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;
  const f = frame - delay;
  const opacity = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const slideY = interpolate(f, [0, 18], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const taxOpacity = interpolate(f, [22, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const takeHomeDelay = 36;

  const accent = isPositive ? t.colors.positive : t.colors.negative;
  const labelSize = Math.round(width * 0.04);
  const valueSize = Math.round(width * 0.065);
  const profitSize = Math.round(width * 0.045);

  return (
    <div
      style={{
        flex: 1,
        opacity,
        transform: `translateY(${slideY}px)`,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: t.borderRadius.lg,
        border: `2px solid ${accent}50`,
        boxShadow: `0 6px 30px ${accent}30, inset 0 0 40px ${accent}10`,
        padding: t.spacing.md,
        display: "flex",
        flexDirection: "column",
        gap: t.spacing.xs,
      }}
    >
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.bold,
          fontSize: labelSize,
          color: t.colors.textSecondary,
          textAlign: "center",
        }}
      >
        {data.label}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
        <span
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.regular,
            fontSize: Math.round(width * 0.032),
            color: t.colors.textSecondary,
          }}
        >
          利益
        </span>
        <span
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: profitSize,
            color: t.colors.textPrimary,
          }}
        >
          {data.profit}{unit}
        </span>
      </div>

      <div
        style={{
          opacity: taxOpacity,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 4,
        }}
      >
        <span
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.regular,
            fontSize: Math.round(width * 0.032),
            color: t.colors.textSecondary,
          }}
        >
          税金
        </span>
        <span
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: profitSize,
            color: data.tax > 0 ? t.colors.negative : t.colors.positive,
            textShadow: data.tax > 0 ? `0 0 12px ${t.colors.negative}80` : "none",
          }}
        >
          {data.tax > 0 ? `−${data.tax}${unit}` : `0${unit}`}
        </span>
      </div>

      <div
        style={{
          marginTop: t.spacing.sm,
          paddingTop: t.spacing.sm,
          borderTop: `2px solid ${accent}40`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: Math.round(width * 0.034),
            color: t.colors.textPrimary,
          }}
        >
          手取り
        </span>
        <CountUpNumber
          target={data.takeHome}
          suffix={unit}
          delay={takeHomeDelay}
          durationFrames={28}
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: valueSize,
            color: accent,
            textShadow: `0 0 20px ${accent}80`,
            whiteSpace: "nowrap",
          }}
        />
      </div>
    </div>
  );
};

export const TaxSavingsDemo: React.FC<TaxSavingsDemoProps> = ({
  scenarioLabel,
  left,
  right,
  unit = "万円",
  revealMode = "parallel",
  showDiff = false,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Staged reveal: left appears first, right appears later, diff highlighted last
  const leftDelay = 0;
  const rightDelay = revealMode === "staged" ? 75 : 6; // 2.5s gap when staged
  const diffDelay = revealMode === "staged" ? 150 : 90; // diff appears 5s in (staged) or 3s in

  const diff = left.takeHome - right.takeHome;
  const absDiff = Math.abs(diff);
  const diffOpacity = showDiff
    ? interpolate(frame, [diffDelay, diffDelay + 12], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const diffScale = showDiff
    ? interpolate(frame, [diffDelay, diffDelay + 14], [0.6, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.back()),
      })
    : 0;

  return (
    <AnimatedBackground accent={t.colors.positive} variant={bgVariant}>
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
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: Math.round(width * 0.05),
            color: t.colors.textPrimary,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          {scenarioLabel}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: t.spacing.sm,
            width: "100%",
            alignItems: "stretch",
          }}
        >
          <Side data={left} delay={leftDelay} isPositive={false} unit={unit} />
          <Side data={right} delay={rightDelay} isPositive={true} unit={unit} />
        </div>

        {showDiff && (
          <div
            style={{
              opacity: diffOpacity,
              transform: `scale(${diffScale})`,
              padding: `${t.spacing.sm}px ${t.spacing.lg}px`,
              backgroundColor: `${t.colors.highlight}1f`,
              border: `2px solid ${t.colors.highlight}`,
              borderRadius: t.borderRadius.md,
              boxShadow: `0 0 30px ${t.colors.highlight}80`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.058),
              color: t.colors.highlight,
              textAlign: "center",
              marginTop: t.spacing.sm,
              whiteSpace: "nowrap",
              textShadow: `0 0 16px ${t.colors.highlight}`,
            }}
          >
            差額 {absDiff}{unit}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
