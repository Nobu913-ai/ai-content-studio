---
name: repurpose
description: 台本をマルチプラットフォーム展開用に変換する。YouTube説明文(アフィリエイトリンク入り)、Twitterスレッド、Instagramキャプション・カルーセルを生成。「SNS展開して」「Twitter用に変換」「説明文作って」等に使用。
argument-hint: <channel> <script-path>
allowed-tools: Bash(node src/cli.js *) Bash(ls *)
---

# マルチプラットフォーム コンテンツ展開

1本の台本から YouTube 以外の全 SNS 用コンテンツを生成します。

## 手順

1. `$ARGUMENTS` で台本パスが指定されていない場合、最新の台本を探す:

```bash
ls -t content/*/scripts/*.md | head -5
```

2. Repurpose コンテンツを生成:

```bash
cd ai-content-studio && node src/cli.js repurpose $ARGUMENTS
```

3. 生成された JSON を読み込み、以下を整形して表示する:

### YouTube 説明文
- アフィリエイトリンクが適切に配置されているか確認
- タイムスタンプが含まれているか確認
- PR 表記・免責事項が含まれているか確認

### Twitter/X スレッド
- 各ツイートが280文字以内か確認
- 1ツイート目が単体でも機能するか確認
- 最終ツイートにCTA（動画リンク誘導）があるか確認

### Instagram
- キャプションにハッシュタグが適切に入っているか
- カルーセルスライドが5-10枚で構成されているか

4. `config/monetization.js` のアフィリエイト設定と照合し、高 CPA の案件が優先的に配置されているか確認する

## 収益化のポイント

- **genz-money**: 証券口座開設（CPA ¥2,000-5,000）を最優先で配置
- **chill-culture**: Amazon/楽天アフィリエイトで紹介商品のリンクを入れる
- **japanese-mindset**: Audible/Skillshare のトライアル誘導が効果的
