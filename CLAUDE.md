# AI Content Studio

YouTube 3チャンネル統合コンテンツ制作パイプライン。

## プロジェクト概要

Claude API を使い、台本生成 → SEO最適化 → カレンダー管理を CLI で行うツール。

### チャンネル構成

| ID | 名前 | 言語 | ターゲット |
|----|------|------|-----------|
| `japanese-mindset` | Japanese Mindset | EN | 英語圏 25-45歳。日本の哲学・マインドセットを紹介 |
| `genz-money` | Z世代マネー教室 | JA | 日本 18-28歳。金融リテラシーをカジュアルに |
| `chill-culture` | チルカルチャーガイド | JA | 日本 18-30歳。シーシャ、カフェ、サウナ、音楽 |

### 各チャンネルのトーン

- **japanese-mindset**: 落ち着いた洞察的なナレーション。ステレオタイプを避け、深みを持たせる。英語で出力。
- **genz-money**: カジュアルでテンポが速い。「ぶっちゃけ」「マジで」等の若者言葉OK。正確性は維持。
- **chill-culture**: 落ち着いたカジュアル。「エモい」「チルい」「整う」を自然に使用。シーシャは「空間体験」にフォーカスし喫煙推奨にならないこと。

## 技術スタック

- **Runtime**: Node.js (ESM)
- **AI**: Claude API (`@anthropic-ai/sdk`) — モデルは `claude-sonnet-4-20250514`
- **CLI**: Commander.js
- **環境変数**: `ANTHROPIC_API_KEY` が必要

## ディレクトリ構成

```
config/channels.js     — チャンネル設定・トピック定義
src/cli.js             — メインCLI エントリポイント
src/generators/        — 台本・SEO・カレンダー生成エンジン
src/utils/             — Claude API クライアント、ファイルヘルパー
content/<channel>/     — 生成されたコンテンツ（scripts/, metadata/, calendar/）
```

## CLI コマンド

```bash
node src/cli.js channels            # チャンネル一覧
node src/cli.js topics <channel>    # トピック一覧
node src/cli.js script <channel> <topic>   # 台本生成
node src/cli.js seo <channel> <script-path>  # SEO生成
node src/cli.js calendar <channel>  # カレンダー生成
node src/cli.js full <channel> <topic>  # 台本+SEO一括
node src/cli.js status              # 制作状況
```

## コーディング規約

- ESM (`import`/`export`) を使用。`require` は使わない。
- チャンネル設定の変更は `config/channels.js` のみで行う。
- 生成コンテンツは `content/<channel-id>/` 配下に日時付きファイル名で保存。
- エラーメッセージは日本語で表示。
