/**
 * 金融系台本から [SOURCE:], [INFO TYPE:], [INFO DATE:] マーカーを抽出し構造化する
 */

// [SOURCE: URL, accessed YYYY-MM-DD] または [SOURCE: URL]
const SOURCE_RE = /\[SOURCE:\s*(.+?)(?:,\s*accessed\s+(\d{4}-\d{2}-\d{2}))?\s*\]/g;

// [INFO TYPE: fact|general|opinion]
const INFO_TYPE_RE = /\[INFO TYPE:\s*(fact|general|opinion)\s*\]/g;

// 免責事項キーワード
const DISCLAIMER_KEYWORDS = ["情報提供を目的", "投資は自己責任", "金融商品の勧誘ではありません"];

/**
 * 台本テキストの各行を解析し、直近のコンテキスト（主張文）と紐付ける
 */
function findNearestClaim(lines, markerLineIndex) {
  // マーカーの直前の非空行を主張として扱う
  for (let i = markerLineIndex - 1; i >= Math.max(0, markerLineIndex - 5); i--) {
    const line = lines[i].trim();
    if (line && !line.startsWith("[") && line.length > 5) {
      return line.slice(0, 200);
    }
  }
  // 直前が見つからなければマーカーと同じ行のテキストを使う
  const sameLine = lines[markerLineIndex].replace(/\[.*?\]/g, "").trim();
  return sameLine || "(claim not identified)";
}

/**
 * 台本テキストからソースメタデータを抽出
 * @param {string} scriptText 台本テキスト
 * @param {string} channelId チャンネルID
 * @param {string} topic トピック
 * @param {string} generated 生成タイムスタンプ
 * @returns {object} 構造化されたソースメタデータ
 */
export function extractSourceMetadata(scriptText, channelId, topic, generated) {
  const lines = scriptText.split("\n");
  const sources = [];
  const infoTypeCounts = { fact: 0, general: 0, opinion: 0 };

  // INFO TYPE の集計
  for (const match of scriptText.matchAll(INFO_TYPE_RE)) {
    infoTypeCounts[match[1]]++;
  }

  // 行ごとにマーカーを探索し、主張と紐付け
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // SOURCE マーカーを抽出
    for (const match of line.matchAll(SOURCE_RE)) {
      const url = match[1].trim();
      const accessed = match[2] || undefined;
      const claim = findNearestClaim(lines, i);

      // 同じ行付近の INFO TYPE と INFO DATE を探す
      const contextRange = lines.slice(Math.max(0, i - 3), i + 2).join("\n");
      const typeMatch = contextRange.match(/\[INFO TYPE:\s*(fact|general|opinion)\s*\]/);
      const dateMatch = contextRange.match(/\[INFO DATE:\s*(\d{4}-\d{2}-\d{2})\s*\]/);

      sources.push({
        url,
        ...(accessed && { accessed }),
        claim,
        ...(typeMatch && { info_type: typeMatch[1] }),
        ...(dateMatch && { info_date: dateMatch[1] }),
      });
    }
  }

  // 免責事項の有無
  const hasDisclaimer = DISCLAIMER_KEYWORDS.some((kw) => scriptText.includes(kw));

  // 事実主張のカウント（INFO TYPE: fact のマーカー数 + SOURCE の数から推定）
  const totalClaims = Math.max(sources.length, infoTypeCounts.fact + infoTypeCounts.general);

  return {
    channel_id: channelId,
    topic,
    generated,
    sources,
    summary: {
      total_claims: totalClaims,
      sourced: sources.length,
      unsourced: Math.max(0, totalClaims - sources.length),
      has_disclaimer: hasDisclaimer,
      info_types: infoTypeCounts,
    },
  };
}

/**
 * ソースメタデータのサマリーをCLI表示用にフォーマット
 */
export function formatSourceSummary(metadata) {
  const s = metadata.summary;
  let output = "";
  output += `\n  --- Source Metadata ---\n`;
  output += `  Claims: ${s.sourced}/${s.total_claims} sourced`;
  if (s.unsourced > 0) {
    output += ` [!!] ${s.unsourced} unsourced`;
  }
  output += "\n";
  output += `  Disclaimer: ${s.has_disclaimer ? "[OK]" : "[NG] MISSING"}\n`;
  output += `  Info types: fact=${s.info_types.fact}, general=${s.info_types.general}, opinion=${s.info_types.opinion}\n`;

  if (metadata.sources.length > 0) {
    output += `\n  Sources:\n`;
    for (const src of metadata.sources) {
      output += `  - ${src.url}`;
      if (src.accessed) output += ` (accessed ${src.accessed})`;
      output += "\n";
      output += `    Claim: ${src.claim.slice(0, 80)}${src.claim.length > 80 ? "..." : ""}\n`;
      if (src.info_type) output += `    Type: ${src.info_type}`;
      if (src.info_date) output += ` | Date: ${src.info_date}`;
      if (src.info_type || src.info_date) output += "\n";
    }
  }

  return output;
}
