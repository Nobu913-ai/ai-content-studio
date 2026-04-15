import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { getMonetization } from "../../config/monetization.js";
import { readInput, writeOutput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";

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

Be strict. Flag anything borderline. The goal is to make AI-assisted content indistinguishable from expert human content.

Respond in valid JSON only — no markdown fences.`;

  const existingList = existingTitles.length > 0
    ? `\n\nExisting video titles (check for overlap):\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
    : "";

  const complianceRules = monetConfig.compliance.map((c) => `- ${c}`).join("\n");

  const userPrompt = `Audit this YouTube script for compliance and quality.

## Channel: ${channel.name}
## Compliance Rules:
${complianceRules}

## Script Content:
${scriptContent.slice(0, 6000)}
${existingList}

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
      ]${isFinance ? `,
      "has_disclaimer": true,
      "has_source_citations": false,
      "separates_info_from_advice": true` : ""}
    },
    "originality": {
      "score": 80,
      "verdict": "pass|warn|fail",
      "overlap_with_existing": ["title of similar existing video if any"],
      "unique_angle": "What makes this script different"
    }${isEnglish ? `,
    "english_quality": {
      "score": 85,
      "verdict": "pass|warn|fail",
      "issues": [
        {"text": "unnatural phrase", "suggestion": "natural alternative"}
      ]
    }` : ""}
  },
  "human_edit_priority": [
    {"section": "Section name", "action": "What the human should add/change", "why": "Why this needs human touch"}
  ],
  "summary": "1-2 sentence overall assessment"
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.3,
  });

  let checkData;
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    checkData = JSON.parse(cleaned);
  } catch {
    checkData = { raw: result, parseError: true };
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
  const icon = (v) => v === "pass" ? "[OK]" : v === "warn" ? "[!!]" : "[NG]";

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
