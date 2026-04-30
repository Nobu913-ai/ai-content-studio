import { z } from "zod";

/**
 * SEO メタデータのスキーマ
 */
export const seoSchema = z.object({
  titles: z
    .array(
      z.object({
        text: z.string().min(1).max(100),
        ctr_reason: z.string().min(1),
      }),
    )
    .min(3, "タイトルは最低3件必要です"),
  thumbnail_texts: z
    .array(
      z.object({
        text: z.string().min(1),
        why: z.string().min(1),
      }),
    )
    .optional(),
  description: z.string().min(10, "説明文が短すぎます"),
  tags: z.array(z.string()).min(5, "タグは最低5件必要です"),
  thumbnail_ideas: z
    .array(
      z.object({
        concept: z.string(),
        text_overlay: z.string(),
      }),
    )
    .optional(),
  shorts_hooks: z.array(z.string()).optional(),
});

/**
 * Shorts のスキーマ
 */
const shortItemSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  script: z.string().min(50, "スクリプトが短すぎます"),
  cta: z.string().min(1),
  estimated_seconds: z.number().min(30).max(180),
  hashtags: z
    .object({
      youtube: z.array(z.string()).optional(),
      tiktok: z.array(z.string()).optional(),
      instagram: z.array(z.string()).optional(),
    })
    .optional(),
  viral_score: z.string(),
  viral_reason: z.string(),
});

export const shortsSchema = z.object({
  shorts: z.array(shortItemSchema).min(1, "最低1本のShortsが必要です"),
});

/**
 * Shorts先行テストのスキーマ（追加フィールドあり）
 */
export const shortsTestSchema = z.object({
  topic: z.string().optional(),
  strategy: z.string().optional(),
  shorts: z
    .array(
      shortItemSchema.extend({
        angle: z.string().optional(),
        longform_potential: z.string().optional(),
      }),
    )
    .min(1, "最低1本のShortsが必要です"),
});

/**
 * Repurpose のスキーマ
 */
export const repurposeSchema = z.object({
  youtube_description: z.string().min(20, "YouTube説明文が短すぎます"),
  twitter_thread: z.array(z.string()).min(2, "Twitterスレッドは最低2ツイート必要です"),
  instagram_caption: z.string().min(10),
  instagram_carousel_slides: z.array(z.string()).optional(),
  affiliate_recommendations: z
    .array(
      z.object({
        product: z.string(),
        placement: z.string(),
        cta_script: z.string(),
      }),
    )
    .optional(),
});

/**
 * コンプライアンスチェックのスキーマ
 */
export const complianceSchema = z.object({
  overall_score: z.number().min(0).max(100),
  overall_verdict: z.enum(["pass", "warn", "fail"]),
  checks: z.record(z.string(), z.unknown()),
  human_edit_priority: z
    .array(
      z.object({
        section: z.string(),
        action: z.string(),
        why: z.string(),
      }),
    )
    .optional(),
  summary: z.string().min(1),
});

/**
 * 金融系 source metadata のスキーマ
 * 台本内の [SOURCE:], [INFO TYPE:], [INFO DATE:] マーカーを構造化
 */
const sourceEntrySchema = z.object({
  url: z.string().min(1),
  accessed: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD 形式で指定してください")
    .optional(),
  claim: z.string().min(1),
  info_type: z.enum(["fact", "general", "opinion"]).optional(),
  info_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付は YYYY-MM-DD 形式で指定してください")
    .optional(),
});

export const sourceMetadataSchema = z.object({
  channel_id: z.string().min(1),
  topic: z.string().min(1),
  generated: z.string().min(1),
  sources: z.array(sourceEntrySchema),
  summary: z.object({
    total_claims: z.number().min(0),
    sourced: z.number().min(0),
    unsourced: z.number().min(0),
    has_disclaimer: z.boolean(),
    info_types: z.object({
      fact: z.number().min(0),
      general: z.number().min(0),
      opinion: z.number().min(0),
    }),
  }),
});

