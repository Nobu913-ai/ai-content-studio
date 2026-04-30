# Shorts 量産ワークフロー（共通基盤対応版）

このドキュメントは Shorts #02 以降の制作で利用する標準フロー。`shorts-nisa-01-hook` v8 で確立した共通演出基盤を前提にしている。

---

## 0. 前提

- 動画長: **TikTok Creator Rewards 要件で 60秒以上を維持**
- 最終尺は「**音声累積 + 意図したCTA hold時間**」で決める（無理に60秒固定しない、ただし下回らない）
- 音声駆動: shot timing は実測 audio segment 境界に揃える
- 共通基盤: captionSegments[] / bgVariant 3変種 / seEvents

---

## 1. 制作フロー（推奨7ステップ）

### Step 1. 台本作成
`content/<channel>/scripts/<topic>-<slug>.txt` に置く。空行 (`\n\s*\n`) で segment が区切られる。

```
投資で100万円儲けても、約20万円は税金で取られる。

でも新NISAなら、100万円まるまる残る。

...
```

**ポイント**:
- 1セグメント = 1ナレーション（VOICEVOXが個別に合成する単位）
- 句読点 `。` は音声合成時に約0.25-0.5秒の間が入る
- 全動画の最後に必ず CTA セグメントを置く

### Step 2. 音声生成
```bash
node scripts/generate-genz-audio.js \
  content/genz-money/scripts/<topic>-<slug>.txt \
  content/genz-money/audio/<topic>_<slug>.wav
```

VOICEVOX preset (`config/tools.js: voicevoxPresets["genz-money-shorts"]`) と発音辞書 (`config/pronunciation-dictionary.json`) が自動適用される。

### Step 3. 音声段境界の実測
```bash
node scripts/measure-segments.js \
  content/genz-money/scripts/<topic>-<slug>.txt \
  --json content/genz-money/metadata/<topic>-<slug>_segments.json \
  --final-wav content/genz-money/audio/<topic>_<slug>.wav
```

`segments.json` を出力。各 segment の `start / end / dur / text` が記録される。最終wavとの差分検証も自動実行（差分0.5秒以上なら fail）。

### Step 4. ショットプラン作成
`content/<channel>/handoff/<series>/shot-plan-<slug>.json` を作成。

最低限の各 shot 構造:
```json
{
  "shot_id": "01-01",
  "start_sec": 0,
  "duration_sec": 4.7,
  "narration": "...",
  "component": "factCard",
  "data": { "headline": "..." }
}
```

**timing 決定の指針**: shot の `start_sec` は対応 audio segment の **start** に揃える（measurements の値を直接コピー）。`duration_sec` は次 shot の `start` までの差。

`bgVariant` は省略可（component種別から自動推定）。明示指定する場合のみ書く。

### Step 5. caption の自動生成
```bash
node scripts/generate-captions.js \
  content/genz-money/handoff/<series>/shot-plan-<slug>.json \
  --segments content/genz-money/metadata/<topic>-<slug>_segments.json \
  --in-place
```

各 shot の `narration` を句読点で分割し、measured 段境界を尊重して `captionSegments[]` を自動付与。**既に手書きで captionSegments を持つ shot はスキップ**（手調整結果を保護）。

`--preview` オプションで生成内容のみ標準出力に確認可能。

### Step 6. scene JSON 生成
```bash
node src/cli.js remotion-scene genz-money \
  content/genz-money/handoff/<series>/shot-plan-<slug>.json
```

`bgVariant` が未指定の shot には自動推定値が入る（[remotion-scene-generator.js: defaultBgVariantFor](../src/generators/remotion-scene-generator.js)）:

