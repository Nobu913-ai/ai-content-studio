import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  seoSchema,
  shortsSchema,
  shortsTestSchema,
  repurposeSchema,
  complianceSchema,
  validateOutput,
} from "../utils/schemas.js";

describe("seoSchema", () => {
  it("should pass with valid SEO data", () => {
    const data = {
      titles: [
        { text: "Title 1", ctr_reason: "Reason 1" },
        { text: "Title 2", ctr_reason: "Reason 2" },
        { text: "Title 3", ctr_reason: "Reason 3" },
      ],
      description: "A valid YouTube description with enough length",
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
    };
    const result = validateOutput(seoSchema, data, "SEO");
    assert.equal(result.valid, true);
    assert.equal(result.warnings.length, 0);
  });

  it("should fail when titles array is too short", () => {
    const data = {
      titles: [{ text: "Title 1", ctr_reason: "Reason 1" }],
      description: "A valid description",
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
    };
    const result = validateOutput(seoSchema, data, "SEO");
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some((w) => w.includes("タイトルは最低3件")));
  });

  it("should fail when tags are fewer than 5", () => {
    const data = {
      titles: [
        { text: "T1", ctr_reason: "R" },
        { text: "T2", ctr_reason: "R" },
        { text: "T3", ctr_reason: "R" },
      ],
      description: "Valid description",
      tags: ["tag1", "tag2"],
    };
    const result = validateOutput(seoSchema, data, "SEO");
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some((w) => w.includes("タグは最低5件")));
  });

  it("should fail when description is too short", () => {
    const data = {
      titles: [
        { text: "T1", ctr_reason: "R" },
        { text: "T2", ctr_reason: "R" },
        { text: "T3", ctr_reason: "R" },
      ],
      description: "Short",
      tags: ["t1", "t2", "t3", "t4", "t5"],
    };
    const result = validateOutput(seoSchema, data, "SEO");
    assert.equal(result.valid, false);
    assert.ok(result.warnings.some((w) => w.includes("説明文が短すぎます")));
  });
});

describe("shortsSchema", () => {
  const validShort = {
    title: "Test Short",
    hook: "Did you know?",
    script: "A script that is definitely longer than fifty characters for validation purposes here.",
    cta: "Follow for more",
    estimated_seconds: 65,
    viral_score: "high",
    viral_reason: "Interesting angle",
  };

  it("should pass with valid shorts data", () => {
    const result = validateOutput(shortsSchema, { shorts: [validShort] }, "Shorts");
    assert.equal(result.valid, true);
  });

  it("should fail with empty shorts array", () => {
    const result = validateOutput(shortsSchema, { shorts: [] }, "Shorts");
    assert.equal(result.valid, false);
  });

  it("should fail when estimated_seconds exceeds 180", () => {
    const result = validateOutput(shortsSchema, { shorts: [{ ...validShort, estimated_seconds: 200 }] }, "Shorts");
    assert.equal(result.valid, false);
  });
});

describe("complianceSchema", () => {
  it("should pass with valid compliance data", () => {
    const data = {
      overall_score: 85,
      overall_verdict: "pass",
      checks: { exaggeration: { score: 90 } },
      summary: "Good quality overall",
    };
    const result = validateOutput(complianceSchema, data, "Compliance");
    assert.equal(result.valid, true);
  });

  it("should fail with invalid verdict", () => {
    const data = {
      overall_score: 85,
      overall_verdict: "invalid",
      checks: {},
      summary: "Test",
    };
    const result = validateOutput(complianceSchema, data, "Compliance");
    assert.equal(result.valid, false);
  });

  it("should fail with score out of range", () => {
    const data = {
      overall_score: 150,
      overall_verdict: "pass",
      checks: {},
      summary: "Test",
    };
    const result = validateOutput(complianceSchema, data, "Compliance");
    assert.equal(result.valid, false);
  });
});

describe("repurposeSchema", () => {
  it("should pass with valid repurpose data", () => {
    const data = {
      youtube_description: "A full YouTube description with affiliate links and timestamps.",
      twitter_thread: ["Tweet 1", "Tweet 2", "Tweet 3"],
      instagram_caption: "Check out our latest video! #tags",
    };
    const result = validateOutput(repurposeSchema, data, "Repurpose");
    assert.equal(result.valid, true);
  });

  it("should fail with insufficient twitter thread", () => {
    const data = {
      youtube_description: "A valid YouTube description here",
      twitter_thread: ["Only one tweet"],
      instagram_caption: "Valid caption",
    };
    const result = validateOutput(repurposeSchema, data, "Repurpose");
    assert.equal(result.valid, false);
  });
});

describe("validateOutput", () => {
  it("should return warnings array for invalid data", () => {
    const result = validateOutput(seoSchema, {}, "Test");
    assert.equal(result.valid, false);
    assert.ok(result.warnings.length > 0);
    assert.ok(result.warnings[0].includes("[SCHEMA]"));
  });

  it("should return original data even when invalid", () => {
    const data = { foo: "bar" };
    const result = validateOutput(seoSchema, data, "Test");
    assert.deepEqual(result.data, data);
  });
});
