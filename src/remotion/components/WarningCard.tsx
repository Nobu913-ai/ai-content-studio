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
import { StaggeredText } from "./AnimatedText";
import { autoFontSize, splitOverlayLines } from "../utils/responsive-text";

export interface WarningCardProps {
  title: string;
  body: string;
  severity?: "warn" | "danger" | "info";
  bgVariant?: BackgroundVariant;
}

export const WarningCard: React.FC<WarningCardProps> = ({
  title,
  body,
  severity = "warn",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const colorMap = {
    warn: t.colors.warning,
    danger: t.colors.negative,
    info: t.colors.accent,
  };
  const accentColor = colorMap[severity];

  const iconScale = spring({ frame, fps, config: { damping: 8, mass: 0.5, stiffness: 300 } });
  const iconOpacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringScale = interpolate(frame, [0, 20], [0.5, 1.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringOpacity = interpolate(frame, [0, 20], [0.4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [8, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bodyLines = splitOverlayLines(body);
  const bodyFontSize = autoFontSize(body, Math.round(width * 0.05), width * 0.75);

  const iconMap = { warn: "⚠️", danger: "🚫", info: "ℹ️" };

  return (
    <AnimatedBackground accent={accentColor} variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.xl,
        }}
      >
        {/* Pulsing ring behind icon */}
        <div style={{ position: "relative", marginBottom: t.spacing.md }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${ringScale})`,
              width: 120,
              height: 120,
              borderRadius: 60,
              border: `3px solid ${accentColor}`,
              opacity: ringOpacity,
            }}
          />
          <div
            style={{
              fontSize: 80,
              transform: `scale(${iconScale})`,
              opacity: iconOpacity,
              filter: `drop-shadow(0 4px 15px ${accentColor}60)`,
            }}
          >
            {iconMap[severity]}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: autoFontSize(title, Math.round(width * 0.08)),
            color: accentColor,
            opacity: titleOpacity,
            textShadow: `0 0 30px ${accentColor}40`,
            marginBottom: t.spacing.md,
            textAlign: "center",
          }}
        >
          {title}
        </div>

        {/* Body in card */}
        <div
          style={{
            width: "85%",
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: t.borderRadius.lg,
            border: `2px solid ${accentColor}25`,
            padding: t.spacing.lg,
            boxShadow: `inset 0 0 30px ${accentColor}08`,
          }}
        >
          <StaggeredText
            lines={bodyLines}
            baseDelay={18}
            staggerMs={350}
            animation="slideUp"
            lineStyle={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: bodyFontSize,
              color: t.colors.textPrimary,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          />
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