| component | bgVariant 自動値 |
|-----------|----------|
| `taxSavingsDemo`, `taxFlowDemo`, `numberHero`, `compoundDemo` | `impact`（明るめコントラスト） |
| `stackedBarCompare`, `comparisonTable`, `infinityFact`, `compareSplit`, `recommendationFocus`, `dataSourceCard`, `iconGrid`, `brokerScreenMockup` | `data`（グリッド・構造化アクセント） |
| `phoneStepsDemo`, `ctaPanel`, `progressSteps`, `calendarHighlight` | `action`（warmer accents） |
| その他 (`factCard` など) | `default` |

### Step 7. レンダリング
```bash
node src/cli.js remotion-render genz-money \
  content/genz-money/metadata/<最新の_scenes.json>
```

---

## 2. SE (効果音) の追加

`public/se/` に4ファイル配置:
- `pop.mp3` (数字・強調)
- `whoosh.mp3` (切替)
- `tick.mp3` (step進行)
- `soft-impact.mp3` (締め)

shot plan で `seEvents` を追加するだけで再生される:
```json
{
  "seEvents": [
    { "type": "softImpact", "atSec": 0.2 },
    { "type": "pop", "atSec": 5.0, "volume": 0.5 }
  ]
}
```

`atSec` は shot 開始からの相対秒。`volume` 省略時は 0.6。
詳細: [public/se/README.md](../public/se/README.md)

---

## 3. caption / bgVariant の手動オーバーライド

### caption を手書きしたい場合
shot に `captionSegments` を直接書けばよい。`generate-captions.js` は既存の captionSegments を保護してスキップする。

```json
{
  "shot_id": "...",
  "captionSegments": [
    { "text": "100万円儲けても 約20万円が税金", "startSec": 0, "endSec": 4.7, "highlight": ["20万円"] }
  ]
}
```

### bgVariant を強制したい場合
shot に `bgVariant: "data"` を書けば自動推定を上書き。
```json
{
  "shot_id": "08-10",
  "bgVariant": "data",
  ...
}
```

例: progressSteps（自動だと action）をリスク注意用に使う時、`data` に切替えると落ち着いた背景になる。

---

## 4. デバッグ用 preview コマンド

### caption 生成内容を確認するだけ
```bash
node scripts/generate-captions.js shot-plan.json --preview --segments segments.json
```

### scene JSON のシーン一覧をテキストで確認
```bash
node src/cli.js remotion-scene genz-money shot-plan.json
# 標準出力に各 scene の component / dur / 主要文言が表示される
```

### Remotion Studio でプレビュー
```bash
node src/cli.js remotion-preview <scenes.json>
```

---

## 5. 自動チェック（lint）— 量産時の必須項目

過去のフィードバックで頻出した問題を、台本/shot plan 作成段階で機械検出する2つのlintを用意。
**Step 4 (shot plan作成) と Step 7 (レンダリング) の間に必ず実行**するのが推奨。

### 5-1. `lint-script.js` — 台本テキストチェック

```bash
node scripts/lint-script.js <script-path> [--strict] [--json]
```

**検出項目**:

| レベル | 項目 | 過去の事例 |
|------|------|------|
| ❌ error | 読み事故パターン (例: `年` + 数字) | v6→v8: 「年120万円」が「とし120」と読まれた |
| ❌ error | セグメント長 > 60c | 一度に発音すると間延び |
| ❌ error | 空セグメント | — |
| ⚠️ warn | 推奨断定 (「〜が安心」「〜が大事」「絶対」「確実」) | v3→v7: 金融コンプラの中立化指摘 |
| ⚠️ warn | 専門用語の単独使用 (`インデックス投信` `ETF` 等) | v7: 「インデックス投信」削減指摘 |
| ⚠️ warn | 時間依存表現 (`2024年に`) | v3: 「2024年に始まった」古く見える指摘 |
| ⚠️ warn | 重複フレーズ (7c以上が複数seg出現) | v1→v3: 言い換え重複の指摘 |
| ⚠️ warn | リスク注記の不在 | v3以降: 必須化 |
| ℹ️ info | 英字商品名 (NISA等) | 発音辞書未登録の検出 |

