import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { HookCard } from "../components/HookCard";
import { ExplainerStack } from "../components/ExplainerStack";
import { CompareCard } from "../components/CompareCard";
import { WarningCard } from "../components/WarningCard";
import { SourceFooter } from "../components/SourceFooter";
import { CTAEndCard } from "../components/CTAEndCard";
import { FactCard } from "../components/FactCard";
import { CompareSplit } from "../components/CompareSplit";
import { StackedBarCompare } from "../components/StackedBarCompare";
import { TaxSavingsDemo } from "../components/TaxSavingsDemo";
import { InfinityFact } from "../components/InfinityFact";
import { PhoneStepsDemo } from "../components/PhoneStepsDemo";
import { DataSourceCard } from "../components/DataSourceCard";
import { ComparisonTable } from "../components/ComparisonTable";
import { NumberHero } from "../components/NumberHero";
import { ProgressSteps } from "../components/ProgressSteps";
import { IconGrid } from "../components/IconGrid";
import { BrokerScreenMockup } from "../components/BrokerScreenMockup";
import { CalendarHighlight } from "../components/CalendarHighlight";
import { CompoundDemo } from "../components/CompoundDemo";
import { TaxFlowDemo } from "../components/TaxFlowDemo";
import { RecommendationFocus } from "../components/RecommendationFocus";
import { SubtitleLayer } from "../components/SubtitleLayer";
import { SeLayer } from "../components/SeLayer";
import { buildTimeline } from "../utils/scene-timing";
import type { SceneJSON, Scene, SceneV2 } from "../types/scene";

export interface GenzMoneyShortProps {
  sceneData: SceneJSON;
}

const isV2Scene = (scene: Scene): scene is SceneV2 =>
  typeof (scene as SceneV2).component === "string";

