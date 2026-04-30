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
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";

export interface CalendarHighlightProps {
  /** カレンダー上部に表示する月名・タイトル（例: "毎月", "1月", "給料日カレンダー"） */
  title?: string;
  /** カレンダーグリッド上部の月ラベル（例: "MAY"） */
  monthLabel?: string;
  /** ハイライトする日（1-31）。複数指定可 */
  highlightDays: number[];
  /** ハイライト下に表示するラベル（例: "給料日"） */
  highlightLabel?: string;
  /** カレンダーが何日まであるか（28-31）。default 30 */
  daysInMonth?: number;
  /** 1日が何曜日始まりか（0=日, 1=月...）。default 0 */
  startDayOfWeek?: number;
  /** 「毎月」感を出す巡回バッジを表示 */
  showCycleBadge?: boolean;
  bgVariant?: BackgroundVariant;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export const CalendarHighlight: React.FC<CalendarHighlightProps> = ({
  title,
  monthLabel,
  highlightDays,
  highlightLabel,
  daysInMonth = 30,
  startDayOfWeek = 0,
  showCycleBadge,
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

  const calendarOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const calendarScale = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 180 },
  });

  // Pulse for highlight days
  const pulse = Math.sin(Math.max(0, frame - 30) * 0.12) * 0.15 + 0.85;
  const highlightAppearAt = 36;
  const highlightOpacity = interpolate(frame, [highlightAppearAt, highlightAppearAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const highlightScale = spring({
    frame: Math.max(0, frame - highlightAppearAt),
    fps,
    config: { damping: 8, mass: 0.4, stiffness: 240 },
  });

  // Build calendar grid
  const cells: { day: number | null }[] = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const calendarWidth = Math.min(width * 0.84, 920);
  const cellSize = Math.floor((calendarWidth - 6 * 6) / 7);

  const cycleAngle = ((frame - 14) * 1.2) % 360;

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
              whiteSpace: "pre-wrap",
            }}
          >
            {smartLineBreak(title, Math.round(width * 0.06), width * 0.85)}
          </div>
        )}

        <div
          style={{
            opacity: calendarOpacity,
            transform: `scale(${calendarScale})`,
            width: calendarWidth,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: t.borderRadius.lg,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: t.spacing.md,
            position: "relative",
          }}
        >
          {/* Cycle badge (毎月) */}
          {showCycleBadge && (
            <div
              style={{
                position: "absolute",
                top: -32,
                right: -24,
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: t.colors.positive,
                border: "3px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.black,
                fontSize: 26,
                color: t.colors.bgPrimary,
                transform: `rotate(${cycleAngle * 0.1}deg)`,
                boxShadow: `0 4px 20px ${t.colors.positive}80, 0 0 30px ${t.colors.positive}60`,
                zIndex: 5,
              }}
            >
              毎月
            </div>
          )}

          {/* Month label */}
          {monthLabel && (
            <div
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.bold,
                fontSize: 36,
                color: t.colors.textSecondary,
                textAlign: "center",
                marginBottom: t.spacing.sm,
                letterSpacing: 4,
              }}
            >
              {monthLabel}
            </div>
          )}

          {/* Weekday header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {WEEKDAYS.map((wd, i) => (
              <div
                key={i}
                style={{
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: t.fontWeights.bold,
                  fontSize: 18,
                  color:
                    i === 0
                      ? t.colors.negative
                      : i === 6
                        ? t.colors.accent
                        : t.colors.textSecondary,
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {cells.map((cell, i) => {
              const isHighlight = cell.day !== null && highlightDays.includes(cell.day);
              return (
                <div
                  key={i}
                  style={{
                    height: cellSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: isHighlight ? t.fontWeights.black : t.fontWeights.bold,
                    fontSize: isHighlight ? 38 : 28,
                    color: isHighlight ? "#fff" : cell.day ? t.colors.textPrimary : "transparent",
                    backgroundColor: isHighlight
                      ? t.colors.highlight
                      : cell.day
                        ? "rgba(255,255,255,0.03)"
                        : "transparent",
                    borderRadius: 12,
                    boxShadow: isHighlight
                      ? `0 0 ${28 * pulse}px ${t.colors.highlight}, 0 0 ${56 * pulse}px ${t.colors.highlight}80`
                      : "none",
                    border: isHighlight ? `3px solid #fff` : "none",
                    transform: isHighlight ? `scale(${1 + (pulse - 0.85) * 0.4})` : "scale(1)",
                  }}
                >
                  {cell.day || ""}
                </div>
              );
            })}
          </div>
        </div>

        {highlightLabel && (
          <div
            style={{
              opacity: highlightOpacity,
              transform: `scale(${highlightScale})`,
              padding: `${t.spacing.sm}px ${t.spacing.lg}px`,
              backgroundColor: `${t.colors.highlight}1f`,
              border: `2px solid ${t.colors.highlight}`,
              borderRadius: t.borderRadius.md,
              boxShadow: `0 0 30px ${t.colors.highlight}50`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.05),
              color: t.colors.highlight,
              textShadow: `0 0 16px ${t.colors.highlight}`,
              marginTop: t.spacing.sm,
            }}
          >
            {highlightLabel}
          </div>
        )}
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
