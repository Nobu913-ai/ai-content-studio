import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";
import { formatJapaneseNumericText } from "../utils/format-number-ja";

interface FlowCardData {
  label: string;
  value?: string;
  tone?: "neutral" | "positive";
}

export interface CompoundFlowDemoProps {
  title?: string;
  leadLabel?: string;
  left: FlowCardData;
  right: FlowCardData;
  result: FlowCardData;
  loopLabel?: string;
  footnote?: string;
  revealTimings?: {
    leftSec?: number;
    rightSec?: number;
    resultSec?: number;
    loopSec?: number;
    footnoteSec?: number;
  };
  bgVariant?: BackgroundVariant;
}

const cardToneColor = (tone?: "neutral" | "positive") =>
  tone === "positive" ? t.colors.positive : t.colors.accent;

const flowCardBorderWidth = 3;

const Card: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  data: FlowCardData;
  delay: number;
}> = ({ x, y, width, height, data, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, mass: 0.55, stiffness: 180 },
  });
  const accent = cardToneColor(data.tone);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity,
        transform: `scale(${scale})`,
        borderRadius: 28,
        border: `${flowCardBorderWidth}px solid ${accent}90`,
        background: `linear-gradient(180deg, ${accent}18, rgba(255,255,255,0.04))`,
        boxShadow: `0 0 30px ${accent}35`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textAlign: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.bold,
          fontSize: 34,
          color: t.colors.textSecondary,
          lineHeight: 1.2,
          whiteSpace: "pre-wrap",
        }}
      >
        {formatJapaneseNumericText(data.label)}
      </div>
      {data.value ? (
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: 48,
            color: accent,
            textShadow: `0 0 18px ${accent}60`,
            whiteSpace: "nowrap",
          }}
        >
          {formatJapaneseNumericText(data.value)}
        </div>
      ) : null}
    </div>
  );
};

const Arrow: React.FC<{
  d: string;
  delay: number;
  color: string;
}> = ({ d, delay, color }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);
  const progress = interpolate(localFrame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        overflow: "visible",
      }}
      width="100%"
      height="100%"
      viewBox="0 0 900 780"
    >
      <defs>
        <marker
          id={`arrowhead-${delay}`}
          markerWidth="18"
          markerHeight="18"
          refX="9"
          refY="9"
          orient="auto"
        >
          <path d="M0,0 L18,9 L0,18 z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#arrowhead-${delay})`}
        style={{
          strokeDasharray: 1200,
          strokeDashoffset: 1200 * (1 - progress),
          filter: `drop-shadow(0 0 12px ${color})`,
        }}
      />
    </svg>
  );
};

const DownArrow: React.FC<{
  top: number;
  delay: number;
  color: string;
}> = ({ top, delay, color }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(localFrame, [0, 12], [-16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        opacity,
        transform: `translateY(${translateY}px)`,
        width: 900,
        height: 86,
        overflow: "visible",
      }}
      width="900"
      height="86"
      viewBox="0 0 900 86"
    >
      <defs>
        <marker
          id={`down-arrowhead-${delay}`}
          markerWidth="26"
          markerHeight="26"
          refX="13"
          refY="13"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L26,13 L0,26 z" fill={color} />
        </marker>
      </defs>
      <line
        x1="450"
        y1="8"
        x2="450"
        y2="64"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        markerEnd={`url(#down-arrowhead-${delay})`}
        style={{ filter: `drop-shadow(0 0 12px ${color})` }}
      />
    </svg>
  );
};

