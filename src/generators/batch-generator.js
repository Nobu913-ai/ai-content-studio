import { generateScript } from "./script-generator.js";
import { generateSEO } from "./seo-generator.js";

/**
 * 台本生成 → SEO最適化 を一気通貫で実行
 */
export async function generateFull(channelId, topic, options = {}) {
  // Step 1: 台本生成
  const scriptResult = await generateScript(channelId, topic, options);

  // Step 2: SEO メタデータ生成
  const seoResult = await generateSEO(channelId, scriptResult.outputPath);

  return {
    script: scriptResult,
    seo: seoResult,
  };
}
