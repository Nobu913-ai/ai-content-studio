import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSize, autoFontSizeJa } from "../utils/responsive-text";

type Tone = "positive" | "negative" | "neutral";

export interface CompareSplitProps {
  title?: string;
  left: { label: string; value: string; tone?: Tone };
  right: { label: string; value: string; tone?: Tone };
  divider?: "vs" | "arrow";
  bgVariant?: BackgroundVariant;
}

const toneColor = (tone?: Tone) => {
  if (tone === "positive") return t.colors.positive;
  if (tone === "negative") return t.colors.negative;
  return t.colors.textPrimary;
};

const SidePanel: React.FC<{
  label: string;
  value: string;
  tone?: Tone;
  delay: number;
  fromX: number;
}> = ({ label, value, tone, delay, fromX }) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;
  const f = frame - delay;
  const opacity = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const slideX = interpolate(f, [0, 18], [fromX, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const color = toneColor(tone);
  // Japanese-aware sizing handles 全角/半角 mix accurately
  const valueSize = autoFontSizeJa(value, Math.round(width * 0.10), width * 0.34);
  const labelSize = autoFontSizeJa(label, Math.round(width * 0.04), width * 0.34);

  return (
    <div
      style={{
        flex: 1,
        opacity,
        transform: `translateX(${slideX}px)`,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: t.borderRadius.lg,
        border: `2px solid ${color}40`,
        boxShadow: `0 6px 30px ${color}25, inset 0 0 30px ${color}10`,
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
          fontWeight: t.fontWeights.bold,
          fontSize: labelSize,
          color: t.colors.textSecondary,
          textAlign: "center",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.black,
          fontSize: valueSize,
          color,
          textShadow: `0 0 30px ${color}60`,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const CompareSplit: React.FC<CompareSplitProps> = ({
  title,
  left,
  right,
  divider = "vs",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dividerOpacity = interpolate(frame, [16, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dividerScale = interpolate(frame, [16, 26], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back()),
  });

  return (
    <AnimatedBackground variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
        }}
      >
        {title && (
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: autoFontSize(title, Math.round(width * 0.055), width * 0.85),
              color: t.colors.textPrimary,
              opacity: titleOpacity,
              textAlign: "center",
              marginBottom: t.spacing.lg,
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
            height: 600,
            alignItems: "stretch",
            position: "relative",
          }}
        >
          <SidePanel label={left.label} value={left.value} tone={left.tone} delay={0} fromX={-80} />
          <SidePanel label={right.label} value={right.value} tone={right.tone} delay={6} fromX={80} />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${dividerScale})`,
              opacity: dividerOpacity,
              backgroundColor: t.colors.bgSecondary,
              border: `3px solid ${divider === "arrow" ? t.colors.positive : t.colors.accent}`,
              color: divider === "arrow" ? t.colors.positive : t.colors.accent,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * (divider === "arrow" ? 0.075 : 0.06)),
              borderRadius: 100,
              width: 100,
              height: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 30px ${divider === "arrow" ? t.colors.positive : t.colors.accent}80`,
            }}
          >
            {divider === "arrow" ? "→" : "VS"}
          </div>
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