### 5-2. `lint-shot-plan.js` — shot plan 構造チェック

```bash
node scripts/lint-shot-plan.js <shot-plan.json> \
  [--segments <segments.json>] [--strict] [--json]
```

**検出項目**:

| レベル | 項目 | 過去の事例 |
|------|------|------|
| ❌ error | 必須フィールド (component / duration_sec) 欠落 | — |
| ❌ error | duration_sec < 0.5s | — |
| ❌ error | audio参照のバージョン不整合 (plan v8 ↔ audio v7 等) | v8 feedback: 整合確認指摘 |
| ❌ error | audioファイルが存在しない | — |
| ⚠️ warn | 合計尺 < 60s | v6 feedback: TikTok Creator Rewards要件 |
| ⚠️ warn | total_duration_sec と shot合計の不一致 | — |
| ⚠️ warn | start_sec が累積と不一致 | shot plan の手動編集ミス |
| ⚠️ warn | factCard比率 > 35% | v3→v8: 連打回避指摘 |
| ⚠️ warn | 同一component が3つ以上連続 | テンプレ感 |
| ⚠️ warn | 最後のshotが ctaPanel でない | v4: CTA最後配置指摘 |
| ⚠️ warn | CTA shot 長すぎ (>7s) / 短すぎ (<3s) | v5→v6: CTA尺の指摘 |
| ⚠️ warn | リスク注記shot不在 (`価格変動リスク` 等の語句がどこにもない) | v3以降必須 |
| ⚠️ warn | 冒頭がimpact componentでない | v3: strongest proof 冒頭5秒指摘 |
| ⚠️ warn | shot 範囲外の audio segment | shot timing と実音声の乖離 |
| ⚠️ warn | 静的ホールド > 5s | v2: 12秒無音免責の指摘 |
| ℹ️ info | 長い shot に caption / captionSegments なし | 音なし視聴対応 |

### 5-3. 推奨の実行タイミング

```bash
# 台本ができたら
node scripts/lint-script.js content/genz-money/scripts/<topic>.txt

# shot plan ができたら（measure-segments の出力 JSON を併用すると精度UP）
node scripts/lint-shot-plan.js content/genz-money/handoff/<series>/<plan>.json \
  --segments content/genz-money/metadata/<topic>_segments.json

# CIに組み込む場合 (errorsのみで失敗)
node scripts/lint-shot-plan.js <plan>.json --strict  # warnings でも失敗
```

**運用ルール**:
- ❌ error は必ず修正してから次のステップへ
- ⚠️ warn は意図的な逸脱でなければ修正
- ℹ️ info は参考。スキップ可

---

## 6. 日本語の折り返しルール（量産時の必須項目）

字幕・見出し・サブテキストが画面幅を超える場合、**機械的な途中折り返しを禁止**し、
意味のある区切りで自動改行する仕組みが入っている。

### 適用箇所

- `SubtitleLayer` (caption / captionSegments)
- `CTAEndCard` (headline / subtext)
- `FactCard` (subheadline)
- 必要に応じて他のコンポーネントにも `smartLineBreak()` を適用可能

### アルゴリズム ([responsive-text.ts: smartLineBreak](../src/remotion/utils/responsive-text.ts))

1. **手動 `\n` 優先** — テキストに改行が含まれていれば、そのまま尊重
2. **収まれば何もしない** — 計算上1行で `maxWidth` に収まれば改行しない
3. **収まらない場合のみ** 優先度の高い区切りで2行に分割

### 区切りの優先度（高い順）

| 優先度 | 区切り | 説明 |
|------|------|------|
| 10 | `、` `。` | 句読点（最強の意味区切り） |
| 9 | `は` | 主題マーカー（topic particle） |
| 8 | `を` `が` `も` | 格助詞 |
| 7 | ` / ` | スペース付きスラッシュ（視覚的区切り） |
| 6 | `に` `で` `と` `から` `まで` | 場所/手段/対象を示す助詞 |
| 5 | `の` `て` | 連体助詞・接続助詞 |
| 4 | `/` | スラッシュ単独 |

