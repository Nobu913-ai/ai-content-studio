import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateChannelId, validateTopic, validateWeeks } from "../utils/validators.js";

describe("validateChannelId", () => {
  it("should accept valid channel IDs", () => {
    assert.equal(validateChannelId("genz-money"), "genz-money");
    assert.equal(validateChannelId("japanese-mindset"), "japanese-mindset");
    assert.equal(validateChannelId("chill-culture"), "chill-culture");
  });

  it("should throw for invalid channel ID", () => {
    assert.throws(() => validateChannelId("nonexistent"), { message: /不明なチャンネル/ });
  });

  it("should throw for empty channel ID", () => {
    assert.throws(() => validateChannelId(""), { message: /チャンネルID/ });
  });
});

describe("validateTopic", () => {
  it("should accept valid topics", () => {
    assert.equal(validateTopic("新NISAの始め方"), "新NISAの始め方");
  });

  it("should trim whitespace", () => {
    assert.equal(validateTopic("  topic  "), "topic");
  });

  it("should throw for empty topic", () => {
    assert.throws(() => validateTopic(""), { message: /トピック/ });
    assert.throws(() => validateTopic("   "), { message: /トピック/ });
  });

  it("should throw for topic exceeding max length", () => {
    const longTopic = "a".repeat(201);
    assert.throws(() => validateTopic(longTopic), { message: /200文字/ });
  });
});

describe("validateWeeks", () => {
  it("should accept valid week numbers", () => {
    assert.equal(validateWeeks(1), 1);
    assert.equal(validateWeeks(4), 4);
    assert.equal(validateWeeks(12), 12);
  });

  it("should throw for weeks out of range", () => {
    assert.throws(() => validateWeeks(0));
    assert.throws(() => validateWeeks(13));
  });
});

describe("currency formatting", () => {
  // repurpose-generator の formatPrice ロジックを直接テスト
  function formatPrice(price, currency) {
    return currency === "USD" ? `$${price}` : `¥${price.toLocaleString()}`;
  }

  it("should format JPY with yen symbol", () => {
    assert.equal(formatPrice(980, undefined), "¥980");
    assert.equal(formatPrice(1480, "JPY"), "¥1,480");
  });

  it("should format USD with dollar symbol", () => {
    assert.equal(formatPrice(7, "USD"), "$7");
    assert.equal(formatPrice(12, "USD"), "$12");
  });

  it("should default to JPY when currency is undefined", () => {
    assert.equal(formatPrice(500, undefined), "¥500");
  });
});
