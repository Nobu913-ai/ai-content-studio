---
name: add-topic
description: チャンネルに新しいトピック（動画ネタ）を追加する。「ネタを追加して」「新しいトピック登録」「○○をトピックに入れて」等に使用。
argument-hint: <channel> <topic-title>
---

# トピック追加

チャンネルの `config/channels.js` に新しいトピックを追加します。

## 手順

1. `$ARGUMENTS` からチャンネルとトピックタイトルを特定する
   - 有効なチャンネル ID: `japanese-mindset`, `genz-money`, `chill-culture`
2. `config/channels.js` を読み、対象チャンネルの既存カテゴリとトピックを確認する
3. 新しいトピックがどのカテゴリに属するか判断する。既存カテゴリに合わない場合は新カテゴリの作成を提案する
4. トピックに最適な SEO キーワードを 3-5 個考案する
5. 以下の形式でユーザーに確認する:

```
追加内容:
- チャンネル: <channel name>
- カテゴリ: <category name>
- タイトル: <topic title>
- キーワード: <keyword1>, <keyword2>, ...
```

6. ユーザーが承認したら `config/channels.js` を編集してトピックを追加する
7. 追加後、CLI でトピック一覧を表示して確認する:

```bash
cd ai-content-studio && node src/cli.js topics <channel>
```

## キーワード選定の基準

- **検索ボリューム**: 実際にユーザーが検索しそうなフレーズ
- **具体性**: 「投資」より「20代 少額投資 始め方」のように具体的に
- **チャンネル整合性**: 既存トピックのキーワードと方向性を合わせる
