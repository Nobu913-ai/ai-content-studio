/**
 * DaVinci Resolve クライアント
 * Python Scripting API ブリッジ経由で DaVinci Resolve を自動操作
 *
 * 前提条件:
 *   - DaVinci Resolve が起動中であること
 *   - Python 3.6+ がインストールされていること
 *   - DaVinci Resolve Scripting API がインストールされていること
 *
 * 環境変数 (任意):
 *   DAVINCI_PYTHON_PATH — Python 実行パス（未設定時は自動検出）
 */

import { execFile } from "child_process";
import { resolve as resolvePath, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";
import { resolve as resolveProject } from "../utils/file-helpers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRIDGE_SCRIPT = resolvePath(__dirname, "davinci", "bridge.py");

/**
 * Python の実行パスを取得
 */
function getPythonPath() {
  if (process.env.DAVINCI_PYTHON_PATH) {
    return process.env.DAVINCI_PYTHON_PATH;
  }

  // Windows: winget でインストールされた Python の一般的なパス
  const localAppData = process.env.LOCALAPPDATA || `${process.env.USERPROFILE}/AppData/Local`;
  const candidates = [
    `${localAppData}\\Programs\\Python\\Python314\\python.exe`,
    `${localAppData}\\Programs\\Python\\Python313\\python.exe`,
    `${localAppData}\\Programs\\Python\\Python312\\python.exe`,
    "C:\\Python314\\python.exe",
    "C:\\Python313\\python.exe",
    "python",
    "python3",
  ];

  for (const p of candidates) {
    try {
      if (p.includes("/") || p.includes("\\")) {
        if (existsSync(p)) return p;
      }
    } catch {
      // 次の候補を試す
    }
  }

  // フォールバック: PATH 上の python
  return "python";
}

/**
 * Python ブリッジスクリプトを実行
 * @param {string} command - サブコマンド名
 * @param {string[]} args - 引数リスト
 * @returns {Promise<object>} JSON レスポンス
 */
function runBridge(command, args = []) {
  return new Promise((resolve, reject) => {
    const python = getPythonPath();
    const fullArgs = [BRIDGE_SCRIPT, command, ...args];

    const env = {
      ...process.env,
      RESOLVE_SCRIPT_API:
        process.env.RESOLVE_SCRIPT_API ||
        `${process.env.PROGRAMDATA || "C:\\ProgramData"}\\Blackmagic Design\\DaVinci Resolve\\Support\\Developer\\Scripting`,
      RESOLVE_SCRIPT_LIB:
        process.env.RESOLVE_SCRIPT_LIB ||
        `${process.env.PROGRAMFILES || "C:\\Program Files"}\\Blackmagic Design\\DaVinci Resolve\\fusionscript.dll`,
    };
    env.PYTHONPATH = `${env.RESOLVE_SCRIPT_API}\\Modules`;

    execFile(python, fullArgs, { env, timeout: 60000, encoding: "utf-8" }, (error, stdout, stderr) => {
      if (error) {
        // Python 未インストール or ブリッジスクリプト実行エラー
        if (error.code === "ENOENT") {
          return reject(
            new Error(
              "Python が見つかりません。DaVinci Resolve 自動化には Python 3.10+ が必要です。\n" +
                "  インストール: winget install Python.Python.3.14\n" +
                "  または DAVINCI_PYTHON_PATH 環境変数で Python パスを指定してください。",
            ),
          );
        }
        return reject(new Error(`DaVinci Bridge エラー: ${stderr || error.message}`));
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (!result.ok) {
          return reject(new Error(`DaVinci Resolve: ${result.error}`));
        }
        resolve(result);
      } catch {
        reject(new Error(`DaVinci Bridge: JSON パース失敗\nstdout: ${stdout}\nstderr: ${stderr}`));
      }
    });
  });
}

/**
 * DaVinci Resolve への接続状態を確認
 * @returns {Promise<object>} { version, product, currentProject, currentPage }
 */
export async function getStatus() {
  return runBridge("status");
}

/**
 * プロジェクトを作成（既存なら開く）
 * @param {string} name - プロジェクト名
 * @param {object} [options]
 * @param {number} [options.width] - 解像度幅 (default: 1080)
 * @param {number} [options.height] - 解像度高 (default: 1920)
 * @param {number} [options.fps] - フレームレート (default: 30)
 * @param {string} [options.timelineName] - タイムライン名
 * @returns {Promise<object>} { project, timeline, resolution, fps }
 */
export async function createProject(name, options = {}) {
  const args = ["--name", name];
  if (options.width) args.push("--width", String(options.width));
  if (options.height) args.push("--height", String(options.height));
  if (options.fps) args.push("--fps", String(options.fps));
  if (options.timelineName) args.push("--timeline-name", options.timelineName);

  console.log(`  [DaVinci] Creating project: ${name} ...`);
  const result = await runBridge("create-project", args);
  console.log(`  [DaVinci] [OK] Project: ${result.project} | Timeline: ${result.timeline} | ${result.resolution} @ ${result.fps}fps`);
  return result;
}

/**
 * メディアファイルをインポート
 * @param {string[]} filePaths - ファイルパスの配列（相対パスは自動解決）
 * @param {object} [options]
 * @param {string} [options.folder] - メディアプール内のサブフォルダ名
 * @returns {Promise<object>} { folder, imported, count }
 */
export async function importMedia(filePaths, options = {}) {
  // 相対パスをプロジェクトルートからの絶対パスに変換
  const absPaths = filePaths.map((p) => resolveProject(p));
  const args = ["--files", ...absPaths];
  if (options.folder) args.push("--folder", options.folder);

  console.log(`  [DaVinci] Importing ${absPaths.length} file(s) ...`);
  const result = await runBridge("import-media", args);
  console.log(`  [DaVinci] [OK] Imported ${result.count} file(s) into "${result.folder}"`);
  return result;
}

/**
 * ショットプランに基づきタイムラインを構築
 * @param {string} shotPlanPath - ショットプラン JSON パス
 * @param {object} [options]
 * @param {string} [options.audioPath] - ナレーション音声パス
 * @returns {Promise<object>} { timeline, shots_planned, shots_added, shots_missing, details }
 */
export async function buildTimeline(shotPlanPath, options = {}) {
  const args = ["--shot-plan", resolveProject(shotPlanPath)];
  if (options.audioPath) args.push("--audio", resolveProject(options.audioPath));

  console.log(`  [DaVinci] Building timeline from shot plan ...`);
  const result = await runBridge("build-timeline", args);
  console.log(
    `  [DaVinci] [OK] Timeline: ${result.timeline} | Added: ${result.shots_added}/${result.shots_planned} | Missing: ${result.shots_missing}`,
  );
  return result;
}

/**
 * テキストオーバーレイを追加
 * @param {Array<{text: string, start_sec?: number, duration_sec?: number}>} overlays
 * @returns {Promise<object>} { overlays_requested, overlays_added }
 */
export async function addTextOverlays(overlays) {
  const args = ["--overlays", JSON.stringify(overlays)];

  console.log(`  [DaVinci] Adding ${overlays.length} text overlay(s) ...`);
  const result = await runBridge("add-text", args);
  console.log(`  [DaVinci] [OK] Added ${result.overlays_added}/${result.overlays_requested} overlay(s)`);
  return result;
}

/**
 * レンダーキューに追加（オプションで即座に開始）
 * @param {string} outputDir - 出力ディレクトリ
 * @param {object} [options]
 * @param {string} [options.filename] - 出力ファイル名
 * @param {string} [options.format] - フォーマット (default: mp4)
 * @param {string} [options.codec] - コーデック (default: H264)
 * @param {number} [options.width] - 解像度幅
 * @param {number} [options.height] - 解像度高
 * @param {boolean} [options.start] - true で即座にレンダリング開始
 * @returns {Promise<object>} { jobId, status, outputDir, filename }
 */
export async function render(outputDir, options = {}) {
  const args = ["--output-dir", resolveProject(outputDir)];
  if (options.filename) args.push("--filename", options.filename);
  if (options.format) args.push("--format", options.format);
  if (options.codec) args.push("--codec", options.codec);
  if (options.width) args.push("--width", String(options.width));
  if (options.height) args.push("--height", String(options.height));
  if (options.start) args.push("--start");

  console.log(`  [DaVinci] Adding render job ...`);
  const result = await runBridge("render", args);
  console.log(`  [DaVinci] [OK] Job ${result.jobId}: ${result.status}`);
  return result;
}

/**
 * レンダリング状況を確認
 * @returns {Promise<object>} { isRendering, jobs }
 */
export async function getRenderStatus() {
  return runBridge("render-status");
}

/**
 * ハンドオフパッケージから一括自動化
 * プロジェクト作成 → メディアインポート → タイムライン構築 → テキスト追加 → レンダーキュー
 *
 * @param {string} packageDir - ハンドオフパッケージのディレクトリパス
 * @param {object} [options]
 * @param {boolean} [options.startRender] - true で即座にレンダリング開始
 * @returns {Promise<object>} 各ステップの結果
 */
export async function assembleFromPackage(packageDir, options = {}) {
  const pkgJsonPath = resolveProject(`${packageDir}/package.json`);
  if (!existsSync(pkgJsonPath)) {
    throw new Error(`ハンドオフパッケージが見つかりません: ${pkgJsonPath}`);
  }

  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
  const results = { steps: [] };

  // 1. プロジェクト作成
  const preset = pkg.export_preset || {};
  const [width, height] = (preset.resolution || "1080x1920").split("x").map(Number);
  const projectName = `${pkg.channel}_${pkg.generated}`;

  try {
    const projectResult = await createProject(projectName, {
      width,
      height,
      fps: preset.fps || 30,
      timelineName: projectName,
    });
    results.project = projectResult;
    results.steps.push({ step: "create-project", status: "done" });
  } catch (e) {
    results.steps.push({ step: "create-project", status: "error", error: e.message });
    return results;
  }

  // 2. メディアインポート
  const mediaFiles = [];
  for (const asset of pkg.assets || []) {
    if (asset.exists && asset.copied) {
      const assetPath = `${packageDir}/${asset.packagePath}`;
      const absPath = resolveProject(assetPath);
      if (existsSync(absPath)) {
        mediaFiles.push(assetPath);
      }
    }
  }

  if (mediaFiles.length > 0) {
    try {
      const importResult = await importMedia(mediaFiles, { folder: "Assets" });
      results.import = importResult;
      results.steps.push({ step: "import-media", status: "done" });
    } catch (e) {
      results.steps.push({ step: "import-media", status: "error", error: e.message });
    }
  }

  // 3. ショットプランがあればタイムライン構築
  const shotPlanAsset = (pkg.assets || []).find((a) => a.type === "shot_plan" && a.exists);
  const audioAsset = (pkg.assets || []).find((a) => a.type === "audio" && a.exists);

  if (shotPlanAsset) {
    try {
      const timelineResult = await buildTimeline(`${packageDir}/${shotPlanAsset.packagePath}`, {
        audioPath: audioAsset ? `${packageDir}/${audioAsset.packagePath}` : undefined,
      });
      results.timeline = timelineResult;
      results.steps.push({ step: "build-timeline", status: "done" });
    } catch (e) {
      results.steps.push({ step: "build-timeline", status: "error", error: e.message });
    }
  }

  // 4. テキストオーバーレイ（ハンドオフノートからの抽出は将来対応）
  // 現状はスキップ — 手動で追加するか、ショットプランの overlay_text を使用
  results.steps.push({ step: "add-text", status: "skipped", note: "手動追加推奨" });

  // 5. レンダーキュー
  try {
    const outputDir = `content/${pkg.channel}/output`;
    const renderResult = await render(outputDir, {
      filename: projectName,
      format: "mp4",
      codec: "H264",
      width,
      height,
      start: options.startRender || false,
    });
    results.render = renderResult;
    results.steps.push({ step: "render", status: renderResult.status });
  } catch (e) {
    results.steps.push({ step: "render", status: "error", error: e.message });
  }

  return results;
}
