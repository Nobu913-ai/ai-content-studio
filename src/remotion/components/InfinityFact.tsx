import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";

export interface InfinityFactProps {
  title: string;
  emphasis: string;
  symbol?: "infinity" | "checkmark";
  bgVariant?: BackgroundVariant;
}

export const InfinityFact: React.FC<InfinityFactProps> = ({
  title,
  emphasis,
  symbol = "infinity",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const symbolScale = spring({
    frame,
    fps,
    config: { damping: 9, mass: 0.6, stiffness: 220 },
  });

  // Continuous gentle rotation/pulse for infinity glow
  const pulse = Math.sin(frame * 0.06) * 0.15 + 0.85;
  const rotation = symbol === "infinity" ? Math.sin(frame * 0.04) * 5 : 0;

  const emphasisOpacity = interpolate(frame, [14, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const emphasisScale = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 10, mass: 0.5 },
  });

  const symbolGlyph = symbol === "checkmark" ? "✓" : "∞";

  return (
    <AnimatedBackground accent={t.colors.highlight} variant={bgVariant}>
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
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: Math.round(width * 0.06),
            color: t.colors.textSecondary,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          {title}
        </div>

        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              borderRadius: 180,
              background: `radial-gradient(circle, ${t.colors.highlight}30 0%, transparent 70%)`,
              filter: "blur(30px)",
              opacity: pulse,
            }}
          />
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.45),
              color: t.colors.highlight,
              transform: `scale(${symbolScale}) rotate(${rotation}deg)`,
              textShadow: `0 0 ${60 * pulse}px ${t.colors.highlight}, 0 0 ${100 * pulse}px ${t.colors.highlight}80`,
              lineHeight: 0.9,
            }}
          >
            {symbolGlyph}
          </div>
        </div>

        <div
          style={{
            opacity: emphasisOpacity,
            transform: `scale(${emphasisScale})`,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: Math.round(width * 0.13),
            color: t.colors.textPrimary,
            textShadow: `0 0 30px ${t.colors.highlight}80`,
            textAlign: "center",
          }}
        >
          {emphasis}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
