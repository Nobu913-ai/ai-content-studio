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

export interface PhoneStepsDemoProps {
  totalSteps: number;
  currentStep: number;
  stepLabel: string;
  uiMock: "openAccount" | "setupAutoInvest" | "selectFund";
  bgVariant?: BackgroundVariant;
}

const MOCK_TITLES: Record<PhoneStepsDemoProps["uiMock"], string> = {
  openAccount: "NISA口座開設",
  setupAutoInvest: "つみたて設定",
  selectFund: "銘柄選択",
};

interface MockField {
  label: string;
  value: string;
}

const MOCK_FIELDS: Record<PhoneStepsDemoProps["uiMock"], MockField[]> = {
  openAccount: [
    { label: "氏名", value: "山田 ◯◯" },
    { label: "生年月日", value: "1998/04/15" },
    { label: "マイナンバー", value: "● ● ● ● ● ● ●" },
  ],
  setupAutoInvest: [
    { label: "銘柄", value: "全世界株式" },
    { label: "毎月の積立額", value: "30,000円" },
    { label: "引落し日", value: "毎月15日" },
  ],
  selectFund: [
    { label: "種類", value: "インデックス" },
    { label: "対象", value: "S&P500" },
    { label: "通貨", value: "円建て" },
  ],
};

const PhoneFrame: React.FC<{
  uiMock: PhoneStepsDemoProps["uiMock"];
  stepLabel: string;
  currentStep: number;
  totalSteps: number;
  delay: number;
}> = ({ uiMock, stepLabel, currentStep, totalSteps, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;

  // Field check animation: appear → check appears
  const fieldOpacity = (idx: number) => {
    const startFrame = 12 + idx * 8;
    return interpolate(f, [startFrame, startFrame + 6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };
  const fieldSlide = (idx: number) => {
    const startFrame = 12 + idx * 8;
    return interpolate(f, [startFrame, startFrame + 8], [20, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  };
  const fieldCheckOpacity = (idx: number) => {
    const startFrame = 12 + idx * 8 + 6;
    return interpolate(f, [startFrame, startFrame + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };
  const fieldCheckScale = (idx: number) => {
    const startFrame = 12 + idx * 8 + 6;
    return spring({
      frame: Math.max(0, f - startFrame),
      fps,
      config: { damping: 8, mass: 0.4, stiffness: 240 },
    });
  };

  const buttonDelay = 12 + 3 * 8 + 8;
  const buttonOpacity = interpolate(f, [buttonDelay, buttonDelay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonScale = spring({
    frame: Math.max(0, f - buttonDelay),
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 200 },
  });

  // Tap cursor appears, moves to button, taps, ripple
  const cursorAppearAt = buttonDelay + 12;
  const cursorTapAt = cursorAppearAt + 10;
  const cursorOpacity = interpolate(f, [cursorAppearAt, cursorAppearAt + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(
    f,
    [cursorAppearAt, cursorTapAt],
    [80, 10],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );
  const tapPulse = interpolate(f, [cursorTapAt, cursorTapAt + 4, cursorTapAt + 8], [1, 0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rippleScale = interpolate(f, [cursorTapAt, cursorTapAt + 18], [0.4, 2.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rippleOpacity = interpolate(f, [cursorTapAt, cursorTapAt + 18], [0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress bar at top of phone
  const progressTarget = currentStep / totalSteps;
  const progressFill = interpolate(f, [4, 16], [
    (currentStep - 1) / totalSteps,
    progressTarget,
  ], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fields = MOCK_FIELDS[uiMock];
  const screenTitle = MOCK_TITLES[uiMock];

  const phoneWidth = 540;
  const phoneHeight = 1100;
  const screenInset = 14;

  return (
    <div
      style={{
        position: "relative",
        width: phoneWidth,
        height: phoneHeight,
        borderRadius: 60,
        backgroundColor: "#0a0a0a",
        border: `4px solid #2a2a2a`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${t.colors.accent}40`,
        padding: screenInset,
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: 160,
          height: 28,
          backgroundColor: "#000",
          borderRadius: 14,
          zIndex: 5,
        }}
      />

      {/* Screen */}
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f5f7fa",
          borderRadius: 48,
          padding: `80px 28px 28px 28px`,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* App header with progress */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 12,
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: 700,
              fontSize: 28,
              color: "#1e293b",
            }}
          >
            {screenTitle}
          </div>
          <div
            style={{
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: 700,
              fontSize: 18,
              color: "#64748b",
            }}
          >
            {currentStep}/{totalSteps}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            backgroundColor: "#e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressFill * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${t.colors.accent}, ${t.colors.positive})`,
              transition: "none",
              boxShadow: `0 0 12px ${t.colors.accent}80`,
            }}
          />
        </div>

        {/* Step label */}
        <div
          style={{
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: 700,
            fontSize: 32,
            color: t.colors.bgPrimary,
            marginTop: 12,
          }}
        >
          {stepLabel}
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
          {fields.map((field, i) => {
            // value typing-in delay (after field appears)
            const valueStart = 12 + i * 8 + 2;
            const valueOpacity = interpolate(f, [valueStart, valueStart + 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const valueSlide = interpolate(f, [valueStart, valueStart + 8], [12, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            // Field "active" state: highlight border while typing, then back to gray once check appears
            const checkStart = 12 + i * 8 + 6;
            const isActive =
              f >= valueStart && f < checkStart + 6;
            const borderHighlight = interpolate(
              f,
              [valueStart, valueStart + 4, checkStart + 6, checkStart + 10],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const activeColor = t.colors.accent;
            const borderColor = `rgba(68, 138, 255, ${borderHighlight * 0.85 + 0.0})`;
            return (
              <div
                key={i}
                style={{
                  opacity: fieldOpacity(i),
                  transform: `translateY(${fieldSlide(i)}px)`,
                  padding: "16px 22px",
                  backgroundColor: borderHighlight > 0.1 ? `${activeColor}08` : "#ffffff",
                  borderRadius: 14,
                  border: `2px solid ${borderHighlight > 0.1 ? borderColor : "#e2e8f0"}`,
                  boxShadow: borderHighlight > 0.1 ? `0 0 12px ${activeColor}40` : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: 600,
                    fontSize: 22,
                    color: "#64748b",
                    flexShrink: 0,
                  }}
                >
                  {field.label}
                </span>
                <span
                  style={{
                    fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
                    fontWeight: 700,
                    fontSize: 24,
                    color: "#1e293b",
                    flex: 1,
                    textAlign: "right",
                    opacity: valueOpacity,
                    transform: `translateY(${valueSlide}px)`,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {field.value}
                </span>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: t.colors.positive,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: fieldCheckOpacity(i),
                    transform: `scale(${fieldCheckScale(i)})`,
                    boxShadow: `0 0 12px ${t.colors.positive}80`,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        <div style={{ marginTop: "auto", position: "relative" }}>
          <div
            style={{
              opacity: buttonOpacity,
              transform: `scale(${buttonScale * tapPulse})`,
              padding: "26px 24px",
              backgroundColor: interpolate(
                f,
                [cursorTapAt - 2, cursorTapAt, cursorTapAt + 4, cursorTapAt + 10],
                [0, 0, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ) > 0.3
                ? t.colors.accent
                : t.colors.bgPrimary,
              borderRadius: 16,
              textAlign: "center",
              fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
              fontWeight: 800,
              fontSize: 32,
              color: "#fff",
              boxShadow: `0 8px 24px ${t.colors.bgPrimary}60`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            進む →
            {/* Tap ripple */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "rgba(255,255,255,0.4)",
                transform: `translate(-50%, -50%) scale(${rippleScale})`,
                opacity: rippleOpacity,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Tap cursor finger — comes from below the button */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "100%",
              transform: `translate(-50%, ${cursorY}px)`,
              opacity: cursorOpacity,
              fontSize: 72,
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.5))",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
};

export const PhoneStepsDemo: React.FC<PhoneStepsDemoProps> = ({
  totalSteps,
  currentStep,
  stepLabel,
  uiMock,
  bgVariant,
}) => {
  const frame = useCurrentFrame();
  const { width } = t.resolution;

  const headerOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AnimatedBackground accent={t.colors.accent} variant={bgVariant}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // STEP ヘッダーをさらに下方に: +180px (合計 244px) で画面中央寄りに
          paddingTop: t.spacing.xl + 180,
          paddingBottom: t.spacing.xl + 240,
          gap: t.spacing.md,
        }}
      >
        <div
          style={{
            opacity: headerOpacity,
            fontFamily: `"${t.fonts.main}", ${t.fonts.fallback}`,
            fontWeight: t.fontWeights.bold,
            fontSize: Math.round(width * 0.05),
            color: t.colors.textPrimary,
            textAlign: "center",
          }}
        >
          STEP {currentStep}: {stepLabel}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            width: "100%",
          }}
        >
          <PhoneFrame
            uiMock={uiMock}
            stepLabel={stepLabel}
            currentStep={currentStep}
            totalSteps={totalSteps}
            delay={0}
          />
        </div>
      </AbsoluteFill>
    </AnimatedBackground>
  );
};
