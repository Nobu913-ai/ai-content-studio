# E2E Walkthrough: 1本のコンテンツを最後まで通す

このガイドでは、genz-money チャンネルで「新NISAの始め方」を Shorts として
企画 → 台本 → 動画素材 → 音声 → 編集 → 最終仕上げ → 投稿 → KPI記録
まで一通り完了する手順を示します。

## 前提

- `ANTHROPIC_API_KEY` は設定済み（必須）
- 外部APIキー（Runway / ElevenLabs / Descript）は未設定でもOK（手動フォールバック）

---

## Phase 0: 企画

### 0-1. トピック候補を生成

```bash
acs topic-gen genz-money -n 5
```

出力例:
```
  1. [trend] 新NISA2026年改正のポイント — viral: 8/10
  2. [comparison] つみたてNISA vs 新NISA — viral: 7/10
  3. [contrarian] 「NISAは損する」は本当か？ — viral: 9/10
  ...
```

### 0-2. 既存トピックも確認

```bash
acs topics genz-money
```

---

## Phase 1: 計画（Claude APIのみ）

### 方法A: 一括実行

```bash
acs produce-plan genz-money "新NISAの始め方" --format shorts \
  --sources https://www.fsa.go.jp/policy/nisa2/
```

これで以下が一括生成されます:
1. 台本（`content/genz-money/scripts/...md`）
2. ショットプラン（`content/genz-money/metadata/..._shots.json`）
3. ナレーションテキスト（`content/genz-money/metadata/..._narration.json` + `.txt`）
4. ハンドオフノート（`content/genz-money/metadata/..._handoff.md`）

### 方法B: ステップごとに実行

```bash
# Step 1: 台本
acs script genz-money "新NISAの始め方" --sources https://www.fsa.go.jp/policy/nisa2/

# Step 2: コンプライアンスチェック（金融系は必須）
acs check genz-money content/genz-money/scripts/xxx.md

# Step 3: ショットプラン
acs shot-plan genz-money content/genz-money/scripts/xxx.md --format shorts

# Step 4: ナレーションテキスト
acs narration genz-money content/genz-money/scripts/xxx.md

# Step 5: ハンドオフノート
acs handoff genz-money content/genz-money/scripts/xxx.md \
  --shot-plan content/genz-money/metadata/xxx_shots.json
```

### 確認ポイント

- [ ] 台本の金融情報に `[SOURCE: URL]` マーカーがあるか
- [ ] 免責事項（`※投資は自己責任です`等）が含まれるか
- [ ] コンプラチェックが pass / warn（fail なら修正）
- [ ] ショットプランの各ショットにプロンプトがあるか

---

## Phase 2: 素材生成

### APIキー設定済みの場合

```bash
acs produce genz-money "新NISAの始め方" --format shorts
```

全ステップが自動実行され、マニフェストJSON が出力されます。

### APIキー未設定の場合（手動フォールバック）

`acs produce` を実行すると、APIなしのステップは `manual` としてスキップされます。
以下の手動オペレーションが必要です。

#### 手動ステップ 1: Runway で動画クリップ生成

1. ショットプランJSON（`content/genz-money/metadata/xxx_shots.json`）を開く
2. 各ショットの `prompt` を Runway にコピー
3. `aspect_ratio`（9:16）と `duration_sec` を設定
4. 生成された動画をダウンロードし、`content/genz-money/assets/video/` に保存

#### 手動ステップ 2: ElevenLabs でナレーション生成

1. ナレーションテキスト（`content/genz-money/metadata/xxx_narration.txt`）を開く
2. ElevenLabs の Text-to-Speech にペースト
3. Voice: 日本語・信頼感のある落ち着いたトーン
4. Settings: stability 0.7, similarity_boost 0.75
5. 生成されたMP3を `content/genz-money/audio/` に保存

#### 手動ステップ 3: Descript でインポート+編集

1. Descript でプロジェクトを新規作成（タイトル: 「新NISAの始め方」）
2. 動画クリップ（Runway出力）と音声（ElevenLabs出力）をインポート
3. AI機能を適用:
   - Studio Sound（整音）
   - 字幕生成
   - フィラーワード除去
