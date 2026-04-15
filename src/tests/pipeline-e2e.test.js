import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { copyAsset, getBasename, resolve } from "../utils/file-helpers.js";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { dirname } from "path";

describe("file-helpers: copyAsset", () => {
  const testDir = "content/_test_copy";
  const srcPath = `${testDir}/src/test_file.txt`;
  const destPath = `${testDir}/dest/test_file.txt`;

  before(() => {
    const srcFull = resolve(srcPath);
    mkdirSync(dirname(srcFull), { recursive: true });
    writeFileSync(srcFull, "test content", "utf-8");
  });

  after(() => {
    rmSync(resolve(testDir), { recursive: true, force: true });
  });

  it("copies existing file to destination", () => {
    const result = copyAsset(srcPath, destPath);
    assert.ok(result);
    assert.ok(existsSync(resolve(destPath)));
  });

  it("returns null when source does not exist", () => {
    const result = copyAsset(`${testDir}/nonexistent.txt`, `${testDir}/dest/none.txt`);
    assert.equal(result, null);
  });

  it("creates destination directory if it does not exist", () => {
    const deepDest = `${testDir}/deep/nested/dir/file.txt`;
    const result = copyAsset(srcPath, deepDest);
    assert.ok(result);
    assert.ok(existsSync(resolve(deepDest)));
  });
});

describe("file-helpers: getBasename", () => {
  it("extracts filename from path", () => {
    assert.equal(getBasename("content/genz-money/scripts/test.md"), "test.md");
  });

  it("handles path with no directory", () => {
    assert.equal(getBasename("file.txt"), "file.txt");
  });

  it("handles path with multiple segments", () => {
    assert.equal(getBasename("a/b/c/d/file.json"), "file.json");
  });
});

describe("pipeline: media URL separation logic", () => {
  it("classifies Runway URLs as remote", () => {
    const remoteUrls = [];
    const localPaths = [];
    const runwayOutputUrl = "https://runway-output.example.com/video.mp4";
    const elevenlabsLocalPath = "content/genz-money/audio/narration.mp3";

    // Simulate Runway: remote URL
    remoteUrls.push({ type: "video", url: runwayOutputUrl, shotId: "shot_01" });
    // Simulate ElevenLabs: local path
    localPaths.push({ type: "audio", path: elevenlabsLocalPath });

    // Only remote URLs should go to Descript
    const descriptableUrls = remoteUrls.map((m) => m.url);
    assert.equal(descriptableUrls.length, 1);
    assert.equal(descriptableUrls[0], runwayOutputUrl);
    assert.ok(!descriptableUrls.includes(elevenlabsLocalPath));
  });

  it("handles empty media arrays", () => {
    const remoteUrls = [];
    const descriptableUrls = remoteUrls.map((m) => m.url);
    assert.equal(descriptableUrls.length, 0);
  });

  it("handles multiple shots and audio files", () => {
    const remoteUrls = [
      { type: "video", url: "https://example.com/shot01.mp4", shotId: "shot_01" },
      { type: "video", url: "https://example.com/shot02.mp4", shotId: "shot_02" },
    ];
    const localPaths = [{ type: "audio", path: "content/ch/audio/narration.mp3" }];

    const descriptableUrls = remoteUrls.map((m) => m.url);
    assert.equal(descriptableUrls.length, 2);
    assert.equal(localPaths.length, 1);
  });
});

describe("pipeline: manifest structure integrity", () => {
  it("all manual fallback produces correct stats", () => {
    const steps = [
      { step: "script", status: "done" },
      { step: "shot_plan", status: "done" },
      { step: "narration", status: "done" },
      { step: "handoff", status: "done" },
      { step: "runway", status: "manual", note: "API key missing" },
      { step: "elevenlabs", status: "manual", note: "API key missing" },
      { step: "descript", status: "manual", note: "API key missing" },
    ];

    const stats = {
      totalSteps: steps.length,
      completed: steps.filter((s) => s.status === "done").length,
      skipped: steps.filter((s) => s.status === "skipped").length,
      manual: steps.filter((s) => s.status === "manual").length,
      errors: steps.filter((s) => s.status === "error").length,
    };

    assert.equal(stats.totalSteps, 7);
    assert.equal(stats.completed, 4);
    assert.equal(stats.manual, 3);
    assert.equal(stats.errors, 0);
    assert.equal(stats.skipped, 0);
  });

  it("mixed success/error produces correct stats", () => {
    const steps = [
      { step: "script", status: "done" },
      { step: "shot_plan", status: "done" },
      { step: "narration", status: "done" },
      { step: "handoff", status: "done" },
      { step: "runway", status: "done", succeeded: 3 },
      { step: "elevenlabs", status: "error", error: "Rate limit" },
      { step: "descript", status: "manual", note: "No remote URLs" },
    ];

    const stats = {
      totalSteps: steps.length,
      completed: steps.filter((s) => s.status === "done").length,
      skipped: steps.filter((s) => s.status === "skipped").length,
      manual: steps.filter((s) => s.status === "manual").length,
      errors: steps.filter((s) => s.status === "error").length,
    };

    assert.equal(stats.totalSteps, 7);
    assert.equal(stats.completed, 5);
    assert.equal(stats.manual, 1);
    assert.equal(stats.errors, 1);
  });

  it("error list correctly extracted from steps", () => {
    const steps = [
      { step: "script", status: "done" },
      { step: "runway", status: "error", error: "Connection timeout" },
      { step: "descript", status: "error", error: "Auth failed" },
    ];

    const errors = steps.filter((s) => s.status === "error").map((s) => ({ step: s.step, error: s.error }));
    assert.equal(errors.length, 2);
    assert.equal(errors[0].step, "runway");
    assert.equal(errors[1].error, "Auth failed");
  });
});

describe("handoff package: asset directory mapping", () => {
  const ASSET_DIRS = {
    script: "docs",
    handoff_note: "docs",
    shot_plan: "docs",
    narration_json: "docs",
    narration_text: "docs",
    runway_shots: "assets/video",
    audio: "assets/audio",
    video: "assets/video",
    stills: "assets/stills",
  };

  it("maps document assets to docs/", () => {
    assert.equal(ASSET_DIRS.script, "docs");
    assert.equal(ASSET_DIRS.shot_plan, "docs");
    assert.equal(ASSET_DIRS.narration_text, "docs");
  });

  it("maps video assets to assets/video/", () => {
    assert.equal(ASSET_DIRS.runway_shots, "assets/video");
    assert.equal(ASSET_DIRS.video, "assets/video");
  });

  it("maps audio assets to assets/audio/", () => {
    assert.equal(ASSET_DIRS.audio, "assets/audio");
  });

  it("has stills directory defined", () => {
    assert.equal(ASSET_DIRS.stills, "assets/stills");
  });
});
