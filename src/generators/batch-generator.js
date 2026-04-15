import { generateScript } from "./script-generator.js";
import { generateSEO } from "./seo-generator.js";
import { generateShorts } from "./shorts-generator.js";
import { generateRepurpose } from "./repurpose-generator.js";
import { checkCompliance } from "./compliance-checker.js";

/**
 * 台本生成 → SEO最適化 を一気通貫で実行
 */
export async function generateFull(channelId, topic, options = {}) {
  const scriptResult = await generateScript(channelId, topic, options);

  // 台本が手動モードの場合、SEOもスキップ
  if (scriptResult.manual) {
    return { script: scriptResult, seo: { manual: true }, manual: true };
  }

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

  // 台本が手動モードの場合、後続ステップはスキップ
  if (scriptResult.manual) {
    console.log(`  [Hybrid] 台本が手動モード — 後続ステップをスキップ`);
    return {
      script: scriptResult,
      seo: { manual: true },
      shorts: { manual: true },
      repurpose: { manual: true },
      compliance: { manual: true },
      manual: true,
    };
  }

  // Step 2: SEO（タイトル・説明文・タグ）
  const seoResult = await generateSEO(channelId, scriptResult.outputPath);

  // Step 3: Shorts 3本切り出し
  const shortsResult = await generateShorts(channelId, scriptResult.outputPath);

  // Step 4: 全プラットフォーム展開（YouTube説明文、Twitter、Instagram）
  const repurposeResult = await generateRepurpose(channelId, scriptResult.outputPath);

  // Step 5: コンプライアンス・品質チェック
  const complianceResult = await checkCompliance(channelId, scriptResult.outputPath);

  return {
    script: scriptResult,
    seo: seoResult,
    shorts: shortsResult,
    repurpose: repurposeResult,
    compliance: complianceResult,
  };
}
