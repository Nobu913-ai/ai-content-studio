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
import { autoFontSizeJa } from "../utils/responsive-text";

/**
 * TaxFlowDemo
 *
 * 5段階の "お金の流れ" を時系列で見せるシーン。
 *
 * 比較表ではなく **手元に残る金額がどう変わるか** を視覚化することで、
 * 初心者にも理解の負荷が軽い1カット1メッセージ構成になる。
 *
 * 想定タイムライン (durationSec = 7.7s 基準, fps=30):
 *   stage1: 0.0–1.0s  principalLabel + principalValue を中央表示
 *   stage2: 1.0–3.0s  税金 -tax がカードに付き、剥がれて飛び出す
 *   stage3: 3.0–4.7s  中央で 100万円 → 80万円 の数字モーフ + ラベル「利益→手元」切替
 *                     ＋ 80着地時に punch スケール
 *   stage4: 4.7–5.8s  普通口座カード(左) + NISAカード(右) が同時にスライドイン
 *   stage5: 5.8–end   差額メッセージ (diffMessage) を中央バッジで強調
 *
 * 視線誘導の重要点:
 *   - stage3 の "100→80" 数字モーフが「税金で減る」因果を視覚化する核
 *   - captionSegments も同期させること (3.0sで「手元80万円」, 4.7sで「NISAなら」)
 */

export interface TaxFlowDemoProps {
  /** 元になる利益・元本など (例: 100) */
  principal: number;
  /** 引かれる税金額 (例: 20) */
  tax: number;
  unit?: string;
  /** stage1 で見せるラベル (例: "利益100万円")。未指定時は principalPrefix+principal+unit から合成 */
  principalLabel?: string;
  /** principalLabel 未指定時の prefix (例: "利益") */
  principalPrefix?: string;
  /** stage3 のモーフ後ラベル prefix (例: "手元")。最終表示は `{prefix}{takeHome}{unit}` */
  takeHomePrefix?: string;
  /** 普通口座側のラベル */
  regularLabel?: string;
  /** 普通口座側の手元 (省略時 principal-tax) */
  regularTakeHome?: number;
  /** 普通口座カード内の手元サブラベル */
  regularTakeHomeLabel?: string;
  /** NISA側ラベル */
  nisaLabel?: string;
  nisaTakeHomeLabel?: string;
  /** 差額バッジ前文言 (例: "差額") */
  diffPrefix?: string;
  /** 差額の "約" を入れたいときのプレフィックス */
  diffApprox?: string;
  /** 最終バッジ文言。指定時はprefix+approx+diff+unitフォーマットを上書き。複数行可 (\n)。 */
  diffMessage?: string;
  /** 普通の口座カードのスタイル: 主役の NISA カードより小さく/暗く見せる */
  regularCardStyle?: { scale?: number; opacity?: number };
  /** NISA カードのスタイル: 主役として大きく明るく見せる + ✓ チェックアイコン */
  nisaCardStyle?: { scale?: number; checkIcon?: boolean };
  /** 普通の口座カード sub label (例: "税引後") */
  regularSubLabel?: string;
  /** NISA カード横のフローティングバッジ。デフォルトは非表示 (下部の diffMessage と重複するため)。
   *  特殊な強調が必要な場合のみ shot plan で文字列指定する (例: "+20万円\n多く残る")。 */
  nisaFloatingBadge?: string;
  bgVariant?: BackgroundVariant;
}

