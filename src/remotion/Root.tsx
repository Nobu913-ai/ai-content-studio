import React from "react";
import { Composition, getInputProps, registerRoot } from "remotion";
import { GenzMoneyShort } from "./compositions/GenzMoneyShort";
import { GenzMoneyNoteImage } from "./compositions/GenzMoneyNoteImage";
import type { NoteImageId } from "./compositions/GenzMoneyNoteImage";
import { TakeoutGourmetReel } from "./compositions/TakeoutGourmetReel";
import { totalFrames } from "./utils/scene-timing";
import type { SceneJSON } from "./types/scene";

const FPS = 30;

const noteImageCompositions: { id: string; imageId: NoteImageId }[] = [
  { id: "GenzMoneyNoteTop", imageId: "top" },
  { id: "GenzMoneyNoteCompoundFlow", imageId: "compoundFlow" },
  { id: "GenzMoneyNoteProjectionTable", imageId: "projectionTable" },
  { id: "GenzMoneyNoteBreakdown", imageId: "breakdown" },
  { id: "GenzMoneyNoteGrowthChart", imageId: "growthChart" },
  { id: "GenzMoneyNoteStartSmall", imageId: "startSmall" },
  { id: "GenzMoneyNoteCheckpoints", imageId: "checkpoints" },
  { id: "GenzMoneyNoteSummary", imageId: "summary" },
];

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

const GenzMoneyShortComposition: React.FC<{ sceneData?: SceneJSON }> = ({
  sceneData = defaultSceneData,
}) => <GenzMoneyShort sceneData={sceneData} />;

const defaultTakeoutSceneData: SceneJSON = {
  videoMeta: {
    channel: "takeout-gourmet",
    format: "shorts",
    aspectRatio: "9:16",
    durationSec: 10,
    topic: "プレビュー",
  },
  brand: { theme: "takeout-gourmet" },
  scenes: [
    {
      id: "preview",
      component: "warmTextCard",
      durationSec: 10,
      data: {
        headline: "プレビュー",
        subheadline: "scene JSONを指定してレンダリングしてください",
        variant: "concept",
      },
    } as any,
  ],
};

const TakeoutGourmetReelComposition: React.FC<{ sceneData?: SceneJSON }> = ({
  sceneData = defaultTakeoutSceneData,
}) => <TakeoutGourmetReel sceneData={sceneData} />;

const RemotionRoot: React.FC = () => {
  const inputProps = getInputProps() as { sceneData?: SceneJSON } | undefined;
  const sceneData = inputProps?.sceneData ?? defaultSceneData;
  const channelId = sceneData.videoMeta?.channel;
  const isTakeoutGourmet = channelId === "takeout-gourmet";
  const takeoutSceneData = isTakeoutGourmet ? sceneData : defaultTakeoutSceneData;

  const total = totalFrames(sceneData.scenes);
  const takeoutTotal = totalFrames(takeoutSceneData.scenes);

  return (
    <>
      <Composition
        id="GenzMoneyShort"
        component={GenzMoneyShortComposition}
        durationInFrames={total || FPS * 10}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ sceneData }}
      />
      <Composition
        id="TakeoutGourmetReel"
        component={TakeoutGourmetReelComposition}
        durationInFrames={takeoutTotal || FPS * 10}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ sceneData: takeoutSceneData }}
      />
      {noteImageCompositions.map(({ id, imageId }) => (
        <Composition
          key={id}
          id={id}
          component={GenzMoneyNoteImage}
          durationInFrames={1}
          fps={FPS}
          width={1280}
          height={720}
          defaultProps={{ imageId }}
        />
      ))}
    </>
  );
};

registerRoot(RemotionRoot);
