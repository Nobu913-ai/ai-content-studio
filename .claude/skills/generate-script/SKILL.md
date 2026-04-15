---
name: generate-script
description: YouTube台本を生成する。チャンネルとトピックを指定して、SEOに最適化された動画台本を作成。「台本を書いて」「スクリプト作って」「○○の動画を作りたい」等のリクエストに使用。
argument-hint: <channel> <topic>
allowed-tools: Bash(node src/cli.js *)
---

# YouTube 台本生成

指定されたチャンネルとトピックで YouTube 動画の台本を生成します。

## 手順

1. まず引数を確認する。`$ARGUMENTS` が空、またはチャンネル指定が不明確な場合は、ユーザーに確認する
   - 有効なチャンネル ID: `japanese-mindset`, `genz-money`, `chill-culture`
2. トピックがチャンネルの登録トピックに該当するか、`config/channels.js` を読んで確認する
3. CLI で台本を生成する:

```bash
cd ai-content-studio && node src/cli.js script $ARGUMENTS
```

4. 生成された台本ファイルを読み、以下の観点でクイックレビューする:
   - **フック**: 冒頭30秒で視聴者を掴めているか
   - **構成**: セクション分けが論理的か
   - **トーン**: チャンネルのトーンに合っているか
   - **長さ**: 目標尺に収まるか
5. レビュー結果と改善提案をユーザーに報告する
6. ユーザーが修正を希望する場合は、台本ファイルを直接編集する

## チャンネル別の注意点

- **japanese-mindset**: 日本語の概念を英語圏の人に伝わる比喩で説明できているか確認
- **genz-money**: 金融情報の正確性を特に重視。「投資は自己責任」の注意喚起を含めること
- **chill-culture**: シーシャ関連はYouTubeのタバコポリシーに抵触しない表現になっているか確認
