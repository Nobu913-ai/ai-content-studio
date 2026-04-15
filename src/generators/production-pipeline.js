/**
 * Production Pipeline Orchestrator
 *
 * Claude Code → Script → Shot Plan + Narration Text → Runway + ElevenLabs → Descript → DaVinci Handoff
 *
 * 全体フロー:
 * 1. 台本生成（既存 or 指定パス）
 * 2. ショットプラン生成（Claude → Runway用JSON）
 * 3. ナレーション整形（Claude → ElevenLabs用テキスト）
 * 4. 動画生成（Runway API）— API キーがなければスキップ
 * 5. 音声生成（ElevenLabs API）— API キーがなければスキップ
 * 6. Descript インポート（Descript API）— API キーがなければスキップ
 * 7. DaVinci ハンドオフノート生成（常に実行）
 */

import { generateScript } from "./script-generator.js";
import { generateShotPlan } from "./shot-planner.js";
import { formatNarration } from "./narration-formatter.js";
import { generateHandoff } from "./handoff-generator.js";
import { generateShotPlan as runwayGeneratePlan } from "../clients/runway-client.js";
import { generateNarration as elevenlabsGenerate } from "../clients/elevenlabs-client.js";
import { runDescriptPipeline } from "../clients/descript-client.js";
import { validateChannelId, validateTopic } from "../utils/validators.js";

/**
 * API キーの有無を確認（エラーを投げず true/false を返す）
 */
function hasApiKey(envKey) {
  return !!process.env[envKey];
}

/**
 * 制作パイプライン Step 1-3: 計画フェーズ（Claude APIのみ使用）
 * 台本 → ショットプラン → ナレーション整形 → ハンドオフノート
 *
 * @param {string} channelId - チャンネルID
 * @param {string} topic - トピック
 * @param {object} [options]
 * @param {string} [options.scriptPath] - 既存台本パス（省略時は新規生成）
 * @param {string} [options.angle] - 切り口
 * @param {string} [options.format] - "shorts" | "longform"
 * @param {Array<string>} [options.sources] - 一次情報URL（金融系）
 * @returns {Promise<object>} 計画フェーズの全出力
 */
export async function runPlanPhase(channelId, topic, options = {}) {
  channelId = validateChannelId(channelId);
  topic = validateTopic(topic);
  const format = options.format || "shorts";

  const results = { steps: [] };

  // Step 1: 台本生成（既存パスがあればスキップ）
  if (options.scriptPath) {
    results.scriptPath = options.scriptPath;
    results.steps.push({ step: "script", status: "skipped", note: "既存台本を使用" });
  } else {
    console.log(`  [1/4] 台本生成中 ...`);
    const scriptResult = await generateScript(channelId, topic, {
      angle: options.angle,
      sources: options.sources,
    });
    results.script = scriptResult;
    results.scriptPath = scriptResult.outputPath;
    results.steps.push({ step: "script", status: "done", path: scriptResult.outputPath });
  }

  // Step 2: ショットプラン生成
  console.log(`  [2/4] ショットプラン生成中 ...`);
  const shotResult = await generateShotPlan(channelId, results.scriptPath, { format });
  results.shotPlan = shotResult;
  results.steps.push({ step: "shot_plan", status: "done", path: shotResult.outputPath });

  // Step 3: ナレーション整形
  console.log(`  [3/4] ナレーション整形中 ...`);
  const narrationResult = await formatNarration(channelId, results.scriptPath);
  results.narration = narrationResult;
  results.steps.push({ step: "narration", status: "done", path: narrationResult.outputPath });

  // Step 4: DaVinci ハンドオフノート
  console.log(`  [4/4] DaVinci ハンドオフノート生成中 ...`);
  const handoffResult = await generateHandoff(channelId, results.scriptPath, {
    format,
    shotPlanPath: shotResult.outputPath,
  });
  results.handoff = handoffResult;
  results.steps.push({ step: "handoff", status: "done", path: handoffResult.outputPath });

  return results;
}

/**
 * 制作パイプライン Step 4-6: 生成フェーズ（外部API使用）
 * Runway → ElevenLabs → Descript
 *
 * API キーが未設定のツールは自動スキップし、手動ステップとして記録。
 *
 * @param {string} channelId - チャンネルID
 * @param {object} planResults - runPlanPhase の出力
 * @param {string} topic - トピック（Descript プロジェクト名に使用）
 * @returns {Promise<object>} 生成フェーズの全出力
 */
