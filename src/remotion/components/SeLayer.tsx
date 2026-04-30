import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * SE種別 (8役割)。
 * ChatGPTの SE Palette 整理 (2026-04-29) を反映。
 *
 * 基本パレット (常用):
 * - pop:        UI数字出現・小見出し・情報確定
 * - tick:       step進行・タップ音・チェック点灯
 * - whoosh:     基本切替・clean な横移動
 * - whooshSoft: 柔らかい大遷移・カード遷移・CTA導入
 * - softImpact: 見出し確定・CTA確定・大事な数字着地
 *
 * 限定パレット (1動画 1〜2回):
 * - popStrong:    強調pop / CTA直前の強調 / タイトル確定の補助
 * - whooshPower:  強い遷移 / CTA必殺技 (1動画1回)
 * - specialImpact: 特殊impact / 1動画1回だけの大きいパネル着地
 */
export type SeType =
  | "pop"
  | "popStrong"
  | "tick"
  | "whoosh"
  | "whooshSoft"
  | "whooshPower"
  | "softImpact"
  | "specialImpact";

export interface SeEvent {
  type: SeType;
  atSec: number;
  volume?: number;
}

export interface SeLayerProps {
  events?: SeEvent[];
  shotStartFrame: number;
  fps: number;
}

const SE_FILE_MAP: Record<SeType, string> = {
  pop: "se/pop.mp3",
  popStrong: "se/pop-strong.mp3",
  tick: "se/tick.mp3",
  whoosh: "se/whoosh.mp3",
  whooshSoft: "se/whoosh-soft.mp3",
  whooshPower: "se/whoosh-power.mp3",
  softImpact: "se/soft-impact.mp3",
  specialImpact: "se/special-impact.mp3",
};

/**
 * Plays small sound effects at specified offsets within a shot.
 *
 * Files expected at public/se/*.mp3:
 *   - pop.mp3
 *   - whoosh.mp3
 *   - tick.mp3
 *   - soft-impact.mp3
 *
 * If a file is missing, Remotion will log a 404 but continue rendering.
 */
export const SeLayer: React.FC<SeLayerProps> = ({ events, shotStartFrame, fps }) => {
  if (!events || events.length === 0) return null;
  return (
    <>
      {events.map((ev, i) => {
        const offsetFrames = Math.round(ev.atSec * fps);
        return (
          <Sequence key={i} from={offsetFrames} durationInFrames={Math.round(2 * fps)}>
            <Audio src={staticFile(SE_FILE_MAP[ev.type])} volume={ev.volume ?? 0.6} />
          </Sequence>
        );
      })}
    </>
  );
};
