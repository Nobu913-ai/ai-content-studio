# AI Content Studio v3.1

YouTube + TikTok + Instagram + Twitter/X 3チャンネル統合コンテンツ制作パイプライン。

## プロジェクト概要

Claude API + 5ツール（Remotion / Runway / ElevenLabs / Descript / DaVinci Resolve）+ VOICEVOX（日本語TTS）を使い、台本生成 → ショットプラン → ナレーション → 動画生成 → AI編集 → 最終仕上げの全工程を CLI で行うツール。

### 戦略方針
- **Shorts先行テスト**: いきなり長尺を作らない。Shortsで仮説検証し、勝ちテーマのみ長尺化
- **AIは"編集部"**: AI量産ではなく、AIドラフト → 人間の独自視点追加 → 品質チェックの流れ
- **主力集中**: genz-moneyが主力、japanese-mindsetが並走、chill-cultureは後発
- **Remotion中心映像基盤**: Remotionで動画本体を生成。Runwayは補助B-roll、DaVinciは最終仕上げ

### チャンネル構成

| ID | 名前 | 言語 | ターゲット | 優先度 |
|----|------|------|-----------|--------|
| `genz-money` | Z世代マネー教室 | JA | 日本 18-28歳。金融リテラシーをカジュアルに | 主力 |
| `japanese-mindset` | Japanese Mindset | EN | 英語圏 25-45歳。日本の哲学・マインドセットを紹介 | 並走 |
| `chill-culture` | チルカルチャーガイド | JA | 日本 18-30歳。シーシャ、カフェ、サウナ、音楽 | 後発 |

### 各チャンネルのトーン

- **genz-money**: カジュアルでテンポが速い。「ぶっちゃけ」「マジで」等の若者言葉OK。正確性は維持。**金融コンプラ最優先**。
- **japanese-mindset**: 落ち着いた洞察的なナレーション。ステレオタイプを避け、深みを持たせる。英語で出力。
- **chill-culture**: 落ち着いたカジュアル。「エモい」「チルい」「整う」を自然に使用。シーシャは「空間体験」にフォーカスし喫煙推奨にならないこと。

## ツールスタック

### 固定5ツール + VOICEVOX

| ツール | 役割 | API | 環境変数 |
|--------|------|-----|---------|
| Remotion | 動画本体レンダリング（React/TS） | ローカルCLI | — |
| Runway Standard | B-roll・雰囲気ショット生成 | REST | `RUNWAY_API_KEY` |
| ElevenLabs Creator | 英語ナレーション | REST | `ELEVENLABS_API_KEY` |
| Descript Creator | AI編集・字幕・整音 | REST (beta) | `DESCRIPT_API_KEY` |
| DaVinci Resolve Free | 最終仕上げ | Python Scripting API | `DAVINCI_PYTHON_PATH` (任意) |
| VOICEVOX ENGINE | 日本語TTS（genz-money主力） | ローカルHTTP | `VOICEVOX_ENGINE_URL` (任意), `VOICEVOX_SPEAKER_ID` |

### VOICEVOX 導入ガイド
- **目的**: 日本語チャンネル（genz-money）の誤読・イントネーション改善の比較検証
- **セットアップ**: VOICEVOX アプリをインストール・起動するだけ（デフォルト: `http://127.0.0.1:50021`）
- **Docker**: `docker run -p 50021:50021 voicevox/voicevox_engine` でも可
- **商用利用**: 可能。ただしクレジット表記が必要。speaker ごとに利用規約を確認すること
- **英語チャンネル**: VOICEVOX は日本語専用。english-mindset は引き続き ElevenLabs を使用

### Remotion 動画生成基盤

- **役割**: 動画本編のレンダラー。scene JSONからモーショングラフィックス動画を生成
- **構成**: React/TypeScript コンポーネント（`src/remotion/`）
- **scene type**: `hook`, `steps`, `compare`, `warning`, `source`, `cta` の6種
- **ワークフロー**: `acs remotion-scene` → scene JSON生成 → `acs remotion-render` → MP4出力
- **音声**: レンダリング時にaudioをpublic/にコピーして同梱
- **料金**: 個人・3人以下チームは無料。ローカルレンダリングのみ使用

### 運用原則

