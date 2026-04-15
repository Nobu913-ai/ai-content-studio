#!/usr/bin/env node

import { Command } from "commander";
import { generateScript } from "./generators/script-generator.js";
import { generateSEO } from "./generators/seo-generator.js";
import { generateCalendar, formatCalendarForDisplay } from "./generators/calendar-generator.js";
import { generateFull } from "./generators/batch-generator.js";
import { getChannel, getChannelIds } from "../config/channels.js";

const program = new Command();

program
  .name("acs")
  .description("AI Content Studio — 3チャンネル統合コンテンツ制作CLI")
  .version("1.0.0");

// ─── チャンネル一覧 ──────────────────────────────
program
  .command("channels")
  .description("登録チャンネル一覧を表示")
  .action(() => {
    const ids = getChannelIds();
    console.log("\n  Registered Channels:\n");
    for (const id of ids) {
      const ch = getChannel(id);
      const lang = ch.language === "ja" ? "🇯🇵" : "🌍";
      console.log(`  ${lang}  ${id}`);
      console.log(`      ${ch.name} — ${ch.description}`);
      console.log(`      CPM: ${ch.estimatedCPM} | Frequency: ${ch.uploadFrequency}`);
      console.log();
    }
  });

// ─── トピック一覧 ──────────────────────────────
program
  .command("topics <channel>")
  .description("チャンネルの登録トピック一覧を表示")
  .action((channelId) => {
    const ch = getChannel(channelId);
    console.log(`\n  ${ch.name} — Topics\n`);
    for (const cat of ch.categories) {
      console.log(`  [${cat.name}]`);
      for (const topic of cat.topics) {
        console.log(`    - ${topic.title}`);
        console.log(`      keywords: ${topic.keywords.join(", ")}`);
      }
      console.log();
    }
  });

// ─── 台本生成 ──────────────────────────────
program
  .command("script <channel> <topic>")
  .description("指定チャンネル・トピックの台本を生成")
  .option("-a, --angle <angle>", "特定の切り口を指定")
  .action(async (channelId, topic, opts) => {
    console.log(`\n  Generating script for [${channelId}]: "${topic}" ...\n`);
    try {
      const result = await generateScript(channelId, topic, { angle: opts.angle });
      console.log(`  Script saved: ${result.path}`);
      console.log(`  ───────────────────────────────────`);
      console.log(result.script.slice(0, 500) + "\n  ...\n");
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── SEO メタデータ生成 ──────────────────────────────
program
  .command("seo <channel> <script-path>")
  .description("台本ファイルからSEOメタデータを生成")
  .action(async (channelId, scriptPath) => {
    console.log(`\n  Generating SEO metadata for [${channelId}] ...\n`);
    try {
      const result = await generateSEO(channelId, scriptPath);
      console.log(`  SEO metadata saved: ${result.path}`);
      if (!result.seo.parseError) {
        console.log(`\n  Title options:`);
        for (const t of result.seo.titles || []) {
          console.log(`    -> ${t.text}`);
          console.log(`       (${t.ctr_reason})`);
        }
        console.log(`\n  Tags: ${(result.seo.tags || []).slice(0, 10).join(", ")} ...`);
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── カレンダー生成 ──────────────────────────────
program
  .command("calendar <channel>")
  .description("コンテンツカレンダーを生成（4週間分）")
  .option("-w, --weeks <number>", "週数", "4")
  .option("-s, --start <date>", "開始日 (YYYY-MM-DD)")
  .action(async (channelId, opts) => {
    console.log(`\n  Generating ${opts.weeks}-week calendar for [${channelId}] ...\n`);
    try {
      const result = await generateCalendar(channelId, {
        weeks: parseInt(opts.weeks),
        startDate: opts.start,
      });
      console.log(`  Calendar saved: ${result.path}`);
      console.log(formatCalendarForDisplay(result.calendar));
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── フルパイプライン（台本 + SEO 一括） ──────────────────────────────
program
  .command("full <channel> <topic>")
  .description("台本生成 + SEO最適化 を一括実行")
  .option("-a, --angle <angle>", "特定の切り口を指定")
  .action(async (channelId, topic, opts) => {
    console.log(`\n  Full pipeline for [${channelId}]: "${topic}"\n`);
    console.log(`  Step 1/2: Generating script ...`);
    try {
      const result = await generateFull(channelId, topic, { angle: opts.angle });

      console.log(`  Step 2/2: Generating SEO metadata ...`);
      console.log(`\n  Done!`);
      console.log(`  Script:   ${result.script.path}`);
      console.log(`  SEO:      ${result.seo.path}`);

      if (!result.seo.seo.parseError && result.seo.seo.titles) {
        console.log(`\n  Suggested titles:`);
        for (const t of result.seo.seo.titles) {
          console.log(`    -> ${t.text}`);
        }
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── ステータス表示 ──────────────────────────────
program
  .command("status")
  .description("全チャンネルのコンテンツ制作状況を表示")
  .action(async () => {
    const { readdirSync, existsSync } = await import("fs");
    const { resolve } = await import("./utils/file-helpers.js");

    console.log("\n  Content Studio Status\n");

    for (const id of getChannelIds()) {
      const ch = getChannel(id);
      const lang = ch.language === "ja" ? "🇯🇵" : "🌍";

      const scriptsDir = resolve(`content/${id}/scripts`);
      const metaDir = resolve(`content/${id}/metadata`);
      const calDir = resolve(`content/${id}/calendar`);

      const scriptCount = existsSync(scriptsDir) ? readdirSync(scriptsDir).filter((f) => f.endsWith(".md")).length : 0;
      const metaCount = existsSync(metaDir) ? readdirSync(metaDir).filter((f) => f.endsWith(".json")).length : 0;
      const calCount = existsSync(calDir) ? readdirSync(calDir).filter((f) => f.endsWith(".json")).length : 0;

      console.log(`  ${lang}  ${ch.name} (${id})`);
      console.log(`      Scripts: ${scriptCount} | SEO: ${metaCount} | Calendars: ${calCount}`);
      console.log();
    }
  });

program.parse();
