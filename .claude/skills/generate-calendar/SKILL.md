---
name: generate-calendar
description: コンテンツカレンダー（投稿計画）を生成する。4週間分の動画投稿スケジュールを自動作成。「カレンダー作って」「来月の投稿計画」「スケジュール立てて」等に使用。
argument-hint: <channel> [--weeks N]
allowed-tools: Bash(node src/cli.js *)
---

# コンテンツカレンダー生成

チャンネルの投稿カレンダーを生成し、戦略的な投稿計画を立てます。

## 手順

1. 引数からチャンネルを特定する。`$ARGUMENTS` が空なら全3チャンネル分を生成するか確認する
   - 有効なチャンネル ID: `japanese-mindset`, `genz-money`, `chill-culture`
2. CLI でカレンダーを生成する:

```bash
cd ai-content-studio && node src/cli.js calendar $ARGUMENTS
```

3. 生成されたカレンダー JSON を読み込み、以下を確認する:
   - 曜日の偏りがないか（高トラフィック日 = 火〜木に重要コンテンツを配置）
   - カテゴリのバランスが取れているか
   - Shorts と長尺動画の連携が適切か
4. 結果を見やすい表形式でユーザーに提示する
5. 3チャンネル分を一括生成した場合は、チャンネル間でテーマが重複しないか確認する

## 全チャンネル一括生成

引数なしまたは「全部」と指定された場合:

```bash
cd ai-content-studio && node src/cli.js calendar japanese-mindset
cd ai-content-studio && node src/cli.js calendar genz-money
cd ai-content-studio && node src/cli.js calendar chill-culture
```
