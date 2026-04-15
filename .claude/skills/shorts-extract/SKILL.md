---
name: shorts-extract
description: 既存の台本からShorts/TikTok/Reels用のショート動画スクリプト3本を切り出す。「Shorts作って」「TikTok用に切り出して」「ショート動画のネタ」等に使用。
argument-hint: <channel> <script-path>
allowed-tools: Bash(node src/cli.js *) Bash(ls *)
---

# Shorts/TikTok/Reels スクリプト切り出し

既存の長尺台本からバイラル性の高いショートスクリプト3本を生成します。

## 手順

1. `$ARGUMENTS` で台本パスが指定されていない場合、最新の台本を探す:

```bash
ls -t content/*/scripts/*.md | head -5
```

2. Shorts を生成:

```bash
cd ai-content-studio && node src/cli.js shorts $ARGUMENTS
```

3. 生成された JSON を読み込み、各 Short について以下を報告:
   - フック文（最初の1-2秒）
   - 拡散可能性スコア（high/medium）と理由
   - プラットフォーム別ハッシュタグ
   - 推定尺

4. TikTok Creator Rewards Program の要件を満たしているか確認:
   - 60秒以上あるか（1分未満は収益対象外）
   - オリジナリティがあるか

## 投稿ガイドライン

- **YouTube Shorts**: 1日2-3本。#Shorts タグ必須
- **TikTok**: 1日2-3本。19:00-22:00 JST が最適
- **Instagram Reels**: 1日1-2本。ストーリーズでもシェア
- 同じ内容を3プラットフォームに投稿してOK（各プラットフォーム用にリサイズが必要）