中央に最も近い候補が選ばれる（priority * 100 - 中央からの距離 でスコア計算）。
極端に短い断片を作らないよう、**両端それぞれに全体の20%以上の長さ**を残す制約あり。

### 例

**入力**: `"NISAの始め方は固定コメント / プロフィールへ"` (1行に収まらない)

**出力**:
```
NISAの始め方は
固定コメント / プロフィールへ
```

→ 「は」（topic particle、優先度9）で改行。視覚的にも意味的にも自然。

### 量産時の運用

- **基本**: 何もしなくてよい。component が自動で smartLineBreak を呼ぶ
- **明示制御**: 改行位置を指定したい場合は caption / subheadline に `\n` を入れる（手動指定が優先される）
- **新コンポーネント追加時**: テキスト描画する場合は `autoFontSizeJa` + `smartLineBreak` のペアを使う

```tsx
import { autoFontSizeJa, smartLineBreak } from "../utils/responsive-text";

const fontSize = autoFontSizeJa(text, maxFont, maxWidth);
const wrapped = smartLineBreak(text, fontSize, maxWidth);

<div style={{ fontSize, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
  {wrapped}
</div>
```

`whiteSpace: "pre-wrap"` を必ずセットすること（`\n` を改行として描画するため）。

---

## 6. 命名規則

| 種別 | 場所 | 例 |
|------|------|------|
| 台本 | `content/<channel>/scripts/` | `shorts-nisa-01-hook-v8.txt` |
| 音声 | `content/<channel>/audio/` | `shorts_nisa_01-hook-v8.wav` |
| 段測定JSON | `content/<channel>/metadata/` | `shorts-nisa-01-hook-v8_segments.json` |
| shot plan | `content/<channel>/handoff/<series>/` | `shot-plan-01-hook-v8.json` |
| scene JSON | `content/<channel>/metadata/` | `<timestamp>_<slug>_scenes.json`（自動生成） |
| 動画 | `content/<channel>/video/` | `<timestamp>_<scene>_shot-plan-<slug>.mp4`（自動生成） |

**重要**: `shot-plan.audio` は対応する wav の **同じ version** を指すこと。バージョン違いは管理事故の原因になる。

---

## 6.5. VOICEVOX イントネーション問題への対処

音声を聴いて「アクセントが関西訛り風」「棒読み感がある」等が気になったら、以下の優先順位で対処する。

### 第一選択: フレーズ変更 (推奨、罠が少ない)

スクリプト側で言い換える。例:
- 「慣れたら」(関西訛り風) → 「慣れてきたら」(自然) — 連用形+補助動詞「くる」+条件形は morph 解析で正しく分割される
- 「年120万円」(「とし120」と誤読) → 「年間120万円」(正常)

複合語/接続語のほうが解析が安定する。Single token の動詞活用形は VOICEVOX デフォルト辞書に依存して安定しないことが多い。

### 第二選択: `config/voicevox-accent-dictionary.json` への登録

`scripts/register-voicevox-accents.js` で `/user_dict_word` API に冪等登録 (既存 surface は削除して再登録)。

**推奨設定:**
- `word_type: COMMON_NOUN` (VERB は活用形を拾えない、PROPER_NOUN は priority 上限が低い)
- `priority: 10` (上限値、morph 辞書を上書き)
- `accent_type`: `0` (heiban) は棒読みになりがち、自然な抑揚は `2` (LHLL) や `3` (LHHL) を試す

**確認手順:**
```bash
curl -s -X POST "http://127.0.0.1:50021/audio_query?text=<URL_ENCODED>&speaker=2" \
  | node -e "let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{const q=JSON.parse(d); q.accent_phrases.forEach(p=>console.log('accent='+p.accent, '|', p.moras.map(m=>m.text+'('+m.pitch.toFixed(2)+')').join('')))})"
```

