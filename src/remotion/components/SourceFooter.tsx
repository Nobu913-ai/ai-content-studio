import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground } from "./AnimatedBackground";
import { autoFontSize } from "../utils/responsive-text";

export interface SourceEntry {
  name: string;
  infoDate?: string;
  url?: string;
}

export interface SourceFooterProps {
  sources: SourceEntry[];
  disclaimer?: string;
}

export const SourceFooter: React.FC<SourceFooterProps> = ({
  sources,
  disclaimer,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 10], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

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
        {/* Title with icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: t.spacing.sm,
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            marginBottom: t.spacing.lg,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.colors.accent + "30",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            📋
          </div>
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.045),
              color: t.colors.textSecondary,
            }}
          >
            出典・参考情報
          </div>
        </div>

        {/* Source cards */}
        <div
          style={{
            width: "85%",
            display: "flex",
            flexDirection: "column",
            gap: t.spacing.sm,
          }}
        >
          {sources.map((src, i) => {
            const delay = 10 + i * 10;
            const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const slideX = interpolate(frame, [delay, delay + 10], [60, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });

            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${slideX}px)`,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: t.borderRadius.sm,
                  padding: `${t.spacing.sm}px ${t.spacing.md}px`,
                  borderLeft: `4px solid ${t.colors.accent}`,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.bold,
                    fontSize: autoFontSize(src.name, Math.round(width * 0.04), width * 0.7),
                    color: t.colors.textPrimary,
                    lineHeight: 1.4,
                  }}
                >
                  {src.name}
                </div>
                {src.infoDate && (
                  <div
                    style={{
                      fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                      fontWeight: t.fontWeights.regular,
                      fontSize: Math.round(width * 0.028),
                      color: t.colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    情報日: {src.infoDate}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        {disclaimer && (
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.regular,
              fontSize: Math.round(width * 0.028),
              color: t.colors.textSecondary,
              marginTop: t.spacing.lg,
              opacity: interpolate(frame, [35, 45], [0, 0.7], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              width: "85%",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {disclaimer}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
