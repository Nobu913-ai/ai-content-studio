---
name: full-pipeline
description: 台本生成からSEO最適化まで一括実行するフルパイプライン。「動画を1本作って」「フルで生成して」「台本とSEOまとめて」等に使用。
argument-hint: <channel> <topic>
disable-model-invocation: true
allowed-tools: Bash(node src/cli.js *)
---

# フルパイプライン実行

台本生成 → SEO最適化 を一気通貫で実行し、動画制作に必要な素材を揃えます。

## 手順

1. 引数からチャンネルとトピックを特定する
   - 有効なチャンネル ID: `japanese-mindset`, `genz-money`, `chill-culture`
2. フルパイプラインを実行する:

```bash
cd ai-content-studio && node src/cli.js full $ARGUMENTS
```

3. 生成された台本ファイルを読んでレビューする
4. 生成された SEO メタデータ（JSON）を読み、以下を報告する:
   - タイトル候補3つ（おすすめ順に並べる）
   - 説明文のプレビュー
   - タグ一覧
   - サムネイルアイデア
   - Shorts 用フック
5. 最後に次のステップ（音声生成、画像生成等）を案内する

## 出力サマリーのフォーマット

以下の形式でユーザーに報告する:

```
## 生成完了

### 台本
- ファイル: content/<channel>/scripts/...
- 推定尺: X分
- セクション数: X

### SEO メタデータ
- おすすめタイトル: 「...」
- タグ数: X
- サムネイル案: X案

### 次のステップ
1. 台本を確認・修正 → /review-script で改善可能
2. ElevenLabs で音声生成
3. Midjourney でサムネイル・挿入画像作成
4. CapCut/DaVinci で編集
```