const FormulaBox: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  accent: string;
  delay: number;
  glow?: boolean;
}> = ({ x, y, width, height, label, accent, delay, glow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 10, mass: 0.55, stiffness: 180 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity,
        transform: `scale(${scale})`,
        borderRadius: 28,
        border: `${flowCardBorderWidth}px solid ${accent}95`,
        background: `linear-gradient(180deg, ${accent}20, rgba(255,255,255,0.055))`,
        boxShadow: glow ? `0 0 34px ${accent}55` : `0 0 22px ${accent}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "18px 24px",
      }}
    >
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.black,
          fontSize: 44,
          color: glow ? accent : t.colors.textPrimary,
          textShadow: glow ? `0 0 16px ${accent}80` : "none",
          lineHeight: 1.15,
          whiteSpace: "pre-wrap",
        }}
      >
        {formatJapaneseNumericText(label)}
      </div>
    </div>
  );
};

const GrowthSteps: React.FC<{
  delay: number;
}> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);
  const titleOpacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bars = [
    { label: "1回目", height: 34, width: 108, delay: 0 },
    { label: "2回目", height: 86, width: 134, delay: 6 },
    { label: "3回目", height: 212, width: 178, delay: 12 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 548,
        height: 280,
        opacity: titleOpacity,
      }}
    >
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.black,
          fontSize: 38,
          color: t.colors.textPrimary,
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        繰り返すほど、増えた分が大きくなる
      </div>
      <div
        style={{
          position: "relative",
          width: 700,
          height: 222,
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        {bars.map((bar, index) => {
          const barFrame = Math.max(0, localFrame - bar.delay);
          const barHeight = interpolate(barFrame, [0, 14], [18, bar.height], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const opacity = interpolate(barFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={bar.label}
              style={{
                width: 180,
                height: 220,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                opacity,
              }}
            >
              <div
                style={{
                  width: bar.width,
                  height: barHeight,
                  borderRadius: 20,
                  background: `linear-gradient(180deg, ${t.colors.positive}, ${t.colors.positive}A8)`,
                  boxShadow: `0 0 22px ${t.colors.positive}65`,
                }}
              />
              <div
                style={{
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.black,
                  fontSize: 28,
                  color: index === 2 ? t.colors.highlight : t.colors.textSecondary,
                  textAlign: "center",
                }}
              >
                {bar.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CompoundFlowDemo: React.FC<CompoundFlowDemoProps> = ({
  title,
  leadLabel,
  left,
  right,
  result,
  loopLabel,
  footnote,
  revealTimings,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;
  const sec = (value: number) => Math.round(value * fps);
  const leftDelay = sec(revealTimings?.leftSec ?? 0.8);
  const rightDelay = sec(revealTimings?.rightSec ?? 2.1);
  const resultDelay = sec(revealTimings?.resultSec ?? 4.2);
  const loopDelay = sec(revealTimings?.loopSec ?? 7.0);
  const footnoteDelay = sec(revealTimings?.footnoteSec ?? 7.4);

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const loopBadgeOpacity = interpolate(frame, [loopDelay, loopDelay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loopPulse = Math.sin(Math.max(0, frame - loopDelay) * 0.12) * 0.08 + 1;

  return (
    <AnimatedBackground accent={t.colors.positive} variant={bgVariant}>
      <AbsoluteFill
        style={{
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: t.spacing.md,
        }}
      >
        {title ? (
          <div
            style={{
              opacity: titleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: autoFontSizeJa(title, Math.round(width * 0.06), width * 0.84),
              color: t.colors.textPrimary,
              textAlign: "center",
              whiteSpace: "pre-wrap",
            }}
          >
            {smartLineBreak(title, Math.round(width * 0.06), width * 0.84)}
          </div>
        ) : null}

        {leadLabel ? (
          <div
            style={{
              opacity: titleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: 38,
              color: t.colors.textSecondary,
              textAlign: "center",
            }}
          >
            {formatJapaneseNumericText(leadLabel)}
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            width: 900,
            height: 780,
          }}
        >
          <FormulaBox
            x={70}
            y={44}
            width={330}
            height={126}
            label={left.label}
            accent={t.colors.accent}
            delay={leftDelay}
          />
          <FormulaBox
            x={500}
            y={44}
            width={330}
            height={126}
            label={right.label}
            accent={t.colors.positive}
            delay={rightDelay}
            glow
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 78,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: 64,
              lineHeight: 1,
              color: t.colors.highlight,
              textAlign: "center",
              opacity: interpolate(frame, [rightDelay, rightDelay + 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            +
          </div>

          <DownArrow top={188} delay={resultDelay - 8} color={t.colors.positive} />

          <div
            style={{
              position: "absolute",
              left: 70,
              top: 282,
              width: 760,
              minHeight: 138,
              opacity: interpolate(frame, [resultDelay, resultDelay + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `scale(${spring({
                frame: Math.max(0, frame - resultDelay),
                fps,
                config: { damping: 10, mass: 0.55, stiffness: 180 },
              })})`,
              borderRadius: 32,
              border: `${flowCardBorderWidth}px solid ${t.colors.positive}`,
              backgroundColor: `${t.colors.positive}18`,
              boxShadow: `0 0 36px ${t.colors.positive}55`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "22px 30px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.bold,
                fontSize: 30,
                color: t.colors.textSecondary,
              }}
            >
              元本 + 増えた分
            </div>
            <div
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.black,
                fontSize: 54,
                color: t.colors.positive,
                textShadow: `0 0 18px ${t.colors.positive}70`,
                lineHeight: 1.15,
                whiteSpace: "nowrap",
              }}
            >
              {formatJapaneseNumericText(result.label)}
            </div>
          </div>

          <GrowthSteps delay={Math.max(0, footnoteDelay - sec(0.6))} />
        </div>

        {footnote ? (
          <div
            style={{
              opacity: interpolate(frame, [footnoteDelay, footnoteDelay + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: 34,
              color: t.colors.textPrimary,
              textAlign: "center",
            }}
          >
            {formatJapaneseNumericText(footnote)}
          </div>
        ) : null}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