- Remotionが動画本体の標準レンダラー。Runwayは補助B-roll、DaVinciは最終仕上げ
- 新ツール追加は明確なボトルネック発生時のみ
- DaVinci は Python Scripting API で自動化可（プロジェクト作成・メディアインポート・タイムライン構築・レンダー）。要 DaVinci Resolve 起動中 + Python 3.6+
- Descript の export は手動前提
- API キー未設定のツールは自動スキップ

### Voice Routing（チャンネル別音声設定）
- `genz-money`: 信頼感のある落ち着いた日本語（voice_ja_trust_01）
- `japanese-mindset`: ドキュメンタリー調英語（voice_en_docu_01）
- `chill-culture`: リラックスした穏やかな日本語（voice_ja_soft_01）

### Shot Style（チャンネル別映像スタイル）
- `genz-money`: 図解・インフォグラフィック寄り（9:16）
- `japanese-mindset`: シネマティック日本風景（16:9）
- `chill-culture`: 温かいアンビエント・LoFi（9:16）

## 技術スタック

- **Runtime**: Node.js (ESM)
- **AI**: Claude API (`@anthropic-ai/sdk`) -- モデルは `claude-sonnet-4-20250514`
- **CLI**: Commander.js
- **環境変数**: 全APIキー任意。`ANTHROPIC_API_KEY` 設定時はCLI自動生成、未設定時はプロンプト書き出し→Claude Code手動実行のハイブリッドモード。`RUNWAY_API_KEY`, `ELEVENLABS_API_KEY`, `DESCRIPT_API_KEY` も任意。
- **品質保証**: zod によるJSON出力スキーマ検証、ESLint、Prettier、入力バリデーション、パストラバーサル防止
- **エラー処理**: 指数バックオフリトライ（429/5xx対応）
- **テスト**: Node.js built-in test runner（102テスト）

## ディレクトリ構成

