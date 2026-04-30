const FPS = 30;

export function secToFrames(sec: number): number {
  return Math.round(sec * FPS);
}

export function framesToSec(frames: number): number {
  return frames / FPS;
}

export interface SceneTimingEntry {
  id: string;
  startFrame: number;
  durationFrames: number;
}

export function buildTimeline(
  scenes: { id: string; durationSec: number }[],
): SceneTimingEntry[] {
  let cursor = 0;
  return scenes.map((s) => {
    const entry: SceneTimingEntry = {
      id: s.id,
      startFrame: cursor,
      durationFrames: secToFrames(s.durationSec),
    };
    cursor += entry.durationFrames;
    return entry;
  });
}

export function totalFrames(
  scenes: { durationSec: number }[],
): number {
  return scenes.reduce((sum, s) => sum + secToFrames(s.durationSec), 0);
}
