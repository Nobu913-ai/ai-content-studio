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
import { AnimatedBackground } from "./AnimatedBackground";
import { autoFontSize, extractNumber } from "../utils/responsive-text";

export interface CompareCardProps {
  title?: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  leftColor?: string;
  rightColor?: string;
}

export const CompareCard: React.FC<CompareCardProps> = ({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftColor,
  rightColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const lColor = leftColor || t.colors.negative;
  const rColor = rightColor || t.colors.positive;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const leftNum = extractNumber(leftValue);
  const rightNum = extractNumber(rightValue);
  const maxNum = Math.max(leftNum || 1, rightNum || 1);

  const leftBarWidth = interpolate(frame, [15, 40], [0, leftNum ? (leftNum / maxNum) * 100 : 50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const rightBarWidth = interpolate(frame, [25, 50], [0, rightNum ? (rightNum / maxNum) * 100 : 80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const leftOpacity = interpolate(frame, [10, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightOpacity = interpolate(frame, [20, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const valueFontSize = autoFontSize(
    leftValue.length > rightValue.length ? leftValue : rightValue,
    Math.round(width * 0.07),
    width * 0.5,
  );

  const dividerScale = spring({ frame: frame - 35, fps, config: { damping: 12, mass: 0.5 } });

  return (
    <AnimatedBackground>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.xl,
        }}
      >
        {/* Title */}
        {title && (
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.055),
              color: t.colors.textSecondary,
              marginBottom: t.spacing.lg,
              opacity: titleOpacity,
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {title}
          </div>
        )}

        {/* Left side */}
        <CompareRow
          label={leftLabel}
          value={leftValue}
          color={lColor}
          barWidth={leftBarWidth}
          opacity={leftOpacity}
          valueFontSize={valueFontSize}
          width={width}
        />

        {/* VS divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: t.spacing.md,
            margin: `${t.spacing.md}px 0`,
            width: "85%",
            transform: `scaleX(${dividerScale})`,
          }}
        >
          <div style={{ flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: 32,
              color: t.colors.textSecondary,
              padding: `0 ${t.spacing.sm}px`,
            }}
          >
            VS
          </div>
          <div style={{ flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Right side */}
        <CompareRow
          label={rightLabel}
          value={rightValue}
          color={rColor}
          barWidth={rightBarWidth}
          opacity={rightOpacity}
          valueFontSize={valueFontSize}
          width={width}
          winner
        />
      </AbsoluteFill>
    </AnimatedBackground>
  );
};

const CompareRow: React.FC<{
  label: string;
  value: string;
  color: string;
  barWidth: number;
  opacity: number;
  valueFontSize: number;
  width: number;
  winner?: boolean;
}> = ({ label, value, color, barWidth, opacity, valueFontSize, width, winner }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "85%",
        opacity,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: t.borderRadius.md,
        padding: t.spacing.md,
        border: `2px solid ${color}30`,
        boxShadow: winner ? `0 0 30px ${color}20, inset 0 0 30px ${color}08` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${barWidth}%`,
          background: `linear-gradient(90deg, ${color}20, ${color}08)`,
          borderRadius: t.borderRadius.md,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Label */}
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: Math.round(width * 0.035),
            color,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {label}
        </div>

        {/* Value */}
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: valueFontSize,
            color: t.colors.textPrimary,
            textShadow: winner ? `0 0 20px ${color}40` : "none",
          }}
        >
          {value}
        </div>
      </div>

      {/* Winner indicator */}
      {winner && (
        <div
          style={{
            position: "absolute",
            right: t.spacing.md,
            top: "50%",
            transform: "translateY(-50%)",
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            boxShadow: `0 0 20px ${color}60`,
            opacity: interpolate(frame, [40, 50], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          ◎
        </div>
      )}
    </div>
  );
};
