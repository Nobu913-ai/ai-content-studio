# AI Content Studio v3.0

YouTube + TikTok + Instagram + Twitter/X 3チャンネル統合コンテンツ制作パイプライン。

## プロジェクト概要

Claude API + 4ツール（Runway / ElevenLabs / Descript / DaVinci Resolve）を使い、台本生成 → ショットプラン → ナレーション → 動画/音声生成 → AI編集 → 最終仕上げの全工程を CLI で行うツール。

### 戦略方針
- **Shorts先行テスト**: いきなり長尺を作らない。Shortsで仮説検証し、勝ちテーマのみ長尺化
- **AIは"編集部"**: AI量産ではなく、AIドラフト → 人間の独自視点追加 → 品質チェックの流れ
- **主力集中**: genz-moneyが主力、japanese-mindsetが並走、chill-cultureは後発
- **4ツール固定**: ツールを増やしすぎない。Runway/ElevenLabs/Descript/DaVinciで制作フローを安定させる

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

### 固定4ツール
| ツール | 役割 | API | 環境変数 |
|--------|------|-----|---------|
| Runway Standard | 動画生成ハブ | REST | `RUNWAY_API_KEY` |
| ElevenLabs Creator | 日英ナレーション | REST | `ELEVENLABS_API_KEY` |
| Descript Creator | AI編集・字幕・整音 | REST (beta) | `DESCRIPT_API_KEY` |
| DaVinci Resolve Free | 最終仕上げ | Python Scripting API | `DAVINCI_PYTHON_PATH` (任意) |

### 運用原則
- この4ツールを前提にワークフローを固定
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
config/pronunciation-dictionary.json -- TTS読み辞書（誤読語句のalias登録）
src/cli.js               -- メインCLI エントリポイント（28コマンド）
src/clients/             -- 外部APIクライアント
  runway-client.js       -- Runway API（動画生成・ポーリング・ショットプラン実行）
  elevenlabs-client.js   -- ElevenLabs API（TTS・Voice一覧・使用量確認）
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
  narration-formatter.js -- ElevenLabs用ナレーション整形（マーカー除去・短文化・辞書適用）
  tts-benchmark.js       -- Voice/Model A/Bテスト（比較生成・レポート出力）
  topic-generator.js    -- AIトピックアイデア生成（5角度）
  handoff-generator.js   -- DaVinci用ハンドオフノート+パッケージ生成
  production-pipeline.js -- 4ツール統合制作パイプライン（計画+生成+マニフェスト）
src/utils/               -- ユーティリティ
  claude-client.js       -- Claude API クライアント（リトライ付き）
  file-helpers.js        -- ファイル操作
  validators.js          -- 入力バリデーション
  schemas.js             -- zod スキーマ定義（SEO/Shorts/Compliance/SourceMetadata/Manifest）
  source-extractor.js    -- 金融ソースメタデータ抽出
  api-retry.js           -- 外部API共通リトライ（指数バックオフ）
src/tests/               -- ユニットテスト（102テスト）
content/<channel>/       -- 生成コンテンツ（scripts/, metadata/, audio/, handoff/, calendar/, kpi/）
docs/hybrid-workflow.md  -- ハイブリッドモード運用ガイド（プロンプト→保存先マッピング・手動実行手順）
docs/mvp-smoke-test.md   -- MVPスモークテスト計画（実行コマンド・手動介入・完了条件・次フェーズ）
docs/e2e-walkthrough.md  -- E2Eウォークスルー（1本通しの制作手順・手動ステップ標準オペレーション）
docs/mvp-plan.md         -- MVP実装計画（優先順位・API設計・未解決論点）
docs/90day-plan.md       -- 90日実行計画
docs/improvement-roadmap.md -- 改善ロードマップ
docs/tts-quality-guide.md -- TTS品質管理ガイド（読み辞書運用・Voice比較・QA手順）
```

## CLI コマンド（28コマンド）

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
acs tts-bench-voice <ch> <txt> --voices <id1>,<id2>       # Voice A/Bテスト
acs tts-bench-model <ch> <txt> --models <m1>,<m2>         # Model A/Bテスト
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
    ├── audio/       -- ElevenLabs 音声
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
- 現時点の固定ツールは Runway / ElevenLabs / Descript / DaVinci の4つ。新ツールを前提にした提案は明示的に依頼された場合のみ。

## 収益化

- 目標: 3アカウント合計 月5万〜10万円（6〜12ヶ月目標）
- 収益源: アフィリエイト > デジタル商品 > YouTube広告 > TikTok > スポンサー
- ツール固定費: $58-$69/月
- 詳細: `config/monetization.js` および `docs/90day-plan.md` を参照
