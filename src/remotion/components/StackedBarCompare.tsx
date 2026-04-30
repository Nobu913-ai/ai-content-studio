import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSize } from "../utils/responsive-text";

interface BarData {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

export interface StackedBarCompareProps {
  title: string;
  bars: BarData[];
  total?: { label: string; value: number; unit?: string };
  highlight?: string;
  staggerFrames?: number;
  growthFrames?: number;
  bgVariant?: BackgroundVariant;
}

const resolveColor = (token?: string): string => {
  if (!token) return t.colors.accent;
  if (token === "positive") return t.colors.positive;
  if (token === "negative") return t.colors.negative;
  if (token === "accent") return t.colors.accent;
  if (token === "highlight") return t.colors.highlight;
  return token;
};

const Bar: React.FC<{
  data: BarData;
  index: number;
  maxValue: number;
  delay: number;
  width: number;
  growthFrames: number;
}> = ({ data, index, maxValue, delay, width: containerWidth, growthFrames }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const widthRatio = data.value / maxValue;
  const targetWidth = containerWidth * 0.78 * widthRatio;
  const animWidth = interpolate(f, [0, growthFrames], [0, targetWidth], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(f, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const valueOpacity = interpolate(f, [Math.round(growthFrames * 0.7), Math.round(growthFrames) + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const color = resolveColor(data.color);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", opacity }}>
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.bold,
          fontSize: Math.round(containerWidth * 0.038),
          color: t.colors.textSecondary,
        }}
      >
        {data.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: t.spacing.sm }}>
        <div
          style={{
            width: animWidth,
            height: 60,
            background: `linear-gradient(90deg, ${color}, ${color}AA)`,
            borderRadius: t.borderRadius.sm,
            boxShadow: `0 4px 20px ${color}60`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: t.spacing.sm,
          }}
        />
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: Math.round(containerWidth * 0.045),
            color,
            opacity: valueOpacity,
            whiteSpace: "nowrap",
            textShadow: `0 0 12px ${color}50`,
          }}
        >
          {data.value}{data.unit || ""}
        </div>
      </div>
    </div>
  );
};

export const StackedBarCompare: React.FC<StackedBarCompareProps> = ({
  title,
  bars,
  total,
  highlight,
  staggerFrames = 8,
  growthFrames = 22,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  const maxValue = total?.value ?? Math.max(...bars.map((b) => b.value));

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 10], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const totalDelay = 10 + bars.length * staggerFrames + growthFrames;
  const totalOpacity = interpolate(frame, [totalDelay, totalDelay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const totalScale = interpolate(frame, [totalDelay, totalDelay + 14], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back()),
  });

  const highlightOpacity = interpolate(frame, [totalDelay + 8, totalDelay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        }}
      >
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: autoFontSize(title, Math.round(width * 0.06), width * 0.85),
            color: t.colors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            textAlign: "center",
            marginBottom: t.spacing.lg,
          }}
        >
          {title}
        </div>

        <div
          style={{
            width: "85%",
            display: "flex",
            flexDirection: "column",
            gap: t.spacing.md,
          }}
        >
          {bars.map((bar, i) => (
            <Bar
              key={i}
              data={bar}
              index={i}
              maxValue={maxValue}
              delay={10 + i * staggerFrames}
              width={width}
              growthFrames={growthFrames}
            />
          ))}

          {total && (
            <div
              style={{
                opacity: totalOpacity,
                transform: `scale(${totalScale})`,
                marginTop: t.spacing.md,
                padding: `${t.spacing.md}px ${t.spacing.lg}px`,
                backgroundColor: `${t.colors.positive}1a`,
                borderRadius: t.borderRadius.md,
                border: `2px solid ${t.colors.positive}80`,
                boxShadow: `0 0 30px ${t.colors.positive}40`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.bold,
                  fontSize: Math.round(width * 0.045),
                  color: t.colors.textPrimary,
                }}
              >
                {total.label}
              </div>
              <div
                style={{
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.black,
                  fontSize: Math.round(width * 0.07),
                  color: t.colors.positive,
                  textShadow: `0 0 24px ${t.colors.positive}80`,
                }}
              >
                {total.value}{total.unit || ""}
              </div>
            </div>
          )}
        </div>

        {highlight && (
          <div
            style={{
              opacity: highlightOpacity,
              marginTop: t.spacing.lg,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: autoFontSize(highlight, Math.round(width * 0.058), width * 0.85),
              color: t.colors.highlight,
              textShadow: `0 0 24px ${t.colors.highlight}80`,
              textAlign: "center",
            }}
          >
            {highlight}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
