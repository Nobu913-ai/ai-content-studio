#!/usr/bin/env node

import "dotenv/config";
import { readdirSync, existsSync, statSync } from "fs";
import { Command } from "commander";
import { generateScript } from "./generators/script-generator.js";
import { generateSEO } from "./generators/seo-generator.js";
import { generateCalendar, formatCalendarForDisplay } from "./generators/calendar-generator.js";
import { generateFull, generateFullPipeline } from "./generators/batch-generator.js";
import { generateShorts, generateShortsFromTopic } from "./generators/shorts-generator.js";
import { generateRepurpose } from "./generators/repurpose-generator.js";
import { checkCompliance, formatComplianceReport } from "./generators/compliance-checker.js";
import { getChannel, getChannelIds } from "../config/channels.js";
import { getMonetization, revenueTargets } from "../config/monetization.js";
import { resolve } from "./utils/file-helpers.js";

const program = new Command();

program
  .name("acs")
  .description("AI Content Studio — 3チャンネル統合コンテンツ制作CLI")
  .version("2.0.0");

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
    try {
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
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
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

// ─── 完全パイプライン（台本 + SEO + Shorts + 全SNS展開） ──────────────────────────────
program
  .command("pipeline <channel> <topic>")
  .description("1本の動画から全SNS素材を一括生成（台本+SEO+Shorts+SNS展開+コンプラチェック）")
  .option("-a, --angle <angle>", "特定の切り口を指定")
  .action(async (channelId, topic, opts) => {
    console.log(`\n  === Full Content Pipeline ===`);
    console.log(`  Channel: ${channelId} | Topic: "${topic}"\n`);
    try {
      console.log(`  [1/5] Generating script ...`);
      const result = await generateFullPipeline(channelId, topic, { angle: opts.angle });

      console.log(`  [2/5] SEO metadata ... done`);
      console.log(`  [3/5] Shorts (3 clips) ... done`);
      console.log(`  [4/5] Multi-platform content ... done`);
      console.log(`  [5/5] Compliance check ... done`);

      console.log(`\n  === Output Files ===`);
      console.log(`  Script:     ${result.script.path}`);
      console.log(`  SEO:        ${result.seo.path}`);
      console.log(`  Shorts:     ${result.shorts.path}`);
      console.log(`  Repurpose:  ${result.repurpose.path}`);
      console.log(`  Compliance: ${result.compliance.path}`);

      if (!result.seo.seo.parseError && result.seo.seo.titles) {
        console.log(`\n  Suggested titles:`);
        for (const t of result.seo.seo.titles) {
          console.log(`    -> ${t.text}`);
        }
      }

      if (!result.shorts.shorts.parseError && result.shorts.shorts.shorts) {
        console.log(`\n  Shorts generated:`);
        for (const s of result.shorts.shorts.shorts) {
          console.log(`    [${s.viral_score}] ${s.title}`);
          console.log(`      Hook: "${s.hook}"`);
        }
      }

      if (result.compliance && !result.compliance.check.parseError) {
        const c = result.compliance.check;
        const icon = (v) => v === "pass" ? "[OK]" : v === "warn" ? "[!!]" : "[NG]";
        console.log(`\n  Compliance: ${icon(c.overall_verdict)} ${c.overall_score}/100`);
        if (c.summary) console.log(`  ${c.summary}`);
      }

      console.log(`\n  Total files generated: 5`);
      console.log(`  Ready for: YouTube + TikTok + Instagram + Twitter/X\n`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── Shorts先行テスト（トピックから直接Shorts生成） ──────────────────────────────
program
  .command("shorts-first <channel> <topic>")
  .description("Shorts先行戦略: トピックから直接Shorts3本を生成し仮説検証（長尺台本なし）")
  .action(async (channelId, topic) => {
    console.log(`\n  === Shorts-First Hypothesis Test ===`);
    console.log(`  Channel: ${channelId} | Topic: "${topic}"\n`);
    console.log(`  Generating 3 test Shorts with different angles ...\n`);
    try {
      const result = await generateShortsFromTopic(channelId, topic);
      console.log(`  Shorts saved: ${result.path}`);

      if (!result.shorts.parseError) {
        if (result.shorts.strategy) {
          console.log(`\n  Strategy: ${result.shorts.strategy}`);
        }
        if (result.shorts.shorts) {
          for (const s of result.shorts.shorts) {
            console.log(`\n  [${s.viral_score}] ${s.title}`);
            console.log(`    Angle: ${s.angle}`);
            console.log(`    Hook: "${s.hook}"`);
            console.log(`    TikTok: ${(s.hashtags?.tiktok || []).join(" ")}`);
            if (s.longform_potential) {
              console.log(`    -> Long-form: ${s.longform_potential}`);
            }
          }
        }
        console.log(`\n  Next: Post these Shorts and track performance.`);
        console.log(`  Winner → run 'acs pipeline <channel> <topic>' for full long-form production.\n`);
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── Shorts 生成 ──────────────────────────────
program
  .command("shorts <channel> <script-path>")
  .description("長尺台本から Shorts/TikTok/Reels 用スクリプト3本を生成")
  .action(async (channelId, scriptPath) => {
    console.log(`\n  Generating 3 Shorts from script ...\n`);
    try {
      const result = await generateShorts(channelId, scriptPath);
      console.log(`  Shorts saved: ${result.path}`);
      if (!result.shorts.parseError && result.shorts.shorts) {
        for (const s of result.shorts.shorts) {
          console.log(`\n  [${s.viral_score}] ${s.title} (~${s.estimated_seconds}s)`);
          console.log(`    Hook: "${s.hook}"`);
          console.log(`    TikTok tags: ${(s.hashtags?.tiktok || []).join(" ")}`);
        }
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── マルチプラットフォーム展開 ──────────────────────────────
program
  .command("repurpose <channel> <script-path>")
  .description("台本からYouTube説明文(アフィリエイト入り)+Twitter+Instagramコンテンツを生成")
  .action(async (channelId, scriptPath) => {
    console.log(`\n  Generating multi-platform content ...\n`);
    try {
      const result = await generateRepurpose(channelId, scriptPath);
      console.log(`  Repurpose data saved: ${result.path}`);
      if (!result.repurpose.parseError) {
        if (result.repurpose.twitter_thread) {
          console.log(`\n  Twitter thread (${result.repurpose.twitter_thread.length} tweets)`);
        }
        if (result.repurpose.affiliate_recommendations) {
          console.log(`  Affiliate placements: ${result.repurpose.affiliate_recommendations.length}`);
        }
        console.log(`  Instagram carousel: ${(result.repurpose.instagram_carousel_slides || []).length} slides`);
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── コンプライアンスチェック ──────────────────────────────
program
  .command("check <channel> <script-path>")
  .description("台本のコンプライアンス・品質チェック（誇大表現、AI臭さ、金融コンプラ、独自性）")
  .option("-t, --titles <titles...>", "過去の動画タイトル（重複チェック用）")
  .action(async (channelId, scriptPath, opts) => {
    console.log(`\n  Compliance check for [${channelId}] ...\n`);
    try {
      const result = await checkCompliance(channelId, scriptPath, opts.titles || []);
      console.log(`  Report saved: ${result.path}`);
      console.log(formatComplianceReport(result.check));
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      process.exit(1);
    }
  });

// ─── 収益化ダッシュボード ──────────────────────────────
program
  .command("monetize [channel]")
  .description("収益化戦略・アフィリエイト・収益目標を表示")
  .action((channelId) => {
    try {
      const targets = revenueTargets;
      if (channelId) {
        const config = getMonetization(channelId);
        const ch = getChannel(channelId);
        console.log(`\n  === ${ch.name} 収益化プラン ===\n`);
        console.log(`  月額目標: ¥${config.revenueTarget.toLocaleString()}`);
        console.log(`  優先度: ${config.priority}/3\n`);

        console.log(`  --- アフィリエイト ---`);
        for (const a of config.affiliates) {
          const earning = a.cpa ? `CPA ¥${a.cpa}` : `Commission ${a.commission}`;
          console.log(`    ${a.name} (${a.asp}) — ${earning}`);
        }

        console.log(`\n  --- デジタル商品 ---`);
        for (const p of config.digitalProducts) {
          console.log(`    ${p.name} — ¥${p.price} (${p.platform})${p.note ? ` [${p.note}]` : ""}`);
        }

        console.log(`\n  --- コンプライアンス ---`);
        for (const c of config.compliance) {
          console.log(`    ! ${c}`);
        }
      } else {
        console.log(`\n  === 月次収益ロードマップ ===\n`);
        for (const [month, data] of Object.entries(targets)) {
          const b = data.breakdown;
          console.log(`  ${month}: ¥${data.total.toLocaleString()}`);
          console.log(`    Affiliate: ¥${b.affiliate.toLocaleString()} | Digital: ¥${b.digital.toLocaleString()} | Ads: ¥${b.ads.toLocaleString()} | Sponsor: ¥${b.sponsor.toLocaleString()}`);
        }
        console.log(`\n  チャンネル別詳細: node src/cli.js monetize <channel>\n`);
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
  .action(() => {
    console.log("\n  Content Studio Status\n");

    for (const id of getChannelIds()) {
      const ch = getChannel(id);
      const lang = ch.language === "ja" ? "JP" : "EN";

      const scriptsDir = resolve(`content/${id}/scripts`);
      const metaDir = resolve(`content/${id}/metadata`);
      const calDir = resolve(`content/${id}/calendar`);

      const scriptCount = existsSync(scriptsDir) ? readdirSync(scriptsDir).filter((f) => f.endsWith(".md")).length : 0;
      const metaCount = existsSync(metaDir) ? readdirSync(metaDir).filter((f) => f.endsWith(".json")).length : 0;
      const calCount = existsSync(calDir) ? readdirSync(calDir).filter((f) => f.endsWith(".json")).length : 0;

      let lastUpdated = "-";
      if (scriptCount > 0) {
        const files = readdirSync(scriptsDir).filter((f) => f.endsWith(".md"));
        const latest = files.map((f) => statSync(`${scriptsDir}/${f}`).mtime).sort((a, b) => b - a)[0];
        lastUpdated = latest.toISOString().slice(0, 10);
      }

      console.log(`  [${lang}] ${ch.name} (${id})`);
      console.log(`      Scripts: ${scriptCount} | SEO: ${metaCount} | Calendars: ${calCount} | Last: ${lastUpdated}`);
      console.log();
    }
  });

program.parse();
