---
name: content-status
description: 全チャンネルのコンテンツ制作状況を表示する。生成済み台本の数、未完了タスク、次にやるべきことを一覧する。「進捗は？」「ステータス見せて」「どこまで作った？」等に使用。
allowed-tools: Bash(node src/cli.js *) Bash(ls *) Bash(wc *)
---

# コンテンツ制作ステータス

全チャンネルの制作状況を一覧表示し、次のアクションを提案します。

## 手順

1. CLI でステータスを取得する:

```bash
cd ai-content-studio && node src/cli.js status
```

2. 各チャンネルの `content/` ディレクトリを確認し、詳細な状況を集計する:

```bash
ls -lt content/japanese-mindset/scripts/ 2>/dev/null | head -5
ls -lt content/genz-money/scripts/ 2>/dev/null | head -5
ls -lt content/chill-culture/scripts/ 2>/dev/null | head -5
```

3. 以下のフォーマットでダッシュボードを表示する:

```
## Content Studio ダッシュボード

| チャンネル | 台本 | SEO | カレンダー | 最終更新 |
|-----------|------|-----|----------|---------|
| Japanese Mindset | X本 | X件 | X件 | YYYY-MM-DD |
| お金の初期設定 | X本 | X件 | X件 | YYYY-MM-DD |
| チルカルチャー | X本 | X件 | X件 | YYYY-MM-DD |

### 次のアクション
1. ...
2. ...
```

4. 最新のカレンダーがあれば、今週予定されている動画を表示する
5. 台本はあるが SEO がない動画を特定し、SEO 生成を提案する
