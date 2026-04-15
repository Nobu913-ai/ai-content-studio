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
