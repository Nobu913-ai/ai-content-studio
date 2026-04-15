import { writeOutput, readInput, resolve, fileExists, timestamp } from "../utils/file-helpers.js";
import { validateChannelId } from "../utils/validators.js";
import { readdirSync } from "fs";

/**
 * KPIデータを保存
 */
export function saveKPI(channelId, videoId, data) {
  channelId = validateChannelId(channelId);
  if (!videoId || typeof videoId !== "string") {
    throw new Error("videoId は必須です");
  }

  const kpiEntry = {
    videoId,
    channel: channelId,
    savedAt: timestamp(),
    title: data.title || "",
    type: data.type || "longform", // "shorts" | "longform"
    publishedAt: data.publishedAt || "",
    manifestPath: data.manifestPath || null, // 制作マニフェストへの参照
    metrics: {
      views: Number(data.views) || 0,
      ctr: Number(data.ctr) || 0,
      avgWatchTime: Number(data.avgWatchTime) || 0,
      retentionRate: Number(data.retentionRate) || 0,
      likes: Number(data.likes) || 0,
      comments: Number(data.comments) || 0,
      shares: Number(data.shares) || 0,
      subscribersGained: Number(data.subscribersGained) || 0,
    },
    content: {
      hook: data.hook || "",
      angle: data.angle || "",
      topic: data.topic || "",
    },
    verdict: classifyPerformance(data),
  };

  const outputPath = `content/${channelId}/kpi/${videoId}.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(kpiEntry, null, 2));

  return { path: fullPath, kpi: kpiEntry };
}

/**
 * パフォーマンスを分類
 */
function classifyPerformance(data) {
  const views = Number(data.views) || 0;
  const retention = Number(data.retentionRate) || 0;

  // 暫定的な閾値（チャンネル平均が溜まるまで固定値を使用）
  if (views >= 1000 && retention >= 50) return "win";
  if (views < 300 || retention < 30) return "lose";
  return "neutral";
}

/**
 * チャンネルのKPIデータを全件読み込み
 */
export function loadAllKPI(channelId) {
  channelId = validateChannelId(channelId);
  const kpiDir = resolve(`content/${channelId}/kpi`);

  if (!fileExists(`content/${channelId}/kpi`)) {
    return [];
  }

  try {
    const files = readdirSync(kpiDir).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const content = readInput(`content/${channelId}/kpi/${f}`);
      return JSON.parse(content);
    });
  } catch {
    return [];
  }
}

/**
 * 勝ちパターンを抽出してプロンプト用サマリーを生成
 */
export function getWinningPatterns(channelId) {
  const allKPI = loadAllKPI(channelId);
  if (allKPI.length === 0) return null;

  const wins = allKPI.filter((k) => k.verdict === "win");
  const losses = allKPI.filter((k) => k.verdict === "lose");

  if (wins.length === 0 && losses.length === 0) return null;

  let summary = "";

  if (wins.length > 0) {
    summary += "## Past Winning Content (replicate these patterns):\n";
    for (const w of wins.slice(-5)) {
      summary += `- "${w.title}" (${w.metrics.views} views, ${w.metrics.retentionRate}% retention)`;
      if (w.content.hook) summary += ` — Hook: "${w.content.hook}"`;
      if (w.content.angle) summary += ` — Angle: ${w.content.angle}`;
      summary += "\n";
    }
  }

  if (losses.length > 0) {
    summary += "\n## Past Underperforming Content (avoid these patterns):\n";
    for (const l of losses.slice(-3)) {
      summary += `- "${l.title}" (${l.metrics.views} views, ${l.metrics.retentionRate}% retention)`;
      if (l.content.angle) summary += ` — Angle: ${l.content.angle}`;
      summary += "\n";
    }
  }

  // 統計サマリー
  const avgViews = Math.round(allKPI.reduce((s, k) => s + k.metrics.views, 0) / allKPI.length);
  const avgRetention = Math.round(allKPI.reduce((s, k) => s + k.metrics.retentionRate, 0) / allKPI.length);
  summary += `\n## Channel Stats: avg ${avgViews} views, avg ${avgRetention}% retention (${allKPI.length} videos total)\n`;

  return summary;
}

/**
 * マニフェストパスからKPIエントリを検索
 * @param {string} channelId
 * @param {string} manifestPath - マニフェストJSONの相対パス
 * @returns {object|null} 該当するKPIエントリ or null
 */
export function findKPIByManifest(channelId, manifestPath) {
  const allKPI = loadAllKPI(channelId);
  return allKPI.find((k) => k.manifestPath === manifestPath) || null;
}

/**
 * トピック名からKPIエントリを検索
 * @param {string} channelId
 * @param {string} topic - トピック名（部分一致）
 * @returns {Array<object>} 該当するKPIエントリ配列
 */
export function findKPIByTopic(channelId, topic) {
  const allKPI = loadAllKPI(channelId);
  const normalized = topic.toLowerCase();
  return allKPI.filter((k) => k.content.topic && k.content.topic.toLowerCase().includes(normalized));
}

/**
 * KPIサマリーを表示用にフォーマット
 */
export function formatKPISummary(allKPI) {
  if (allKPI.length === 0) return "  KPIデータなし\n";

  let output = "";
  const wins = allKPI.filter((k) => k.verdict === "win").length;
  const neutrals = allKPI.filter((k) => k.verdict === "neutral").length;
  const losses = allKPI.filter((k) => k.verdict === "lose").length;

  const avgViews = Math.round(allKPI.reduce((s, k) => s + k.metrics.views, 0) / allKPI.length);
  const avgCTR = (allKPI.reduce((s, k) => s + k.metrics.ctr, 0) / allKPI.length).toFixed(1);
  const avgRetention = Math.round(allKPI.reduce((s, k) => s + k.metrics.retentionRate, 0) / allKPI.length);

  output += `  動画数: ${allKPI.length} | Win: ${wins} | Neutral: ${neutrals} | Lose: ${losses}\n`;
  output += `  平均: 再生${avgViews}回 | CTR ${avgCTR}% | 維持率${avgRetention}%\n`;

  // 直近のベスト動画
  const sorted = [...allKPI].sort((a, b) => b.metrics.views - a.metrics.views);
  if (sorted.length > 0) {
    output += `\n  --- Top 3 ---\n`;
    for (const k of sorted.slice(0, 3)) {
      const icon = k.verdict === "win" ? "[W]" : k.verdict === "lose" ? "[L]" : "[-]";
      output += `  ${icon} ${k.title} — ${k.metrics.views}回 CTR:${k.metrics.ctr}% 維持:${k.metrics.retentionRate}%\n`;
    }
  }

  return output;
}
