import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractSourceMetadata } from "../utils/source-extractor.js";

const CHANNEL = "genz-money";
const TOPIC = "新NISAの始め方";
const TS = "2025-01-15T10-30-00";

describe("extractSourceMetadata", () => {
  it("should extract SOURCE markers with accessed date", () => {
    const script = `新NISAでは年間投資枠が360万円に拡大されました。
[SOURCE: https://www.fsa.go.jp/nisa, accessed 2025-01-10]`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.sources.length, 1);
    assert.equal(result.sources[0].url, "https://www.fsa.go.jp/nisa");
    assert.equal(result.sources[0].accessed, "2025-01-10");
    assert.ok(result.sources[0].claim.includes("360万円"));
  });

  it("should extract SOURCE markers without accessed date", () => {
    const script = `つみたて投資枠は年間120万円です。
[SOURCE: https://www.fsa.go.jp/nisa2]`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.sources.length, 1);
    assert.equal(result.sources[0].url, "https://www.fsa.go.jp/nisa2");
    assert.equal(result.sources[0].accessed, undefined);
  });

  it("should extract multiple sources", () => {
    const script = `新NISAの年間投資枠は360万円。
[SOURCE: https://www.fsa.go.jp/nisa, accessed 2025-01-10]

iDeCoの掛金上限は月23,000円。
[SOURCE: https://www.ideco-koushiki.jp, accessed 2025-01-12]`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.sources.length, 2);
    assert.equal(result.summary.sourced, 2);
  });

  it("should extract INFO TYPE markers and count them", () => {
    const script = `[INFO TYPE: fact] 新NISAの非課税期間は無期限です。
[INFO TYPE: general] 一般的に長期投資はリスクを分散できます。
[INFO TYPE: opinion] 個人的にはインデックス投資がおすすめ。`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.summary.info_types.fact, 1);
    assert.equal(result.summary.info_types.general, 1);
    assert.equal(result.summary.info_types.opinion, 1);
  });

  it("should associate INFO TYPE with nearby SOURCE", () => {
    const script = `[INFO TYPE: fact] 新NISAの年間投資枠は360万円です。
[SOURCE: https://www.fsa.go.jp/nisa, accessed 2025-01-10]`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.sources[0].info_type, "fact");
  });

  it("should associate INFO DATE with nearby SOURCE", () => {
    const script = `[INFO DATE: 2025-01-01] 2025年からの新制度では非課税期間が無期限化。
[SOURCE: https://www.fsa.go.jp/nisa, accessed 2025-01-10]`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.sources[0].info_date, "2025-01-01");
  });

  it("should detect disclaimer presence", () => {
    const script = `投資の基本について解説します。
※ 本動画は情報提供を目的としており、特定の金融商品の勧誘ではありません。投資は自己責任でお願いします。`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.summary.has_disclaimer, true);
  });

  it("should detect missing disclaimer", () => {
    const script = `投資の基本について解説します。特にNISAを中心に。`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.summary.has_disclaimer, false);
  });

  it("should return correct metadata structure", () => {
    const script = `テスト台本`;
    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);

    assert.equal(result.channel_id, CHANNEL);
    assert.equal(result.topic, TOPIC);
    assert.equal(result.generated, TS);
    assert.ok(Array.isArray(result.sources));
    assert.ok(typeof result.summary === "object");
    assert.ok("total_claims" in result.summary);
    assert.ok("sourced" in result.summary);
    assert.ok("unsourced" in result.summary);
    assert.ok("has_disclaimer" in result.summary);
    assert.ok("info_types" in result.summary);
  });

  it("should handle script with no markers", () => {
    const script = `これはマーカーのないシンプルな台本です。
投資について自由に話しましょう。`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    assert.equal(result.sources.length, 0);
    assert.equal(result.summary.sourced, 0);
    assert.equal(result.summary.info_types.fact, 0);
  });

  it("should calculate unsourced claims correctly", () => {
    const script = `[INFO TYPE: fact] 事実1。マーカーのみで出典なし。
[INFO TYPE: fact] 事実2。これも出典なし。
[INFO TYPE: general] 一般論。

出典付きの事実。
[SOURCE: https://example.com]`;

    const result = extractSourceMetadata(script, CHANNEL, TOPIC, TS);
    // total_claims = max(1 source, 2 fact + 1 general) = 3
    assert.equal(result.summary.total_claims, 3);
    assert.equal(result.summary.sourced, 1);
    assert.equal(result.summary.unsourced, 2);
  });
});