export async function runGeneratePhase(channelId, planResults, topic) {
  const results = { steps: [], mediaUrls: [] };

  // Runway: 動画生成
  if (hasApiKey("RUNWAY_API_KEY")) {
    console.log(`  [5/7] Runway 動画生成中 ...`);
    try {
      const shotPlan = planResults.shotPlan.shotPlan;
      if (shotPlan && !shotPlan.parseError && shotPlan.shots) {
        const runwayResult = await runwayGeneratePlan(shotPlan.shots, channelId);
        results.runway = runwayResult;
        results.steps.push({ step: "runway", status: "done", succeeded: runwayResult.succeeded });
        // 成功したクリップのURLを収集
        for (const shot of runwayResult.shots || []) {
          if (shot.outputUrl) results.mediaUrls.push(shot.outputUrl);
        }
      } else {
        results.steps.push({ step: "runway", status: "skipped", note: "ショットプラン解析失敗" });
      }
    } catch (err) {
      results.steps.push({ step: "runway", status: "error", error: err.message });
      console.error(`  [Runway] Error: ${err.message}`);
    }
  } else {
    results.steps.push({
      step: "runway",
      status: "manual",
      note: "RUNWAY_API_KEY 未設定 — ショットプランを元に手動で生成してください",
      shotPlanPath: planResults.shotPlan.outputPath,
    });
    console.log(`  [5/7] Runway: スキップ (API キー未設定 → ショットプランを手動で使用)`);
  }

  // ElevenLabs: 音声生成
  if (hasApiKey("ELEVENLABS_API_KEY")) {
    console.log(`  [6/7] ElevenLabs 音声生成中 ...`);
    try {
      const narrationText = planResults.narration.narration.full_text;
      if (narrationText) {
        const audioResult = await elevenlabsGenerate(channelId, narrationText);
        results.elevenlabs = audioResult;
        results.steps.push({ step: "elevenlabs", status: "done", path: audioResult.outputPath });
        if (audioResult.outputPath) results.mediaUrls.push(audioResult.outputPath);
      } else {
        results.steps.push({ step: "elevenlabs", status: "skipped", note: "ナレーションテキストが空" });
      }
    } catch (err) {
      results.steps.push({ step: "elevenlabs", status: "error", error: err.message });
      console.error(`  [ElevenLabs] Error: ${err.message}`);
    }
  } else {
    results.steps.push({
      step: "elevenlabs",
      status: "manual",
      note: "ELEVENLABS_API_KEY 未設定 — ナレーションテキストを手動で音声化してください",
      narrationTextPath: planResults.narration.textPath,
    });
    console.log(`  [6/7] ElevenLabs: スキップ (API キー未設定 → ナレーションテキストを手動で使用)`);
  }

  // Descript: インポート + AI編集
  if (hasApiKey("DESCRIPT_API_KEY") && results.mediaUrls.length > 0) {
    console.log(`  [7/7] Descript インポート + AI編集中 ...`);
    try {
      const descriptResult = await runDescriptPipeline(channelId, topic, results.mediaUrls, {
        captions: true,
        studioSound: true,
        removeFiller: true,
      });
      results.descript = descriptResult;
      results.steps.push({ step: "descript", status: "done", projectId: descriptResult.projectId });
    } catch (err) {
      results.steps.push({ step: "descript", status: "error", error: err.message });
      console.error(`  [Descript] Error: ${err.message}`);
    }
  } else {
    const reason = !hasApiKey("DESCRIPT_API_KEY") ? "DESCRIPT_API_KEY 未設定" : "インポート可能なメディアがありません";
    results.steps.push({ step: "descript", status: "manual", note: reason });
    console.log(`  [7/7] Descript: スキップ (${reason})`);
  }

  return results;
}

/**
 * 全工程パイプライン（計画 → 生成 → ハンドオフ）
 * API キーが未設定のツールは自動スキップし、手動ステップとして記録。
 *
 * @param {string} channelId
 * @param {string} topic
 * @param {object} [options]
 * @returns {Promise<object>} 全結果
 */
export async function runFullProduction(channelId, topic, options = {}) {
  console.log(`\n  === Production Pipeline ===`);
  console.log(`  Channel: ${channelId} | Topic: "${topic}"`);
  console.log(`  Format: ${options.format || "shorts"}\n`);

  // Phase 1: 計画（Claude APIのみ）
  console.log(`  --- Phase 1: Planning (Claude API) ---`);
  const planResults = await runPlanPhase(channelId, topic, options);

  // Phase 2: 生成（外部API、利用可能な範囲で）
  console.log(`\n  --- Phase 2: Generation (External APIs) ---`);
  const genResults = await runGeneratePhase(channelId, planResults, topic);

  // 結果をまとめる
  const allSteps = [...planResults.steps, ...genResults.steps];
  const summary = {
    channel: channelId,
    topic,
    format: options.format || "shorts",
    steps: allSteps,
    outputs: {
      script: planResults.scriptPath,
      shotPlan: planResults.shotPlan?.outputPath,
      narration: planResults.narration?.outputPath,
      narrationText: planResults.narration?.textPath,
      handoff: planResults.handoff?.outputPath,
      runway: genResults.runway?.outputPath,
      elevenlabs: genResults.elevenlabs?.outputPath,
      descript: genResults.descript?.outputPath,
    },
    manualSteps: allSteps.filter((s) => s.status === "manual"),
  };

  return { plan: planResults, generation: genResults, summary };
}

/**
 * パイプライン結果を見やすく表示
 */
export function formatProductionSummary(result) {
  const { summary } = result;
  let output = "";

  output += `\n  === Production Summary ===\n`;
  output += `  Channel: ${summary.channel} | Format: ${summary.format}\n\n`;

  // ステップ一覧
  output += `  Steps:\n`;
  for (const step of summary.steps) {
    const icon =
      step.status === "done" ? "[OK]" : step.status === "manual" ? "[>>]" : step.status === "skipped" ? "[--]" : "[!!]";
    output += `  ${icon} ${step.step}`;
    if (step.note) output += ` — ${step.note}`;
    if (step.error) output += ` — ERROR: ${step.error}`;
    if (step.path) output += ` → ${step.path}`;
    output += "\n";
  }

  // 出力ファイル
  output += `\n  Output Files:\n`;
  for (const [key, path] of Object.entries(summary.outputs)) {
    if (path) output += `  - ${key}: ${path}\n`;
  }

  // 手動ステップ
  if (summary.manualSteps.length > 0) {
    output += `\n  Manual Steps Required:\n`;
    for (const step of summary.manualSteps) {
      output += `  [>>] ${step.step}: ${step.note}\n`;
      if (step.shotPlanPath) output += `       Shot plan: ${step.shotPlanPath}\n`;
      if (step.narrationTextPath) output += `       Narration: ${step.narrationTextPath}\n`;
    }
  }

  output += `\n  Next: DaVinci Resolve で最終仕上げ → 投稿\n`;

  return output;
}
