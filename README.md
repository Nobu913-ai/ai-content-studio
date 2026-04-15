# AI Content Studio v3.0

YouTube + TikTok + Instagram + Twitter/X 対応の3チャンネル統合コンテンツ制作基盤。  
Claude API を使い、**Shorts先行テスト → 長尺化 → SEO → 全SNS展開 → コンプラチェック → KPI学習**の全工程を CLI で自動化。  
**Runway / ElevenLabs / Descript / DaVinci Resolve** の4ツール連携による制作パイプラインを搭載。

## 特徴

- **4ツール統合制作パイプライン**: Runway(動画) + ElevenLabs(音声) + Descript(AI編集) + DaVinci(最終仕上げ)
- **Shorts先行戦略**: Shortsで仮説検証し、勝ちテーマだけ長尺化
- **KPI学習ループ**: 投稿後の再生数・CTR・維持率を記録し、次回生成に自動反映
- **金融コンプラ強化**: 一次情報URL必須、免責事項強制、禁止表現検出、ソースメタデータ構造化
- **品質保証**: zod によるJSON出力スキーマ検証、ESLint/Prettier
- **マルチプラットフォーム**: YouTube説明文、Twitter/Xスレッド、Instagramキャプションを一括生成
- **API未設定でも動作**: 外部API未設定の場合は自動スキップし、手動ステップとして記録

## チャンネル構成

| ID | チャンネル名 | 言語 | ターゲット | 優先度 |
|----|-------------|------|-----------|--------|
| `genz-money` | Z世代マネー教室 | JA | 日本 18-28歳 金融リテラシー | 主力 |
| `japanese-mindset` | Japanese Mindset | EN | 英語圏 25-45歳 日本文化 | 並走 |
| `chill-culture` | チルカルチャーガイド | JA | 日本 18-30歳 チル文化 | 後発 |

## ツールスタック

| ツール | 役割 | 月額目安 | API連携 |
|--------|------|---------|---------|
| Runway Standard | 動画生成ハブ | $12 | Yes |
| ElevenLabs Creator | 日英ナレーション | $22 | Yes |
| Descript Creator | AI補助編集・字幕 | $24-$35 | Yes (beta) |
| DaVinci Resolve Free | 最終仕上げ | $0 | 手動 |

## セットアップ

```bash
cd ai-content-studio
npm install

# API キーを設定
cp .env.example .env
# .env を編集して必要なAPIキーを設定
# ANTHROPIC_API_KEY（必須）
# RUNWAY_API_KEY, ELEVENLABS_API_KEY, DESCRIPT_API_KEY（任意）
```

## CLI コマンド一覧

### 基本操作
```bash
acs channels                          # チャンネル一覧
acs topics <channel>                  # トピック一覧
acs status                            # 制作状況
acs monetize [channel]                # 収益化ダッシュボード
acs tools                             # ツールスタック・API接続状況
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

### 制作パイプライン（4ツール連携）
```bash
acs shot-plan <channel> <script-path> # Runway用ショットプラン生成
acs narration <channel> <script-path> # ElevenLabs用ナレーションテキスト整形
acs handoff <channel> <script-path>   # DaVinci用編集ハンドオフノート生成
acs produce-plan <channel> <topic>    # 計画フェーズ一括（台本+ショット+ナレーション+ハンドオフ）
acs produce <channel> <topic>         # 全工程一括（計画+Runway+ElevenLabs+Descript）
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

## 推奨ワークフロー

### Shorts先行 → 長尺化フロー
```
1. acs shorts-first genz-money "新NISAの始め方"   <- Shorts 3本でテスト
2. 各プラットフォームに投稿 -> 1-2週間反応を見る
3. acs kpi genz-money vid01 --views 2500 --ctr 8   <- KPIを記録
4. acs pipeline genz-money "新NISAの始め方"        <- 勝ちテーマを長尺化
5. コンプラ結果確認 -> 独自視点を追加 -> 投稿
```

### 4ツール連携制作フロー
```
1. acs produce-plan genz-money "新NISAの始め方"   <- 計画フェーズ（Claude APIのみ）
   -> 台本 + ショットプラン + ナレーションテキスト + ハンドオフノート
2. Runway でショットプラン通りに動画クリップ生成
3. ElevenLabs でナレーション音声生成
4. Descript で動画+音声をインポート -> 字幕+整音+ラフカット
5. DaVinci Resolve でハンドオフノートを参照して最終仕上げ -> 書き出し
```

### API設定済みなら全自動
```
acs produce genz-money "新NISAの始め方"
# -> 台本 -> ショットプラン -> ナレーション -> Runway -> ElevenLabs -> Descript -> ハンドオフ
# API未設定のツールは自動スキップ、手動ステップとして表示
```

## 品質保証