### 罠: 読点なしだと user_dict accent_type が無視される

VOICEVOX の morph 解析は前後語と結合して 1つの accent_phrase を作ることがある。結合された場合、user_dict の accent_type は使われず結合語全体のアクセントが計算される。

対処は (a) フレーズ自体を変える、または (b) スクリプトに読点 (、) を入れて accent_phrase を強制分離する (ただし読点は 0.15-0.2s pause を生むので Shorts では timing と相談)。

### 罠: heiban (accent_type=0) は「自然」ではなく「棒読み」

heiban は LHHH... で pitch 変化が極小になる → 棒読み。自然な抑揚が欲しいなら N型 (1-N) を使う。

詳細は memory `feedback_voicevox_intonation_strategy.md` 参照。

---

## 7. 1カット1メッセージ原則（量産時のビジュアル設計指針）

初心者向け Shorts では、**1カット内に主役メッセージを1つに絞る**。比較表より動き・強調が刺さる。

### 冒頭カット（税金・手数料・コスト比較）

左右並列比較ではなく **時系列フロー** で見せる:

| ❌ 避ける | ✅ 推奨 |
|----------|----------|
| `taxSavingsDemo` (普通口座 vs NISA を最初から並列) | `taxFlowDemo` (元本 → 税金が剥がれる → 中央モーフ → 左右カード分割 → 差額バッジ) |

`taxFlowDemo` の主要 prop:
- 数値: `principal` / `tax` / `unit`
- 中央表示: `principalLabel` / `principalPrefix` (= "利益") / `takeHomePrefix` (= "手元")
- 左右カード: `regularLabel` / `nisaLabel` / `regularSubLabel` (= "税引後", 必須) / `regularTakeHomeLabel` / `nisaTakeHomeLabel`
- カード非対称化: `regularCardStyle: { scale: 0.94, opacity: 0.85 }` / `nisaCardStyle: { scale: 1.10, checkIcon: true }`
- 最終バッジ: `diffMessage`（`\n` で改行可）。煽り防止に「NISAなら\n約20万円多く残る」推奨

5段階タイムライン (durationSec=7.7s 基準):

| stage | 時間 | 中央ビジュアル | caption |
|------|------|---------|---------|
| 1 | 0.0–1.0s | 元本 (e.g. "利益100万円") | 「利益100万円」 |
| 2 | 1.0–3.0s | -20万円 が下から落ちて → 右下に剥がれて飛ぶ | 「普通の口座だと 約20万円が税金」 |
| 3 | 3.0–3.8s | **中央で 100→80 数字カウントダウンモーフ** + prefix 利益→手元 切替 + 80着地時 punch scale 1.18 | 「手元に残るのは 約80万円」 |
| 4 | 3.8–4.7s | 「手元80万円」中央でホールド | (同上) |
| 5 | 4.7–end | 左カード (`scale 0.94 + opacity 0.85` + 「税引後」 + 「ドスン」と沈むバウンド + brief loss tint filter on value) + 右カード (`scale 1.10` + ✓ + 強グロー) + 下部 diffMessage バッジ | 「NISAなら 100万円まるまる残る」 |

**重要**: caption は手書きで stage と同期させる (`generate-captions.js` の自動生成は narration の句読点ベースで stage と一致しない)。手書きの captionSegments があれば auto 生成はスキップされる。

### 選択誘導カット（証券会社・カード・枠・プラン推薦）

並列比較ではなく **focus 主役強調 + secondary 補足化** で見せる:

| ❌ 避ける | ✅ 推奨 |
|----------|----------|
| `compareSplit` (両方が同じ重さに見える) | `recommendationFocus` (focus 拡大 + バッジ + secondary を opacity 0.2 まで沈める) |