4. ラフカットを確認
5. **export は DaVinci に渡すため不要**（Descript はラフカット確認まで）

---

## Phase 3: DaVinci Resolve で最終仕上げ

### 3-1. ハンドオフパッケージを準備

```bash
acs handoff genz-money content/genz-money/scripts/xxx.md --package \
  --shot-plan content/genz-money/metadata/xxx_shots.json \
  --audio content/genz-money/audio/xxx_narration.mp3
```

パッケージ構造:
```
content/genz-money/handoff/<ts>_xxx/
├── package.json     <- 開いてチェックリストを確認
├── handoff.md       <- 編集指示書
├── docs/            <- 台本・ショットプランのコピー
└── assets/
    ├── video/       <- Runway動画
    └── audio/       <- ナレーション音声
```

### 3-2. DaVinci Resolve での作業

`handoff.md` を参照して以下を実行:

1. [ ] 新規タイムラインを作成（1080x1920, 30fps）
2. [ ] 動画クリップを配置
3. [ ] ナレーション音声を同期
4. [ ] テキストオーバーレイを追加（タイトル、ポイント、CTA）
5. [ ] BGMを配置・音量調整（speech -14 LUFS, BGM -25 LUFS）
6. [ ] カラーグレーディング
7. [ ] 書き出し（H.264, 1080x1920, 30fps）

### 3-3. package.json のチェックリスト更新

```json
{
  "checklist": [
    { "item": "全クリップをタイムラインに配置", "done": true },
    { "item": "ナレーション音声を同期", "done": true },
    ...
  ]
}
```

---

## Phase 4: SEO + マルチプラットフォーム

```bash
# SEOメタデータ生成
acs seo genz-money content/genz-money/scripts/xxx.md

# マルチプラットフォーム展開
acs repurpose genz-money content/genz-money/scripts/xxx.md
```

出力:
- YouTube: タイトル10案 + サムネ文言5案 + 説明文 + タグ
- Twitter/X: スレッド形式
- Instagram: キャプション + カルーセル案

---

## Phase 5: 投稿（手動）

1. YouTube Shorts にアップロード
   - SEO出力からタイトル・説明文・タグを設定
2. TikTok にアップロード
3. Instagram Reels にアップロード
4. Twitter/X にスレッド投稿

---

## Phase 6: KPI記録 + 学習ループ

### 投稿1-2週間後にKPIを記録

```bash
acs kpi genz-money vid-nisa-001 \
  --title "新NISAの始め方" \
  --views 2500 \
  --ctr 8.5 \
  --retention 62 \
  --likes 120 \
  --type shorts \
  --hook "月100円から始められるって知ってた？" \
  --angle "初心者向け入門"
```

### KPIサマリーで勝ちパターンを確認

```bash
acs kpi-summary genz-money
```

出力例:
```
  動画数: 5 | Win: 2 | Neutral: 2 | Lose: 1
  平均: 再生1800回 | CTR 6.2% | 維持率48%

  --- Top 3 ---
  [W] 新NISAの始め方 — 2500回 CTR:8.5% 維持:62%
  [W] つみたてNISAの落とし穴 — 2100回 CTR:7.8% 維持:55%
  [-] 投資信託の選び方 — 1500回 CTR:5.5% 維持:45%
```

### 勝ちテーマを長尺化

```bash
# KPI が win のトピックを長尺化
acs produce genz-money "新NISAの始め方" --format longform
```

勝ちパターン（hook、angle、topic）は次回の台本生成プロンプトに自動注入されます。

---

## マニフェストの活用

`acs produce` が出力するマニフェストJSON（`content/<ch>/metadata/xxx_manifest.json`）には:

- `version`: パイプラインバージョン
- `steps[]`: 各ステップの実行状態（done/manual/error/skipped）
- `outputs`: 全出力ファイルパス
- `media.remoteUrls`: Descript に渡せるURL一覧
- `media.localPaths`: 手動インポートが必要なローカルファイル
- `audioMetadata`: ElevenLabs の音声設定
- `manualSteps[]`: 手動介入が必要なステップ
- `errors[]`: エラーが発生したステップ
- `stats`: 完了/スキップ/手動/エラーの集計

KPIとの紐づけは `videoId` をキーに manifest の `topic` と照合できます。
