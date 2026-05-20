import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";
import { formatJapaneseNumericText } from "../utils/format-number-ja";

interface ChecklistItem {
  text: string;
  tone?: "positive" | "negative" | "neutral";
  revealSec?: number;
}

export interface ChecklistPanelProps {
  title?: string;
  subtitle?: string;
  items: ChecklistItem[];
  bgVariant?: BackgroundVariant;
}

const toneColor = (tone?: ChecklistItem["tone"]) => {
  if (tone === "positive") return t.colors.positive;
  if (tone === "negative") return t.colors.negative;
  return t.colors.accent;
};

const AnimatedItemText: React.FC<{
  text: string;
  startFrame: number;
  fontSize: number;
}> = ({ text, startFrame, fontSize }) => {
  const frame = useCurrentFrame();
  const chars = Array.from(formatJapaneseNumericText(text));

  return (
    <div
      style={{
        fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
        fontWeight: t.fontWeights.black,
        fontSize,
        color: t.colors.textPrimary,
        whiteSpace: "nowrap",
      }}
    >
      {chars.map((char, index) => {
        const localFrame = frame - startFrame - index * 0.8;
        const opacity = interpolate(localFrame, [0, 7], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const translateY = interpolate(localFrame, [0, 7], [2, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <span
            key={`${char}-${index}`}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${translateY}px)`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </div>
  );
};

export const ChecklistPanel: React.FC<ChecklistPanelProps> = ({
  title,
  subtitle,
  items,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AnimatedBackground accent={t.colors.highlight} variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
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
            {smartLineBreak(formatJapaneseNumericText(title), Math.round(width * 0.06), width * 0.84)}
          </div>
        ) : null}

        {subtitle ? (
          <div
            style={{
              opacity: titleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.038),
              color: t.colors.textSecondary,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {formatJapaneseNumericText(subtitle)}
          </div>
        ) : null}

        <div
          style={{
            width: Math.min(width * 0.74, 800),
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 18,
          }}
        >
          {items.map((item, index) => {
            const delay =
              item.revealSec !== undefined
                ? Math.round(item.revealSec * fps)
                : 16 + index * 16;
            const localFrame = Math.max(0, frame - delay);
            const opacity = interpolate(localFrame, [0, 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const slide = interpolate(localFrame, [0, 14], [24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const scale = interpolate(localFrame, [0, 14], [0.995, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const accent = toneColor(item.tone);

            return (
              <div
                key={`${item.text}-${index}`}
                style={{
                  opacity,
                  transform: `translateY(${slide}px) scale(${scale})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  minHeight: 92,
                  padding: "20px 24px",
                  borderRadius: 26,
                  border: `3px solid ${accent}70`,
                  backgroundColor: `${accent}18`,
                  boxShadow: `0 0 24px ${accent}32`,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: accent,
                    color: t.colors.bgPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.black,
                    fontSize: 30,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <AnimatedItemText
                  text={item.text}
                  startFrame={delay + 4}
                  fontSize={42}
                />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