export const GenzMoneyShort: React.FC<GenzMoneyShortProps> = ({ sceneData }) => {
  const { scenes, audio } = sceneData;
  const { fps } = useVideoConfig();
  const timeline = buildTimeline(scenes);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0D1452" }}>
      {audio && <Audio src={staticFile(audio)} volume={1} />}

      {timeline.map((entry, i) => {
        const scene = scenes[i];
        const sceneName = isV2Scene(scene) ? scene.component : scene.type;
        return (
          <Sequence
            key={entry.id}
            from={entry.startFrame}
            durationInFrames={entry.durationFrames}
            name={`${sceneName}-${entry.id}`}
          >
            <SceneRenderer scene={scene} />
            {isV2Scene(scene) && (scene.caption || scene.captionSegments) && (
              <SubtitleLayer
                caption={scene.caption}
                captionSegments={scene.captionSegments}
                shotDurationSec={scene.durationSec}
              />
            )}
            {isV2Scene(scene) && scene.seEvents && (
              <SeLayer events={scene.seEvents} shotStartFrame={entry.startFrame} fps={fps} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  if (isV2Scene(scene)) {
    return <ComponentRenderer scene={scene} />;
  }

  switch (scene.type) {
    case "hook":
      return (
        <HookCard
          headline={scene.headline}
          subheadline={scene.subheadline}
          emphasis={scene.emphasis}
        />
      );
    case "steps":
      return (
        <ExplainerStack
          title={scene.title}
          steps={scene.steps}
          highlightIndex={scene.highlightIndex}
        />
      );
    case "compare":
      return (
        <CompareCard
          title={scene.title}
          leftLabel={scene.leftLabel}
          leftValue={scene.leftValue}
          rightLabel={scene.rightLabel}
          rightValue={scene.rightValue}
          leftColor={scene.leftColor}
          rightColor={scene.rightColor}
        />
      );
    case "warning":
      return (
        <WarningCard
          title={scene.title}
          body={scene.body}
          severity={scene.severity}
        />
      );
    case "source":
      return (
        <SourceFooter
          sources={scene.sources}
          disclaimer={scene.disclaimer}
        />
      );
    case "cta":
      return (
        <CTAEndCard
          headline={scene.headline}
          subtext={scene.subtext}
          actions={scene.actions}
        />
      );
    default:
      return <AbsoluteFill />;
  }
};

// Default background variant per component if not specified explicitly
const defaultBgVariantFor = (component: SceneV2["component"]): "impact" | "data" | "action" | "default" => {
  switch (component) {
    case "taxSavingsDemo":
    case "taxFlowDemo":
    case "numberHero":
    case "compoundDemo":
      return "impact";
    case "stackedBarCompare":
    case "comparisonTable":
    case "infinityFact":
    case "compareSplit":
    case "recommendationFocus":
    case "dataSourceCard":
    case "iconGrid":
    case "brokerScreenMockup":
      return "data";
    case "phoneStepsDemo":
    case "ctaPanel":
    case "progressSteps":
    case "calendarHighlight":
      return "action";
    default:
      return "default";
  }
};

const ComponentRenderer: React.FC<{ scene: SceneV2 }> = ({ scene }) => {
  const data = scene.data as any;
  const bg = scene.bgVariant ?? defaultBgVariantFor(scene.component);
  switch (scene.component) {
    case "factCard":
      return (
        <FactCard
          headline={data.headline}
          subheadline={data.subheadline}
          highlight={data.highlight}
          variant={data.variant}
          tone={data.tone}
          bgVariant={bg}
        />
      );
    case "compareSplit":
      return (
        <CompareSplit
          title={data.title}
          left={data.left}
          right={data.right}
          divider={data.divider}
          bgVariant={bg}
        />
      );
    case "stackedBarCompare":
      return (
        <StackedBarCompare
          title={data.title}
          bars={data.bars}
          total={data.total}
          highlight={data.highlight}
          staggerFrames={data.staggerFrames}
          growthFrames={data.growthFrames}
          bgVariant={bg}
        />
      );
    case "taxSavingsDemo":
      return (
        <TaxSavingsDemo
          scenarioLabel={data.scenarioLabel}
          left={data.left}
          right={data.right}
          unit={data.unit}
          revealMode={data.revealMode}
          showDiff={data.showDiff}
          bgVariant={bg}
        />
      );
    case "infinityFact":
      return (
        <InfinityFact
          title={data.title}
          emphasis={data.emphasis}
          symbol={data.symbol}
          bgVariant={bg}
        />
      );
    case "phoneStepsDemo":
      return (
        <PhoneStepsDemo
          totalSteps={data.totalSteps}
          currentStep={data.currentStep}
          stepLabel={data.stepLabel}
          uiMock={data.uiMock}
          bgVariant={bg}
        />
      );
    case "ctaPanel":
      return (
        <CTAEndCard
          headline={data.headline}
          subtext={data.subtext}
          destinations={data.destinations}
          bgVariant={bg}
        />
      );
    case "dataSourceCard":
      return (
        <DataSourceCard
          title={data.title}
          sources={data.sources}
          asOfDate={data.asOfDate}
          disclaimer={data.disclaimer}
          bgVariant={bg}
        />
      );
    case "comparisonTable":
      return (
        <ComparisonTable
          title={data.title}
          caption={data.caption}
          columns={data.columns}
          rows={data.rows}
          highlightLabel={data.highlightLabel}
          bgVariant={bg}
        />
      );
    case "numberHero":
      return (
        <NumberHero
          number={data.number}
          prefix={data.prefix}
          suffix={data.suffix}
          caption={data.caption}
          subtext={data.subtext}
          tone={data.tone}
          bgVariant={bg}
        />
      );
    case "progressSteps":
      return (
        <ProgressSteps
          title={data.title}
          steps={data.steps}
          staggerSec={data.staggerSec}
          highlightFinal={data.highlightFinal}
          bgVariant={bg}
        />
      );
    case "iconGrid":
      return (
        <IconGrid
          title={data.title}
          subtitle={data.subtitle}
          items={data.items}
          columns={data.columns}
          staggerSec={data.staggerSec}
          bgVariant={bg}
        />
      );
    case "brokerScreenMockup":
      return (
        <BrokerScreenMockup
          brokerName={data.brokerName}
          tagline={data.tagline}
          rows={data.rows}
          highlightLabel={data.highlightLabel}
          highlightValue={data.highlightValue}
          brandColor={data.brandColor}
          bgVariant={bg}
        />
      );
    case "calendarHighlight":
      return (
        <CalendarHighlight
          title={data.title}
          monthLabel={data.monthLabel}
          highlightDays={data.highlightDays}
          highlightLabel={data.highlightLabel}
          daysInMonth={data.daysInMonth}
          startDayOfWeek={data.startDayOfWeek}
          showCycleBadge={data.showCycleBadge}
          bgVariant={bg}
        />
      );
    case "compoundDemo":
      return (
        <CompoundDemo
          monthlyAmount={data.monthlyAmount}
          years={data.years}
          annualRate={data.annualRate}
          title={data.title}
          unit={data.unit}
          milestones={data.milestones}
          bgVariant={bg}
        />
      );
    case "taxFlowDemo":
      return (
        <TaxFlowDemo
          principal={data.principal}
          tax={data.tax}
          unit={data.unit}
          principalLabel={data.principalLabel}
          principalPrefix={data.principalPrefix}
          takeHomePrefix={data.takeHomePrefix}
          regularLabel={data.regularLabel}
          regularTakeHome={data.regularTakeHome}
          regularTakeHomeLabel={data.regularTakeHomeLabel}
          nisaLabel={data.nisaLabel}
          nisaTakeHomeLabel={data.nisaTakeHomeLabel}
          diffPrefix={data.diffPrefix}
          diffApprox={data.diffApprox}
          diffMessage={data.diffMessage}
          regularCardStyle={data.regularCardStyle}
          nisaCardStyle={data.nisaCardStyle}
          regularSubLabel={data.regularSubLabel}
          nisaFloatingBadge={data.nisaFloatingBadge}
          bgVariant={bg}
        />
      );
    case "recommendationFocus":
      return (
        <RecommendationFocus
          title={data.title}
          focus={data.focus}
          secondary={data.secondary}
          secondarySide={data.secondarySide}
          bgVariant={bg}
        />
      );
    default:
      return <AbsoluteFill />;
  }
};
