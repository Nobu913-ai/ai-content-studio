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
import { StaggeredText } from "./AnimatedText";
import { autoFontSize, splitOverlayLines, isNegative, isPositive } from "../utils/responsive-text";

export interface HookCardProps {
  headline: string;
  subheadline?: string;
  emphasis?: string[];
}

export const HookCard: React.FC<HookCardProps> = ({
  headline,
  subheadline,
  emphasis = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = t.resolution;

  const allLines = splitOverlayLines(
    subheadline ? `${headline}\n${subheadline}` : headline,
  );

  const mainSize = autoFontSize(headline, Math.round(width * 0.1));
  const subSize = subheadline ? autoFontSize(subheadline, Math.round(width * 0.06)) : 0;

  const accentLineWidth = interpolate(frame, [5, 25], [0, width * 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const accentOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const topLineColor = allLines.some(isNegative) ? t.colors.negative :
    allLines.some(isPositive) ? t.colors.positive : t.colors.highlight;

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
        {/* Decorative accent line */}
        <div
          style={{
            width: accentLineWidth,
            height: 4,
            backgroundColor: topLineColor,
            borderRadius: 2,
            marginBottom: t.spacing.lg,
            opacity: accentOpacity,
            boxShadow: `0 0 20px ${topLineColor}60`,
          }}
        />

        {/* Main headline */}
        <StaggeredText
          lines={[headline]}
          baseDelay={3}
          animation="popIn"
          highlightWords={emphasis}
          lineStyle={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: mainSize,
            color: t.colors.textPrimary,
            textAlign: "center",
            lineHeight: 1.3,
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        />

        {/* Subheadline */}
        {subheadline && (
          <div style={{ marginTop: t.spacing.md }}>
            <StaggeredText
              lines={splitOverlayLines(subheadline)}
              baseDelay={15}
              staggerMs={400}
              animation="slideUp"
              highlightWords={emphasis}
              lineStyle={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.bold,
                fontSize: subSize,
                color: t.colors.textSecondary,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            />
          </div>
        )}

        {/* Bottom accent */}
        <div
          style={{
            width: accentLineWidth * 0.5,
            height: 4,
            backgroundColor: topLineColor,
            borderRadius: 2,
            marginTop: t.spacing.lg,
            opacity: accentOpacity * 0.5,
            boxShadow: `0 0 15px ${topLineColor}40`,
          }}
        />
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
