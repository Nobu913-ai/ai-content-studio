# AI Content Studio v2.2

YouTube + TikTok + Instagram + Twitter/X 対応の3チャンネル統合コンテンツ制作基盤。  
Claude API を使い、**Shorts先行テスト → 長尺化 → SEO → 全SNS展開 → コンプラチェック → KPI学習**の全工程を CLI で自動化。

## 特徴

- **Shorts先行戦略**: Shortsで仮説検証し、勝ちテーマだけ長尺化
- **KPI学習ループ**: 投稿後の再生数・CTR・維持率を記録し、次回生成に自動反映
- **金融コンプラ強化**: 一次情報URL必須、免責事項強制、禁止表現検出
- **品質保証**: zod によるJSON出力スキーマ検証、ESLint/Prettier
- **マルチプラットフォーム**: YouTube説明文、Twitter/Xスレッド、Instagramキャプションを一括生成

## チャンネル構成

| ID | チャンネル名 | 言語 | ターゲット | 優先度 |
|----|-------------|------|-----------|--------|
| `genz-money` | Z世代マネー教室 | JA | 日本 18-28歳 金融リテラシー | 主力 |
| `japanese-mindset` | Japanese Mindset | EN | 英語圏 25-45歳 日本文化 | 並走 |
| `chill-culture` | チルカルチャーガイド | JA | 日本 18-30歳 チル文化 | 後発 |

## セットアップ

```bash
cd ai-content-studio
npm install

# API キーを設定
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定
```

## CLI コマンド一覧

### 基本操作
```bash
acs channels                          # チャンネル一覧
acs topics <channel>                  # トピック一覧
acs status                            # 制作状況
acs monetize [channel]                # 収益化ダッシュボード
```

### コンテンツ生成
```bash
acs script <channel> <topic>          # 台本生成（金融系: --sources でURL指定推奨）
acs seo <channel> <script-path>       # SEOメタデータ（タイトル10案+サムネ文言5案）
acs calendar <channel>                # コンテンツカレンダー生成
acs shorts <channel> <script-path>    # 長尺台本からShorts切り出し
acs repurpose <channel> <script-path> # YouTube説明文+Twitter+Instagram生成
acs check <channel> <script-path>     # コンプライアンス・品質チェック
```

### 統合パイプライン
```bash
acs shorts-first <channel> <topic>    # Shorts先行テスト（3本・異なる切り口）
acs full <channel> <topic>            # 台本+SEO一括
acs pipeline <channel> <topic>        # 全工程一括（5ステップ）
```

### KPIフィードバック
```bash
acs kpi <channel> <video-id> --views 2500 --ctr 8.5 --retention 62  # KPI入力
acs kpi-summary <channel>             # 勝ち/負けパターン分析
```

## 推奨ワークフロー（Shorts先行戦略）

```
1. acs shorts-first genz-money "新NISAの始め方"   ← Shorts 3本でテスト
2. 各プラットフォームに投稿 → 1-2週間反応を見る
3. acs kpi genz-money vid01 --views 2500 --ctr 8   ← KPIを記録
4. acs pipeline genz-money "新NISAの始め方"        ← 勝ちテーマを長尺化
5. コンプラ結果確認 → 独自視点を追加 → 投稿
```

## 品質保証

### 金融コンテンツ（genz-money）
- 台本に `[SOURCE: URL]` `[INFO DATE:]` `[INFO TYPE:]` マーカーを自動要求
- コンプラチェックで未出典・禁止表現・免責事項欠落を検出
- `--sources` オプションで公式情報URLを直接指定可能

### スキーマ検証（zod）
- SEO: タイトル3件以上、タグ5件以上、説明文10文字以上
- Shorts: 各30〜180秒、必須フィールド完備
- Compliance: スコア0-100、verdict(pass/warn/fail)
- 検証結果は JSON に `_schemaWarnings` として保存

### テスト・Lint
```bash
npm test          # 37テスト（schema, KPI, validators, currency）
npm run lint      # ESLint
npm run format    # Prettier
```

## ディレクトリ構成

```
ai-content-studio/
├── config/
│   ├── channels.js              # チャンネル設定・トピック定義
│   └── monetization.js          # 収益化戦略（アフィリエイト・コンプラ）
├── src/
│   ├── cli.js                   # メインCLI（15コマンド）
│   ├── generators/
│   │   ├── script-generator.js  # 台本生成（金融ルール強制）
│   │   ├── seo-generator.js     # SEO（10タイトル+5サムネ文言）
│   │   ├── calendar-generator.js
│   │   ├── shorts-generator.js  # Shorts（切り出し+トピック直接）
│   │   ├── repurpose-generator.js # マルチプラットフォーム展開
│   │   ├── compliance-checker.js  # コンプラ・品質チェック
│   │   ├── kpi-tracker.js       # KPI入力・学習ループ
│   │   └── batch-generator.js   # パイプライン統合
│   ├── utils/
│   │   ├── claude-client.js     # Claude API（リトライ付き）
│   │   ├── file-helpers.js
│   │   ├── validators.js        # 入力バリデーション
│   │   └── schemas.js           # zod スキーマ定義
│   └── tests/                   # ユニットテスト
├── content/                     # 生成コンテンツ
│   └── <channel>/
│       ├── scripts/             # 台本・Shorts
│       ├── metadata/            # SEO・コンプラ・リパーパス
│       ├── calendar/            # カレンダー
│       └── kpi/                 # KPIデータ
├── docs/
│   ├── 90day-plan.md            # 90日実行計画
│   └── improvement-roadmap.md   # 改善ロードマップ
└── .env                         # API キー（gitignore対象）
```

## 外部ツール連携（推奨）

| 工程 | ツール | 備考 |
|------|--------|------|
| 音声合成 | ElevenLabs | AI ナレーション |
| 画像生成 | Midjourney / Stable Diffusion | サムネイル・挿入画像 |
| 動画編集 | CapCut / DaVinci Resolve | 最終編集 |
| BGM | Suno / Udio | AI 音楽生成 |
| 動画生成 | Runway / Kling AI | 画像→動画変換 |

## 技術スタック

- **Runtime**: Node.js 18+ (ESM)
- **AI**: Claude API (`@anthropic-ai/sdk`) — claude-sonnet-4-20250514
- **CLI**: Commander.js
- **品質**: zod (スキーマ検証), ESLint, Prettier
- **環境変数**: dotenv
