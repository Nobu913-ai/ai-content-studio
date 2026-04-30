import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { genzMoneyTheme as t } from "../theme/genzMoneyTheme";
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";

export interface CaptionSegment {
  text: string;
  startSec: number;
  endSec?: number;
  highlight?: string[];
}

export interface SubtitleLayerProps {
  caption?: string;
  captionSegments?: CaptionSegment[];
  /** Total shot duration in seconds; needed to default endSec on the last segment. */
  shotDurationSec?: number;
}

const renderHighlightedText = (
  text: string,
  highlights: string[] | undefined,
): React.ReactNode => {
  if (!highlights || highlights.length === 0) return text;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    let earliest = remaining.length;
    let matched = "";
    for (const w of highlights) {
      const idx = remaining.indexOf(w);
      if (idx !== -1 && idx < earliest) {
        earliest = idx;
        matched = w;
      }
    }
    if (matched && earliest < remaining.length) {
      if (earliest > 0) parts.push(<span key={key++}>{remaining.slice(0, earliest)}</span>);
      parts.push(
        <span
          key={key++}
          style={{
            color: t.colors.highlight,
            textShadow: `0 0 16px ${t.colors.highlight}80`,
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
};

export const SubtitleLayer: React.FC<SubtitleLayerProps> = ({
  caption,
  captionSegments,
  shotDurationSec,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  // captionSegments takes precedence over caption
  const useSegments = captionSegments && captionSegments.length > 0;

  if (!useSegments && !caption) return null;

  const currentSec = frame / fps;

  // Find active segment in captionSegments
  let activeText: string | null = null;
  let activeHighlight: string[] | undefined;
  let segmentLocalFrame = frame;
  let isStatic = !useSegments;
  if (useSegments) {
    for (let i = 0; i < captionSegments!.length; i++) {
      const seg = captionSegments![i];
      const next = captionSegments![i + 1];
      const segEnd = seg.endSec ?? next?.startSec ?? shotDurationSec ?? Infinity;
      if (currentSec >= seg.startSec && currentSec < segEnd) {
        activeText = seg.text;
        activeHighlight = seg.highlight;
        segmentLocalFrame = Math.round((currentSec - seg.startSec) * fps);
        break;
      }
    }
    if (!activeText) return null;
  } else {
    activeText = caption!;
  }

  // Animate based on either shot frame (static caption) or segment-local frame (live caption)
  const animFrame = isStatic ? frame : segmentLocalFrame;
  const opacity = interpolate(animFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slideY = interpolate(animFrame, [0, 10], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const captionMaxWidth = width * 0.86;
  const baseFontSize = Math.round(width * 0.044);
  // 1パス目: 入力テキストのまま font計算 → smartLineBreakの判定に使う
  const initialFontSize = autoFontSizeJa(activeText, baseFontSize, captionMaxWidth);
  const wrappedText = smartLineBreak(activeText, initialFontSize, captionMaxWidth);
  // 2パス目: 改行後の最長行をベースに再計算 (改行で短くなれば font を大きくできる)
  const fontSize = autoFontSizeJa(wrappedText, baseFontSize, captionMaxWidth);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        // 縦動画 Shorts 下端は YouTube/TikTok/Reels が UI (進捗バー/コメント/フォロー等) を被せるため
        // 110px だと TikTok/Reels で隠れるリスクあり。240px で各プラットフォームの safe zone 内に収める。
        paddingBottom: 240,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${slideY}px)`,
          padding: `${t.spacing.sm}px ${t.spacing.lg}px`,
          backgroundColor: "rgba(0,0,0,0.62)",
          backdropFilter: "blur(8px)",
          borderRadius: t.borderRadius.md,
          border: "1px solid rgba(255,255,255,0.10)",
          maxWidth: width * 0.92,
        }}
      >
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize,
            color: t.colors.textPrimary,
            textAlign: "center",
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
          }}
        >
          {renderHighlightedText(wrappedText, activeHighlight)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