/**
 * 制作パイプライン マニフェストのスキーマ
 * produce コマンドの全出力を追跡
 */
const manifestStepSchema = z.object({
  step: z.string().min(1),
  status: z.enum(["done", "skipped", "manual", "error"]),
  note: z.string().optional(),
  error: z.string().optional(),
  path: z.string().optional(),
  shotPlanPath: z.string().optional(),
  narrationTextPath: z.string().optional(),
  succeeded: z.number().optional(),
  projectId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  importedUrls: z.number().optional(),
  manualImportNeeded: z.number().optional(),
  localPaths: z.array(z.string()).optional(),
});

const manifestMediaEntrySchema = z.object({
  type: z.string().min(1),
  url: z.string().optional(),
  path: z.string().optional(),
  shotId: z.string().optional(),
});

export const manifestSchema = z.object({
  version: z.string().min(1),
  channel: z.string().min(1),
  topic: z.string().min(1),
  format: z.enum(["shorts", "longform"]),
  generated: z.string().min(1),
  steps: z.array(manifestStepSchema),
  outputs: z.object({
    script: z.string().nullable(),
    shotPlan: z.string().nullable(),
    narration: z.string().nullable(),
    narrationText: z.string().nullable(),
    handoff: z.string().nullable(),
    runway: z.string().nullable(),
    elevenlabs: z.string().nullable(),
    descript: z.string().nullable(),
  }),
  media: z.object({
    remoteUrls: z.array(manifestMediaEntrySchema),
    localPaths: z.array(manifestMediaEntrySchema),
  }),
  audioMetadata: z
    .object({
      channel: z.string().optional(),
      generated: z.string().optional(),
      voice_id: z.string().optional(),
      model: z.string().optional(),
      text_length: z.number().optional(),
      style: z.string().optional(),
      outputPath: z.string().optional(),
    })
    .nullable(),
  manualSteps: z.array(manifestStepSchema),
  errors: z.array(
    z.object({
      step: z.string().min(1),
      error: z.string().optional(),
    }),
  ),
  stats: z.object({
    totalSteps: z.number().min(0),
    completed: z.number().min(0),
    skipped: z.number().min(0),
    manual: z.number().min(0),
    errors: z.number().min(0),
  }),
});

/**
 * Remotion scene JSON のスキーマ
 */
const sceneBaseSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["hook", "steps", "compare", "warning", "source", "cta"]),
  durationSec: z.number().min(1).max(300),
  narration: z.string().optional(),
});

const hookSceneSchema = sceneBaseSchema.extend({
  type: z.literal("hook"),
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  emphasis: z.array(z.string()).optional(),
});

const stepsSceneSchema = sceneBaseSchema.extend({
  type: z.literal("steps"),
  title: z.string().min(1),
  steps: z.array(z.string()).min(1, "ステップが必要です"),
  highlightIndex: z.number().optional(),
});

const compareSceneSchema = sceneBaseSchema.extend({
  type: z.literal("compare"),
  title: z.string().optional(),
  leftLabel: z.string().min(1),
  leftValue: z.string().min(1),
  rightLabel: z.string().min(1),
  rightValue: z.string().min(1),
  leftColor: z.string().optional(),
  rightColor: z.string().optional(),
});

const warningSceneSchema = sceneBaseSchema.extend({
  type: z.literal("warning"),
  title: z.string().min(1),
  body: z.string().min(1),
  severity: z.enum(["warn", "danger", "info"]).optional(),
  compliance: z
    .object({
      disclaimer: z.boolean().optional(),
    })
    .optional(),
});

