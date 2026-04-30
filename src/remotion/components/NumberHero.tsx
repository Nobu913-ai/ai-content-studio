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
import { autoFontSize } from "../utils/responsive-text";

export interface NumberHeroProps {
  number: string;
  prefix?: string;
  suffix?: string;
  caption?: string;
  subtext?: string;
  tone?: "positive" | "negative" | "neutral";
  bgVariant?: BackgroundVariant;
}

const toneColor = (tone: NumberHeroProps["tone"]) => {
  if (tone === "positive") return t.colors.positive;
  if (tone === "negative") return t.colors.negative;
  return t.colors.highlight;
};

export const NumberHero: React.FC<NumberHeroProps> = ({
  number,
  prefix,
  suffix,
  caption,
  subtext,
  tone = "positive",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;
  const accent = toneColor(tone);

  const captionOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numberScale = spring({
    frame: Math.max(0, frame - 4),
    fps,
    config: { damping: 8, mass: 0.6, stiffness: 220 },
  });

  const pulse = Math.sin(Math.max(0, frame - 14) * 0.08) * 0.08 + 0.92;

  const subtextOpacity = interpolate(frame, [16, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextSlide = interpolate(frame, [16, 26], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const numberFontSize = autoFontSize(`${prefix || ""}${number}${suffix || ""}`, Math.round(width * 0.28), width * 0.92);

  return (
    <AnimatedBackground accent={accent} variant={bgVariant}>
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
        {/* Glow halo behind number */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%)`,
            width: 700,
            height: 700,
            borderRadius: 350,
            background: `radial-gradient(circle, ${accent}30 0%, transparent 65%)`,
            filter: "blur(40px)",
            opacity: pulse,
          }}
        />

        {caption && (
          <div
            style={{
              opacity: captionOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.045),
              color: t.colors.textSecondary,
              textAlign: "center",
            }}
          >
            {caption}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            transform: `scale(${numberScale})`,
            justifyContent: "center",
          }}
        >
          {prefix && (
            <span
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.bold,
                fontSize: Math.round(numberFontSize * 0.45),
                color: t.colors.textPrimary,
              }}
            >
              {prefix}
            </span>
          )}
          <span
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: numberFontSize,
              color: accent,
              textShadow: `0 0 ${50 * pulse}px ${accent}, 0 0 ${100 * pulse}px ${accent}80`,
              lineHeight: 1,
            }}
          >
            {number}
          </span>
          {suffix && (
            <span
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.bold,
                fontSize: Math.round(numberFontSize * 0.45),
                color: t.colors.textPrimary,
              }}
            >
              {suffix}
            </span>
          )}
        </div>

        {subtext && (
          <div
            style={{
              opacity: subtextOpacity,
              transform: `translateY(${subtextSlide}px)`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: autoFontSize(subtext, Math.round(width * 0.05), width * 0.85),
              color: t.colors.textPrimary,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            {subtext}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
