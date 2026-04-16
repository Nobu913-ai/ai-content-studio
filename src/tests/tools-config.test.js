import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTool,
  getVoiceConfig,
  getShotStyle,
  tools,
  voiceRouting,
  shotStyles,
  exportPresets,
  deferredTools,
} from "../../config/tools.js";

describe("tools config", () => {
  it("should have 5 active tools", () => {
    assert.equal(Object.keys(tools).length, 5);
    assert.ok(tools.runway);
    assert.ok(tools.elevenlabs);
    assert.ok(tools.descript);
    assert.ok(tools.davinci);
    assert.ok(tools.voicevox);
  });

  it("should have API keys defined for API-based tools", () => {
    assert.equal(tools.runway.envKey, "RUNWAY_API_KEY");
    assert.equal(tools.elevenlabs.envKey, "ELEVENLABS_API_KEY");
    assert.equal(tools.descript.envKey, "DESCRIPT_API_KEY");
    assert.equal(tools.davinci.envKey, null);
  });

  it("should return tool by ID", () => {
    const tool = getTool("runway");
    assert.equal(tool.name, "Runway Standard");
  });

  it("should throw for unknown tool ID", () => {
    assert.throws(() => getTool("nonexistent"), { message: /不明なツール/ });
  });
});

describe("voice routing", () => {
  it("should have routing for all 3 channels", () => {
    assert.ok(voiceRouting["genz-money"]);
    assert.ok(voiceRouting["japanese-mindset"]);
    assert.ok(voiceRouting["chill-culture"]);
  });

  it("should route genz-money to Japanese voice", () => {
    const config = getVoiceConfig("genz-money");
    assert.equal(config.language, "ja");
    assert.ok(config.voice_id);
    assert.ok(config.stability > 0);
  });

  it("should route japanese-mindset to English voice", () => {
    const config = getVoiceConfig("japanese-mindset");
    assert.equal(config.language, "en");
  });

  it("should throw for unknown channel", () => {
    assert.throws(() => getVoiceConfig("nonexistent"), { message: /Voice routing/ });
  });
});

describe("shot styles", () => {
  it("should have styles for all 3 channels", () => {
    assert.ok(shotStyles["genz-money"]);
    assert.ok(shotStyles["japanese-mindset"]);
    assert.ok(shotStyles["chill-culture"]);
  });

  it("should default genz-money to 9:16", () => {
    const style = getShotStyle("genz-money");
    assert.equal(style.defaultAspectRatio, "9:16");
  });

  it("should default japanese-mindset to 16:9", () => {
    const style = getShotStyle("japanese-mindset");
    assert.equal(style.defaultAspectRatio, "16:9");
  });

  it("should have duration ranges", () => {
    const style = getShotStyle("genz-money");
    assert.ok(style.durationRange.min > 0);
    assert.ok(style.durationRange.max > style.durationRange.min);
  });

  it("should throw for unknown channel", () => {
    assert.throws(() => getShotStyle("nonexistent"), { message: /Shot style/ });
  });
});

describe("export presets", () => {
  it("should have shorts preset at 1080x1920", () => {
    assert.equal(exportPresets.shorts.resolution, "1080x1920");
    assert.equal(exportPresets.shorts.aspectRatio, "9:16");
  });

  it("should have longform 16:9 preset at 1920x1080", () => {
    assert.equal(exportPresets.longform_16_9.resolution, "1920x1080");
    assert.equal(exportPresets.longform_16_9.aspectRatio, "16:9");
  });
});

describe("deferred tools", () => {
  it("should have at least 5 deferred tools", () => {
    assert.ok(deferredTools.length >= 5);
  });

  it("should have priority and condition for each", () => {
    for (const tool of deferredTools) {
      assert.ok(tool.name);
      assert.ok(tool.priority);
      assert.ok(tool.condition);
    }
  });
});
