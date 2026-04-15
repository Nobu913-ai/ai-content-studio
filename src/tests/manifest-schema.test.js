import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { manifestSchema, validateOutput } from "../utils/schemas.js";

describe("manifestSchema", () => {
  const validManifest = {
    version: "3.0.1",
    channel: "genz-money",
    topic: "新NISAの始め方",
    format: "shorts",
    generated: "2026-04-15T10-00-00",
    steps: [
      { step: "script", status: "done", path: "content/genz-money/scripts/test.md" },
      { step: "shot_plan", status: "done", path: "content/genz-money/metadata/test_shots.json" },
      { step: "narration", status: "done", path: "content/genz-money/metadata/test_narration.json" },
      { step: "handoff", status: "done", path: "content/genz-money/metadata/test_handoff.md" },
      {
        step: "runway",
        status: "manual",
        note: "RUNWAY_API_KEY 未設定 — ショットプランを元に手動で生成してください",
      },
      {
        step: "elevenlabs",
        status: "manual",
        note: "ELEVENLABS_API_KEY 未設定 — ナレーションテキストを手動で音声化してください",
      },
      { step: "descript", status: "manual", note: "DESCRIPT_API_KEY 未設定" },
    ],
    outputs: {
      script: "content/genz-money/scripts/test.md",
      shotPlan: "content/genz-money/metadata/test_shots.json",
      narration: "content/genz-money/metadata/test_narration.json",
      narrationText: "content/genz-money/metadata/test_narration.txt",
      handoff: "content/genz-money/metadata/test_handoff.md",
      runway: null,
      elevenlabs: null,
      descript: null,
    },
    media: {
      remoteUrls: [],
      localPaths: [],
    },
    audioMetadata: null,
    manualSteps: [
      {
        step: "runway",
        status: "manual",
        note: "RUNWAY_API_KEY 未設定 — ショットプランを元に手動で生成してください",
      },
      {
        step: "elevenlabs",
        status: "manual",
        note: "ELEVENLABS_API_KEY 未設定 — ナレーションテキストを手動で音声化してください",
      },
      { step: "descript", status: "manual", note: "DESCRIPT_API_KEY 未設定" },
    ],
    errors: [],
    stats: {
      totalSteps: 7,
      completed: 4,
      skipped: 0,
      manual: 3,
      errors: 0,
    },
  };

  it("validates a correct manifest (all manual fallback)", () => {
    const result = validateOutput(manifestSchema, validManifest, "manifest");
    assert.equal(result.valid, true, `Schema warnings: ${result.warnings.join(", ")}`);
  });

  it("validates manifest with media entries", () => {
    const withMedia = {
      ...validManifest,
      media: {
        remoteUrls: [{ type: "video", url: "https://example.com/shot01.mp4", shotId: "shot_01" }],
        localPaths: [{ type: "audio", path: "content/genz-money/audio/narration.mp3" }],
      },
      audioMetadata: {
        channel: "genz-money",
        voice_id: "voice_ja_trust_01",
        model: "eleven_multilingual_v2",
        text_length: 500,
      },
    };
    const result = validateOutput(manifestSchema, withMedia, "manifest");
    assert.equal(result.valid, true, `Schema warnings: ${result.warnings.join(", ")}`);
  });

  it("validates manifest with error steps", () => {
    const withErrors = {
      ...validManifest,
      steps: [
        ...validManifest.steps.slice(0, 4),
        { step: "runway", status: "error", error: "API connection failed" },
        { step: "elevenlabs", status: "done", path: "content/genz-money/audio/test.mp3" },
        { step: "descript", status: "manual", note: "インポート可能なリモートURLがありません" },
      ],
      errors: [{ step: "runway", error: "API connection failed" }],
      stats: { ...validManifest.stats, completed: 5, manual: 1, errors: 1 },
    };
    const result = validateOutput(manifestSchema, withErrors, "manifest");
    assert.equal(result.valid, true, `Schema warnings: ${result.warnings.join(", ")}`);
  });

  it("rejects manifest without required version", () => {
    const noVersion = { ...validManifest, version: "" };
    const result = validateOutput(manifestSchema, noVersion, "manifest");
    assert.equal(result.valid, false);
  });

  it("rejects manifest with invalid format", () => {
    const badFormat = { ...validManifest, format: "unknown" };
    const result = validateOutput(manifestSchema, badFormat, "manifest");
    assert.equal(result.valid, false);
  });

  it("rejects manifest without channel", () => {
    const noChannel = { ...validManifest, channel: "" };
    const result = validateOutput(manifestSchema, noChannel, "manifest");
    assert.equal(result.valid, false);
  });

  it("rejects manifest with invalid step status", () => {
    const badStep = {
      ...validManifest,
      steps: [{ step: "script", status: "invalid" }],
    };
    const result = validateOutput(manifestSchema, badStep, "manifest");
    assert.equal(result.valid, false);
  });

  it("validates stats counters are non-negative", () => {
    const negativeStats = {
      ...validManifest,
      stats: { ...validManifest.stats, errors: -1 },
    };
    const result = validateOutput(manifestSchema, negativeStats, "manifest");
    assert.equal(result.valid, false);
  });

  it("validates outputs allow null values", () => {
    const allNull = {
      ...validManifest,
      outputs: {
        script: null,
        shotPlan: null,
        narration: null,
        narrationText: null,
        handoff: null,
        runway: null,
        elevenlabs: null,
        descript: null,
      },
    };
    const result = validateOutput(manifestSchema, allNull, "manifest");
    assert.equal(result.valid, true, `Schema warnings: ${result.warnings.join(", ")}`);
  });
});
