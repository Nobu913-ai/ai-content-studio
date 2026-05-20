import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";
import { formatNumberJa, formatNumberWithUnitJa, formatJapaneseNumericText } from "../utils/format-number-ja";

interface MilestoneDetail {
  year: number;
  displayValue?: number;
  label?: string;
}

interface FocusTimelineItem {
  year: number;
  startSec: number;
  endSec: number;
  label?: string;
  panelTitle?: string;
  panelValue?: string;
  panelSubtext?: string;
  panelLines?: string[];
  equation?: {
    principalLabel?: string;
    principalValue: string;
    growthLabel?: string;
    growthValue: string;
    resultLabel?: string;
    resultValue: string;
  };
}

export interface CompoundDemoProps {
  monthlyAmount: number;
  years: number;
  annualRate?: number;
  title?: string;
  unit?: string;
  milestones?: number[];
  xAxisTicks?: number[];
  milestoneDetails?: MilestoneDetail[];
  focusTimeline?: FocusTimelineItem[];
  finalDisplayValue?: number;
  showMilestoneLabels?: boolean;
  principalLegendLabel?: string;
  totalLegendLabel?: string;
  chartOpacity?: number;
  progressMode?: "auto" | "focusTimeline";
  bgVariant?: BackgroundVariant;
}

const uniqSorted = (values: number[]) =>
  [...new Set(values)].sort((a, b) => a - b);