### 金融コンテンツ（genz-money）
- 台本に `[SOURCE: URL]` `[INFO DATE:]` `[INFO TYPE:]` マーカーを自動要求
- コンプラチェックで未出典・禁止表現・免責事項欠落を検出
- ソースメタデータを `_sources.json` として構造化保存
- `--sources` オプションで公式情報URLを直接指定可能

### スキーマ検証（zod）
- SEO: タイトル3件以上、タグ5件以上、説明文10文字以上
- Shorts: 各30-180秒、必須フィールド完備
- Compliance: スコア0-100、verdict(pass/warn/fail)
- Source Metadata: claim-to-source mapping、disclaimer有無

### テスト・Lint
```bash
npm test          # 77テスト（schema, KPI, validators, currency, source, tools, narration）
npm run lint      # ESLint
npm run format    # Prettier
```

## ディレクトリ構成

```
ai-content-studio/
├── config/
│   ├── channels.js              # チャンネル設定・トピック定義
│   ├── monetization.js          # 収益化戦略
│   └── tools.js                 # ツール設定・Voice routing・Shot style
├── src/
│   ├── cli.js                   # メインCLI（21コマンド）
│   ├── clients/
│   │   ├── runway-client.js     # Runway API クライアント
│   │   ├── elevenlabs-client.js # ElevenLabs API クライアント
│   │   └── descript-client.js   # Descript API クライアント
│   ├── generators/
│   │   ├── script-generator.js  # 台本生成（金融ルール+ソース抽出）
│   │   ├── seo-generator.js     # SEO（10タイトル+5サムネ文言）
│   │   ├── calendar-generator.js
│   │   ├── shorts-generator.js  # Shorts（切り出し+トピック直接）
│   │   ├── repurpose-generator.js # マルチプラットフォーム展開
│   │   ├── compliance-checker.js  # コンプラ・品質チェック
│   │   ├── kpi-tracker.js       # KPI入力・学習ループ
│   │   ├── batch-generator.js   # パイプライン統合
│   │   ├── shot-planner.js      # Runway用ショットプラン生成
│   │   ├── narration-formatter.js # ElevenLabs用ナレーション整形
│   │   ├── handoff-generator.js # DaVinci用ハンドオフノート
│   │   └── production-pipeline.js # 4ツール統合制作パイプライン
│   ├── utils/
│   │   ├── claude-client.js     # Claude API（リトライ付き）
│   │   ├── file-helpers.js
│   │   ├── validators.js        # 入力バリデーション
│   │   ├── schemas.js           # zod スキーマ定義
│   │   └── source-extractor.js  # 金融ソースメタデータ抽出
│   └── tests/                   # ユニットテスト（77テスト）
├── content/                     # 生成コンテンツ
│   └── <channel>/
│       ├── scripts/             # 台本・Shorts・ナレーション
│       ├── metadata/            # SEO・コンプラ・ショットプラン・ハンドオフ
│       ├── audio/               # 生成音声
│       ├── calendar/            # カレンダー
│       └── kpi/                 # KPIデータ
├── docs/
│   ├── 90day-plan.md            # 90日実行計画
│   └── improvement-roadmap.md   # 改善ロードマップ
└── .env                         # API キー（gitignore対象）
```

## 外部ツール連携

### 採用ツール（固定スタック）

| ツール | 役割 | 接続方式 |
|--------|------|----------|
| Runway Standard | 動画生成ハブ | API |
| ElevenLabs Creator | 日英ナレーション | REST API |
| Descript Creator | AI編集・字幕・整音 | API (beta) |
| DaVinci Resolve Free | 最終仕上げ | 手動 |

### 保留ツール

| 優先度 | ツール | 再検討条件 |
|--------|--------|-----------|
| 高 | Adobe Firefly | 図解品質が課題になった時 |
| 高 | Vertex AI Veo 3.1 | ショット単位の従量最適化時 |
| 中 | FLUX系API | サムネABテスト大量化時 |
| 中 | OpusClip | 長尺→Shorts切り出し工数増加時 |
| 中 | Midjourney | ブランド世界観強化時 |
| 低 | HeyGen | 英語講師キャラ型に寄せる時 |

## 技術スタック

- **Runtime**: Node.js 18+ (ESM)
- **AI**: Claude API (`@anthropic-ai/sdk`) -- claude-sonnet-4-20250514
- **CLI**: Commander.js
- **品質**: zod (スキーマ検証), ESLint, Prettier
- **環境変数**: dotenv
- **外部API**: Runway, ElevenLabs, Descript (optional)

## 月額コスト目安

| 項目 | 金額 |
|------|------|
| Runway Standard | $12/月 |
| ElevenLabs Creator | $22/月 |
| DaVinci Resolve Free | $0 |
| Descript Creator | $24-$35/月 |
| **合計** | **$58-$69/月** |
