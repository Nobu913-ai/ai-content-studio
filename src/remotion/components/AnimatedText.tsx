import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";

interface AnimatedLineProps {
  text: string;
  delay: number;
  style?: React.CSSProperties;
  highlightWords?: string[];
  animation?: "slideUp" | "fadeIn" | "popIn" | "typewriter";
}

export const AnimatedLine: React.FC<AnimatedLineProps> = ({
  text,
  delay,
  style = {},
  highlightWords = [],
  animation = "slideUp",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;

  let opacity = 0;
  let translateY = 0;
  let scale = 1;

  switch (animation) {
    case "slideUp":
      opacity = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      translateY = interpolate(f, [0, 10], [40, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      break;
    case "fadeIn":
      opacity = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      break;
    case "popIn":
      opacity = interpolate(f, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      scale = spring({ frame: Math.max(0, f), fps, config: { damping: 8, mass: 0.5, stiffness: 200 } });
      break;
    case "typewriter":
      opacity = f >= 0 ? 1 : 0;
      break;
  }

  const rendered = renderHighlights(text, highlightWords);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        ...style,
      }}
    >
      {rendered}
    </div>
  );
};

function renderHighlights(text: string, highlights: string[]): React.ReactNode {
  if (highlights.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliest = remaining.length;
    let matched = "";

    for (const word of highlights) {
      const idx = remaining.indexOf(word);
      if (idx !== -1 && idx < earliest) {
        earliest = idx;
        matched = word;
      }
    }

    if (matched && earliest < remaining.length) {
      if (earliest > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, earliest)}</span>);
      }
      parts.push(
        <span
          key={key++}
          style={{
            color: t.colors.highlight,
            textShadow: `0 0 20px ${t.colors.highlight}40, 0 0 40px ${t.colors.highlight}20`,
          }}
        >
          {matched}
        </span>,
      );
      remaining = remaining.slice(earliest + matched.length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return <>{parts}</>;
}

interface StaggeredTextProps {
  lines: string[];
  baseDelay?: number;
  staggerMs?: number;
  lineStyle?: React.CSSProperties;
  highlightWords?: string[];
  animation?: "slideUp" | "fadeIn" | "popIn" | "typewriter";
  gap?: number;
}

export const StaggeredText: React.FC<StaggeredTextProps> = ({
  lines,
  baseDelay = 5,
  staggerMs = 300,
  lineStyle = {},
  highlightWords = [],
  animation = "slideUp",
  gap = 12,
}) => {
  const { fps } = useVideoConfig();
  const staggerFrames = Math.round((staggerMs / 1000) * fps);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap, alignItems: "center" }}>
      {lines.map((line, i) => (
        <AnimatedLine
          key={i}
          text={line}
          delay={baseDelay + i * staggerFrames}
          style={lineStyle}
          highlightWords={highlightWords}
          animation={animation}
        />
      ))}
    </div>
  );
};

interface CountUpNumberProps {
  target: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
  durationFrames?: number;
  style?: React.CSSProperties;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  target,
  prefix = "",
  suffix = "",
  delay = 0,
  durationFrames = 30,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const progress = interpolate(f, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const current = Math.round(target * progress);
  const opacity = interpolate(f, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = 1 + (1 - progress) * 0.2;

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        ...style,
      }}
    >
      {prefix}{current.toLocaleString()}{suffix}
    </div>
  );
};
