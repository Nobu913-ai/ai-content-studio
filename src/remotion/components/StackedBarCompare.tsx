import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSize } from "../utils/responsive-text";
import { formatNumberWithUnitJa } from "../utils/format-number-ja";

interface BarData {
  label: string;
  value: number;
  unit?: string;
  color?: string;
  revealSec?: number;
}

export interface StackedBarCompareProps {
  title: string;
  bars: BarData[];
  total?: { label: string; value: number; unit?: string };
  highlight?: string;
  layout?: "separate" | "stacked";
  revealMode?: "auto" | "timed";
  totalRevealSec?: number;
  highlightRevealSec?: number;
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
          {formatNumberWithUnitJa(data.value, data.unit || "")}
        </div>
      </div>
    </div>
  );
};

const StackedBar: React.FC<{
  bars: BarData[];
  totalValue: number;
  width: number;
  growthFrames: number;
  revealMode: "auto" | "timed";
}> = ({ bars, totalValue, width: containerWidth, growthFrames, revealMode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barWidth = containerWidth * 0.82;
  const progressFor = (bar: BarData, index: number) => {
    const startFrame =
      revealMode === "timed" && typeof bar.revealSec === "number"
        ? Math.round(bar.revealSec * fps)
        : 12 + index * 8;
    return interpolate(frame - startFrame, [0, growthFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  };
  const labelOpacityFor = (bar: BarData, index: number) => {
    const startFrame =
      revealMode === "timed" && typeof bar.revealSec === "number"
        ? Math.round(bar.revealSec * fps)
        : 18 + index * 8;
    return interpolate(frame - startFrame, [8, 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  return (
    <div style={{ width: "86%", display: "flex", flexDirection: "column", alignItems: "center", gap: t.spacing.md }}>
      <div
        style={{
          width: barWidth,
          height: 150,
          borderRadius: 30,
          overflow: "hidden",
          display: "flex",
          border: `3px solid ${t.colors.textPrimary}30`,
          backgroundColor: "rgba(255,255,255,0.05)",
          boxShadow: `0 0 34px ${t.colors.positive}40`,
        }}
      >
        {bars.map((bar, index) => {
          const color = resolveColor(bar.color);
          const progress = progressFor(bar, index);
          const segmentWidth = (bar.value / totalValue) * progress * 100;
          return (
            <div
              key={bar.label}
              style={{
                flex: `0 0 ${segmentWidth}%`,
                minWidth: 0,
                height: "100%",
                background: `linear-gradient(135deg, ${color}, ${color}B8)`,
                boxShadow: `inset 0 0 24px rgba(255,255,255,0.12)`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          width: barWidth,
          display: "grid",
          gridTemplateColumns: bars.map((bar) => `${bar.value}fr`).join(" "),
          gap: 14,
        }}
      >
        {bars.map((bar, index) => {
          const color = resolveColor(bar.color);
          const labelOpacity = labelOpacityFor(bar, index);
          return (
            <div
              key={`${bar.label}-label`}
              style={{
                padding: `${t.spacing.sm}px ${t.spacing.md}px`,
                borderRadius: t.borderRadius.md,
                border: `3px solid ${color}80`,
                backgroundColor: `${color}18`,
                textAlign: "center",
                opacity: labelOpacity,
              }}
            >
              <div
                style={{
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.bold,
                  fontSize: Math.round(containerWidth * 0.034),
                  color: t.colors.textSecondary,
                  lineHeight: 1.2,
                }}
              >
                {bar.label}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.black,
                  fontSize: Math.round(containerWidth * 0.047),
                  color,
                  whiteSpace: "nowrap",
                  textShadow: `0 0 14px ${color}70`,
                }}
              >
                {formatNumberWithUnitJa(bar.value, bar.unit || "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const StackedBarCompare: React.FC<StackedBarCompareProps> = ({
  title,
  bars,
  total,
  highlight,
  layout = "separate",
  revealMode = "auto",
  totalRevealSec,
  highlightRevealSec,
  staggerFrames = 8,
  growthFrames = 22,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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

  const totalDelay =
    totalRevealSec !== undefined ? Math.round(totalRevealSec * fps) : 10 + bars.length * staggerFrames + growthFrames;
  const totalOpacity = interpolate(frame, [totalDelay, totalDelay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const totalScale = interpolate(frame, [totalDelay, totalDelay + 14], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back()),
  });

  const highlightDelay =
    highlightRevealSec !== undefined ? Math.round(highlightRevealSec * fps) : totalDelay + 8;
  const highlightOpacity = interpolate(frame, [highlightDelay, highlightDelay + 12], [0, 1], {
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
            fontWeight: t.fontWeights.black,
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

        {layout === "stacked" ? (
          <StackedBar
            bars={bars}
            totalValue={total?.value ?? bars.reduce((sum, bar) => sum + bar.value, 0)}
            width={width}
            growthFrames={growthFrames + 12}
            revealMode={revealMode}
          />
        ) : (
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
                  border: `3px solid ${t.colors.positive}80`,
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
                  {formatNumberWithUnitJa(total.value, total.unit || "")}
                </div>
              </div>
            )}
          </div>
        )}

        {layout === "stacked" && total && (
            <div
              style={{
                opacity: totalOpacity,
                transform: `scale(${totalScale})`,
                marginTop: t.spacing.md,
                padding: `${t.spacing.md}px ${t.spacing.lg}px`,
                backgroundColor: `${t.colors.positive}1a`,
                borderRadius: t.borderRadius.md,
                border: `3px solid ${t.colors.positive}80`,
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
                {formatNumberWithUnitJa(total.value, total.unit || "")}
              </div>
            </div>
        )}

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
