# AI Content Studio v2.0

YouTube + TikTok + Instagram + Twitter/X 3チャンネル統合コンテンツ制作パイプライン。

## プロジェクト概要

Claude API を使い、Shorts先行テスト → 長尺化 → SEO最適化 → 全SNS展開 → コンプライアンスチェックの全工程を CLI で行うツール。

### 戦略方針
- **Shorts先行テスト**: いきなり長尺を作らない。Shortsで仮説検証し、勝ちテーマのみ長尺化
- **AIは"編集部"**: AI量産ではなく、AIドラフト → 人間の独自視点追加 → 品質チェックの流れ
- **主力集中**: genz-moneyが主力、japanese-mindsetが並走、chill-cultureは後発

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

## 技術スタック

- **Runtime**: Node.js (ESM)
- **AI**: Claude API (`@anthropic-ai/sdk`) — モデルは `claude-sonnet-4-20250514`
- **CLI**: Commander.js
- **環境変数**: `ANTHROPIC_API_KEY` が必要（`.env` に設定、dotenv で読み込み）
- **品質保証**: zod によるJSON出力スキーマ検証、入力バリデーション、パストラバーサル防止
- **エラー処理**: 指数バックオフリトライ（429/5xx対応）

## ディレクトリ構成

```
config/channels.js      — チャンネル設定・トピック定義
config/monetization.js   — 収益化戦略（アフィリエイト・デジタル商品・コンプラ規則）
src/cli.js              — メインCLI エントリポイント（15コマンド）
src/generators/         — 各種生成エンジン
  script-generator.js   — 長尺台本生成（金融系は一次情報ルール強制）
  seo-generator.js      — SEOメタデータ（タイトル10案・サムネ文言5案）+ スキーマ検証
  calendar-generator.js — コンテンツカレンダー
  shorts-generator.js   — Shorts生成（長尺切り出し + トピック直接生成）+ KPI学習反映
  repurpose-generator.js — マルチプラットフォーム展開 + スキーマ検証
  compliance-checker.js — コンプライアンス・品質チェック（金融系ソース検証強化）
  batch-generator.js    — パイプライン統合
  kpi-tracker.js        — KPIデータ入力・蓄積・勝ちパターン抽出
src/utils/              — Claude API クライアント、ファイルヘルパー、バリデーター
  schemas.js            — zod によるJSON出力スキーマ検証
content/<channel>/      — 生成コンテンツ（scripts/, metadata/, calendar/, kpi/）
docs/90day-plan.md      — 90日実行計画
docs/improvement-roadmap.md — 改善ロードマップ
```

## CLI コマンド

### 基本操作
```bash
acs channels                        # チャンネル一覧
acs topics <channel>                # トピック一覧
acs status                          # 制作状況
acs monetize [channel]              # 収益化ダッシュボード
```

### コンテンツ生成
```bash
acs script <channel> <topic>        # 台本生成（金融系: --sources で公式URL指定推奨）
acs seo <channel> <script-path>     # SEOメタデータ（タイトル10案+サムネ5案）
acs calendar <channel>              # カレンダー生成
acs shorts <channel> <script-path>  # 長尺台本からShorts切り出し
acs repurpose <channel> <script-path> # YouTube説明文+Twitter+Instagram生成
acs check <channel> <script-path>   # コンプライアンス・品質チェック
```

### 統合パイプライン
```bash
acs shorts-first <channel> <topic>  # Shorts先行テスト（3本・異なる切り口・KPI学習反映）
acs full <channel> <topic>          # 台本+SEO一括
acs pipeline <channel> <topic>      # 全工程一括（台本+SEO+Shorts+SNS+コンプラ）
```

### KPIフィードバック（学習ループ）
```bash
acs kpi <channel> <video-id> --views 2500 --ctr 8.5 --retention 62  # KPI入力
acs kpi-summary <channel>           # 勝ち/負けパターン分析
```

### 推奨ワークフロー（Shorts先行戦略）
```bash
# Step 1: Shortsでテスト
acs shorts-first genz-money "新NISAの始め方"
# Step 2: 投稿して反応を見る（1-2週間）
# Step 3: 勝ちテーマを長尺化
acs pipeline genz-money "新NISAの始め方"
# Step 4: コンプラチェック確認 → 人間が独自視点を追加 → 投稿
```

## コーディング規約

- ESM (`import`/`export`) を使用。`require` は使わない。
- チャンネル設定の変更は `config/channels.js` のみで行う。
- 収益化設定の変更は `config/monetization.js` のみで行う。
- 生成コンテンツは `content/<channel-id>/` 配下に日時付きファイル名で保存。
- エラーメッセージは日本語で表示。
- 入力は必ず `src/utils/validators.js` でバリデーションする。

## 収益化

- 目標: 3アカウント合計 月5万〜10万円（6〜12ヶ月目標）
- 収益源: アフィリエイト > デジタル商品 > YouTube広告 > TikTok > スポンサー
- 詳細: `config/monetization.js` および `docs/90day-plan.md` を参照
