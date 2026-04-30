# Remotion動画品質改善 v2 設計書

作成日: 2026-04-29
対象: `genz-money` 新NISA Shorts #01-hook

ChatGPTフィードバック v2 (`remotion-video-review_nisa-hook_2026-04-29_v2.md`) を踏まえた設計提案。

---

## 0. 設計方針サマリ

| 項目 | 現状 (v1) | 改善 (v2) |
|------|-----------|-----------|
| 動画尺 | 68秒 | **65〜70秒（マスター）** — TikTok収益化対応で短縮しない |
| strongest proof | 38秒〜（中盤以降） | **0〜10秒** に前倒し |
| scene type | 抽象6種（hook/steps/compare/warning/source/cta） | **コンポーネント指向**（factCard, compareSplit, stackedBar, taxSavings, infinity, phoneSteps, cta） |
| データ表現 | headline/subheadline/emphasis中心 | **component別の data フィールド**（数値・ラベル・モーション指定） |
| 字幕 | headlineが字幕兼用 | **caption フィールドで分離**（下部ライブ字幕） |
| 音声 | 文間長い・話速1.02 | 文間300ms→**150ms**、話速1.02→**1.08** |
| 表現 | 「税金ゼロ」「10分で完了」など断定強め | **金融コンプラ寄せ**（NISA口座内の運用益は非課税、最短ですぐ申込み完了 等） |

---

## 1. 新台本（推定67秒）

### 1.1 全文

```
0:00  投資で100万円儲けても、約20万円は税金で取られる。
0:04  でも新NISAなら、100万円まるまる残る。
0:10  これが、新NISA。
0:13  2024年に始まった、国の非課税投資制度。
0:18  つみたて投資枠は年間120万円。
0:22  成長投資枠は年間240万円。
0:25  合わせて年間360万円まで、非課税で投資できる。
0:30  しかも非課税期間は、無期限。
0:34  通常、運用益には約20%の税金がかかる。
0:40  でもNISA口座内の運用益は非課税。
0:44  始め方はシンプル。
0:46  ネット証券でNISA口座を開設して、つみたて設定するだけ。
0:53  最短ならスマホでサクッと申込みまで進められる。
0:58  月100円から積立できる証券会社もある。
1:02  まずは少額から始めるのがおすすめ。
1:05  詳しい始め方は、固定コメントかプロフィールへ。
```

**冒頭の設計意図**: ターゲット（投資初心者）にとって「投資の利益に税金20%かかる」こと自体が新情報になる。1文目で前提（税金がかかる）と数字インパクト（20万円）を同時に伝え、2文目で即座にNISAによる解決を提示する。これにより、初心者でも10秒以内にNISAの価値を理解できる。

### 1.2 v1からの主な変更

| 項目 | v1 | v2 |
|------|----|----|
| 冒頭 | "ねえ、知ってた？" → "月100円〜" → "税金ゼロ" → "知らない=損" | **「投資の利益に税金20%かかる」事実 → NISAで非課税** を10秒以内に提示（初心者向けに前提知識から構築） |
| "税金ゼロ" | 多用 | **「NISA口座内の運用益は非課税」「通常約20%の税金がかかる」** に置換 |
| "10分で終わる" | 断定 | **「最短ならスマホでサクッと申込みまで進められる」** に緩和 |
| "月100円から始められる" | 主訴求の1つ | **「月100円から積立できる証券会社もある」** に注記化（証券会社差を含意） |
| "知らない=損" | 強調シーン1つ | **削除**（重複・煽りすぎ） |
| CTA | "今日から始めよう / プロフィールリンク" | **"固定コメントかプロフィールへ"** にplatform-neutral化 |
| 重複 | "税金がかからない"3回・"月100円"2回 | **各1回** |

### 1.3 後半の新情報

ChatGPTの「後半に新情報」要件への対応。

- 0:34〜0:43 に「通常20%の税金 vs NISA非課税」をtaxSavingsDemoで再可視化（冒頭の数字差を裏付け）
- 0:44〜0:57 にスマホUIモックで「口座開設→積立設定」を疑似デモ
- 0:58〜1:04 に「月100円〜」を最後に出す（最低ハードル提示）

---

## 2. 新ショットプラン（13ショット / 67秒）

### 2.1 概要