export const CompoundDemo: React.FC<CompoundDemoProps> = ({
  monthlyAmount,
  years,
  annualRate = 0.05,
  title,
  unit = "万円",
  milestones,
  xAxisTicks,
  milestoneDetails,
  focusTimeline,
  finalDisplayValue,
  showMilestoneLabels = true,
  principalLegendLabel = "積立元本",
  totalLegendLabel = "試算評価額",
  chartOpacity = 1,
  progressMode = "auto",
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { width } = t.resolution;
  const currentSec = frame / fps;

  const principalSeries: number[] = [];
  const totalSeries: number[] = [];
  let principal = 0;
  let total = 0;
  const monthlyRate = annualRate / 12;

  for (let year = 0; year <= years; year++) {
    principalSeries.push(principal);
    totalSeries.push(total);
    if (year < years) {
      for (let month = 0; month < 12; month++) {
        principal += monthlyAmount;
        total = (total + monthlyAmount) * (1 + monthlyRate);
      }
    }
  }

  const toDisplay = (value: number) => Math.round(value / 10000);
  const finalActualDisplayValue = toDisplay(totalSeries[years]);
  const displayedFinalValue = finalDisplayValue ?? finalActualDisplayValue;
  const chartMaxValue = Math.max(...totalSeries);
  const displayMaxValue = displayedFinalValue;

  const milestoneYears = uniqSorted([...(milestones ?? []), years]);
  const tickYears = uniqSorted([0, ...(xAxisTicks ?? []), years]);
  const detailMap = new Map((milestoneDetails ?? []).map((detail) => [detail.year, detail]));
  const activeFocus = (() => {
    if (!focusTimeline?.length) return null;
    const current = focusTimeline.find((item) => currentSec >= item.startSec && currentSec < item.endSec);
    if (current) return current;
    const last = focusTimeline[focusTimeline.length - 1];
    if (progressMode === "focusTimeline" && currentSec >= last.endSec) return last;
    return null;
  })();
  const focusedYear = activeFocus?.year ?? null;
  const activeFocusIndex =
    activeFocus && focusTimeline ? focusTimeline.findIndex((item) => item === activeFocus) : -1;
  const localFocusFrame = activeFocus ? Math.max(0, Math.round((currentSec - activeFocus.startSec) * fps)) : frame;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chartWidth = width * 0.84;
  const chartHeight = 600;
  const padding = 60;
  const innerW = chartWidth - padding * 2;
  const innerH = chartHeight - padding * 2;

  const drawStart = 16;
  const drawDuration = Math.min(120, Math.round(durationInFrames * 0.32));
  const drawProgress = interpolate(frame, [drawStart, drawStart + drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const timelineProgress = (() => {
    if (progressMode !== "focusTimeline" || !activeFocus || activeFocusIndex < 0 || !focusTimeline) {
      return drawProgress;
    }
    const previousYear = activeFocusIndex > 0 ? focusTimeline[activeFocusIndex - 1].year : 0;
    const drawSec = Math.min(1.15, Math.max(0.45, activeFocus.endSec - activeFocus.startSec));
    return interpolate(currentSec - activeFocus.startSec, [0, drawSec], [previousYear / years, activeFocus.year / years], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  })();

  const valueAtYear = (series: number[], yearPosition: number) => {
    const clamped = Math.max(0, Math.min(years, yearPosition));
    const lower = Math.floor(clamped);
    const upper = Math.min(years, Math.ceil(clamped));
    if (lower === upper) return series[lower];
    const ratio = clamped - lower;
    return series[lower] + (series[upper] - series[lower]) * ratio;
  };

  const buildPath = (series: number[]) => {
    const visibleUntil = Math.max(0.05, Math.min(years, years * timelineProgress));
    const points: string[] = [];
    const sampleStep = 0.25;
    for (let yearPoint = 0; yearPoint <= visibleUntil; yearPoint += sampleStep) {
      const x = padding + (yearPoint / years) * innerW;
      const y = padding + innerH - (valueAtYear(series, yearPoint) / chartMaxValue) * innerH;
      points.push(`${points.length === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const lastWholeStep = Math.floor(visibleUntil / sampleStep) * sampleStep;
    if (visibleUntil - lastWholeStep > 0.001) {
      const x = padding + (visibleUntil / years) * innerW;
      const y = padding + innerH - (valueAtYear(series, visibleUntil) / chartMaxValue) * innerH;
      points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  const principalPath = buildPath(principalSeries);
  const totalPath = buildPath(totalSeries);

  const getYearPoint = (year: number) => {
    const x = padding + (year / years) * innerW;
    const y = padding + innerH - (totalSeries[year] / chartMaxValue) * innerH;
    return { x, y };
  };

  const resolveLabel = (year: number) => {
    if (activeFocus?.year === year && activeFocus.label) return formatJapaneseNumericText(activeFocus.label);
    const detail = detailMap.get(year);
    if (detail?.label) return formatJapaneseNumericText(detail.label);
    if (detail?.displayValue !== undefined) return formatNumberWithUnitJa(detail.displayValue, unit, { approx: true });
    return null;
  };

  const panelData = (() => {
    if (activeFocus) {
      const detail = detailMap.get(activeFocus.year);
      return {
        title: activeFocus.panelTitle ?? `${activeFocus.year}年時点`,
        value:
          activeFocus.panelValue ??
          (detail?.displayValue !== undefined
            ? formatNumberWithUnitJa(detail.displayValue, unit, { approx: true })
            : formatNumberWithUnitJa(toDisplay(totalSeries[activeFocus.year]), unit, { approx: true })),
        subtext: activeFocus.panelSubtext ? formatJapaneseNumericText(activeFocus.panelSubtext) : "",
        lines: activeFocus.panelLines?.map((line) => formatJapaneseNumericText(line)) ?? [],
        equation: activeFocus.equation
          ? {
              principalLabel: formatJapaneseNumericText(activeFocus.equation.principalLabel ?? "元本"),
              principalValue: formatJapaneseNumericText(activeFocus.equation.principalValue),
              growthLabel: formatJapaneseNumericText(activeFocus.equation.growthLabel ?? "増えた分"),
              growthValue: formatJapaneseNumericText(activeFocus.equation.growthValue),
              resultLabel: formatJapaneseNumericText(activeFocus.equation.resultLabel ?? "合計（次の元本）"),
              resultValue: formatJapaneseNumericText(activeFocus.equation.resultValue),
            }
          : null,
        accent: t.colors.highlight,
      };
    }

    return {
      title: `${years}年後`,
      value: formatNumberWithUnitJa(displayedFinalValue, unit, { approx: true }),
      subtext: "",
      lines: [],
      equation: null,
      accent: t.colors.positive,
    };
  })();

  const panelOpacity =
    progressMode === "focusTimeline" && activeFocus
      ? interpolate(localFocusFrame, [8, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [drawStart + drawDuration - 10, drawStart + drawDuration + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const panelScaleBase =
    progressMode === "focusTimeline" && activeFocus
      ? interpolate(localFocusFrame, [8, 22], [0.985, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(frame, [drawStart + drawDuration - 8, drawStart + drawDuration + 10], [0.985, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
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
          月{formatNumberWithUnitJa((monthlyAmount / 10000).toFixed(0), "万円")} × {years}年 (年率{formatNumberJa((annualRate * 100).toFixed(0))}%想定)
        </div>

        <svg width={chartWidth} height={chartHeight} style={{ marginTop: t.spacing.sm, opacity: chartOpacity }}>
          {[0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
            const y = padding + innerH - innerH * ratio;
            return (
              <g key={index}>
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
                  {formatNumberJa(Math.round(displayMaxValue * ratio))}
                </text>
              </g>
            );
          })}

          {tickYears.map((year) => {
            const x = padding + (year / years) * innerW;
            return (
              <g key={year}>
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
                  {year}年
                </text>
              </g>
            );
          })}

          <path
            d={principalPath}
            fill="none"
            stroke={t.colors.accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="8 6"
            opacity={0.7}
          />

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

          <g transform={`translate(${padding + 10}, ${padding + 10})`}>
            <line x1={0} y1={6} x2={28} y2={6} stroke={t.colors.accent} strokeWidth={4} strokeDasharray="6 4" opacity={0.7} />
            <text x={36} y={12} fontSize={20} fill={t.colors.textSecondary} fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}>
              {principalLegendLabel}
            </text>
            <line x1={150} y1={6} x2={178} y2={6} stroke={t.colors.positive} strokeWidth={6} strokeLinecap="round" />
            <text x={186} y={12} fontSize={20} fontWeight={700} fill={t.colors.positive} fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}>
              {totalLegendLabel}
            </text>
          </g>

          {focusedYear !== null && (() => {
            const focusPoint = getYearPoint(focusedYear);
            const guideOpacity = interpolate(frame, [0, 6], [0.25, 0.6], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <g>
                <line
                  x1={focusPoint.x}
                  y1={padding + innerH}
                  x2={focusPoint.x}
                  y2={focusPoint.y}
                  stroke={t.colors.highlight}
                  strokeWidth={3}
                  strokeDasharray="8 8"
                  opacity={guideOpacity}
                />
              </g>
            );
          })()}

          {milestoneYears.map((year) => {
            const xRatio = year / years;
            if (xRatio > timelineProgress + 0.001) return null;

            const point = getYearPoint(year);
            const isFocused = focusedYear === year;
            const pulse = isFocused
              ? Math.sin(Math.max(0, frame - Math.round((activeFocus?.startSec ?? 0) * fps)) * 0.14) * 0.12 + 1
              : 1;
            const pointRadius = isFocused ? 12 * pulse : 10;
            const label = resolveLabel(year);

            return (
              <g key={year}>
                {isFocused && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={24 * pulse}
                    fill={t.colors.highlight}
                    opacity={0.18}
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={pointRadius}
                  fill={t.colors.highlight}
                  stroke="#fff"
                  strokeWidth={3}
                />
                {label && isFocused && showMilestoneLabels && (
                  <g>
                    <rect
                      x={point.x - 110}
                      y={point.y - 66}
                      width={220}
                      height={42}
                      rx={16}
                      fill="rgba(8,15,52,0.82)"
                      stroke={t.colors.highlight}
                      strokeWidth={2}
                    />
                    <text
                      x={point.x}
                      y={point.y - 37}
                      fontSize={26}
                      fontWeight={900}
                      fill={t.colors.highlight}
                      textAnchor="middle"
                      fontFamily={`"${t.fonts.main}", ${t.fonts.fallback}`}
                      style={{
                        filter: `drop-shadow(0 0 8px ${t.colors.highlight})`,
                      }}
                    >
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div
          style={{
            opacity: panelOpacity,
            transform: `scale(${panelScaleBase})`,
            width: Math.min(width * 0.86, 900),
            padding: `${t.spacing.md}px ${t.spacing.md}px`,
            backgroundColor: `${panelData.accent}1f`,
            border: `3px solid ${panelData.accent}`,
            borderRadius: t.borderRadius.md,
            boxShadow: `0 0 22px ${panelData.accent}45`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: Math.round(width * 0.042),
              color: t.colors.textSecondary,
            }}
          >
            {panelData.title}
          </div>
          {panelData.equation ? (
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                gap: 12,
              }}
            >
              {[
                {
                  label: panelData.equation.principalLabel,
                  value: panelData.equation.principalValue,
                  color: t.colors.accent,
                },
                {
                  label: panelData.equation.growthLabel,
                  value: panelData.equation.growthValue,
                  color: t.colors.positive,
                },
                {
                  label: panelData.equation.resultLabel,
                  value: panelData.equation.resultValue,
                  color: panelData.accent,
                },
              ].map((term, index) => {
                const isResult = index === 2;
                const revealDelay = progressMode === "focusTimeline" ? [16, 48, 86][index] : 0;
                const termOpacity =
                  progressMode === "focusTimeline" && activeFocus
                    ? interpolate(localFocusFrame, [revealDelay, revealDelay + 14], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 1;
                const termSlide =
                  progressMode === "focusTimeline" && activeFocus
                    ? interpolate(localFocusFrame, [revealDelay, revealDelay + 14], [12, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.out(Easing.cubic),
                      })
                    : 0;
                const labelOpacity =
                  progressMode === "focusTimeline" && activeFocus
                    ? interpolate(localFocusFrame, [revealDelay + 6, revealDelay + 16], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 1;
                const valueOpacity =
                  progressMode === "focusTimeline" && activeFocus
                    ? interpolate(localFocusFrame, [revealDelay + 16, revealDelay + 28], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })
                    : 1;
                const resultGlow = isResult
                  ? interpolate(localFocusFrame, [revealDelay + 12, revealDelay + 28], [0.18, 0.55], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })
                  : 0;
                const resultScale =
                  isResult && progressMode === "focusTimeline" && activeFocus
                    ? interpolate(localFocusFrame, [revealDelay + 10, revealDelay + 24], [0.985, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.out(Easing.cubic),
                      })
                    : 1;

                return (
                  <React.Fragment key={`${panelData.title}-${term.label}`}>
                    {index === 1 ? (
                      <div
                        style={{
                          alignSelf: "center",
                          opacity: termOpacity,
                          transform: `translateY(${termSlide}px)`,
                          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                          fontWeight: t.fontWeights.black,
                          fontSize: 42,
                          color: t.colors.highlight,
                        }}
                      >
                        +
                      </div>
                    ) : null}
                    {index === 2 ? (
                      <div
                        style={{
                          alignSelf: "center",
                          opacity: termOpacity,
                          transform: `translateY(${termSlide}px)`,
                          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                          fontWeight: t.fontWeights.black,
                          fontSize: 42,
                          color: t.colors.textPrimary,
                        }}
                      >
                        ⇒
                      </div>
                    ) : null}
                    <div
                      style={{
                        flex: isResult ? 1.1 : 1,
                        minHeight: 118,
                        opacity: termOpacity,
                        transform: `translateY(${termSlide}px) scale(${resultScale})`,
                        borderRadius: 22,
                        border: `${isResult ? 4 : 3}px solid ${term.color}${isResult ? "B8" : "85"}`,
                        backgroundColor: `${term.color}${isResult ? "1D" : "18"}`,
                        boxShadow: isResult ? `0 0 ${18 + resultGlow * 18}px ${term.color}58` : "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "14px 10px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                          fontWeight: t.fontWeights.bold,
                          fontSize: isResult ? 24 : 22,
                          opacity: labelOpacity,
                          color: isResult ? t.colors.textPrimary : t.colors.textSecondary,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {term.label}
                      </div>
                      <div
                        style={{
                          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                          fontWeight: t.fontWeights.black,
                          fontSize: isResult ? 42 : 34,
                          opacity: valueOpacity,
                          color: term.color,
                          textAlign: "center",
                          whiteSpace: "nowrap",
                          textShadow: `0 0 ${isResult ? 14 : 12}px ${term.color}${isResult ? "70" : "60"}`,
                        }}
                      >
                        {term.value}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : panelData.lines.length > 0 ? (
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {panelData.lines.map((line, index) => (
                <div
                  key={`${panelData.title}-${index}`}
                  style={{
                    opacity:
                      progressMode === "focusTimeline" && activeFocus
                        ? interpolate(localFocusFrame, [8 + index * 12, 18 + index * 12], [0, 1], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                          })
                        : 1,
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: index === 1 ? t.fontWeights.black : t.fontWeights.bold,
                    fontSize: index === 1 ? Math.round(width * 0.052) : Math.round(width * 0.04),
                    color: index === 1 ? panelData.accent : t.colors.textPrimary,
                    textShadow: index === 1 ? `0 0 20px ${panelData.accent}70` : "none",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.black,
                fontSize: Math.round(width * 0.065),
                color: panelData.accent,
                textShadow: `0 0 24px ${panelData.accent}`,
                whiteSpace: "nowrap",
              }}
            >
              {panelData.value}
            </div>
          )}
          {panelData.subtext ? (
            <div
              style={{
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.bold,
                fontSize: Math.round(width * 0.032),
                color: t.colors.textPrimary,
                textAlign: "center",
              }}
            >
              {panelData.subtext}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
