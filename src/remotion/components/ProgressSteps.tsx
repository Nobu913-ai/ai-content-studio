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

export interface ProgressStep {
  label: string;
  detail?: string;
  icon?: string;
  intensity?: "muted" | "normal" | "accent" | "highlight";
}

export interface ProgressStepsProps {
  title?: string;
  steps: ProgressStep[];
  staggerSec?: number;
  highlightFinal?: boolean;
  bgVariant?: BackgroundVariant;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  title,
  steps,
  staggerSec = 1.5,
  highlightFinal = true,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 10], [-16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const staggerFrames = Math.round(staggerSec * fps);
  const baseDelay = 12;

  const labelMaxFont = Math.round(width * 0.05);
  const detailMaxFont = Math.round(width * 0.034);

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
        {title && (
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${titleSlide}px)`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: autoFontSizeJa(title, Math.round(width * 0.06), width * 0.85),
              color: t.colors.textPrimary,
              textAlign: "center",
            }}
          >
            {title}
          </div>
        )}

        <div
          style={{
            width: "85%",
            display: "flex",
            flexDirection: "column",
            gap: t.spacing.sm,
          }}
        >
          {steps.map((step, i) => {
            const itemDelay = baseDelay + i * staggerFrames;
            const opacity = interpolate(frame, [itemDelay, itemDelay + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const slideX = interpolate(frame, [itemDelay, itemDelay + 18], [-60, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const numberScale = spring({
              frame: Math.max(0, frame - itemDelay),
              fps,
              config: { damping: 9, mass: 0.5, stiffness: 220 },
            });

            // Determine intensity: explicit step.intensity > highlightFinal > default
            const inferredIntensity: ProgressStep["intensity"] =
              step.intensity ?? (highlightFinal && i === steps.length - 1 ? "highlight" : "normal");
            const isFinal = inferredIntensity === "highlight";
            const isMuted = inferredIntensity === "muted";
            const isAccent = inferredIntensity === "accent";
            const accent = isFinal
              ? t.colors.highlight
              : isAccent
                ? t.colors.accent
                : t.colors.positive;
            const baseOpacity = isMuted ? 0.65 : 1.0;
            const badgeSize = isFinal ? 72 : isMuted ? 52 : 64;
            const badgeFontSize = isFinal ? 36 : isMuted ? 24 : 32;

            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    opacity: opacity * baseOpacity,
                    transform: `translateX(${slideX}px)`,
                    backgroundColor: isFinal
                      ? `${accent}1a`
                      : isAccent
                        ? `${accent}10`
                        : "rgba(255,255,255,0.04)",
                    borderLeft: `${isFinal ? 6 : 5}px solid ${accent}`,
                    borderRadius: t.borderRadius.md,
                    padding: `${t.spacing.md}px ${t.spacing.lg}px`,
                    boxShadow: isFinal
                      ? `0 0 40px ${accent}60`
                      : isAccent
                        ? `0 0 20px ${accent}30`
                        : "0 4px 20px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: t.spacing.md,
                  }}
                >
                  <div
                    style={{
                      width: badgeSize,
                      height: badgeSize,
                      borderRadius: badgeSize / 2,
                      background: `linear-gradient(135deg, ${accent}, ${accent}AA)`,
                      color: t.colors.bgPrimary,
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.black,
                      fontSize: badgeFontSize,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${numberScale})`,
                      boxShadow: isFinal ? `0 0 30px ${accent}` : `0 0 20px ${accent}80`,
                      flexShrink: 0,
                    }}
                  >
                    {step.icon || i + 1}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div
                      style={{
                        fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                        fontWeight: t.fontWeights.bold,
                        fontSize: autoFontSizeJa(step.label, labelMaxFont, width * 0.6),
                        color: isFinal ? accent : t.colors.textPrimary,
                        lineHeight: 1.3,
                        textShadow: isFinal ? `0 0 16px ${accent}80` : "none",
                      }}
                    >
                      {step.label}
                    </div>
                    {step.detail && (
                      <div
                        style={{
                          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                          fontWeight: t.fontWeights.regular,
                          fontSize: autoFontSizeJa(step.detail, detailMaxFont, width * 0.6),
                          color: t.colors.textSecondary,
                          lineHeight: 1.4,
                        }}
                      >
                        {step.detail}
                      </div>
                    )}
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <div
                    style={{
                      opacity,
                      display: "flex",
                      justifyContent: "center",
                      paddingLeft: 32,
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 24,
                        backgroundColor: t.colors.positive,
                        opacity: 0.5,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
