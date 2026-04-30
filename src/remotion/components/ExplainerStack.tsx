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
import { autoFontSize } from "../utils/responsive-text";

export interface ExplainerStackProps {
  title: string;
  steps: string[];
  highlightIndex?: number;
}

export const ExplainerStack: React.FC<ExplainerStackProps> = ({
  title,
  steps,
  highlightIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 12], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const stepFontSize = autoFontSize(
    steps.reduce((a, b) => (a.length > b.length ? a : b), ""),
    Math.round(width * 0.048),
    width * 0.65,
  );

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
              transform: `translateY(${titleSlide}px)`,
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {title}
          </div>
        )}

        {/* Step cards */}
        <div
          style={{
            width: "88%",
            display: "flex",
            flexDirection: "column",
            gap: t.spacing.sm,
          }}
        >
          {steps.map((step, i) => {
            const delay = 12 + i * 10;
            const slideX = interpolate(frame, [delay, delay + 12], [width * 0.5, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const itemOpacity = interpolate(frame, [delay, delay + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const isHighlighted = highlightIndex !== undefined && highlightIndex === i;
            const badgeColor = isHighlighted ? t.colors.positive : t.colors.accent;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: t.spacing.md,
                  opacity: itemOpacity,
                  transform: `translateX(${slideX}px)`,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: t.borderRadius.md,
                  padding: `${t.spacing.sm}px ${t.spacing.md}px`,
                  borderLeft: `5px solid ${badgeColor}`,
                  boxShadow: isHighlighted
                    ? `0 0 20px ${badgeColor}30, inset 0 0 20px ${badgeColor}10`
                    : "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${badgeColor}, ${badgeColor}CC)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.black,
                    fontSize: 28,
                    color: "#fff",
                    boxShadow: `0 4px 15px ${badgeColor}40`,
                  }}
                >
                  {i + 1}
                </div>

                {/* Step text */}
                <div
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.bold,
                    fontSize: stepFontSize,
                    color: isHighlighted ? t.colors.positive : t.colors.textPrimary,
                    lineHeight: 1.4,
                    textShadow: "0 1px 5px rgba(0,0,0,0.3)",
                  }}
                >
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
