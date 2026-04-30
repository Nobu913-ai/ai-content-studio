import { readInput, writeOutput, timestamp } from "../utils/file-helpers.js";
import { sceneJSONSchema, sceneJSONSchemaV2, validateOutput } from "../utils/schemas.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";
import { resolveCtaPreset } from "../../config/affiliate-links.js";

/**
 * ショットプランJSONからRemotionのscene JSONを生成する
 * - schema_version === "v2": コンポーネント指向でショットの component/data をそのまま渡す
 * - それ以外: 旧 type ベースの分類ロジック（hook/steps/compare/...）
 */
export function generateSceneJSON(channelId, shotPlanPath, opts = {}) {
  channelId = validateChannelId(channelId);
  shotPlanPath = validateContentPath(shotPlanPath);

  const raw = readInput(shotPlanPath);
  const shotPlan = JSON.parse(raw);

  const isV2 = shotPlan.schema_version === "v2";

  const scenes = isV2
    ? shotPlan.shots.map((shot, i) => buildSceneV2(shot, i))
    : shotPlan.shots.map((shot, i) => classifyShot(shot, i, shotPlan.shots));

  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSec, 0);

  const sceneJSON = {
    videoMeta: {
      channel: channelId,
      format: shotPlan.format || "shorts",
      aspectRatio: shotPlan.aspect_ratio === "16:9" ? "16:9" : "9:16",
      durationSec: totalDuration,
      topic: shotPlan.title || "untitled",
    },
    brand: {
      theme: channelId,
      voiceStyle: "calm-trust",
      motionPreset: "fast-clean",
    },
    scenes,
  };

  if (isV2) sceneJSON.schemaVersion = "v2";
  if (shotPlan.audio) sceneJSON.audio = shotPlan.audio;
  if (opts.audioPath) sceneJSON.audio = opts.audioPath;

  const schema = isV2 ? sceneJSONSchemaV2 : sceneJSONSchema;
  const validation = validateOutput(schema, sceneJSON, "scene JSON");
  if (!validation.valid) {
    for (const w of validation.warnings) console.warn(w);
  }

  const slug = shotPlanPath.split("/").pop().split("\\").pop().replace(/\.json$/, "");
  const outputPath = `content/${channelId}/metadata/${timestamp()}_${slug}_scenes.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(sceneJSON, null, 2));

  return { path: fullPath, relativePath: outputPath, sceneJSON };
}

/**
 * AnimatedBackground variant を component種別から推定する。
 * Remotion側の `defaultBgVariantFor` (compositions/GenzMoneyShort.tsx) と同じロジック。
 * shot側で明示指定があればそちらを優先する。
 */
function defaultBgVariantFor(component) {
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
}

/**
 * v2 (component-oriented) — ショットの component/data をそのままシーンに渡す
 * ctaPanel.data.preset があれば resolveCtaPreset で destinations/subtext を解決する
 * bgVariant 未指定時は component種別から自動推定する
 */
function buildSceneV2(shot, index) {
  if (!shot.component) {
    throw new Error(
      `shot ${shot.shot_id || index} には component フィールドが必要です（schema_version: v2）`,
    );
  }
  let data = shot.data || {};
  if (shot.component === "ctaPanel" && data.preset) {
    const resolved = resolveCtaPreset(data.preset);
    if (resolved) {
      data = {
        ...data,
        destinations: data.destinations || resolved.destinations,
        subtext: data.subtext || resolved.subtext,
      };
      delete data.preset;
    }
  }
  return {
    id: shot.shot_id || `s${index + 1}`,
    component: shot.component,
    durationSec: shot.duration_sec,
    narration: shot.narration,
    caption: shot.caption,
    captionSegments: shot.captionSegments,
    motion: shot.motion,
    bgVariant: shot.bgVariant ?? defaultBgVariantFor(shot.component),
    seEvents: shot.seEvents,
    data,
  };
}

/**
 * 個別ショットをscene typeに分類する（旧schema向け）
 */
function classifyShot(shot, index, allShots) {
  const overlay = (shot.text_overlay || "").trim();
  const narration = (shot.narration || "").trim();
  const isFirst = index === 0;
  const isLast = index === allShots.length - 1;

  if (isLast && isCTA(overlay)) {
    return buildCTA(shot, index);
  }

  if (isCompare(overlay)) {
    return buildCompare(shot, index);
  }

  if (isStepsList(overlay)) {
    return buildSteps(shot, index);
  }

  if (isWarning(overlay, narration)) {
    return buildWarning(shot, index);
  }

  return buildHook(shot, index);
}

function isCTA(overlay) {
  return (
    overlay.includes("コメント") ||
    overlay.includes("フォロー") ||
    overlay.includes("プロフィール") ||
    overlay.includes("教えて")
  );
}

function isCompare(overlay) {
  const lines = overlay.split("\n").filter(Boolean);
  return (
    overlay.includes(" vs ") ||
    overlay.includes("VS") ||
    (lines.length >= 2 && lines.some(l => l.includes("やらない")) && lines.some(l => l.match(/^やる/))) ||
    (overlay.includes("普通") && overlay.includes("新NISA") && overlay.includes(":"))
  );
}

function isStepsList(overlay) {
  const lines = overlay.split("\n").filter(Boolean);
  const checkMarks = (overlay.match(/[✓✔⭕]/g) || []).length;
  if (checkMarks >= 2) return true;
  const stepPrefixes = lines.filter(l => /^[①②③④⑤]|^STEP\s*\d|^[\d]+[.)]/i.test(l.trim()));
  return stepPrefixes.length >= 2;
}

function isWarning(overlay, narration) {
  return (
    overlay.includes("注意") ||
    overlay.includes("元本保証") ||
    overlay.includes("自己責任") ||
    narration.includes("元本保証")
  );
}

function buildHook(shot, index) {
  const lines = (shot.text_overlay || "").split("\n").filter(Boolean);
  const headline = lines[0] || shot.narration?.slice(0, 30) || "";
  const subheadline = lines.length > 1 ? lines.slice(1).join("\n") : undefined;
  const emphasis = extractEmphasis(lines.join(" "));

  return {
    id: shot.shot_id || `s${index + 1}`,
    type: "hook",
    durationSec: shot.duration_sec,
    narration: shot.narration,
    headline,
    subheadline,
    emphasis,
  };
}

function buildCTA(shot, index) {
  const lines = (shot.text_overlay || "").split("\n").filter(Boolean);
  return {
    id: shot.shot_id || `s${index + 1}`,
    type: "cta",
    durationSec: shot.duration_sec,
    narration: shot.narration,
    headline: lines[0] || "フォローしてね",
    subtext: lines.length > 1 ? lines[1] : undefined,
    actions: lines.length > 2 ? lines.slice(2) : ["コメントで教えて！"],
  };
}

function buildCompare(shot, index) {
  const overlay = shot.text_overlay || "";
  const lines = overlay.split("\n").filter(Boolean);

  let leftLabel = "";
  let leftValue = "";
  let rightLabel = "";
  let rightValue = "";

  if (lines.some(l => l.includes("やらない")) && lines.some(l => l.match(/^やる/))) {
    for (const line of lines) {
      if (line.includes("やらない")) {
        const parts = line.split(":");
        leftLabel = "やらない";
        leftValue = (parts[1] || "").trim();
      } else if (line.match(/^やる/)) {
        const parts = line.split(":");
        rightLabel = "やる";
        rightValue = (parts[1] || "").trim();
      }
    }
  } else if (overlay.includes("普通") && overlay.includes("新NISA")) {
    leftLabel = "普通の口座";
    rightLabel = "新NISA";
    const vsMatch = overlay.match(/普通[：:]?\s*(.+?)\s*vs\s*新NISA[：:]?\s*(.+)/);
    if (vsMatch) {
      leftValue = vsMatch[1].trim();
      rightValue = vsMatch[2].trim();
    } else {
      for (const line of lines) {
        if (line.includes("普通") && line.includes(":")) {
          leftValue = line.split(":").slice(1).join(":").trim();
        } else if (line.includes("新NISA") && line.includes(":")) {
          rightValue = line.split(":").slice(1).join(":").trim();
        }
      }
      if (!leftValue) leftValue = "税金20%";
      if (!rightValue) rightValue = "税金0%";
    }
  } else {
    leftLabel = lines[0] || "A";
    leftValue = lines[1] || "";
    rightLabel = lines[2] || "B";
    rightValue = lines[3] || "";
  }

  return {
    id: shot.shot_id || `s${index + 1}`,
    type: "compare",
    durationSec: shot.duration_sec,
    narration: shot.narration,
    leftLabel,
    leftValue,
    rightLabel,
    rightValue,
  };
}

function buildSteps(shot, index) {
  const lines = (shot.text_overlay || "").split("\n").filter(Boolean);
  const steps = lines.map(l =>
    l.replace(/^[①②③④⑤]\s*/, "")
      .replace(/^STEP\s*\d\s*/i, "")
      .replace(/^[\d]+[.)]\s*/, "")
      .trim()
  );

  return {
    id: shot.shot_id || `s${index + 1}`,
    type: "steps",
    durationSec: shot.duration_sec,
    narration: shot.narration,
    title: "まとめ",
    steps,
  };
}

function buildWarning(shot, index) {
  const lines = (shot.text_overlay || "").split("\n").filter(Boolean);
  return {
    id: shot.shot_id || `s${index + 1}`,
    type: "warning",
    durationSec: shot.duration_sec,
    narration: shot.narration,
    title: lines[0] || "注意",
    body: lines.slice(1).join("\n") || shot.narration || "",
    severity: "warn",
  };
}

function extractEmphasis(text) {
  const keywords = [];
  const numberMatch = text.match(/[\d,]+万円/g);
  if (numberMatch) keywords.push(...numberMatch);
  const patterns = ["新NISA", "非課税", "無期限", "0%", "ゼロ", "OK"];
  for (const p of patterns) {
    if (text.includes(p)) keywords.push(p);
  }
  return keywords.length > 0 ? keywords : undefined;
}

export function formatSceneSummary(sceneJSON) {
  const lines = [
    `\n  === Scene JSON Summary ===`,
    `  Topic: ${sceneJSON.videoMeta.topic}`,
    `  Duration: ${sceneJSON.videoMeta.durationSec}s`,
    `  Scenes: ${sceneJSON.scenes.length}`,
    ``,
  ];

  for (const s of sceneJSON.scenes) {
    const kind = s.component || s.type || "scene";
    const label = `[${kind.padEnd(18)}]`;
    const dur = `${s.durationSec}s`;
    const title = sceneTitle(s);
    lines.push(`  ${label} ${dur.padStart(4)} — ${(title || "").slice(0, 50)}`);
  }

  lines.push("");
  return lines.join("\n");
}

function sceneTitle(s) {
  if (s.component) {
    const d = s.data || {};
    switch (s.component) {
      case "factCard": return d.headline?.replace(/\n/g, " / ");
      case "compareSplit": return `${d.left?.label} vs ${d.right?.label}`;
      case "stackedBarCompare": return d.title || d.highlight;
      case "taxSavingsDemo": return d.scenarioLabel;
      case "taxFlowDemo": return d.principalLabel || `${d.principal}${d.unit || "万円"} → ${d.principal - d.tax}${d.unit || "万円"}`;
      case "recommendationFocus": return d.focus?.label;
      case "infinityFact": return `${d.title} ${d.emphasis}`;
      case "phoneStepsDemo": return `STEP ${d.currentStep}: ${d.stepLabel}`;
      case "ctaPanel": return d.headline;
      default: return "";
    }
  }
  if (s.type === "hook" || s.type === "cta") return s.headline;
  if (s.type === "steps") return s.title || s.steps?.[0];
  if (s.type === "compare") return `${s.leftLabel} vs ${s.rightLabel}`;
  if (s.type === "warning") return s.title;
  if (s.type === "source") return s.sources?.[0]?.name;
  return "";
}
