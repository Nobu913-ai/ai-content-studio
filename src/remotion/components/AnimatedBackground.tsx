import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";

export type BackgroundVariant = "impact" | "data" | "action" | "default";

interface FloatingShape {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
  color: string;
}

const SHAPES_DEFAULT: FloatingShape[] = [
  { x: 0.1, y: 0.15, size: 120, speed: 0.3, opacity: 0.06, delay: 0, color: t.colors.accent },
  { x: 0.85, y: 0.3, size: 80, speed: 0.5, opacity: 0.05, delay: 10, color: t.colors.positive },
  { x: 0.2, y: 0.7, size: 160, speed: 0.2, opacity: 0.04, delay: 20, color: t.colors.highlight },
  { x: 0.75, y: 0.85, size: 100, speed: 0.4, opacity: 0.06, delay: 5, color: t.colors.accent },
  { x: 0.5, y: 0.5, size: 200, speed: 0.15, opacity: 0.03, delay: 15, color: t.colors.positive },
  { x: 0.3, y: 0.9, size: 60, speed: 0.6, opacity: 0.07, delay: 8, color: t.colors.highlight },
  { x: 0.9, y: 0.1, size: 90, speed: 0.35, opacity: 0.05, delay: 12, color: t.colors.accent },
];

// impact: bigger blobs, higher saturation, stronger glow
const SHAPES_IMPACT: FloatingShape[] = [
  { x: 0.15, y: 0.2, size: 220, speed: 0.4, opacity: 0.10, delay: 0, color: t.colors.negative },
  { x: 0.85, y: 0.4, size: 180, speed: 0.5, opacity: 0.10, delay: 6, color: t.colors.positive },
  { x: 0.5, y: 0.85, size: 240, speed: 0.25, opacity: 0.08, delay: 12, color: t.colors.highlight },
  { x: 0.5, y: 0.5, size: 320, speed: 0.18, opacity: 0.06, delay: 18, color: t.colors.accent },
];

// data: ordered/rectangular, structured grid feel
const SHAPES_DATA: FloatingShape[] = [
  { x: 0.5, y: 0.5, size: 260, speed: 0.12, opacity: 0.04, delay: 0, color: t.colors.accent },
  { x: 0.18, y: 0.35, size: 100, speed: 0.18, opacity: 0.04, delay: 8, color: t.colors.positive },
  { x: 0.82, y: 0.65, size: 100, speed: 0.18, opacity: 0.04, delay: 14, color: t.colors.accent },
];

// action: warm, motion-forward, slight diagonal flow
const SHAPES_ACTION: FloatingShape[] = [
  { x: 0.2, y: 0.25, size: 140, speed: 0.7, opacity: 0.07, delay: 0, color: t.colors.highlight },
  { x: 0.8, y: 0.3, size: 110, speed: 0.6, opacity: 0.07, delay: 6, color: t.colors.accent },
  { x: 0.3, y: 0.75, size: 130, speed: 0.55, opacity: 0.06, delay: 12, color: t.colors.positive },
  { x: 0.85, y: 0.85, size: 90, speed: 0.65, opacity: 0.07, delay: 18, color: t.colors.highlight },
];

// 装飾線・グリッドは「薄い線ノイズ」と認識されたため全削除。
// 変種の差別化は gradient + 浮遊シェイプのみで行う。

const variantPalette = (variant: BackgroundVariant) => {
  switch (variant) {
    case "impact":
      return {
        gradientStart: "hsl(230, 60%, 12%)",
        gradientMid: t.colors.bgPrimary,
        gradientEnd: "hsl(220, 55%, 18%)",
        shapes: SHAPES_IMPACT,
        ambientGlow: 0.08,
      };
    case "data":
      return {
        gradientStart: t.colors.bgSecondary,
        gradientMid: t.colors.bgPrimary,
        gradientEnd: "hsl(225, 50%, 10%)",
        shapes: SHAPES_DATA,
        ambientGlow: 0.04,
      };
    case "action":
      return {
        gradientStart: "hsl(230, 65%, 14%)",
        gradientMid: t.colors.bgPrimary,
        gradientEnd: "hsl(212, 55%, 18%)",
        shapes: SHAPES_ACTION,
        ambientGlow: 0.06,
      };
    default:
      return {
        gradientStart: t.colors.bgSecondary,
        gradientMid: t.colors.bgPrimary,
        gradientEnd: "hsl(230, 70%, 12%)",
        shapes: SHAPES_DEFAULT,
        ambientGlow: 0.05,
      };
  }
};

export const AnimatedBackground: React.FC<{
  children: React.ReactNode;
  accent?: string;
  variant?: BackgroundVariant;
}> = ({ children, accent, variant = "default" }) => {
  const frame = useCurrentFrame();
  const { width, height } = t.resolution;
  const palette = variantPalette(variant);

  const gradAngle = 160 + Math.sin(frame * 0.008) * 10;
  const gradShift = Math.sin(frame * 0.005) * 5;

  return (
    <AbsoluteFill>
      {/* Variant-specific gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradAngle}deg,
            ${palette.gradientStart} 0%,
            ${palette.gradientMid} ${45 + gradShift}%,
            ${palette.gradientEnd} 100%)`,
        }}
      />

      {/* Floating shapes */}
      {palette.shapes.map((shape, i) => {
        const f = frame - shape.delay;
        const yOffset = Math.sin(f * shape.speed * 0.03) * 20;
        const xOffset = Math.cos(f * shape.speed * 0.02) * 10;
        const scale = 1 + Math.sin(f * 0.02) * 0.1;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: shape.x * width + xOffset,
              top: shape.y * height + yOffset,
              width: shape.size * scale,
              height: shape.size * scale,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${shape.color}${Math.round(shape.opacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
              filter: variant === "impact" ? "blur(40px)" : "blur(30px)",
              transform: `translate(-50%, -50%)`,
            }}
          />
        );
      })}

      {/* Accent lines: removed entirely — were perceived as thin-line noise.
          Variant differentiation is now handled by gradient + floating shapes only. */}

      {/* Ambient glow overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,${palette.ambientGlow}) 0%, transparent 60%)`,
        }}
      />

      {/* Optional accent-color ambient ring (used when accent prop is passed) */}
      {accent && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${accent}10 0%, transparent 60%)`,
            opacity: variant === "impact" ? 1 : 0.7,
          }}
        />
      )}

      {/* Content */}
      {children}
    </AbsoluteFill>
  );
};