const sourceSceneSchema = sceneBaseSchema.extend({
  type: z.literal("source"),
  sources: z
    .array(
      z.object({
        name: z.string().min(1),
        infoDate: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .min(1, "出典が必要です"),
  disclaimer: z.string().optional(),
});

const ctaSceneSchema = sceneBaseSchema.extend({
  type: z.literal("cta"),
  headline: z.string().min(1),
  subtext: z.string().optional(),
  actions: z.array(z.string()).optional(),
});

const sceneSchema = z.discriminatedUnion("type", [
  hookSceneSchema,
  stepsSceneSchema,
  compareSceneSchema,
  warningSceneSchema,
  sourceSceneSchema,
  ctaSceneSchema,
]);

export const sceneJSONSchema = z.object({
  videoMeta: z.object({
    channel: z.string().min(1),
    format: z.enum(["shorts", "longform"]),
    aspectRatio: z.enum(["9:16", "16:9"]),
    durationSec: z.number().min(1),
    topic: z.string().min(1),
  }),
  brand: z.object({
    theme: z.string().min(1),
    voiceStyle: z.string().optional(),
    motionPreset: z.string().optional(),
  }),
  scenes: z.array(sceneSchema).min(1, "最低1シーンが必要です"),
  audio: z.string().optional(),
});

/**
 * Remotion scene JSON v2 — コンポーネント指向schema
 * 各シーンが component + data を持ち、Remotion側で1:1にマッピングされる
 */
const sceneV2Base = z.object({
  id: z.string().min(1),
  component: z.enum([
    "factCard",
    "compareSplit",
    "stackedBarCompare",
    "taxSavingsDemo",
    "infinityFact",
    "phoneStepsDemo",
    "ctaPanel",
    "dataSourceCard",
    "comparisonTable",
    "numberHero",
    "progressSteps",
    "iconGrid",
    "brokerScreenMockup",
    "calendarHighlight",
    "compoundDemo",
    "taxFlowDemo",
    "recommendationFocus",
  ]),
  durationSec: z.number().min(0.5).max(300),
  narration: z.string().optional(),
  caption: z.string().optional(),
  // captionSegments: ライブテロップ用。指定されると caption より優先される。
  // startSec/endSec はそのシーン内 (0始まり) の相対秒。endSec省略時は次のセグメント開始 or シーン終端。
  captionSegments: z
    .array(
      z.object({
        text: z.string().min(1),
        startSec: z.number().min(0),
        endSec: z.number().optional(),
        highlight: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  motion: z.string().optional(),
  // bgVariant: AnimatedBackground の3変種選択 (impact / data / action / default)
  // 未指定時は component 種別から自動推定される（remotion-scene-generator.js 参照）
  bgVariant: z.enum(["impact", "data", "action", "default"]).optional(),
  // seEvents: 軽いSEを発火（音源ファイル名と shot内オフセット秒）。
  // 8役割: 基本パレット (pop / tick / whoosh / whooshSoft / softImpact)
  //        限定パレット (popStrong / whooshPower / specialImpact)
  seEvents: z
    .array(
      z.object({
        type: z.enum([
          "pop",
          "popStrong",
          "tick",
          "whoosh",
          "whooshSoft",
          "whooshPower",
          "softImpact",
          "specialImpact",
        ]),
        atSec: z.number().min(0),
        volume: z.number().optional(),
      }),
    )
    .optional(),
  data: z.record(z.string(), z.any()),
});

const factCardData = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  highlight: z.array(z.string()).optional(),
  icon: z.string().optional(),
  variant: z.enum(["default", "punch", "soft"]).optional(),
  tone: z.enum(["positive", "negative", "neutral"]).optional(),
});

const compareSplitData = z.object({
  title: z.string().optional(),
  left: z.object({
    label: z.string().min(1),
    value: z.string().min(1),
    tone: z.enum(["positive", "negative", "neutral"]).optional(),
  }),
  right: z.object({
    label: z.string().min(1),
    value: z.string().min(1),
    tone: z.enum(["positive", "negative", "neutral"]).optional(),
  }),
  divider: z.enum(["vs", "arrow"]).optional(),
});

const stackedBarCompareData = z.object({
  title: z.string().min(1),
  bars: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.number(),
        unit: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .min(1),
  total: z
    .object({
      label: z.string(),
      value: z.number(),
      unit: z.string().optional(),
    })
    .optional(),
  highlight: z.string().optional(),
  staggerFrames: z.number().optional(),
  growthFrames: z.number().optional(),
});

const taxSavingsDemoData = z.object({
  scenarioLabel: z.string().min(1),
  left: z.object({
    label: z.string().min(1),
    profit: z.number(),
    tax: z.number(),
    takeHome: z.number(),
  }),
  right: z.object({
    label: z.string().min(1),
    profit: z.number(),
    tax: z.number(),
    takeHome: z.number(),
  }),
  unit: z.string().optional(),
  revealMode: z.enum(["parallel", "staged"]).optional(),
  showDiff: z.boolean().optional(),
});

const infinityFactData = z.object({
  title: z.string().min(1),
  emphasis: z.string().min(1),
  symbol: z.enum(["infinity", "checkmark"]).optional(),
});

const phoneStepsDemoData = z.object({
  totalSteps: z.number().int().min(1),
  currentStep: z.number().int().min(1),
  stepLabel: z.string().min(1),
  uiMock: z.enum(["openAccount", "setupAutoInvest", "selectFund"]),
});

const ctaPanelData = z.object({
  headline: z.string().min(1),
  destinations: z.array(z.enum(["pinnedComment", "profileLink"])).min(1).optional(),
  subtext: z.string().optional(),
  preset: z.string().optional(),
});

const dataSourceCardData = z.object({
  title: z.string().optional(),
  sources: z
    .array(
      z.object({
        name: z.string().min(1),
        date: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .min(1),
  asOfDate: z.string().optional(),
  disclaimer: z.string().optional(),
});

const numberHeroData = z.object({
  number: z.string().min(1),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  caption: z.string().optional(),
  subtext: z.string().optional(),
  tone: z.enum(["positive", "negative", "neutral"]).optional(),
});

const progressStepsData = z.object({
  title: z.string().optional(),
  steps: z
    .array(
      z.object({
        label: z.string().min(1),
        detail: z.string().optional(),
        icon: z.string().optional(),
        intensity: z.enum(["muted", "normal", "accent", "highlight"]).optional(),
      }),
    )
    .min(2),
  staggerSec: z.number().optional(),
  highlightFinal: z.boolean().optional(),
});

const comparisonTableData = z.object({
  title: z.string().min(1),
  caption: z.string().optional(),
  columns: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        emphasis: z.boolean().optional(),
      }),
    )
    .min(1),
  rows: z
    .array(
      z.object({
        label: z.string().min(1),
        values: z.record(z.string(), z.union([z.string(), z.number()])),
        highlight: z.boolean().optional(),
      }),
    )
    .min(1),
  highlightLabel: z.string().optional(),
});

const iconGridData = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        icon: z.string().optional(),
        sublabel: z.string().optional(),
        emphasis: z.boolean().optional(),
        tone: z.enum(["positive", "negative", "neutral"]).optional(),
      }),
    )
    .min(2),
  columns: z.number().int().optional(),
  staggerSec: z.number().optional(),
});

