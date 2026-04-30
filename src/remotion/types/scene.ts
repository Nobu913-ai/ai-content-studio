export interface SceneBase {
  id: string;
  type: string;
  durationSec: number;
  narration?: string;
}

export interface HookScene extends SceneBase {
  type: "hook";
  headline: string;
  subheadline?: string;
  emphasis?: string[];
}

export interface StepsScene extends SceneBase {
  type: "steps";
  title: string;
  steps: string[];
  highlightIndex?: number;
}

export interface CompareScene extends SceneBase {
  type: "compare";
  title?: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  leftColor?: string;
  rightColor?: string;
}

export interface WarningScene extends SceneBase {
  type: "warning";
  title: string;
  body: string;
  severity?: "warn" | "danger" | "info";
  compliance?: {
    disclaimer?: boolean;
  };
}

export interface SourceScene extends SceneBase {
  type: "source";
  sources: {
    name: string;
    infoDate?: string;
    url?: string;
  }[];
  disclaimer?: string;
}

export interface CTAScene extends SceneBase {
  type: "cta";
  headline: string;
  subtext?: string;
  actions?: string[];
}

export type Scene =
  | HookScene
  | StepsScene
  | CompareScene
  | WarningScene
  | SourceScene
  | CTAScene
  | SceneV2;

export type ComponentType =
  | "factCard"
  | "compareSplit"
  | "stackedBarCompare"
  | "taxSavingsDemo"
  | "infinityFact"
  | "phoneStepsDemo"
  | "ctaPanel"
  | "dataSourceCard"
  | "comparisonTable"
  | "numberHero"
  | "progressSteps"
  | "iconGrid"
  | "brokerScreenMockup"
  | "calendarHighlight"
  | "compoundDemo"
  | "taxFlowDemo"
  | "recommendationFocus";

export interface CaptionSegment {
  text: string;
  startSec: number;
  endSec?: number;
  highlight?: string[];
}

export type BackgroundVariant = "impact" | "data" | "action" | "default";

export interface SeEvent {
  type:
    | "pop"
    | "popStrong"
    | "tick"
    | "whoosh"
    | "whooshSoft"
    | "whooshPower"
    | "softImpact"
    | "specialImpact";
  atSec: number;
  volume?: number;
}

export interface SceneV2 {
  id: string;
  component: ComponentType;
  durationSec: number;
  narration?: string;
  caption?: string;
  captionSegments?: CaptionSegment[];
  motion?: string;
  bgVariant?: BackgroundVariant;
  seEvents?: SeEvent[];
  data: Record<string, unknown>;
  type?: undefined;
}

export interface VideoMeta {
  channel: string;
  format: "shorts" | "longform";
  aspectRatio: "9:16" | "16:9";
  durationSec: number;
  topic: string;
}

export interface Brand {
  theme: string;
  voiceStyle?: string;
  motionPreset?: string;
}

export interface SceneJSON {
  videoMeta: VideoMeta;
  brand: Brand;
  scenes: Scene[];
  audio?: string;
  schemaVersion?: "v2";
}
