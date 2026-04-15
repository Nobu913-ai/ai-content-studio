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
import { writeOutput, timestamp } from "../utils/file-helpers.js";
import { manifestSchema, validateOutput } from "../utils/schemas.js";
import { hasAnthropicKey } from "../utils/claude-client.js";

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
    if (scriptResult.manual) {
      results.script = scriptResult;
      results.scriptPath = null;
      results.steps.push({
        step: "script",
        status: "manual",
        note: "ANTHROPIC_API_KEY 未設定 → プロンプトを書き出し済み。Claude Code で実行してください",
      });
    } else {
      results.script = scriptResult;
      results.scriptPath = scriptResult.outputPath;
      results.steps.push({ step: "script", status: "done", path: scriptResult.outputPath });
    }
  }

  // 台本がない場合（手動モードで新規生成時）、後続ステップはスキップ
  if (!results.scriptPath) {
    const manualNote = "台本が未生成のためスキップ — 台本生成後に再実行してください";
    results.steps.push({ step: "shot_plan", status: "manual", note: manualNote });
    results.steps.push({ step: "narration", status: "manual", note: manualNote });
    results.steps.push({ step: "handoff", status: "manual", note: manualNote });
    console.log(`  [2/4] ショットプラン: スキップ (台本未生成)`);
    console.log(`  [3/4] ナレーション: スキップ (台本未生成)`);
    console.log(`  [4/4] ハンドオフ: スキップ (台本未生成)`);
    return results;
  }

  // Step 2: ショットプラン生成
  console.log(`  [2/4] ショットプラン生成中 ...`);
  const shotResult = await generateShotPlan(channelId, results.scriptPath, { format });
  if (shotResult.manual) {
    results.shotPlan = shotResult;
    results.steps.push({
      step: "shot_plan",
      status: "manual",
      note: "ANTHROPIC_API_KEY 未設定 → プロンプトを書き出し済み",
    });
  } else {
    results.shotPlan = shotResult;
    results.steps.push({ step: "shot_plan", status: "done", path: shotResult.outputPath });
  }

  // Step 3: ナレーション整形
  console.log(`  [3/4] ナレーション整形中 ...`);
  const narrationResult = await formatNarration(channelId, results.scriptPath);
  results.narration = narrationResult;
  if (narrationResult.narration?.localFallback) {
    results.steps.push({
      step: "narration",
      status: "done",
      path: narrationResult.outputPath,
      note: "ローカルフォールバック（マーカー除去のみ）",
    });
  } else {
    results.steps.push({ step: "narration", status: "done", path: narrationResult.outputPath });
  }

  // Step 4: DaVinci ハンドオフノート
  console.log(`  [4/4] DaVinci ハンドオフノート生成中 ...`);
  const handoffResult = await generateHandoff(channelId, results.scriptPath, {
    format,
    shotPlanPath: shotResult.manual ? null : shotResult.outputPath,
  });
  if (handoffResult.manual) {
    results.handoff = handoffResult;
    results.steps.push({
      step: "handoff",
      status: "manual",
      note: "ANTHROPIC_API_KEY 未設定 → プロンプトを書き出し済み",
    });
  } else {
    results.handoff = handoffResult;
    results.steps.push({ step: "handoff", status: "done", path: handoffResult.outputPath });
  }

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
  // メディアをリモートURL（Descript渡し可）とローカルパス（手動）に分離
  const results = { steps: [], remoteUrls: [], localPaths: [] };

  // Runway: 動画生成
  if (hasApiKey("RUNWAY_API_KEY")) {
    console.log(`  [5/7] Runway 動画生成中 ...`);
    try {
      const shotPlan = planResults.shotPlan?.shotPlan;
      if (shotPlan && !shotPlan.parseError && shotPlan.shots) {
        const runwayResult = await runwayGeneratePlan(shotPlan.shots, channelId);
        results.runway = runwayResult;
        results.steps.push({ step: "runway", status: "done", succeeded: runwayResult.succeeded });
        // Runway は公開URLを返す → Descript に渡せる
        for (const shot of runwayResult.shots || []) {
          if (shot.outputUrl) results.remoteUrls.push({ type: "video", url: shot.outputUrl, shotId: shot.shotId });
          // ローカル保存済みならパスも記録
          if (shot.localPath) results.localPaths.push({ type: "video", path: shot.localPath, shotId: shot.shotId });
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
      shotPlanPath: planResults.shotPlan?.outputPath || null,
    });
    console.log(`  [5/7] Runway: スキップ (API キー未設定 → ショットプランを手動で使用)`);
  }

  // ElevenLabs: 音声生成
  if (hasApiKey("ELEVENLABS_API_KEY")) {
    console.log(`  [6/7] ElevenLabs 音声生成中 ...`);
    try {
      const narrationText = planResults.narration?.narration?.full_text;
      if (narrationText) {
        const audioResult = await elevenlabsGenerate(channelId, narrationText);
        results.elevenlabs = audioResult;
        results.steps.push({
          step: "elevenlabs",
          status: "done",
          path: audioResult.outputPath,
          metadata: audioResult.metadata,
        });
        // ElevenLabs はローカルパスを返す（Descript にはURLとして渡せない）
        if (audioResult.outputPath) {
          results.localPaths.push({ type: "audio", path: audioResult.outputPath });
        }
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
      narrationTextPath: planResults.narration?.textPath || null,
    });
    console.log(`  [6/7] ElevenLabs: スキップ (API キー未設定 → ナレーションテキストを手動で使用)`);
  }

  // Descript: インポート + AI編集（リモートURLのみ渡す。ローカルパスは手動インポート）
  const descriptableUrls = results.remoteUrls.map((m) => m.url);
  if (hasApiKey("DESCRIPT_API_KEY") && descriptableUrls.length > 0) {
    console.log(`  [7/7] Descript インポート + AI編集中 ...`);
    if (results.localPaths.length > 0) {
      console.log(
        `  [Descript] Note: ローカル音声ファイル ${results.localPaths.length}件は手動でインポートしてください`,
      );
    }
    try {
      const descriptResult = await runDescriptPipeline(channelId, topic, descriptableUrls, {
        captions: true,
        studioSound: true,
        removeFiller: true,
      });
      results.descript = descriptResult;
      results.steps.push({
        step: "descript",
        status: "done",
        projectId: descriptResult.projectId,
        importedUrls: descriptableUrls.length,
        manualImportNeeded: results.localPaths.length,
      });
    } catch (err) {
      results.steps.push({ step: "descript", status: "error", error: err.message });
      console.error(`  [Descript] Error: ${err.message}`);
    }
  } else {
    const reasons = [];
    if (!hasApiKey("DESCRIPT_API_KEY")) reasons.push("DESCRIPT_API_KEY 未設定");
    if (descriptableUrls.length === 0) reasons.push("インポート可能なリモートURLがありません");
    const reason = reasons.join("、");
    results.steps.push({
      step: "descript",
      status: "manual",
      note: reason,
      localPaths: results.localPaths.map((m) => m.path),
    });
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

  // Phase 1: 計画（Claude API — 未設定時はプロンプト書き出し）
  if (!hasAnthropicKey()) {
    console.log(`  [Hybrid] ANTHROPIC_API_KEY 未設定 — 計画フェーズはプロンプト書き出しモード`);
  }
  console.log(`  --- Phase 1: Planning ---`);
  const planResults = await runPlanPhase(channelId, topic, options);

  // Phase 2: 生成（外部API、利用可能な範囲で）
  console.log(`\n  --- Phase 2: Generation (External APIs) ---`);
  const genResults = await runGeneratePhase(channelId, planResults, topic);

  // 結果をまとめてマニフェストJSONとして保存
  const ts = timestamp();
  const allSteps = [...planResults.steps, ...genResults.steps];

  // ElevenLabs メタデータを収集
  const elevenlabsStep = genResults.steps.find((s) => s.step === "elevenlabs" && s.metadata);
  const audioMetadata = elevenlabsStep?.metadata || null;

  const summary = {
    version: "3.0.1",
    channel: channelId,
    topic,
    format: options.format || "shorts",
    generated: ts,
    steps: allSteps,
    outputs: {
      script: planResults.scriptPath || null,
      shotPlan: planResults.shotPlan?.outputPath || null,
      narration: planResults.narration?.outputPath || null,
      narrationText: planResults.narration?.textPath || null,
      handoff: planResults.handoff?.outputPath || null,
      runway: genResults.runway?.outputPath || null,
      elevenlabs: genResults.elevenlabs?.outputPath || null,
      descript: genResults.descript?.outputPath || null,
    },
    media: {
      remoteUrls: genResults.remoteUrls || [],
      localPaths: genResults.localPaths || [],
    },
    audioMetadata,
    manualSteps: allSteps.filter((s) => s.status === "manual"),
    errors: allSteps.filter((s) => s.status === "error").map((s) => ({ step: s.step, error: s.error })),
    stats: {
      totalSteps: allSteps.length,
      completed: allSteps.filter((s) => s.status === "done").length,
      skipped: allSteps.filter((s) => s.status === "skipped").length,
      manual: allSteps.filter((s) => s.status === "manual").length,
      errors: allSteps.filter((s) => s.status === "error").length,
    },
  };

  // スキーマ検証
  const validation = validateOutput(manifestSchema, summary, "manifest");
  if (!validation.valid) {
    for (const w of validation.warnings) console.warn(w);
    summary._schemaWarnings = validation.warnings;
  }

  // マニフェストJSONを保存
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u9fff]+/g, "-")
    .slice(0, 50);
  const manifestPath = `content/${channelId}/metadata/${ts}_${slug}_manifest.json`;
  const manifestFullPath = writeOutput(manifestPath, JSON.stringify(summary, null, 2));
  summary.manifestPath = manifestPath;

  console.log(`\n  Manifest saved: ${manifestPath}`);

  return { plan: planResults, generation: genResults, summary, manifestPath: manifestFullPath };
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