export const TaxFlowDemo: React.FC<TaxFlowDemoProps> = ({
  principal,
  tax,
  unit = "万円",
  principalLabel,
  principalPrefix = "利益",
  takeHomePrefix = "手元",
  regularLabel = "普通の口座",
  regularTakeHome,
  regularTakeHomeLabel = "手元",
  nisaLabel = "新NISA",
  nisaTakeHomeLabel = "手元",
  diffPrefix = "差額",
  diffApprox = "約",
  diffMessage,
  regularCardStyle,
  nisaCardStyle,
  regularSubLabel = "税引後",
  nisaFloatingBadge,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width } = t.resolution;

  const takeHome = regularTakeHome ?? principal - tax;
  const diff = principal - takeHome;

  const stage = (sec: number) => Math.round(sec * fps);
  const s1 = stage(0);
  const s2 = stage(1.0);
  const flyStart = stage(2.4);
  const flyEnd = stage(3.0);
  const sMorph = stage(3.0);
  const sMorphHold = stage(3.8);
  const s4 = stage(4.7);
  const sFloating = stage(5.5);
  const s5 = stage(5.8);

  // Card style defaults (NISA は主役、普通の口座は脇役)
  const regularScale = regularCardStyle?.scale ?? 0.94;
  const regularCardOpacity = regularCardStyle?.opacity ?? 0.85;
  const nisaScale = nisaCardStyle?.scale ?? 1.10;
  const nisaShowCheck = nisaCardStyle?.checkIcon ?? true;
  // フローティングバッジは下部 diffMessage と内容が重複するため、デフォルト無効。
  // 必要な場合のみ shot plan で nisaFloatingBadge に文字列を指定する。
  const floatingBadgeText = nisaFloatingBadge ?? "";
  const showFloatingBadge = floatingBadgeText.length > 0;

  // Stage1: principal entrance
  const principalScale = spring({
    frame: Math.max(0, frame - s1),
    fps,
    config: { damping: 9, mass: 0.7, stiffness: 200 },
  });

  // Stage1-2: pre-morph label visible (利益100万円)
  const preMorphOpacity = interpolate(
    frame,
    [s1, s1 + 8, sMorph - 4, sMorph + 4],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Stage3: post-morph label fades in (手元{N}万円), holds, fades out at s4
  const postMorphOpacity = interpolate(
    frame,
    [sMorph - 4, sMorph + 6, s4 - 6, s4 + 6],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Stage3: number countdown principal → takeHome
  const morphProgress = interpolate(
    frame,
    [sMorph + 6, sMorphHold],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );
  const animatedNumber = Math.round(principal - (principal - takeHome) * morphProgress);

  // Punch scale when number lands at "80"
  const punchScale = interpolate(
    frame,
    [sMorphHold - 2, sMorphHold + 4, sMorphHold + 16],
    [1.0, 1.18, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );

  // Stage2: tax label appearance + flyout
  const taxAppearOpacity = interpolate(frame, [s2, s2 + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taxScale = spring({
    frame: Math.max(0, frame - s2),
    fps,
    config: { damping: 9, mass: 0.6, stiffness: 220 },
  });
  const taxFlyX = interpolate(frame, [flyStart, flyEnd], [0, 240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const taxFlyY = interpolate(frame, [flyStart, flyEnd], [0, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const taxFlyRotate = interpolate(frame, [flyStart, flyEnd], [0, 28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taxFlyOpacity = interpolate(frame, [flyStart, flyEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Brief flash on principal area when tax exits (3.0s) — signals "減った"
  const flashOpacity = interpolate(
    frame,
    [flyEnd - 3, flyEnd + 2, flyEnd + 14],
    [0, 0.35, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Stage4: cards
  const leftCardOpacity = interpolate(frame, [s4, s4 + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 左カードは「下から入る → 上に overshoot → ドスンと沈む → settle」で「あ、減っちゃった」感を演出。
  // 落差 42px (-24 → +18) で視覚的にも十分認識でき、かつコメディ感は出さない範囲に抑える。
  const leftCardSlide = interpolate(
    frame,
    [s4, s4 + 10, s4 + 18, s4 + 28],
    [40, -24, 18, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );
  // 着地時の軽い squash scale パルス (1.0 → 0.96 → 1.0) で重みを補強
  const leftCardScalePulse = interpolate(
    frame,
    [s4 + 10, s4 + 18, s4 + 28],
    [1.0, 0.96, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 「手元80万円」出現直後の brief loss tint (税引後感を視覚で補強)。
  // value text 自体に hue-rotate filter で muted orange-red 寄りにシフトする。
  // window: s4+10 (5.0s) → s4+16 (5.2s) でピーク → s4+26 (5.6s) でフェードアウト。
  const regularLossTintIntensity = interpolate(
    frame,
    [s4 + 10, s4 + 16, s4 + 26],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rightCardOpacity = interpolate(frame, [s4 + 6, s4 + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightCardSlide = interpolate(frame, [s4 + 6, s4 + 24], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rightGlowPulse = Math.sin(Math.max(0, frame - s4) * 0.1) * 0.15 + 0.85;

  // Floating badge (+20万円 多く残る) — 5.5s に NISA カード横に出現
  const floatingScale = spring({
    frame: Math.max(0, frame - sFloating),
    fps,
    config: { damping: 7, mass: 0.5, stiffness: 240 },
  });
  const floatingOpacity = interpolate(frame, [sFloating, sFloating + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floatingPulse = Math.sin(Math.max(0, frame - sFloating - 8) * 0.08) * 0.06 + 0.94;

  // Stage5: diff badge
  const diffOpacity = interpolate(frame, [s5, s5 + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const diffScale = spring({
    frame: Math.max(0, frame - s5),
    fps,
    config: { damping: 8, mass: 0.6, stiffness: 220 },
  });
  const diffPulse = Math.sin(Math.max(0, frame - s5 - 8) * 0.12) * 0.06 + 0.94;

  // Center label sizing
  const preMorphText = principalLabel ?? `${principalPrefix}${principal}${unit}`;
  const morphedTextSample = `${takeHomePrefix}${principal}${unit}`; // size based on max (100万円) so layout doesn't jump
  const principalSize = autoFontSizeJa(preMorphText, Math.round(width * 0.16), width * 0.85);
  const morphedSize = autoFontSizeJa(morphedTextSample, Math.round(width * 0.16), width * 0.85);
  const centerLineHeight = Math.max(principalSize, morphedSize);

  return (
    <AnimatedBackground accent={t.colors.positive} variant={bgVariant}>
      <AbsoluteFill
        style={{
          padding: t.spacing.xl,
          paddingBottom: t.spacing.xl + 240,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Center column: principal display (cross-fade morph) + tax label */}
        <div
          style={{
            position: "absolute",
            top: "32%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: t.spacing.sm,
          }}
        >
          {/* Principal display: stacked overlap of pre-morph and post-morph */}
          <div
            style={{
              position: "relative",
              width: width * 0.85,
              height: centerLineHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Flash overlay when tax exits — negative 色で「税金で減っちゃった」感を視覚化 */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at 50% 50%, ${t.colors.negative}, transparent 70%)`,
                opacity: flashOpacity * 0.55,
                pointerEvents: "none",
              }}
            />

            {/* Pre-morph: principalLabel "利益100万円" */}
            <div
              style={{
                position: "absolute",
                opacity: preMorphOpacity,
                transform: `scale(${principalScale})`,
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.black,
                fontSize: principalSize,
                color: t.colors.highlight,
                textShadow: `0 0 30px ${t.colors.highlight}80`,
                textAlign: "center",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {preMorphText}
            </div>

            {/* Post-morph dynamic: 手元{count}万円 with countdown 100→80 + punch */}
            <div
              style={{
                position: "absolute",
                opacity: postMorphOpacity,
                transform: `scale(${punchScale})`,
                fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                fontWeight: t.fontWeights.black,
                fontSize: morphedSize,
                color: t.colors.highlight,
                textShadow: `0 0 36px ${t.colors.highlight}, 0 0 80px ${t.colors.highlight}60`,
                textAlign: "center",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {takeHomePrefix}
              {animatedNumber}
              {unit}
            </div>
          </div>

          {/* Tax label: appears below, dwells, then flies out right-down */}
          <div
            style={{
              opacity: taxAppearOpacity * taxFlyOpacity,
              transform: `translate(${taxFlyX}px, ${taxFlyY}px) rotate(${taxFlyRotate}deg) scale(${taxScale * (1 - taxFlyY / 800)})`,
              padding: `${t.spacing.sm}px ${t.spacing.lg}px`,
              backgroundColor: `${t.colors.negative}33`,
              border: `3px solid ${t.colors.negative}`,
              borderRadius: t.borderRadius.md,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.09),
              color: t.colors.negative,
              textShadow: `0 0 24px ${t.colors.negative}, 0 0 60px ${t.colors.negative}80`,
              whiteSpace: "nowrap",
              boxShadow: `0 8px 30px ${t.colors.negative}80`,
            }}
          >
            −{tax}{unit} 税金
          </div>
        </div>

        {/* Stage4: 左右カード (4.7s 以降に同時スライドイン) */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "row",
            gap: t.spacing.md,
            width: width - t.spacing.xl * 2,
            height: 520,
            alignItems: "stretch",
          }}
        >
          {(() => {
            // 両カードで共有する value font size を、長い方の数字 (例: "100万円") に合わせて計算。
            // これにより 80万円 と 100万円 が同じ基準サイズで描画され、autoFontSize の自動縮小で
            // 「emphasize したい 100万円のほうが小さい」という逆転が起きないようにする。
            // 視覚的な強調は valueScale (右=1.10) と色/グロー (positive 緑 + glow) で付ける。
            const valueMaxFont = Math.round(width * 0.11);
            const longerValueText = `${Math.max(principal, takeHome)}${unit}`;
            const sharedValueSize = autoFontSizeJa(longerValueText, valueMaxFont, width * 0.36);
            return (
              <>
                <ResultCard
                  label={regularLabel}
                  takeLabel={regularTakeHomeLabel}
                  value={takeHome}
                  unit={unit}
                  tone="negative"
                  subLabel={regularSubLabel}
                  opacity={leftCardOpacity}
                  translateY={leftCardSlide}
                  glow={0}
                  valueFontSize={sharedValueSize}
                  valueScale={1.0}
                  cardScale={regularScale * leftCardScalePulse}
                  cardOpacity={regularCardOpacity}
                  lossTintIntensity={regularLossTintIntensity}
                />
                <ResultCard
                  label={nisaLabel}
                  takeLabel={nisaTakeHomeLabel}
                  value={principal}
                  unit={unit}
                  tone="positive"
                  taxNote="税金0円"
                  showCheckIcon={nisaShowCheck}
                  opacity={rightCardOpacity}
                  translateY={rightCardSlide}
                  glow={rightGlowPulse}
                  valueFontSize={sharedValueSize}
                  valueScale={1.0}
                  cardScale={nisaScale}
                  cardOpacity={1.0}
                />
              </>
            );
          })()}
        </div>

        {/* Floating "+20万円 多く残る" badge: NISA カード上部の右側に浮かぶ。
            主役の NISA カードと下部 diff バッジを視覚的につなぐ役割。 */}
        {showFloatingBadge && (
          <div
            style={{
              position: "absolute",
              top: "32%",
              right: "6%",
              transform: `rotate(-4deg) scale(${floatingScale * floatingPulse || 0.0001})`,
              opacity: floatingOpacity,
              padding: `${t.spacing.sm}px ${t.spacing.md}px`,
              backgroundColor: `${t.colors.positive}1f`,
              border: `3px solid ${t.colors.positive}`,
              borderRadius: t.borderRadius.md,
              boxShadow: `0 6px 30px ${t.colors.positive}80, inset 0 0 20px ${t.colors.positive}30`,
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: t.fontWeights.black,
              fontSize: Math.round(width * 0.045),
              color: t.colors.positive,
              textShadow: `0 0 16px ${t.colors.positive}`,
              textAlign: "center",
              lineHeight: 1.2,
              whiteSpace: "pre",
            }}
          >
            {floatingBadgeText}
          </div>
        )}

        {/* Stage5: 差額バッジ。diffMessage 指定時は複数行可。 */}
        <div
          style={{
            position: "absolute",
            bottom: 280,
            left: "50%",
            transform: `translateX(-50%) scale(${diffScale * diffPulse || 0.0001})`,
            opacity: diffOpacity,
            padding: `${t.spacing.md}px ${t.spacing.lg}px`,
            backgroundColor: `${t.colors.highlight}26`,
            border: `3px solid ${t.colors.highlight}`,
            borderRadius: t.borderRadius.lg,
            boxShadow: `0 0 50px ${t.colors.highlight}99`,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.black,
            fontSize: autoFontSizeJa(diffMessage ?? `${diffPrefix} ${diffApprox}${diff}${unit}`, Math.round(width * 0.07), width * 0.70),
            color: t.colors.highlight,
            textAlign: "center",
            lineHeight: 1.25,
            whiteSpace: "pre",
            textShadow: `0 0 18px ${t.colors.highlight}`,
          }}
        >
          {diffMessage ?? `${diffPrefix} ${diffApprox}${diff}${unit}`}
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};

/**
 * 比較カード。4スロット (label / taxNote / takeLabel / value) を justifyContent: space-between で
 * 上下に均等配置し、左右カード間で同じ Y 位置に対応するスロットが並ぶようにする。
 * taxNote が無いカードでも空 placeholder を同じ高さで描画 → スロット位置が揃う。
 *
 * value は外部から渡される sharedValueSize で描画 (両カード同一基準サイズ)、
 * valueScale で視覚的な強弱を付ける (例: focus 側=1.10 で emphasize)。
 */
const ResultCard: React.FC<{
  label: string;
  takeLabel: string;
  value: number;
  unit: string;
  tone: "positive" | "negative";
  taxNote?: string;
  subLabel?: string;
  showCheckIcon?: boolean;
  opacity: number;
  translateY: number;
  glow: number;
  valueFontSize: number;
  valueScale?: number;
  /** カード全体のスケール (例: NISA=1.10, 普通=0.94 で主役/脇役の差を出す) */
  cardScale?: number;
  /** カード全体のopacity 倍率 (アニメーション opacity と乗算される) */
  cardOpacity?: number;
  /** 一時的な loss tint (0-1)。普通口座カードに「減っちゃった感」の orange-red overlay を出す */
  lossTintIntensity?: number;
}> = ({
  label,
  takeLabel,
  value,
  unit,
  tone,
  taxNote,
  subLabel,
  showCheckIcon,
  opacity,
  translateY,
  glow,
  valueFontSize,
  valueScale = 1,
  cardScale = 1,
  cardOpacity = 1,
  lossTintIntensity = 0,
}) => {
  const { width } = t.resolution;
  const accent = tone === "positive" ? t.colors.positive : t.colors.negative;
  const valueText = `${value}${unit}`;
  const labelSize = autoFontSizeJa(label, Math.round(width * 0.042), width * 0.32);
  const taxNoteFontSize = Math.round(width * 0.034);
  const takeLabelFontSize = Math.round(width * 0.030);

  // Slot 2 は taxNote (= "税金0円" 等) または subLabel (= "税引後" 等)。
  // どちらも accent 色 (positive=緑 / negative=赤) で表示し、左右カード間で視覚的な重みを揃える。
  // 「税引後」を textSecondary (薄いグレー) で出すと視聴者が認識しにくいため accent 色に統一。
  const slot2Text = taxNote ?? subLabel;
  const slot2Color = slot2Text ? accent : t.colors.textSecondary;

  return (
    <div
      style={{
        flex: 1,
        opacity: opacity * cardOpacity,
        transform: `translateY(${translateY}px) scale(${cardScale})`,
        transformOrigin: "center center",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: t.borderRadius.lg,
        border: `${tone === "positive" ? 3 : 2}px solid ${accent}${tone === "positive" ? "" : "50"}`,
        boxShadow: `0 6px 30px ${accent}${tone === "positive" ? "60" : "30"}, inset 0 0 40px ${accent}${tone === "positive" ? "20" : "10"}`,
        padding: `${t.spacing.lg}px ${t.spacing.md}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      {tone === "positive" && glow > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: t.borderRadius.lg,
            boxShadow: `0 0 ${50 * glow}px ${accent}90, 0 0 ${100 * glow}px ${accent}60`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Loss tint overlay (普通口座カード出現直後の「減っちゃった感」演出。muted orange-red) */}
      {lossTintIntensity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: t.borderRadius.lg,
            background: `radial-gradient(circle at 50% 75%, rgba(255,112,67,0.6), transparent 65%)`,
            opacity: lossTintIntensity * 0.32,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Slot 1: Label (普通の口座 / 新NISA + ✓ アイコン) */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 6,
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.bold,
          fontSize: labelSize,
          color: t.colors.textSecondary,
          whiteSpace: "nowrap",
        }}
      >
        <span>{label}</span>
        {showCheckIcon && (
          <span
            style={{
              color: t.colors.positive,
              fontSize: Math.round(labelSize * 0.95),
              textShadow: `0 0 12px ${t.colors.positive}`,
            }}
          >
            ✓
          </span>
        )}
      </div>

      {/* Slot 2: TaxNote (placeholder if absent so layout stays parallel) */}
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.bold,
          fontSize: taxNoteFontSize,
          color: slot2Color,
          textAlign: "center",
          minHeight: Math.round(taxNoteFontSize * 1.4),
          opacity: slot2Text ? 1 : 0,
        }}
      >
        {slot2Text ?? " "}
      </div>

      {/* Slot 3: TakeLabel (手元) */}
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.regular,
          fontSize: takeLabelFontSize,
          color: t.colors.textSecondary,
          textAlign: "center",
        }}
      >
        {takeLabel}
      </div>

      {/* Slot 4: Value (80万円 / 100万円) — 両カード同一フォントサイズ + valueScale で強弱
          tone="negative" 時は lossTintIntensity に応じて hue-rotate + brightness filter を適用し
          「税引後の減った感」を一瞬だけ視覚化する */}
      <div
        style={{
          fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
          fontWeight: t.fontWeights.black,
          fontSize: valueFontSize,
          transform: `scale(${valueScale})`,
          transformOrigin: "center center",
          color: accent,
          textShadow:
            tone === "positive"
              ? `0 0 32px ${accent}, 0 0 64px ${accent}80`
              : `0 0 ${24 + lossTintIntensity * 28}px ${accent}, 0 0 ${lossTintIntensity * 60}px rgba(255,107,67,0.9)`,
          filter:
            tone === "negative" && lossTintIntensity > 0
              ? `hue-rotate(${lossTintIntensity * -10}deg) brightness(${1 + lossTintIntensity * 0.18})`
              : "none",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {valueText}
      </div>
    </div>
  );
};
