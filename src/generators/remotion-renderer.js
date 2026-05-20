import { execSync } from "child_process";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import { dirname, basename } from "path";
import { readInput, writeOutput, resolve, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateContentPath } from "../utils/validators.js";

/**
 * 音声ファイルをRemotionのpublic/配下にコピーし、
 * scene JSONのaudioパスをstaticFile()互換に書き換える
 */
function prepareAudio(sceneJSON) {
  if (!sceneJSON.audio) return sceneJSON;

  const audioSrc = resolve(sceneJSON.audio);
  if (!existsSync(audioSrc)) {
    console.warn(`  [WARN] 音声ファイルが見つかりません: ${audioSrc}（音声なしでレンダリング）`);
    const copy = { ...sceneJSON };
    delete copy.audio;
    return copy;
  }

  const audioFilename = basename(audioSrc);
  const publicAudioDir = resolve("public/audio");
  mkdirSync(publicAudioDir, { recursive: true });

  const dest = resolve(`public/audio/${audioFilename}`);
  copyFileSync(audioSrc, dest);

  return { ...sceneJSON, audio: `audio/${audioFilename}` };
}

/**
 * Remotion CLIを使ってscene JSONから動画をレンダリングする
 */
export async function renderVideo(channelId, sceneJsonPath, opts = {}) {
  channelId = validateChannelId(channelId);
  sceneJsonPath = validateContentPath(sceneJsonPath);

  const raw = readInput(sceneJsonPath);
  let sceneJSON = JSON.parse(raw);

  sceneJSON = prepareAudio(sceneJSON);

  const slug = sceneJsonPath
    .split("/")
    .pop()
    .split("\\")
    .pop()
    .replace(/\.json$/, "")
    .replace(/_scenes$/, "");

  const outputDir = `content/${channelId}/video`;
  const outputFile = `${outputDir}/${timestamp()}_${slug}.mp4`;
  const outputPath = resolve(outputFile);

  const propsPath = resolve(`content/${channelId}/metadata/_remotion_props_tmp.json`);
  writeOutput(
    `content/${channelId}/metadata/_remotion_props_tmp.json`,
    JSON.stringify({ sceneData: sceneJSON }),
  );

  const entryPoint = resolve("src/remotion/Root.tsx");
  if (!existsSync(entryPoint)) {
    throw new Error(`Remotion エントリポイントが見つかりません: ${entryPoint}`);
  }

  const codec = opts.codec || "h264";
  const concurrency = opts.concurrency || 4;

  // チャンネルごとに使用する Remotion composition を切替
  const compositionByChannel = {
    "genz-money": "GenzMoneyShort",
    "takeout-gourmet": "TakeoutGourmetReel",
  };
  const compositionId =
    opts.composition || compositionByChannel[channelId] || "GenzMoneyShort";

  const cmd = [
    "npx",
    "remotion",
    "render",
    entryPoint,
    compositionId,
    outputPath,
    `--props=${propsPath}`,
    `--codec=${codec}`,
    `--concurrency=${concurrency}`,
  ];

  if (opts.gl) {
    cmd.push(`--gl=${opts.gl}`);
  }

  console.log(`\n  Remotion レンダリング開始...`);
  console.log(`  出力先: ${outputFile}`);
  console.log(`  シーン数: ${sceneJSON.scenes.length}`);
  console.log(`  尺: ${sceneJSON.videoMeta.durationSec}秒\n`);

  try {
    execSync(cmd.join(" "), {
      cwd: resolve(""),
      stdio: "inherit",
      timeout: 600000,
    });
  } catch (err) {
    throw new Error(`Remotion レンダリング失敗: ${err.message}`);
  }

  if (!existsSync(outputPath)) {
    throw new Error(`レンダリング出力ファイルが見つかりません: ${outputPath}`);
  }

  return {
    path: outputPath,
    relativePath: outputFile,
    durationSec: sceneJSON.videoMeta.durationSec,
    scenesCount: sceneJSON.scenes.length,
  };
}

/**
 * Remotion Studioをプレビューモードで起動する
 */
export function startPreview(sceneJsonPath) {
  if (sceneJsonPath) {
    sceneJsonPath = validateContentPath(sceneJsonPath);
    const raw = readInput(sceneJsonPath);
    let sceneJSON = JSON.parse(raw);
    sceneJSON = prepareAudio(sceneJSON);
    const propsPath = resolve("content/_remotion_preview_props.json");
    writeOutput("content/_remotion_preview_props.json", JSON.stringify({ sceneData: sceneJSON }));
    console.log(`  プレビュー用props: ${propsPath}`);
  }

  const entryPoint = resolve("src/remotion/Root.tsx");

  console.log(`\n  Remotion Studio を起動します...`);
  console.log(`  ブラウザでプレビューが開きます\n`);

  try {
    execSync(`npx remotion studio ${entryPoint}`, {
      cwd: resolve(""),
      stdio: "inherit",
    });
  } catch {
    // Studio closed
  }
}