```
config/channels.js       -- チャンネル設定・トピック定義
config/monetization.js   -- 収益化戦略
config/tools.js          -- ツール設定・Voice routing・Shot style・書き出しプリセット
config/pronunciation-dictionary.json -- TTS読み辞書（誤読語句のalias登録・カテゴリ別・チャンネル別override対応）
config/voice-design-templates.json -- Voice Design用プロンプトテンプレート（チャンネル別音声設計）
src/cli.js               -- メインCLI エントリポイント（37コマンド）
src/clients/             -- 外部APIクライアント
  runway-client.js       -- Runway API（動画生成・ポーリング・ショットプラン実行）
  elevenlabs-client.js   -- ElevenLabs API（TTS・Voice一覧・使用量確認）
  voicevox-client.js     -- VOICEVOX ENGINE API（日本語TTS・Speaker一覧・パラメータ制御）
  tts-provider.js        -- TTS provider抽象化レイヤー（ElevenLabs/VOICEVOX統一IF）
  descript-client.js     -- Descript API（プロジェクト作成・インポート・AI編集）
  davinci-client.js      -- DaVinci Resolve 自動化（Python Scripting APIブリッジ）
  davinci/bridge.py      -- DaVinci Resolve Python ブリッジスクリプト
src/generators/          -- 各種生成エンジン
  script-generator.js    -- 長尺台本生成（金融系は一次情報ルール強制+ソースメタデータ抽出）
  seo-generator.js       -- SEOメタデータ（タイトル10案・サムネ文言5案）+ スキーマ検証
  calendar-generator.js  -- コンテンツカレンダー
  shorts-generator.js    -- Shorts生成（長尺切り出し + トピック直接生成）+ KPI学習反映
  repurpose-generator.js -- マルチプラットフォーム展開 + スキーマ検証
  compliance-checker.js  -- コンプライアンス・品質チェック（構造化ソースデータ連携）
  kpi-tracker.js         -- KPIデータ入力・蓄積・勝ちパターン抽出
  batch-generator.js     -- パイプライン統合
  shot-planner.js        -- Runway用ショットプラン生成（Claude → JSON）
  narration-formatter.js -- ElevenLabs用ナレーション整形（マーカー除去・短文化・辞書適用・TTS向けリライト）
  tts-benchmark.js       -- Voice/Model/Script A/Bテスト（比較生成・スコアシート付きレポート出力）
  topic-generator.js    -- AIトピックアイデア生成（5角度）
  handoff-generator.js   -- DaVinci用ハンドオフノート+パッケージ生成
  remotion-scene-generator.js -- ショットプラン → Remotion scene JSON変換
  remotion-renderer.js   -- Remotion CLIラッパー（レンダリング・プレビュー）
  production-pipeline.js -- 5ツール統合制作パイプライン（計画+生成+マニフェスト）
src/remotion/            -- Remotion動画生成（React/TypeScript）
  Root.tsx               -- Remotionエントリポイント（registerRoot）
  compositions/
    GenzMoneyShort.tsx   -- genz-money Shorts用コンポジション
  components/
    HookCard.tsx         -- フック画面（冒頭インパクト）
    ExplainerStack.tsx   -- ステップ解説（箇条書き段階表示）
    CompareCard.tsx      -- 左右比較（数字・概念対比）
    CompareSplit.tsx     -- 左右並列比較（v2 component）
    WarningCard.tsx      -- 注意喚起・免責表示
    SourceFooter.tsx     -- 出典表示（金融コンプラ）
    CTAEndCard.tsx       -- CTA終了画面（フォロー・コメント誘導）
    FactCard.tsx / NumberHero.tsx / StackedBarCompare.tsx / ProgressSteps.tsx 等 -- v2 専用コンポーネント
    TaxSavingsDemo.tsx   -- 普通口座 vs NISA 左右並列（中級者向け）
    TaxFlowDemo.tsx      -- 元本→税金剥がれ→手元→NISA→差額 の時系列フロー（初心者向け冒頭推奨）
    RecommendationFocus.tsx -- focus 拡大 + secondary 補足化の選択誘導（compareSplit より初心者向け）
    AnimatedBackground.tsx -- 3変種背景 (impact/data/action/default)
    SubtitleLayer.tsx    -- captionSegments 同期テロップ（smartLineBreak 適用）
    SeLayer.tsx          -- shot 内 SE イベント発火 (8役割パレット)
  theme/
    genzMoneyTheme.ts    -- カラーパレット・フォント・スペーシング定義
  types/
    scene.ts             -- scene JSON型定義（v1 + v2 両対応）
  utils/
    scene-timing.ts      -- フレーム計算・タイムライン構築
    responsive-text.ts   -- 日本語対応 autoFontSize + smartLineBreak（区切り優先度ベース改行）
    typography.ts        -- テキストスタイルプリセット
public/audio/            -- Remotionレンダリング用音声（自動コピー）
public/se/               -- 効果音 8役割パレット (pop / popStrong / tick / whoosh / whooshSoft / whooshPower / softImpact / specialImpact)
scripts/                 -- 制作補助スクリプト
  generate-genz-audio.js -- VOICEVOX TTS（共通発音辞書適用）
  measure-segments.js    -- 段境界の実測 (start/end/dur 出力 + 最終wav差分検証)
  generate-captions.js   -- shot plan に captionSegments を自動付与（既存手書きは保護）
  lint-script.js         -- 台本テキスト lint（読み事故・推奨断定・専門用語等9カテゴリ）
  lint-shot-plan.js      -- shot plan 構造 lint（factCard比率・CTA配置・version不整合等16カテゴリ）
  lib/pronunciation-loader.js -- 発音辞書ローダー（チャンネルoverride対応・全スクリプト共通）
src/utils/               -- ユーティリティ
  claude-client.js       -- Claude API クライアント（リトライ付き）
  file-helpers.js        -- ファイル操作
  validators.js          -- 入力バリデーション
  schemas.js             -- zod スキーマ定義（SEO/Shorts/Compliance/SourceMetadata/Manifest）
  source-extractor.js    -- 金融ソースメタデータ抽出
  api-retry.js           -- 外部API共通リトライ（指数バックオフ）
src/tests/               -- ユニットテスト（113テスト）
content/<channel>/       -- 生成コンテンツ（scripts/, metadata/, audio/, handoff/, calendar/, kpi/）
docs/hybrid-workflow.md  -- ハイブリッドモード運用ガイド（プロンプト→保存先マッピング・手動実行手順）
docs/mvp-smoke-test.md   -- MVPスモークテスト計画（実行コマンド・手動介入・完了条件・次フェーズ）
docs/e2e-walkthrough.md  -- E2Eウォークスルー（1本通しの制作手順・手動ステップ標準オペレーション）
docs/mvp-plan.md         -- MVP実装計画（優先順位・API設計・未解決論点）
docs/90day-plan.md       -- 90日実行計画
docs/improvement-roadmap.md -- 改善ロードマップ
docs/tts-quality-guide.md -- TTS品質管理ガイド（読み辞書運用・Voice比較・QA手順）
docs/tts-experiment-plan.md -- TTS実験計画（Script→Voice→Model→Provider段階的比較）
docs/tts-provider-evaluation.md -- TTS Provider採用判定基準（ElevenLabs vs VOICEVOX）
docs/shorts-production-workflow.md -- Shorts共通基盤の標準制作フロー（7ステップ + lint + 1カット1メッセージ原則）
docs/remotion-quality-v2-design.md -- Remotion v2 (component-oriented) スキーマ設計
```