const brokerScreenMockupData = z.object({
  brokerName: z.string().min(1),
  tagline: z.string().optional(),
  rows: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
        emphasis: z.boolean().optional(),
      }),
    )
    .min(1),
  highlightLabel: z.string().optional(),
  highlightValue: z.string().optional(),
  brandColor: z.string().optional(),
});

const calendarHighlightData = z.object({
  title: z.string().optional(),
  monthLabel: z.string().optional(),
  highlightDays: z.array(z.number().int().min(1).max(31)).min(1),
  highlightLabel: z.string().optional(),
  daysInMonth: z.number().int().min(28).max(31).optional(),
  startDayOfWeek: z.number().int().min(0).max(6).optional(),
  showCycleBadge: z.boolean().optional(),
});

const compoundDemoData = z.object({
  monthlyAmount: z.number().min(1),
  years: z.number().int().min(1),
  annualRate: z.number().optional(),
  title: z.string().optional(),
  unit: z.string().optional(),
  milestones: z.array(z.number().int().min(0)).optional(),
});

const taxFlowDemoData = z.object({
  principal: z.number().min(0),
  tax: z.number().min(0),
  unit: z.string().optional(),
  principalLabel: z.string().optional(),
  principalPrefix: z.string().optional(),
  takeHomePrefix: z.string().optional(),
  regularLabel: z.string().optional(),
  regularTakeHome: z.number().optional(),
  regularTakeHomeLabel: z.string().optional(),
  nisaLabel: z.string().optional(),
  nisaTakeHomeLabel: z.string().optional(),
  diffPrefix: z.string().optional(),
  diffApprox: z.string().optional(),
  diffMessage: z.string().optional(),
  regularCardStyle: z
    .object({
      scale: z.number().min(0.5).max(2).optional(),
      opacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  nisaCardStyle: z
    .object({
      scale: z.number().min(0.5).max(2).optional(),
      checkIcon: z.boolean().optional(),
    })
    .optional(),
  regularSubLabel: z.string().optional(),
  nisaFloatingBadge: z.string().optional(),
});

const recommendationFocusData = z.object({
  title: z.string().optional(),
  focus: z.object({
    label: z.string().min(1),
    value: z.string().optional(),
    badge: z.string().optional(),
    tone: z.enum(["positive", "negative", "neutral"]).optional(),
    scale: z.number().min(0.5).max(2).optional(),
  }),
  secondary: z.object({
    label: z.string().min(1),
    value: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    scale: z.number().min(0.5).max(2).optional(),
  }),
  secondarySide: z.enum(["left", "right"]).optional(),
});

const componentDataMap = {
  factCard: factCardData,
  compareSplit: compareSplitData,
  stackedBarCompare: stackedBarCompareData,
  taxSavingsDemo: taxSavingsDemoData,
  infinityFact: infinityFactData,
  phoneStepsDemo: phoneStepsDemoData,
  ctaPanel: ctaPanelData,
  dataSourceCard: dataSourceCardData,
  comparisonTable: comparisonTableData,
  numberHero: numberHeroData,
  progressSteps: progressStepsData,
  iconGrid: iconGridData,
  brokerScreenMockup: brokerScreenMockupData,
  calendarHighlight: calendarHighlightData,
  compoundDemo: compoundDemoData,
  taxFlowDemo: taxFlowDemoData,
  recommendationFocus: recommendationFocusData,
};

const sceneV2Schema = sceneV2Base.superRefine((scene, ctx) => {
  const dataSchema = componentDataMap[scene.component];
  if (!dataSchema) return;
  const result = dataSchema.safeParse(scene.data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data", ...issue.path],
        message: issue.message,
      });
    }
  }
});

export const sceneJSONSchemaV2 = z.object({
  schemaVersion: z.literal("v2"),
  videoMeta: z.object({
    channel: z.string().min(1),
    format: z.enum(["shorts", "longform"]),
    aspectRatio: z.enum(["9:16", "16:9"]),
    durationSec: z.number().min(1),
    topic: z.string().min(1),
  }),
  brand: z.object({
    theme: z.string().min(1),
    voiceStyle: z.string().optional(),
    motionPreset: z.string().optional(),
  }),
  scenes: z.array(sceneV2Schema).min(1, "最低1シーンが必要です"),
  audio: z.string().optional(),
});

/**
 * スキーマ検証を実行し、結果を返す
 * パースエラーではなく検証警告として扱い、データは通す
 */
export function validateOutput(schema, data, label = "output") {
  const result = schema.safeParse(data);
  if (!result.success) {
    const warnings = result.error.issues.map((i) => `  [SCHEMA] ${label}: ${i.path.join(".")} — ${i.message}`);
    return { valid: false, warnings, data };
  }
  return { valid: true, warnings: [], data };
}
