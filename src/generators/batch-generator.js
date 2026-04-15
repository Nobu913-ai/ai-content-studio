import { generateScript } from "./script-generator.js";
import { generateSEO } from "./seo-generator.js";
import { generateShorts } from "./shorts-generator.js";
import { generateRepurpose } from "./repurpose-generator.js";

/**
 * 台本生成 → SEO最適化 を一気通貫で実行
 */
export async function generateFull(channelId, topic, options = {}) {
  const scriptResult = await generateScript(channelId, topic, options);
  const seoResult = await generateSEO(channelId, scriptResult.outputPath);
  return { script: scriptResult, seo: seoResult };
}

/**
 * フルパイプライン: 台本 → SEO → Shorts → 全プラットフォーム展開
 * 1本の長尺動画から全SNS素材を生成
 */
export async function generateFullPipeline(channelId, topic, options = {}) {
  // Step 1: 台本
  const scriptResult = await generateScript(channelId, topic, options);

  // Step 2: SEO（タイトル・説明文・タグ）
  const seoResult = await generateSEO(channelId, scriptResult.outputPath);

  // Step 3: Shorts 3本切り出し
  const shortsResult = await generateShorts(channelId, scriptResult.outputPath);

  // Step 4: 全プラットフォーム展開（YouTube説明文、Twitter、Instagram）
  const repurposeResult = await generateRepurpose(channelId, scriptResult.outputPath);

  return {
    script: scriptResult,
    seo: seoResult,
    shorts: shortsResult,
    repurpose: repurposeResult,
  };
}