## Shorts 制作の主要原則 (genz-money)

### 共通演出基盤
- **captionSegments[]**: ライブテロップ。各 segment が中央ビジュアルの stage と同期する
- **bgVariant**: AnimatedBackground 3変種 (impact/data/action/default)。component種別から自動推定
- **seEvents**: 8役割 SE パレット。60秒で 7-9 event 程度、説明シーンは静音

### 1カット1メッセージ原則
- 冒頭の税金/手数料カット: `taxFlowDemo` (時系列フロー) を使う。`taxSavingsDemo` の左右並列は初心者には重い
- 選択誘導カット: `recommendationFocus` (focus 拡大 + secondary opacity 0.2) を使う。`compareSplit` だと比較に見える
- 1カット内に主役候補3個以上 / 数字3個以上同時表示は避ける
- ナレーション順序と画面の理解順序を一致させる
- 詳細: [docs/shorts-production-workflow.md §7](docs/shorts-production-workflow.md)

## CLI コマンド（37コマンド）

### 基本操作
```bash
acs channels                        # チャンネル一覧
acs topics <channel>                # トピック一覧
acs topic-gen <channel> [-n count]  # AIトピックアイデア生成（5角度）
acs status                          # 制作状況
acs monetize [channel]              # 収益化ダッシュボード
acs tools                           # ツールスタック・API接続状況
```

### コンテンツ生成
```bash
acs script <channel> <topic>        # 台本生成（金融系: --sources で公式URL指定推奨）
acs seo <channel> <script-path>     # SEOメタデータ
acs calendar <channel>              # カレンダー生成
acs shorts <channel> <script-path>  # Shorts切り出し
acs repurpose <channel> <script-path> # マルチプラットフォーム展開
acs check <channel> <script-path>   # コンプライアンスチェック
```

### 制作パイプライン（4ツール連携）
```bash
acs shot-plan <channel> <script-path>   # Runway用ショットプラン
acs narration <channel> <script-path>   # ElevenLabs用ナレーション整形
acs handoff <channel> <script-path>     # DaVinci用ハンドオフノート（--package でパッケージ）
acs produce-plan <channel> <topic>      # 計画フェーズ一括
acs produce <channel> <topic>           # 全工程一括（→マニフェストJSON出力）
```

### 統合パイプライン
```bash
acs shorts-first <channel> <topic>  # Shorts先行テスト
acs full <channel> <topic>          # 台本+SEO一括
acs pipeline <channel> <topic>      # コンテンツ全工程一括
```

### KPIフィードバック
```bash
acs kpi <channel> <video-id> --views 2500 --ctr 8.5 --retention 62 [--manifest <path>]
acs kpi-summary <channel>
```

### TTS品質管理
```bash
acs tts-voices                                            # ElevenLabs Voice 一覧
acs tts-rewrite <ch> <script> [--max-chars 25]            # 台本→TTS向け短文版リライト
acs tts-bench-script <ch> --scripts <p1>,<p2>,<p3>        # Script A/Bテスト（原稿比較）
acs tts-bench-voice <ch> <txt> --voices <id1>,<id2>       # Voice A/Bテスト
acs tts-bench-model <ch> <txt> --models <m1>,<m2>         # Model A/Bテスト
acs tts-bench-provider <ch> <txt> --elevenlabs-voices ... --voicevox-speakers ...  # Provider比較
```

### VOICEVOX
```bash
acs voicevox-status                                       # VOICEVOX ENGINE 接続確認
acs voicevox-speakers                                     # Speaker 一覧表示
```

### Remotion 動画生成

