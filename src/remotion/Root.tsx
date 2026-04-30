import React from "react";
import { Composition, getInputProps, registerRoot } from "remotion";
import { GenzMoneyShort } from "./compositions/GenzMoneyShort";
import { totalFrames } from "./utils/scene-timing";
import type { SceneJSON } from "./types/scene";

const FPS = 30;

const defaultSceneData: SceneJSON = {
  videoMeta: {
    channel: "genz-money",
    format: "shorts",
    aspectRatio: "9:16",
    durationSec: 10,
    topic: "プレビュー",
  },
  brand: { theme: "genz-money" },
  scenes: [
    {
      id: "preview",
      type: "hook",
      durationSec: 10,
      headline: "プレビュー",
      subheadline: "scene JSONを指定してレンダリングしてください",
    },
  ],
};

const RemotionRoot: React.FC = () => {
  const inputProps = getInputProps() as { sceneData?: SceneJSON } | undefined;
  const sceneData = inputProps?.sceneData ?? defaultSceneData;
  const total = totalFrames(sceneData.scenes);

  return (
    <>
      <Composition
        id="GenzMoneyShort"
        component={GenzMoneyShort}
        durationInFrames={total || FPS * 10}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ sceneData }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