| # | shot_id | start | dur | component | 内容 |
|---|---------|-------|-----|-----------|------|
| 1 | 02-01 | 0 | 4 | `factCard` | hook: "投資で100万円儲けても、約20万円は税金で取られる"（赤強調） |
| 2 | 02-02 | 4 | 6 | `taxSavingsDemo` | NISA 100万円まるまる残る（vs 普通80万、count-up） |
| 3 | 02-03 | 10 | 3 | `factCard` | "これが、新NISA" |
| 4 | 02-04 | 13 | 5 | `factCard` | "2024年〜国の非課税投資制度" |
| 5 | 02-05 | 18 | 12 | `stackedBarCompare` | 棒グラフ 120 / 240 / 360 |
| 6 | 02-06 | 30 | 4 | `infinityFact` | ∞ 無期限 |
| 7 | 02-07 | 34 | 10 | `compareSplit` | 通常 約20%課税 / NISA 非課税 |
| 8 | 02-08 | 44 | 2 | `factCard` | "始め方はシンプル" |
| 9 | 02-09 | 46 | 7 | `phoneStepsDemo` | step1 口座開設 |
| 10 | 02-10 | 53 | 5 | `phoneStepsDemo` | step2 つみたて設定 |
| 11 | 02-11 | 58 | 4 | `factCard` | "月100円から積立できる証券会社も" |
| 12 | 02-12 | 1:02 | 3 | `factCard` | "まずは少額から" |
| 13 | 02-13 | 1:05 | 2 | `ctaPanel` | "固定コメント / プロフィールへ" |

合計: 67秒

### 2.2 phoneStepsDemoの分割

step1/step2 を別シーン（02-09, 02-10）にすることで、ナレーションと画面遷移のタイミングを正確に保つ。同一コンポーネントだが `step` フィールドで現在ステップを切り替える。

---

## 3. 新 scene JSON schema（コンポーネント指向）

### 3.1 構造

```ts
type SceneV2 = {
  id: string;
  component: ComponentType;
  durationSec: number;
  narration?: string;
  caption?: string;           // 下部ライブ字幕（headlineと分離）
  motion?: MotionPreset;      // "fadeIn" | "slideUp" | "popIn" | "growX" | "countUp"
  data: ComponentData;        // component別の構造
};

type ComponentType =
  | "factCard"
  | "compareSplit"
  | "stackedBarCompare"
  | "taxSavingsDemo"
  | "infinityFact"
  | "phoneStepsDemo"
  | "ctaPanel";
```

### 3.2 component別 data

#### factCard（汎用ファクトカード）

```ts
{
  headline: string;            // 1行目（最大強調）
  subheadline?: string;
  highlight?: string[];        // 強調語（赤/緑グロー）
  icon?: string;               // emoji or token
  variant?: "default" | "punch" | "soft";
}
```

#### compareSplit（左右比較）

```ts
{
  title?: string;
  left:  { label: string; value: string; tone: "negative" | "neutral" };
  right: { label: string; value: string; tone: "positive" | "neutral" };
  divider?: "vs" | "arrow";
}
```

#### stackedBarCompare（棒グラフ）

```ts
{
  title: string;
  bars: { label: string; value: number; unit?: string; color?: string }[];
  total?: { label: string; value: number; unit?: string };
  highlight?: string;          // "合計360万円/年" 等
}
```

#### taxSavingsDemo（税引き比較・count-up付き）

```ts
{
  scenarioLabel: string;       // "利益100万円のとき"
  left:  { label: string; profit: number; tax: number; takeHome: number };
  right: { label: string; profit: number; tax: number; takeHome: number };
  unit?: string;               // "万円"
}
```

#### infinityFact（∞演出）

```ts
{
  title: string;               // "非課税期間"
  emphasis: string;            // "無期限"
  symbol?: "infinity" | "checkmark";
}
```

#### phoneStepsDemo（スマホUIモック）

```ts
{
  totalSteps: number;          // 全ステップ数（進捗表示）
  currentStep: number;         // このシーンが何ステップ目か
  stepLabel: string;           // "口座開設" / "つみたて設定"
  uiMock: "openAccount" | "setupAutoInvest" | "selectFund";
  caption?: string;
}
```

#### ctaPanel（改善版CTA）

```ts
{
  headline: string;
  destinations: ("pinnedComment" | "profileLink")[];
  subtext?: string;
}
```

### 3.3 後方互換性

旧 `type` ベースのscene JSONも当面残す。新世代scene generatorは `component` フィールド付きで出力し、Remotion側は `component` を優先、なければ `type` にフォールバック。

zodスキーマは新旧の `z.union` または別ファイルで `sceneJSONSchemaV2` として並行運用。

---

## 4. Remotionコンポーネント構成

### 4.1 新規・改修・廃止

| コンポーネント | 状態 | 備考 |
|----------------|------|------|
| `FactCard` | **新規** | 旧HookCardをリネーム＋字幕分離対応 |
| `CompareSplit` | **新規** | 旧CompareCardを刷新（tone-driven coloring, count-up対応） |
| `StackedBarCompare` | **新規** | 棒グラフ（成長アニメーション） |
| `TaxSavingsDemo` | **新規** | count-up + chunk animation で税引きを可視化 |
| `InfinityFact` | **新規** | ∞シンボル＋回転＋グロー |
| `PhoneStepsDemo` | **新規** | スマホUIモック（角丸・notch・タップ表現） |
| `CTAEndCard` | **改修** | platform-neutral化（destinations配列） |
| `WarningCard` | 維持 | 出典・免責に流用可 |
| `SourceFooter` | 維持 | 必要時のみ呼び出し |
| `HookCard` | **廃止** | FactCardに統合 |
| `ExplainerStack` | **廃止** | PhoneStepsDemoに置き換え |
| `AnimatedBackground` | 維持 | 全コンポーネントで共通利用継続 |
| `AnimatedText` | 維持 | StaggeredText, CountUpNumber を活用 |