```bash
acs remotion-scene <channel> <shot-plan>                  # ショットプラン→scene JSON生成
acs remotion-render <channel> <scene-json>                # scene JSON→MP4レンダリング
acs remotion-preview [scene-json]                         # Remotion Studioでプレビュー
```

### DaVinci Resolve 自動化
```bash
acs davinci-status                                        # 接続確認
acs davinci-assemble <package-dir> [--start-render]       # ハンドオフパッケージから一括構築
acs davinci-render-status                                 # レンダリング状況確認
```

### 制作ワークフロー
```bash
# Shorts先行 → 長尺化
acs shorts-first genz-money "新NISAの始め方"  # テスト
acs kpi genz-money vid01 --views 2500         # KPI記録
acs pipeline genz-money "新NISAの始め方"      # 長尺化

# 4ツール連携制作
acs produce-plan genz-money "新NISAの始め方"  # 計画（Claude APIのみ）
acs produce genz-money "新NISAの始め方"       # 全工程（外部API連携）

# DaVinci Resolve 一括構築
acs davinci-assemble content/genz-money/handoff/<pkg-dir>  # パッケージから自動構築
```

## 制作パイプライン設計

### フェーズ構成
1. **計画フェーズ**（Claude APIのみ）: 台本 → ショットプラン → ナレーション整形 → ハンドオフノート
2. **生成フェーズ**（外部API）: Runway動画 → ElevenLabs音声 → Descriptインポート/AI編集
3. **マニフェスト出力**: 全ステップの状態・出力ファイル・メディア・エラーをJSON追跡

### メディア受け渡しルール
- **リモートURL**（Runway出力等）: Descriptに自動投入可
- **ローカルパス**（ElevenLabs音声等）: Descriptには渡さない。手動インポート対象として manifest に記録
- Descript には公開URL のみ渡す。ローカルパス混在は禁止

### ハイブリッドモード（ANTHROPIC_API_KEY 任意化）
- `ANTHROPIC_API_KEY` 設定済み → Claude API で自動生成
- `ANTHROPIC_API_KEY` 未設定 → プロンプトを `content/_prompts/` に書き出し、Claude Code で手動実行
- ナレーション整形はローカルフォールバック（マーカー除去→TTS短文化→読み辞書適用）で自動処理可
- 手動モード時、台本未生成の場合は後続ステップ（ショットプラン・ハンドオフ等）もスキップ
- 既存台本パス指定時（`--script-path`）はプロンプト書き出しのみで後続ステップも実行可

### Graceful Degradation
- 全APIキー未設定でもエラーにならない。`manual` ステータスで manifest に記録
- 外部API障害時もパイプラインは計画フェーズまで完走

### ハンドオフパッケージ構造
```
content/<channel>/handoff/<ts>_<slug>/
├── package.json     -- アセットマニフェスト + チェックリスト + missingAssets
├── handoff.md       -- 編集ハンドオフノート
├── docs/            -- 台本・ショットプラン・ナレーション等
└── assets/
    ├── video/       -- Runway 生成動画
    ├── audio/       -- ElevenLabs / VOICEVOX 音声
    └── stills/      -- 静止画素材
```

## コーディング規約

- ESM (`import`/`export`) を使用。`require` は使わない。
- チャンネル設定の変更は `config/channels.js` のみで行う。
- 収益化設定の変更は `config/monetization.js` のみで行う。
- ツール設定の変更は `config/tools.js` のみで行う。
- 外部APIクライアントは `src/clients/` に配置。各クライアントはAPI キー未設定時にわかりやすいエラーを投げる。
- 生成コンテンツは `content/<channel-id>/` 配下に日時付きファイル名で保存。
- エラーメッセージは日本語で表示。
- 入力は必ず `src/utils/validators.js` でバリデーションする。
- 固定ツールは Runway / ElevenLabs / Descript / DaVinci の4つ + VOICEVOX（日本語TTS比較用）。新ツールを前提にした提案は明示的に依頼された場合のみ。
- TTS は provider 抽象化済み。`src/clients/tts-provider.js` 経由で ElevenLabs / VOICEVOX を切替可能。

## 収益化

- 目標: 3アカウント合計 月5万〜10万円（6〜12ヶ月目標）
- 収益源: アフィリエイト > デジタル商品 > YouTube広告 > TikTok > スポンサー
- ツール固定費: $58-$69/月
- 詳細: `config/monetization.js` および `docs/90day-plan.md` を参照
