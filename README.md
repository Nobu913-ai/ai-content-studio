# AI Content Studio

3チャンネル統合 YouTube コンテンツ制作パイプライン。  
Claude API を使い、台本生成 → SEO最適化 → カレンダー管理を CLI で一気通貫で行う。

## チャンネル構成

| ID | チャンネル名 | 言語 | ターゲット | CPM |
|----|-------------|------|-----------|-----|
| `japanese-mindset` | Japanese Mindset | EN | 英語圏 25-45歳 | $10-20 |
| `genz-money` | Z世代マネー教室 | JA | 日本 18-28歳 | $10-20 |
| `chill-culture` | チルカルチャーガイド | JA | 日本 18-30歳 | $3-8 |

## セットアップ

```bash
cd ai-content-studio
npm install

# API キーを設定
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定
```

## 使い方

```bash
# チャンネル一覧
node src/cli.js channels

# トピック一覧
node src/cli.js topics japanese-mindset
node src/cli.js topics genz-money
node src/cli.js topics chill-culture

# 台本生成
node src/cli.js script japanese-mindset "Ikigai"
node src/cli.js script genz-money "新NISA"
node src/cli.js script chill-culture "サウナ"

# 台本 + SEO 一括生成
node src/cli.js full japanese-mindset "Wabi-Sabi"

# コンテンツカレンダー生成（4週間分）
node src/cli.js calendar japanese-mindset
node src/cli.js calendar genz-money --weeks 6

# 制作状況確認
node src/cli.js status
```

## ディレクトリ構成

```
ai-content-studio/
├── config/
│   └── channels.js          # 3チャンネルの設定・トピック定義
├── src/
│   ├── cli.js                # メインCLI
│   ├── generators/
│   │   ├── script-generator.js   # 台本生成エンジン
│   │   ├── seo-generator.js      # SEOメタデータ生成
│   │   ├── calendar-generator.js # コンテンツカレンダー生成
│   │   └── batch-generator.js    # パイプライン統合
│   └── utils/
│       ├── claude-client.js      # Claude API クライアント
│       └── file-helpers.js       # ファイル操作ユーティリティ
├── content/                  # 生成コンテンツ（gitignore対象）
│   ├── japanese-mindset/
│   │   ├── scripts/          # 生成された台本
│   │   ├── metadata/         # SEOメタデータ
│   │   └── calendar/         # コンテンツカレンダー
│   ├── genz-money/
│   └── chill-culture/
└── .env                      # API キー（gitignore対象）
```

## コンテンツ制作ワークフロー

```
1. カレンダー生成     → node src/cli.js calendar <channel>
2. 台本 + SEO 生成    → node src/cli.js full <channel> "<topic>"
3. 台本レビュー・修正 → content/<channel>/scripts/ を編集
4. 音声生成           → ElevenLabs 等で音声化
5. 映像制作           → Midjourney + CapCut / DaVinci Resolve
6. アップロード       → SEOメタデータを YouTube に適用
```

## 外部ツール連携（推奨）

| 工程 | ツール | 備考 |
|------|--------|------|
| 音声合成 | ElevenLabs | AI ナレーション |
| 画像生成 | Midjourney / Stable Diffusion | サムネイル・挿入画像 |
| 動画編集 | CapCut / DaVinci Resolve | 最終編集 |
| BGM | Suno / Udio | AI 音楽生成 |
| 動画生成 | Runway / Kling AI | 画像→動画変換 |
