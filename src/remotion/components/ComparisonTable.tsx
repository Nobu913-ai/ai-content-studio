import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { AnimatedBackground, BackgroundVariant } from "./AnimatedBackground";
import { autoFontSize, autoFontSizeJa } from "../utils/responsive-text";

interface ColumnDef {
  key: string;
  label: string;
  emphasis?: boolean;
}

interface RowDef {
  label: string;
  values: Record<string, string | number>;
  highlight?: boolean;
}

export interface ComparisonTableProps {
  title: string;
  caption?: string;
  columns: ColumnDef[];
  rows: RowDef[];
  highlightLabel?: string;
  bgVariant?: BackgroundVariant;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  title,
  caption,
  columns,
  rows,
  highlightLabel,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [0, 10], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const headerDelay = 8;
  const headerOpacity = interpolate(frame, [headerDelay, headerDelay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tableWidth = width * 0.92;
  const labelColWidth = tableWidth * 0.44;
  const valueColWidth = (tableWidth - labelColWidth) / Math.max(1, columns.length);

  const titleSize = autoFontSize(title, Math.round(width * 0.055), width * 0.9);
  const captionSize = caption ? autoFontSize(caption, Math.round(width * 0.038), width * 0.85) : 0;

  // セル内のテキストが折り返さないよう、各列・行の最長文字列に基づいて fontSize を auto-shrink。
  // セル内 content 幅 = valueColWidth - padding(xs) * 2 - 安全マージン。
  const valueCellContentWidth = valueColWidth - t.spacing.xs * 2 - 4;
  const labelCellContentWidth = labelColWidth - t.spacing.md * 2 - 4;
  const baseHeaderSize = Math.round(width * 0.034);
  const baseLabelSize = Math.round(width * 0.034);
  const baseValueSize = Math.round(width * 0.04);

  const allValueTexts = rows.flatMap((r) =>
    columns.map((c) => (r.values[c.key] !== undefined && r.values[c.key] !== null ? String(r.values[c.key]) : "—")),
  );
  const allHeaderLabels = columns.map((c) => c.label);
  const allRowLabels = rows.map((r) => r.label);

  const headerSize = allHeaderLabels.length > 0
    ? Math.min(...allHeaderLabels.map((s) => autoFontSizeJa(s, baseHeaderSize, valueCellContentWidth)))
    : baseHeaderSize;
  const labelSize = allRowLabels.length > 0
    ? Math.min(...allRowLabels.map((s) => autoFontSizeJa(s, baseLabelSize, labelCellContentWidth)))
    : baseLabelSize;
  const valueSize = allValueTexts.length > 0
    ? Math.min(...allValueTexts.map((s) => autoFontSizeJa(s, baseValueSize, valueCellContentWidth)))
    : baseValueSize;

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
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: titleSize,
            color: t.colors.textPrimary,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {caption && (
          <div
            style={{
              opacity: titleOpacity,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.bold,
              fontSize: captionSize,
              color: t.colors.textSecondary,
              textAlign: "center",
            }}
          >
            {caption}
          </div>
        )}

        <div
          style={{
            width: tableWidth,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: t.borderRadius.md,
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            marginTop: t.spacing.sm,
          }}
        >
          {/* Header row */}
          <div
            style={{
              opacity: headerOpacity,
              display: "flex",
              backgroundColor: `${t.colors.bgPrimary}`,
              borderBottom: `2px solid ${t.colors.accent}40`,
            }}
          >
            <div
              style={{
                width: labelColWidth,
                padding: `${t.spacing.sm}px ${t.spacing.md}px`,
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.bold,
                fontSize: headerSize,
                color: t.colors.textSecondary,
              }}
            >
              {/* spacer cell */}
            </div>
            {columns.map((col) => (
              <div
                key={col.key}
                style={{
                  width: valueColWidth,
                  padding: `${t.spacing.sm}px ${t.spacing.xs}px`,
                  fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                  fontWeight: col.emphasis ? t.fontWeights.black : t.fontWeights.bold,
                  fontSize: headerSize,
                  color: col.emphasis ? t.colors.positive : t.colors.textPrimary,
                  textAlign: "center",
                  textShadow: col.emphasis ? `0 0 12px ${t.colors.positive}80` : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row, i) => {
            const rowDelay = 14 + i * 6;
            const rowOpacity = interpolate(frame, [rowDelay, rowDelay + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const rowSlide = interpolate(frame, [rowDelay, rowDelay + 12], [20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const isHighlight = row.highlight;
            const rowBg = isHighlight ? `${t.colors.positive}15` : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)";

            return (
              <div
                key={i}
                style={{
                  opacity: rowOpacity,
                  transform: `translateY(${rowSlide}px)`,
                  display: "flex",
                  backgroundColor: rowBg,
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  borderLeft: isHighlight ? `4px solid ${t.colors.positive}` : "none",
                }}
              >
                <div
                  style={{
                    width: labelColWidth,
                    padding: `${t.spacing.sm}px ${t.spacing.md}px`,
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: t.fontWeights.bold,
                    fontSize: labelSize,
                    color: isHighlight ? t.colors.positive : t.colors.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isHighlight && <span style={{ fontSize: labelSize }}>◎</span>}
                  {row.label}
                </div>
                {columns.map((col) => {
                  const v = row.values[col.key];
                  return (
                    <div
                      key={col.key}
                      style={{
                        width: valueColWidth,
                        padding: `${t.spacing.sm}px ${t.spacing.xs}px`,
                        fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                        fontWeight: col.emphasis ? t.fontWeights.black : t.fontWeights.bold,
                        fontSize: valueSize,
                        color: col.emphasis
                          ? isHighlight
                            ? t.colors.positive
                            : t.colors.textPrimary
                          : t.colors.textPrimary,
                        textAlign: "center",
                        textShadow: col.emphasis && isHighlight ? `0 0 16px ${t.colors.positive}80` : "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v !== undefined && v !== null ? String(v) : "—"}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {highlightLabel && (
          <div
            style={{
              opacity: interpolate(frame, [14 + rows.length * 6 + 4, 14 + rows.length * 6 + 16], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.05),
              color: t.colors.highlight,
              textShadow: `0 0 24px ${t.colors.highlight}80`,
              textAlign: "center",
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
