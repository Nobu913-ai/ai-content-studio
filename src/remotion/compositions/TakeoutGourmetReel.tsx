import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { WarmTextCard } from "../components/takeoutGourmet/WarmTextCard";
import { WarmBulletList } from "../components/takeoutGourmet/WarmBulletList";
import { WarmEndCard } from "../components/takeoutGourmet/WarmEndCard";
import { WarmFoodReveal } from "../components/takeoutGourmet/WarmFoodReveal";
import { WarmTeaserCard } from "../components/takeoutGourmet/WarmTeaserCard";
import { SubtitleLayer } from "../components/SubtitleLayer";
import { SeLayer } from "../components/SeLayer";
import { buildTimeline } from "../utils/scene-timing";
import { takeoutGourmetTheme as t } from "../theme/takeoutGourmetTheme";
import type { SceneJSON, Scene, SceneV2 } from "../types/scene";

export interface TakeoutGourmetReelProps {
  sceneData: SceneJSON;
}

const isV2Scene = (scene: Scene): scene is SceneV2 =>
  typeof (scene as SceneV2).component === "string";

/**
 * takeout-gourmet チャンネル用 Reel コンポジション。
 * 暖色系テーマ (takeoutGourmetTheme) と warm-friendly 専用コンポーネントを使用。
 *
 * 対応コンポーネント:
 *  - warmTextCard (hook / concept / highlight / soft)
 *  - warmBulletList
 *  - warmEndCard
 */
export const TakeoutGourmetReel: React.FC<TakeoutGourmetReelProps> = ({ sceneData }) => {
  const { scenes, audio } = sceneData;
  const { fps } = useVideoConfig();
  const timeline = buildTimeline(scenes);

  return (
    <AbsoluteFill style={{ backgroundColor: t.colors.bgPrimary }}>
      {audio && <Audio src={staticFile(audio)} volume={1} />}

      {timeline.map((entry, i) => {
        const scene = scenes[i];
        const sceneName = isV2Scene(scene) ? scene.component : scene.type;
        return (
          <Sequence
            key={entry.id}
            from={entry.startFrame}
            durationInFrames={entry.durationFrames}
            name={`${sceneName}-${entry.id}`}
          >
            <SceneRenderer scene={scene} />
            {isV2Scene(scene) && (scene.caption || scene.captionSegments) && (
              <SubtitleLayer
                caption={scene.caption}
                captionSegments={scene.captionSegments}
                shotDurationSec={scene.durationSec}
              />
            )}
            {isV2Scene(scene) && scene.seEvents && (
              <SeLayer events={scene.seEvents} shotStartFrame={entry.startFrame} fps={fps} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  if (!isV2Scene(scene)) {
    return <FallbackCard text={`unsupported scene type: ${scene.type}`} />;
  }
  return <ComponentRenderer scene={scene} />;
};

const ComponentRenderer: React.FC<{ scene: SceneV2 }> = ({ scene }) => {
  const data = scene.data as Record<string, unknown>;
  switch (scene.component) {
    case "warmTextCard" as any:
      return (
        <WarmTextCard
          headline={String(data.headline ?? "")}
          subheadline={data.subheadline ? String(data.subheadline) : undefined}
          badge={data.badge ? String(data.badge) : undefined}
          emoji={data.emoji ? String(data.emoji) : undefined}
          floatingEmojis={(data.floatingEmojis as string[]) ?? []}
          variant={data.variant as "hook" | "concept" | "highlight" | "soft" | undefined}
          bgVariant={data.bgVariant as any}
        />
      );
    case "warmBulletList" as any:
      return (
        <WarmBulletList
          title={data.title ? String(data.title) : undefined}
          emoji={data.emoji ? String(data.emoji) : undefined}
          items={(data.items as any[]) ?? []}
          staggerSec={typeof data.staggerSec === "number" ? data.staggerSec : undefined}
          bgVariant={data.bgVariant as any}
        />
      );
    case "warmFoodReveal" as any:
      return (
        <WarmFoodReveal
          title={data.title ? String(data.title) : undefined}
          foods={(data.foods as any[]) ?? []}
          subtitle={data.subtitle ? String(data.subtitle) : undefined}
          staggerSec={typeof data.staggerSec === "number" ? data.staggerSec : undefined}
          bgVariant={data.bgVariant as any}
        />
      );
    case "warmTeaserCard" as any:
      return (
        <WarmTeaserCard
          label={String(data.label ?? "次回予告")}
          headline={String(data.headline ?? "")}
          hintItems={(data.hintItems as any[]) ?? []}
          footnote={data.footnote ? String(data.footnote) : undefined}
          bgVariant={data.bgVariant as any}
        />
      );
    case "warmEndCard" as any:
      return (
        <WarmEndCard
          headline={String(data.headline ?? "")}
          badge={data.badge ? String(data.badge) : undefined}
          subtext={data.subtext ? String(data.subtext) : undefined}
          topics={(data.topics as string[]) ?? []}
          cta={data.cta ? String(data.cta) : undefined}
          emoji={data.emoji ? String(data.emoji) : undefined}
          bgVariant={data.bgVariant as any}
        />
      );
    default:
      return <FallbackCard text={`unknown component: ${scene.component}`} />;
  }
};

const FallbackCard: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.colors.bgPrimary,
      color: t.colors.textPrimary,
      fontSize: 32,
      padding: 40,
      textAlign: "center",
    }}
  >
    {text}
  </AbsoluteFill>
);
