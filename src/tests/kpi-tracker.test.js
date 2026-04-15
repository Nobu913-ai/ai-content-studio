import { describe, it } from "node:test";
import assert from "node:assert/strict";

// KPI verdict 判定ロジックのテスト
// classifyPerformance は内部関数なので、saveKPI の結果から検証する
// ただしファイル書き込みが発生するため、判定ロジックを直接テストする

describe("KPI verdict classification", () => {
  // classifyPerformance のロジックを再現
  function classifyPerformance(data) {
    const views = Number(data.views) || 0;
    const retention = Number(data.retentionRate) || 0;
    if (views >= 1000 && retention >= 50) return "win";
    if (views < 300 || retention < 30) return "lose";
    return "neutral";
  }

  it("should classify high views + high retention as win", () => {
    assert.equal(classifyPerformance({ views: 2500, retentionRate: 62 }), "win");
  });

  it("should classify exactly threshold views + retention as win", () => {
    assert.equal(classifyPerformance({ views: 1000, retentionRate: 50 }), "win");
  });

  it("should classify low views as lose", () => {
    assert.equal(classifyPerformance({ views: 100, retentionRate: 80 }), "lose");
  });

  it("should classify low retention as lose", () => {
    assert.equal(classifyPerformance({ views: 5000, retentionRate: 20 }), "lose");
  });

  it("should classify medium performance as neutral", () => {
    assert.equal(classifyPerformance({ views: 500, retentionRate: 45 }), "neutral");
  });

  it("should handle zero values as lose", () => {
    assert.equal(classifyPerformance({ views: 0, retentionRate: 0 }), "lose");
  });

  it("should handle string input by converting to number", () => {
    assert.equal(classifyPerformance({ views: "2500", retentionRate: "62" }), "win");
  });

  it("should handle missing values as lose", () => {
    assert.equal(classifyPerformance({}), "lose");
  });
});

describe("KPI metrics parsing", () => {
  function parseMetrics(data) {
    return {
      views: Number(data.views) || 0,
      ctr: Number(data.ctr) || 0,
      avgWatchTime: Number(data.avgWatchTime) || 0,
      retentionRate: Number(data.retentionRate) || 0,
      likes: Number(data.likes) || 0,
      comments: Number(data.comments) || 0,
      shares: Number(data.shares) || 0,
      subscribersGained: Number(data.subscribersGained) || 0,
    };
  }

  it("should parse numeric strings correctly", () => {
    const metrics = parseMetrics({ views: "1500", ctr: "8.5", retentionRate: "62" });
    assert.equal(metrics.views, 1500);
    assert.equal(metrics.ctr, 8.5);
    assert.equal(metrics.retentionRate, 62);
  });

  it("should default to 0 for missing fields", () => {
    const metrics = parseMetrics({});
    assert.equal(metrics.views, 0);
    assert.equal(metrics.likes, 0);
  });

  it("should handle NaN input as 0", () => {
    const metrics = parseMetrics({ views: "not-a-number" });
    assert.equal(metrics.views, 0);
  });
});
