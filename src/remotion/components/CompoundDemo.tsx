import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";

export interface CompoundDemoProps {
  /** 月額積立 (円) */
  monthlyAmount: number;
  /** 期間 (年) */
  years: number;
  /** 想定年利 (例: 0.05 = 5%) */
  annualRate?: number;
  /** タイトル (例: "複利で資産が育つ") */
  title?: string;
  /** 単位ラベル */
  unit?: string;
  /** マイルストーン年で値を表示 (例: [10, 20, 30]) */
  milestones?: number[];
  bgVariant?: BackgroundVariant;
}

/**
 * 月額積立 × 期間 × 年利 の複利成長を、グラフで可視化する。
 * 元本 (リニア) と総額 (複利) を2本のラインで比較表示。
 */
export const CompoundDemo: React.FC<CompoundDemoProps> = ({
  monthlyAmount,
  years,
  annualRate = 0.05,
  title,
  unit = "万円",
  milestones,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  // Compute year-by-year values
  const principalSeries: number[] = [];
  const totalSeries: number[] = [];
  let principal = 0;
  let total = 0;
  const monthlyRate = annualRate / 12;
  for (let y = 0; y <= years; y++) {
    principalSeries.push(principal);
    totalSeries.push(total);
    // Add 12 months of contributions with monthly compounding
    if (y < years) {
      for (let m = 0; m < 12; m++) {
        principal += monthlyAmount;
        total = (total + monthlyAmount) * (1 + monthlyRate);
      }
    }
  }
  const finalTotal = totalSeries[totalSeries.length - 1];
  const maxValue = finalTotal;

  // Display values in 万円 (divide by 10000)
  const toDisplay = (n: number) => Math.round(n / 10000);

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart dimensions
  const chartWidth = width * 0.84;
  const chartHeight = 600;
  const padding = 60;
  const innerW = chartWidth - padding * 2;
  const innerH = chartHeight - padding * 2;

  // Animation: lines draw from year 0 to year `years` over ~120 frames
  const drawDuration = 120;
  const drawStart = 16;
  const drawProgress = interpolate(frame, [drawStart, drawStart + drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Build SVG path strings up to drawProgress
  const buildPath = (series: number[]) => {
    const visiblePoints = Math.max(2, Math.floor(series.length * drawProgress));
    const points: string[] = [];
    for (let i = 0; i < visiblePoints; i++) {
      const x = padding + (i / (series.length - 1)) * innerW;
      const y = padding + innerH - (series[i] / maxValue) * innerH;
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  const principalPath = buildPath(principalSeries);
  const totalPath = buildPath(totalSeries);

  // Final total label appears late
  const finalLabelOpacity = interpolate(
    frame,
    [drawStart + drawDuration - 10, drawStart + drawDuration + 14],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const finalLabelScale = interpolate(
    frame,
    [drawStart + drawDuration - 10, drawStart + drawDuration + 16],
    [0.7, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back()) },
  );

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
          gap: t.spacing.md,
        }}
      >
        {title && (
          <div
            style={{
              opacity: titleOpacity,
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

        {/* Subtitle: scenario description */}
        <div
          style={{
            opacity: titleOpacity,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: Math.round(width * 0.038),
            color: t.colors.textSecondary,
            textAlign: "center",
          }}
        >
          月{(monthlyAmount / 10000).toFixed(0)}万円 × {years}年 (年利{(annualRate * 100).toFixed(1)}%想定)
        </div>

        {/* Chart */}
        <svg
          width={chartWidth}
          height={chartHeight}
          style={{ marginTop: t.spacing.sm }}
        >
          {/* Y-axis grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((p, i) => {
            const y = padding + innerH - innerH * p;
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + innerW}
                  y2={y}
                  stroke={`${t.colors.accent}40`}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 10}
                  y={y + 5}
                  fontSize={20}
                  fill={t.colors.textSecondary}
                  textAnchor="end"
                  fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}
                >
                  {toDisplay(maxValue * p)}
                </text>
              </g>
            );
          })}

          {/* X-axis ticks (years) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((p, i) => {
            const x = padding + innerW * p;
            const yearLabel = Math.round(years * p);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={padding + innerH}
                  x2={x}
                  y2={padding + innerH + 6}
                  stroke={t.colors.textSecondary}
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={padding + innerH + 28}
                  fontSize={20}
                  fill={t.colors.textSecondary}
                  textAnchor="middle"
                  fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}
                >
                  {yearLabel}年
                </text>
              </g>
            );
          })}

          {/* Principal line (light) */}
          <path
            d={principalPath}
            fill="none"
            stroke={t.colors.accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="8 6"
            opacity={0.7}
          />

          {/* Total line (highlighted) */}
          <path
            d={totalPath}
            fill="none"
            stroke={t.colors.positive}
            strokeWidth={8}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 12px ${t.colors.positive}AA)`,
            }}
          />

          {/* Milestone points */}
          {milestones?.map((mYear, i) => {
            if (mYear > years) return null;
            const idx = mYear;
            const xRatio = idx / years;
            // Only show if drawn yet
            if (xRatio > drawProgress) return null;
            const x = padding + innerW * xRatio;
            const y = padding + innerH - (totalSeries[idx] / maxValue) * innerH;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill={t.colors.highlight}
                  stroke="#fff"
                  strokeWidth={3}
                />
                <text
                  x={x}
                  y={y - 18}
                  fontSize={22}
                  fontWeight={900}
                  fill={t.colors.highlight}
                  textAnchor="middle"
                  fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}
                  style={{
                    filter: `drop-shadow(0 0 8px ${t.colors.highlight})`,
                  }}
                >
                  {toDisplay(totalSeries[idx])}{unit}
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${padding + 10}, ${padding + 10})`}>
            <line x1={0} y1={6} x2={28} y2={6} stroke={t.colors.accent} strokeWidth={4} strokeDasharray="6 4" opacity={0.7} />
            <text x={36} y={12} fontSize={20} fill={t.colors.textSecondary} fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}>
              元本のみ
            </text>
            <line x1={150} y1={6} x2={178} y2={6} stroke={t.colors.positive} strokeWidth={6} strokeLinecap="round" />
            <text x={186} y={12} fontSize={20} fontWeight={700} fill={t.colors.positive} fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}>
              複利で運用
            </text>
          </g>
        </svg>

        {/* Final amount label */}
        <div
          style={{
            opacity: finalLabelOpacity,
            transform: `scale(${finalLabelScale})`,
            padding: `${t.spacing.sm}px ${t.spacing.xl}px`,
            backgroundColor: `${t.colors.positive}1f`,
            border: `3px solid ${t.colors.positive}`,
            borderRadius: t.borderRadius.md,
            boxShadow: `0 0 40px ${t.colors.positive}80`,
            display: "flex",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.04),
              color: t.colors.textSecondary,
            }}
          >
            {years}年後
          </span>
          <span
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.09),
              color: t.colors.positive,
              textShadow: `0 0 24px ${t.colors.positive}`,
              whiteSpace: "nowrap",
            }}
          >
            {toDisplay(finalTotal)}{unit}
          </span>
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
