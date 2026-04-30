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
import { autoFontSize, autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";

export type CTADestination = "pinnedComment" | "profileLink";

export interface CTAEndCardProps {
  headline: string;
  subtext?: string;
  actions?: string[];
  destinations?: CTADestination[];
  bgVariant?: BackgroundVariant;
}

const DESTINATION_LABELS: Record<CTADestination, { icon: string; text: string }> = {
  pinnedComment: { icon: "📌", text: "固定コメント" },
  profileLink: { icon: "🔗", text: "プロフィール" },
};

export const CTAEndCard: React.FC<CTAEndCardProps> = ({
  headline,
  subtext,
  actions = [],
  destinations,
  bgVariant,
}) => {
  const renderedActions =
    destinations && destinations.length > 0
      ? destinations.map((d) => `${DESTINATION_LABELS[d].icon} ${DESTINATION_LABELS[d].text}`)
      : actions;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const headlineScale = spring({ frame, fps, config: { damping: 10, mass: 0.6 } });
  const headlineOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtextOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextSlide = interpolate(frame, [12, 22], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Japanese-aware sizing + auto natural line break (2-pass)
  const headlineMaxWidth = width * 0.86;
  const headlineBase = Math.round(width * 0.09);
  const initialHeadlineFontSize = autoFontSizeJa(headline, headlineBase, headlineMaxWidth);
  const wrappedHeadline = smartLineBreak(headline, initialHeadlineFontSize, headlineMaxWidth);
  const headlineFontSize = autoFontSizeJa(wrappedHeadline, headlineBase, headlineMaxWidth);

  const subtextMaxWidth = width * 0.84;
  const subtextBase = Math.round(width * 0.05);
  const initialSubtextFontSize = subtext
    ? autoFontSizeJa(subtext, subtextBase, subtextMaxWidth)
    : 0;
  const wrappedSubtext = subtext
    ? smartLineBreak(subtext, initialSubtextFontSize, subtextMaxWidth)
    : "";
  const subtextFontSize = subtext
    ? autoFontSizeJa(wrappedSubtext, subtextBase, subtextMaxWidth)
    : 0;

  // Pulsing glow for CTA
  const glowIntensity = Math.sin(frame * 0.08) * 0.3 + 0.7;

  return (
    <AnimatedBackground variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.xl,
        }}
      >
        {/* Decorative rings */}
        <div style={{ position: "relative", marginBottom: t.spacing.lg }}>
          {[0, 1, 2].map((i) => {
            const ringDelay = i * 5;
            const ringScale = interpolate(frame - ringDelay, [0, 30], [0.8, 1.3], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const ringOpacity = interpolate(frame - ringDelay, [0, 30], [0.2, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  position: i === 0 ? "relative" : "absolute",
                  left: i === 0 ? undefined : "50%",
                  top: i === 0 ? undefined : "50%",
                  transform: i === 0
                    ? `scale(${ringScale})`
                    : `translate(-50%, -50%) scale(${ringScale})`,
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  border: `2px solid ${t.colors.positive}`,
                  opacity: ringOpacity,
                }}
              />
            );
          })}
        </div>

        {/* Headline */}
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: headlineFontSize,
            color: t.colors.textPrimary,
            textAlign: "center",
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
            textShadow: `0 0 ${30 * glowIntensity}px ${t.colors.positive}40`,
            lineHeight: 1.3,
            whiteSpace: "pre-wrap",
          }}
        >
          {wrappedHeadline}
        </div>

        {/* Subtext */}
        {subtext && (
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: subtextFontSize,
              color: t.colors.textSecondary,
              marginTop: t.spacing.md,
              opacity: subtextOpacity,
              transform: `translateY(${subtextSlide}px)`,
              textAlign: "center",
              whiteSpace: "pre-wrap",
              lineHeight: 1.4,
            }}
          >
            {wrappedSubtext}
          </div>
        )}

        {/* Action buttons */}
        {renderedActions.length > 0 && (
          <div
            style={{
              marginTop: t.spacing.xl,
              display: "flex",
              flexDirection: "column",
              gap: t.spacing.sm,
              alignItems: "center",
            }}
          >
            {renderedActions.map((action, i) => {
              const delay = 25 + i * 10;
              const btnOpacity = interpolate(frame, [delay, delay + 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const btnSlide = interpolate(frame, [delay, delay + 10], [40, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });

              const isPrimary = i === 0;
              const pulseScale = isPrimary ? 1 + Math.sin(frame * 0.1) * 0.03 : 1;

              return (
                <div
                  key={i}
                  style={{
                    opacity: btnOpacity,
                    transform: `translateY(${btnSlide}px) scale(${pulseScale})`,
                    background: isPrimary
                      ? `linear-gradient(135deg, ${t.colors.positive}, ${t.colors.positive}CC)`
                      : "rgba(255,255,255,0.08)",
                    color: isPrimary ? t.colors.bgPrimary : t.colors.textPrimary,
                    borderRadius: t.borderRadius.md,
                    padding: `${t.spacing.sm}px ${t.spacing.xl}px`,
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.bold,
                    fontSize: autoFontSize(action, Math.round(width * 0.048)),
                    boxShadow: isPrimary
                      ? `0 4px 20px ${t.colors.positive}50`
                      : "0 2px 10px rgba(0,0,0,0.2)",
                    border: isPrimary ? "none" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {action}
                </div>
              );
            })}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