`recommendationFocus` の主要 prop:
- `focus.label` / `focus.value` / `focus.badge` / `focus.scale`（1.15-1.20 で強い主役感）
- `secondary.label` / `secondary.value` / `secondary.opacity`（0.2 まで下げると補足扱い）/ `secondary.scale`（0.7-0.8 で完全に脇役化）
- secondary の `value` は数字より補足文言推奨（「年240万円」より「慣れてから検討でもOK」）

### 主役/脇役カードの非対称化テクニック (taxFlowDemo / recommendationFocus 共通)

| 要素 | 主役側 | 脇役側 |
|------|--------|--------|
| `cardScale` | 1.10-1.15 | 0.92-0.96 |
| `cardOpacity` | 1.0 | 0.78-0.85 |
| Border thickness | 3px | 2px |
| Glow | 50px + 100px 2重 boxShadow | なし |
| Check icon | あり (✓ in positive 緑) | なし |
| sub label slot | 「税金0円」(positive 緑) | 「税引後」(accent red 色で表示、textSecondary だと認識されにくい) |

### 比較カードの fontSize 揃え (autoFontSize の罠回避)

並列描画する value (e.g. 80万円 / 100万円) は **共有 fontSize を計算** する:
```ts
const longerText = `${Math.max(principal, takeHome)}${unit}`;
const sharedSize = autoFontSizeJa(longerText, maxFont, maxWidth);
// 両カード sharedSize で描画、視覚強弱は scale で
```
理由: autoFontSize は長い文字列ほど自動縮小が大きい。「100万円」のほうを emphasize したいのに「80万円」より小さくなる逆転が起きる。

### 全体ルール

- 1カット内に主役候補が3つ以上ない
- 数字を3個以上同時に表示しない
- ナレーション順序と画面の理解順序を一致させる
- 同じメッセージを 2か所表示しない (例: NISA横の `+20万円` バッジ + 下部 `NISAなら20万円多く残る` バッジは重複)
- 「損した！」「もったいない！」等の煽り文言なし (calm-trust トーンが下がる)
- 「減っちゃった感」を SE で表現しない (音で悲しさを出すと安っぽい)
- アニメーションの微調整より明示テキスト (例: 「税引後」ラベル) のほうが量産時に確実に伝わる
- 演出意図は shot plan の data に明示 (デフォルト値と同じでも書き下す → 量産時の可読性)
- 既存の `compareSplit` / `taxSavingsDemo` は廃止せず、中級者向け詳細解説カットで温存

---

## 8. v1〜v8 の振り返り（参考）

| バージョン | 主な変更 |
|----------|--------|
| v1 | Phase A 基本実装 |
| v2 | 構成大幅修正、コンポーネント刷新 |
| v3 | 終盤無音12s解消、factCard比率削減 |
| v4 | 1カット目を比較図に、CTAをラスト |
| v5 | taxSavingsDemo staged、ProgressSteps 進行強弱、measure-segments導入 |
| v6 | 60s+維持のため価値情報追加 |
| v7 | 06-09 統合、リスク中立化、PhoneStepsDemo 操作反応 |
| v8 | progressSteps 段階表示、stackedBar 段階刻み、複利文言緩和、共通基盤対応 (captionSegments / bgVariant / seEvents) |
| v8.1 | 冒頭 taxFlowDemo / 選択誘導 recommendationFocus 導入、1カット1メッセージ原則確立 |
| v8.2 | TaxFlowDemo 中央モーフ (100→80 countdown) + prefix 利益→手元切替 + sharedValueSize、両カード4スロット並列、NISAカード主役化 (cardScale 1.10 + ✓ + 強グロー)、普通口座 「税引後」accent red ラベル + 増幅バウンド + value text hue-rotate filter、フローティングバッジ削除 (下部 diff と重複)、SE softImpact 5.0→5.8s で diff バッジに同期、「慣れたら」→「慣れてきたら」フレーズ変更でイントネーション解決 |

各 review ファイル: `Downloads/remotion-video-review_nisa-hook_*-feedback_*.md`
