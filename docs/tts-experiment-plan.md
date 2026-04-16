# TTS品質改善 実験計画

冒頭30秒を使った段階的比較テスト。
変数を1つずつ固定して、品質影響の主因を特定する。

## Phase 1: Script 比較（最優先）

**目的**: 聞きづらさの主因が原稿にあるかを特定する

- **固定変数**: Voice（チャンネル設定）、Model（eleven_multilingual_v2）
- **変動変数**: 原稿（3パターン）
- **原稿ファイル**:
  - `content/genz-money/scripts/tts-rewrite-pattern-A.txt`
  - `content/genz-money/scripts/tts-rewrite-pattern-B.txt`
  - `content/genz-money/scripts/tts-rewrite-pattern-C.txt`

### 実行コマンド

```bash
acs tts-bench-script genz-money \
  --scripts content/genz-money/scripts/tts-rewrite-pattern-A.txt,content/genz-money/scripts/tts-rewrite-pattern-B.txt,content/genz-money/scripts/tts-rewrite-pattern-C.txt \
  --label script-comparison-30s
```

### 評価ポイント
- 誤読が減ったか
- 間・ポーズが自然か
- 文の区切りが明確か
- 制度語・数字の聞き取りやすさ

### 判定基準
- 3パターン中、スコア合計が最も高い原稿を採用
- 全パターンで改善が見られない場合 → 原稿以外の要因を調査

---

## Phase 2: Voice 比較

**前提**: Phase 1 で採用した原稿を使う

- **固定変数**: 原稿（Phase 1 採用版）、Model（eleven_multilingual_v2）
- **変動変数**: Voice（3本以上）

### 実行コマンド

```bash
acs tts-bench-voice genz-money <採用原稿パス> \
  --voices <voice_id_1>,<voice_id_2>,<voice_id_3> \
  --label voice-comparison-30s
```

### 評価軸
- 誤読率
- 数字・制度語の安定性
- 文末の自然さ
- 早口時の崩れにくさ
- 若者向けでも軽薄すぎないか

---

## Phase 3: Model 比較

**前提**: Phase 1 の原稿 + Phase 2 の Voice を使う

- **固定変数**: 原稿（Phase 1 採用版）、Voice（Phase 2 採用版）
- **変動変数**: Model（2種類以上）

### 実行コマンド

```bash
acs tts-bench-model genz-money <採用原稿パス> \
  --voice <採用voice_id> \
  --models eleven_multilingual_v2,eleven_turbo_v2_5 \
  --label model-comparison-30s
```

---

## Phase 4: 読み辞書チューニング

Phase 1〜3 の最終構成で全文ナレーションを生成し、
実際に聴いて誤読箇所を辞書に追加する。

### 手順
1. 全文ナレーション生成: `acs narration genz-money <台本>`
2. 音声を通しで聴く
3. 誤読を `config/pronunciation-dictionary.json` に追加
4. 再生成して確認
5. 改善するまで繰り返す

### 辞書追加の優先候補語
- 保有限度額、全世界株式、積立、信用取引
- 約定、配当金、確定申告

---

## Phase 5: Voice Design（オプション）

Phase 2 の既存 Voice で満足できない場合のみ実行。

### テンプレート
`config/voice-design-templates.json` の `ja-explainer-trust` を使用。

### 方向性
- 落ち着いている
- 明瞭
- 説明向き
- 若年層向けだが軽すぎない
- 制度説明に向く

---

## Phase 6: 別TTS比較（最終手段）

Phase 1〜5 を経てもなお品質が不十分な場合のみ検討。

### 比較候補に追加する条件
- 原稿最適化済み
- 辞書調整済み
- Voice 3本以上比較済み
- Model 2種類以上比較済み

### 候補エンジン
- Azure Cognitive Services Speech（SSML制御が強い）
- Google Cloud Text-to-Speech（WaveNet/Neural2）
