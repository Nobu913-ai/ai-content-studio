---
name: pipeline
description: 1本の動画から全SNS素材を一括生成するフルパイプライン。台本+SEO+Shorts3本+YouTube説明文(アフィリエイト入り)+Twitterスレッド+Instagramキャプションを一括作成。「動画1本分まるごと作って」「パイプライン回して」「全部作って」等に使用。
argument-hint: <channel> <topic>
disable-model-invocation: true
allowed-tools: Bash(node src/cli.js *)
---

# フルコンテンツパイプライン

1本の長尺動画コンテンツから、全プラットフォーム用の素材を一括生成します。

## 生成されるもの

| # | 素材 | 用途 |
|---|------|------|
| 1 | 台本 (8-15分) | YouTube 長尺動画 |
| 2 | SEO メタデータ | タイトル3案 + 説明文 + タグ + サムネ案 |
| 3 | Shorts スクリプト x3 | YouTube Shorts / TikTok / Instagram Reels |
| 4 | YouTube 説明文 | アフィリエイトリンク + 免責事項入り |
| 5 | Twitter/X スレッド | 5ツイートのスレッド |
| 6 | Instagram キャプション | カルーセル用スライド構成つき |

## 手順

1. 引数からチャンネルとトピックを特定する
   - 有効なチャンネル ID: `japanese-mindset`, `genz-money`, `chill-culture`

2. フルパイプラインを実行:

```bash
cd ai-content-studio && node src/cli.js pipeline $ARGUMENTS
```

3. 生成された4つのファイルを全て読み込み、サマリーを作成する

4. 以下の順序でユーザーに報告する:
   - 台本の概要（セクション構成、推定尺）
   - タイトル候補 TOP 3（おすすめ順）
   - Shorts 3本のフック文と拡散予測
   - アフィリエイト配置提案
   - Twitter スレッドのプレビュー
   - Instagram カルーセルの構成

5. 次のアクションを案内する:
   - 台本の修正 → `/review-script`
   - 音声生成 → ElevenLabs
   - 画像生成 → Midjourney/Stable Diffusion
   - 投稿スケジュール確認 → `/generate-calendar`
