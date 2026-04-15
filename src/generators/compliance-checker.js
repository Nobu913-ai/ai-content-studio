import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getMonetization } from "../../config/monetization.js";
import { readInput, writeOutput, timestamp, fileExists } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";
import { complianceSchema, validateOutput } from "../utils/schemas.js";
import { extractSourceMetadata } from "../utils/source-extractor.js";

/**
 * 台本のコンプライアンス・品質チェック
 * - 誇大表現の検出
 * - AI臭さの検出
 * - 金融コンプライアンス
 * - 過去コンテンツとの重複感
 * - 英語の自然さ（英語チャンネルのみ）
 * - 人間が編集すべきポイントの特定
 */
export async function checkCompliance(channelId, scriptPath, existingTitles = []) {
  channelId = validateChannelId(channelId);
  scriptPath = validateContentPath(scriptPath);
  const channel = getChannel(channelId);
  const monetConfig = getMonetization(channelId);
  const scriptContent = readInput(scriptPath);

  const lang = channel.language === "ja" ? "日本語" : "English";
  const isFinance = channelId === "genz-money";
  const isEnglish = channel.language === "en";

  const systemPrompt = `You are a content compliance auditor and quality reviewer. Respond in ${lang}.

You check content for:
1. Regulatory compliance (especially for finance content)
2. AI-generated "smell" — generic phrasing, lack of specificity, template-like structure
3. Exaggerated or misleading claims
4. Quality and originality
5. Human editing opportunities — where a human voice would add the most value
${
  isFinance
    ? `6. Primary source verification — every factual claim MUST have a [SOURCE: URL] marker
7. Information date verification — time-sensitive data MUST have [INFO DATE: YYYY-MM-DD]
8. Content type labeling — statements must be tagged [INFO TYPE: fact|general|opinion]
9. Disclaimer presence — 投資は自己責任 disclaimer MUST exist
10. Forbidden expressions — 「必ず儲かる」「絶対損しない」「誰でも勝てる」are BANNED`
    : ""
}

Be strict. Flag anything borderline. The goal is to make AI-assisted content indistinguishable from expert human content.

Respond in valid JSON only — no markdown fences.`;

  const existingList =
    existingTitles.length > 0
      ? `\n\nExisting video titles (check for overlap):\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : "";

  const complianceRules = monetConfig.compliance.map((c) => `- ${c}`).join("\n");

  // 金融系: 構造化ソースデータがあれば読み込み、なければ台本から抽出
  let sourceContext = "";
  if (isFinance) {
    const sourcesPath = scriptPath.replace(/\.md$/, "_sources.json");
    let sourceMeta;
    if (fileExists(sourcesPath)) {
      try {
        sourceMeta = JSON.parse(readInput(sourcesPath));
      } catch {
        sourceMeta = null;
      }
    }
    if (!sourceMeta) {
      sourceMeta = extractSourceMetadata(scriptContent, channelId, "unknown", "unknown");
    }
    const s = sourceMeta.summary;
    sourceContext = `\n\n## Pre-extracted Source Analysis:
- Sourced claims: ${s.sourced}/${s.total_claims}
- Unsourced claims: ${s.unsourced}
- Disclaimer present: ${s.has_disclaimer ? "YES" : "NO"}
- Info types: fact=${s.info_types.fact}, general=${s.info_types.general}, opinion=${s.info_types.opinion}
${sourceMeta.sources.length > 0 ? `- Sources found:\n${sourceMeta.sources.map((src) => `  - ${src.url} → "${src.claim.slice(0, 60)}"`).join("\n")}` : "- No [SOURCE:] markers found in script"}`;
  }

  const userPrompt = `Audit this YouTube script for compliance and quality.

## Channel: ${channel.name}
## Compliance Rules:
${complianceRules}

## Script Content:
${scriptContent.slice(0, 6000)}
${existingList}${sourceContext}

## Required JSON Output:
{
  "overall_score": 85,
  "overall_verdict": "pass|warn|fail",
  "checks": {
    "exaggeration": {
      "score": 90,
      "verdict": "pass|warn|fail",
      "issues": [
        {"line_hint": "approximate location in script", "text": "problematic text", "suggestion": "how to fix"}
      ]
    },
    "ai_smell": {
      "score": 75,
      "verdict": "pass|warn|fail",
      "issues": [
        {"text": "generic or template-like phrase", "suggestion": "more natural alternative"}
      ],
      "human_edit_points": [
        "Where in the script a personal anecdote or specific example would help",
        "Sections that feel too 'textbook' and need a conversational rewrite"
      ]
    },
    "compliance": {
      "score": 90,
      "verdict": "pass|warn|fail",
      "issues": [
        {"rule": "which compliance rule", "text": "problematic text", "suggestion": "fix"}
      ]${
        isFinance
          ? `,
      "has_disclaimer": true,
      "has_source_citations": false,
      "separates_info_from_advice": true,
      "source_check": {
        "total_claims": 10,
        "sourced_claims": 5,
        "unsourced_claims": ["list of factual claims without [SOURCE:] markers"],
        "missing_info_dates": ["time-sensitive info without [INFO DATE:] markers"]
      },
      "forbidden_expressions": ["any instances of banned phrases like 必ず儲かる, 絶対損しない, etc."]`
          : ""
      }
    },
    "originality": {
      "score": 80,
      "verdict": "pass|warn|fail",
      "overlap_with_existing": ["title of similar existing video if any"],
      "unique_angle": "What makes this script different"
    }${
      isEnglish
        ? `,
    "english_quality": {
      "score": 85,
      "verdict": "pass|warn|fail",
      "issues": [
        {"text": "unnatural phrase", "suggestion": "natural alternative"}
      ]
    }`
        : ""
    }
  },
  "human_edit_priority": [
    {"section": "Section name", "action": "What the human should add/change", "why": "Why this needs human touch"}
  ],
  "summary": "1-2 sentence overall assessment"
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.3,
    label: "compliance",
    outputHint: `content/${channelId}/metadata/ 配下のコンプライアンスチェック結果`,
  });

  // ハイブリッドモード: API未設定時は手動ワークフロー
  if (result === null) {
    return { path: null, outputPath: null, check: null, manual: true };
  }

  let checkData;
  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    checkData = JSON.parse(cleaned);
  } catch {
    checkData = { raw: result, parseError: true };
  }

  if (!checkData.parseError) {
    const validation = validateOutput(complianceSchema, checkData, "Compliance");
    if (validation.warnings.length > 0) {
      checkData._schemaWarnings = validation.warnings;
      console.warn(validation.warnings.join("\n"));
    }
  }

  const ts = timestamp();
  const slug = scriptPath.split("/").pop().replace(/\.md$/, "");
  const outputPath = `content/${channelId}/metadata/${ts}_${slug}_compliance.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(checkData, null, 2));

  return { path: fullPath, outputPath, check: checkData };
}

/**
 * コンプライアンスチェック結果を見やすく表示
 */
export function formatComplianceReport(checkData) {
  if (checkData.parseError) return checkData.raw;

  let output = "";
  const icon = (v) => (v === "pass" ? "[OK]" : v === "warn" ? "[!!]" : "[NG]");

  output += `\n  Overall: ${icon(checkData.overall_verdict)} ${checkData.overall_score}/100\n`;
  output += `  ${checkData.summary}\n`;

  output += `\n  --- Detail Scores ---\n`;
  for (const [key, val] of Object.entries(checkData.checks || {})) {
    if (val.score !== undefined) {
      output += `  ${icon(val.verdict)} ${key}: ${val.score}/100`;
      if (val.issues && val.issues.length > 0) {
        output += ` (${val.issues.length} issues)`;
      }
      output += "\n";
    }
  }

  // AI 臭さの人間編集ポイント
  const aiCheck = checkData.checks?.ai_smell;
  if (aiCheck?.human_edit_points?.length > 0) {
    output += `\n  --- Human Edit Points (AI smell) ---\n`;
    for (const point of aiCheck.human_edit_points) {
      output += `  * ${point}\n`;
    }
  }

  // 金融系ソースチェック
  const complianceCheck = checkData.checks?.compliance;
  if (complianceCheck?.source_check) {
    const sc = complianceCheck.source_check;
    output += `\n  --- Source Verification (Finance) ---\n`;
    output += `  Sourced: ${sc.sourced_claims}/${sc.total_claims} claims\n`;
    if (sc.unsourced_claims?.length > 0) {
      output += `  [!!] Unsourced claims:\n`;
      for (const c of sc.unsourced_claims) {
        output += `    - ${c}\n`;
      }
    }
    if (sc.missing_info_dates?.length > 0) {
      output += `  [!!] Missing date markers:\n`;
      for (const d of sc.missing_info_dates) {
        output += `    - ${d}\n`;
      }
    }
  }
  if (complianceCheck?.forbidden_expressions?.length > 0) {
    output += `  [NG] Forbidden expressions found:\n`;
    for (const expr of complianceCheck.forbidden_expressions) {
      output += `    - ${expr}\n`;
    }
  }

  // 優先編集ポイント
  if (checkData.human_edit_priority?.length > 0) {
    output += `\n  --- Priority: Human Should Edit ---\n`;
    for (const item of checkData.human_edit_priority) {
      output += `  [${item.section}] ${item.action}\n`;
      output += `    Why: ${item.why}\n`;
    }
  }

  return output;
}