### 4.2 字幕レイヤ

`SubtitleLayer` を新規追加し、`GenzMoneyShort` の最上位に配置。`scene.caption` があれば下部30%領域にスライドアップで表示。headlineと視覚的に分離する。

### 4.3 SE（効果音）

このフェーズでは**実装しない**（フィードバックでは推奨だが、優先度は中）。次フェーズで `pop`, `whoosh`, `tick`, `soft impact` をAudioMixWithOverlayで重ねる。

---

## 5. 字幕と見出しの分離

### 5.1 現状の問題

`headline` がそのまま画面中央に大きく表示され、ナレーションとほぼ同じ文を出している。映像意味（"100万円差"のグラフ）と音声フォロー（"普通の口座なら手取り80万円"）が混ざる。

### 5.2 改善

- **見出し（中央〜上部）**: 映像で伝えたい意味（例: "100万円利益の場合"）
- **字幕（下部）**: ナレーションの短縮版（例: "普通80万 / NISA100万"）
- **強調語のみ色変更**（緑=positive, 赤=negative）

`scene.caption` フィールドに字幕用の短文を入れる運用に切り替える。

---

## 6. 音声テンポ改善

### 6.1 VOICEVOX設定変更

| パラメータ | 現状 | 改善 |
|-----------|------|------|
| `speedScale` | 1.02 | **1.08** |
| `segmentGapMs` | 300 | **150** |
| `intonationScale` | 1.0 | 1.0（維持） |
| `volumeScale` | 1.0 | **1.1**（ラウドネス上げ） |

### 6.2 台本側の調整

- 句読点を絞る（音声合成の間が長くなりすぎる原因）
- 1文を短く（最大25〜30文字目安）
- 既に台本v2で対応済み

### 6.3 期待効果

体感テンポが現状比 **約1.3倍軽く** なる想定。67秒の尺で実時間は維持しつつ、視聴体感は45〜50秒相当。

---

## 7. 実装順序（Phase Bタスク分解）

### Step 1: 台本・shot plan作成
- `content/genz-money/scripts/shorts-nisa-01-hook-v2.txt`
- `content/genz-money/handoff/shorts-nisa/shot-plan-01-hook-v2.json`
- 既存ファイルは残す（v1はバックアップ）

### Step 2: scene JSON schema追加
- `src/utils/schemas.js` に `sceneJSONSchemaV2` を追加
- 旧schemaは維持（並行運用）

### Step 3: scene generator v2
- `src/generators/remotion-scene-generator-v2.js` 新規（または既存をフラグ切替）
- shot plan v2 → scene JSON v2 変換

### Step 4: 新Remotionコンポーネント実装
- `FactCard.tsx`
- `CompareSplit.tsx`
- `StackedBarCompare.tsx`
- `TaxSavingsDemo.tsx`
- `InfinityFact.tsx`
- `PhoneStepsDemo.tsx`
- `CTAEndCard.tsx` 改修
- `SubtitleLayer.tsx` 新規

### Step 5: composition更新
- `GenzMoneyShort.tsx` のSceneRendererをcomponent優先ルーティングに変更
- SubtitleLayerをAbsoluteFillで重畳

### Step 6: 音声再生成
- VOICEVOX設定を更新して `shorts_nisa_01-hook-v2.wav` 生成

### Step 7: レンダリング・検証
- `acs remotion-render genz-money <scene-v2.json>`
- 確認 → 必要なら部分修正

---

## 8. 想定リスク・論点

1. **scene schemaの並行運用が複雑化する** — 旧schemaは段階的に廃止予定。当面は両対応。
2. **PhoneStepsDemoの実装難度** — スマホUIモックを真面目に作るとコストが大きい。最初は簡略化（角丸枠＋ステップバッジ＋ボタン疑似タップ）で実装、後段で高度化。
3. **TaxSavingsDemoのcount-up演出** — 既存の `CountUpNumber` を流用。chunk animation（20万円が赤く崩れる）は MVP 外でも可。
4. **音声テンポ変更で既存テストへの影響** — VOICEVOX設定はchannel別defaultなので、テストへの影響は限定的。
5. **CTAのplatform-neutral化** — 旧CTAはYouTube寄り。3プラットフォーム共通でも違和感のない文言を採用。

---

## 9. 確認事項

実装前に以下の点をご確認ください。

- [ ] 台本v2の文面（特に金融コンプラ調整箇所）
- [ ] 13ショットの構成・尺配分
- [ ] component別 data schema の粒度（過剰/不足はないか）
- [ ] PhoneStepsDemoの実装スコープ（簡略版でOKか）
- [ ] 音声テンポ変更の許容範囲（speedScale 1.08 / segmentGap 150ms）
- [ ] SE実装は次フェーズに送る方針でよいか
