# MVP スモークテスト計画書

## A. 総評

### 設計フォーカスは十分。実地テストに進むべきタイミング。

v3.0.1 時点で以下が揃っている:
- 22 CLI コマンド（全て import エラーなしで起動確認済み）
- 102 テスト（全パス）
- 4ツール連携パイプライン（計画+生成+マニフェスト）
- **ハイブリッドモード**: 全APIキー任意。ANTHROPIC_API_KEY未設定時はプロンプト書き出し→Claude Code手動実行
- Graceful degradation（全APIキーなしでもCLIが破綻しない）
- manifest / handoff package / KPI接続

**これ以上設計を磨くより、1本通して「どこで壊れるか」を可視化する方が前進する。**

### MVPの目的（再確認）
- 完成動画を作ることが目的ではない
- 「この設計で本当に回るか」を最小コストで確認すること
- 失敗ポイントの可視化が最大の成果物

---

## B. MVPスモークテスト計画

### 対象チャンネル: `genz-money`

理由:
- 金融系 source metadata + compliance チェックの検証ができる
- 日本語ナレーション（ElevenLabs）の検証ができる
- 主力チャンネルであり、最優先で動作確認すべき

### テーマ: 「新NISAの始め方」（Shorts 1本）

理由:
- 公式情報源が明確（金融庁 https://www.fsa.go.jp/policy/nisa2/）
- 制度解説は事実ベースでコンプラリスクが低い
- Shorts は尺が短く、素材数が少なくて済む

### 実行順序（11ステップ）

| # | ステップ | コマンド | API設定時 | API未設定時（ハイブリッド） |
|---|---------|---------|----------|--------------------------|
| 1 | トピック生成 | `topic-gen` | 自動生成 | プロンプト書き出し → Claude Code で実行 |
| 2 | 台本生成 | `script` | 自動生成 | プロンプト書き出し → Claude Code で実行 |
| 3 | ソースメタデータ抽出 | script内で自動 | 自動 | 台本生成後に自動（台本テキスト依存） |
| 4 | コンプラチェック | `check` | 自動生成 | プロンプト書き出し → Claude Code で実行 |
| 5 | ショットプラン生成 | `shot-plan` | 自動生成 | プロンプト書き出し → Claude Code で実行 |
| 6 | ナレーション整形 | `narration` | AI整形 | ローカルフォールバック（マーカー除去のみ） |
| 7 | ElevenLabs TTS | API自動 or 手動 | ELEVENLABS 依存 | ElevenLabs GUI で手動生成 |
| 8 | Runway 動画生成 | API自動 or 手動 | RUNWAY 依存 | Runway GUI で手動生成 |
| 9 | Descript 取り込み | API自動 or 手動 | DESCRIPT 依存 | Descript GUI で手動操作 |
| 10 | DaVinci ハンドオフ | `handoff --package` | 自動生成 | プロンプト書き出し → Claude Code で実行 |
| 11 | マニフェスト出力 | `produce` 内で自動 | 自動 | ステップ状態を manual で記録 |

**ハイブリッドモードの詳細手順:** `docs/hybrid-workflow.md` を参照。

### 期待成果物

```
content/genz-money/
├── scripts/           <- 台本 + _sources.json
├── metadata/
│   ├── *_shots.json    <- ショットプラン
│   ├── *_narration.json <- ナレーションJSON
│   ├── *_narration.txt  <- ナレーションプレーンテキスト
│   ├── *_compliance.json <- コンプラ結果
│   ├── *_handoff.md     <- ハンドオフノート
│   └── *_manifest.json  <- マニフェスト（全工程追跡）
├── audio/             <- ナレーション音声（手動 or API生成）
├── handoff/           <- パッケージディレクトリ（--package 使用時）
└── kpi/               <- KPI記録（投稿後）
```

---

## C. 実装差分レビュー

### そのまま動く箇所

| 機能 | API設定時 | ハイブリッドモード | 確認方法 |
|------|----------|------------------|---------|
| topic-gen | 自動生成 | プロンプト書き出し | CLI --help 確認済み |
| script (金融系) | 自動生成 | プロンプト書き出し | source metadata 抽出含む |
| compliance check | 自動生成 | プロンプト書き出し | 構造化ソースデータ連携済み |
| shot-plan | 自動生成 | プロンプト書き出し | Runway用JSON出力 |
| narration | AI整形 | ローカルフォールバック | ElevenLabs用テキスト |
| handoff | 自動生成 | プロンプト書き出し | ノート + パッケージ |
| handoff --package | 自動生成 | プロンプト書き出し | 固定フォルダ構造 + アセットコピー |
| produce-plan | 4ステップ一括 | プロンプト書き出し + スキップ | 台本未生成時は後続スキップ |
| produce | 7ステップ | 計画=manual, 生成=manual | マニフェストに全ステップ記録 |
| manifest | zod 検証付き | zod 検証付き | manual ステップも記録 |

### 追加修正が必要な箇所

#### High（MVPブロッカー）

| 項目 | 問題 | 対応 |
|------|------|------|
| `.env` 未作成 | 環境変数ファイルがない | `.env.example` → `.env` にコピー（APIキーはすべて任意 — ハイブリッドモードで動作可） |

#### Medium（MVP改善）

| 項目 | 問題 | 対応 |
|------|------|------|
| produce 一括実行のエラー表示 | 外部API失敗時のエラーメッセージが英語混在 | 日本語統一は後回しでOK |
| handoff パッケージのアセット不在 | 音声・動画が未生成の場合 missingAssets が多い | 想定通り。手動で配置後に再パッケージ |
| ElevenLabs voice_id | config/tools.js の voice_id がプレースホルダー | 実 voice_id は ElevenLabs アカウント作成後に更新 |

#### Low（MVP後）

| 項目 | 問題 | 対応 |
|------|------|------|
| Runway model 固定 | model 選択が外出しされていない | MVP後に config 化 |
| Descript API beta | 仕様変更リスク | MVP後に監視 |
| KPI → manifest 逆引き | UI表示がまだ簡素 | MVP後に強化 |

### 「設計上はあるが、まだ実動しない箇所」

| 箇所 | 理由 |
|------|------|
| Runway API 連携 | `RUNWAY_API_KEY` が必要。未設定なら手動フォールバック |
| ElevenLabs API 連携 | `ELEVENLABS_API_KEY` が必要。未設定なら手動フォールバック |
| Descript API 連携 | `DESCRIPT_API_KEY` が必要。未設定なら手動フォールバック |
| Runway ローカルダウンロード | API連携が動かないと発動しない |
| Descript リモートURL投入 | Runway が URL を返さないと投入するものがない |

これらは **設計通りの graceful degradation** であり、バグではない。
MVPでは手動フォールバックで問題ない。

---

## D. 実行コマンド例

### 前提: .env 設定

```bash
cp .env.example .env
# .env を編集（すべてのAPIキーは任意）

# パターン A: API自動生成モード
# ANTHROPIC_API_KEY=sk-ant-... を設定

# パターン B: ハイブリッドモード（推奨: 初回スモークテスト）
# ANTHROPIC_API_KEY はコメントアウトのまま
# → プロンプトが content/_prompts/ に書き出される
# → Claude Code で手動実行し、結果を正しいパスに保存
```

### Step 1: トピック生成（確認用）

**API設定時:**
```bash
acs topic-gen genz-money -n 3
```
出力: 3件のトピック候補（trend/comparison/contrarian等の角度付き）

**ハイブリッドモード:**
```bash
acs topic-gen genz-money -n 3
# → content/_prompts/<ts>_topic-gen.md が生成される
# Claude Code で実行し、結果を content/genz-money/metadata/<ts>_topic_ideas.json に保存
```

### Step 2: 台本生成

**API設定時:**
```bash
acs script genz-money "新NISAの始め方" \
  --sources https://www.fsa.go.jp/policy/nisa2/
```

**ハイブリッドモード:**
```bash
acs script genz-money "新NISAの始め方" \
  --sources https://www.fsa.go.jp/policy/nisa2/
# → content/_prompts/<ts>_script.md が生成される
# Claude Code で実行し、結果を content/genz-money/scripts/<ts>_新nisaの始め方.md に保存
```

出力:
- `content/genz-money/scripts/<ts>_新nisaの始め方.md`
- `content/genz-money/metadata/<ts>_新nisaの始め方_sources.json`（API設定時のみ自動生成）

### Step 3: コンプライアンスチェック

**API設定時:**
```bash
acs check genz-money content/genz-money/scripts/<ts>_新nisaの始め方.md
```

**ハイブリッドモード:**
```bash
acs check genz-money content/genz-money/scripts/<ts>_新nisaの始め方.md
# → content/_prompts/<ts>_compliance.md が生成される
# Claude Code で実行し、結果を content/genz-money/metadata/<ts>_新nisaの始め方_compliance.json に保存
```

出力: スコア (0-100), verdict (pass/warn/fail), 要修正箇所

### Step 4: ショットプラン生成

**API設定時:**
```bash
acs shot-plan genz-money content/genz-money/scripts/<ts>_新nisaの始め方.md \
  --format shorts
```

**ハイブリッドモード:**
```bash
acs shot-plan genz-money content/genz-money/scripts/<ts>_新nisaの始め方.md \
  --format shorts
# → content/_prompts/<ts>_shot-plan.md が生成される
# Claude Code で実行し、結果を content/genz-money/metadata/<ts>_*_shotplan.json に保存
```

出力: `content/genz-money/metadata/<ts>_*_shotplan.json`
各ショットに prompt, duration, aspect_ratio が含まれる

### Step 5: ナレーション整形

```bash
acs narration genz-money content/genz-money/scripts/<ts>_新nisaの始め方.md
```

**注:** ナレーション整形はAPI未設定時でもローカルフォールバック（マーカー除去）で自動処理されます。

出力:
- `content/genz-money/metadata/<ts>_*_narration.json`（API時: セグメント付き / 未設定時: full_text のみ）
- `content/genz-money/scripts/<ts>_*_narration.txt`（プレーンテキスト — ElevenLabs 投入用）

### Step 6: 手動 — ElevenLabs でナレーション生成

1. `*_narration.txt` の内容を ElevenLabs にペースト
2. Voice: 日本語、落ち着いたトーン
3. stability: 0.7, similarity_boost: 0.75
4. MP3 をダウンロードし `content/genz-money/audio/<ts>_narration.mp3` に保存

### Step 7: 手動 — Runway で動画クリップ生成

1. `*_shots.json` を開く
2. 各ショットの `prompt` を Runway にコピー
3. aspect_ratio: 9:16, duration: 5s
4. 生成物を `content/genz-money/assets/video/` に保存

### Step 8: ハンドオフパッケージ生成

```bash
acs handoff genz-money content/genz-money/scripts/<ts>_新nisaの始め方.md \
  --package \
  --shot-plan content/genz-money/metadata/<ts>_*_shots.json \
  --audio content/genz-money/audio/<ts>_narration.mp3
```

出力: `content/genz-money/handoff/<ts>_*/` ディレクトリ

### Step 9: 手動 — Descript で取り込み

1. Descript で新規プロジェクト作成
2. Runway 動画 + ElevenLabs 音声をインポート
3. Studio Sound, 字幕生成 を適用
4. ラフカットを確認（export は DaVinci で行う）

### Step 10: 手動 — DaVinci Resolve で最終仕上げ

1. `handoff/<ts>_*/handoff.md` を参照
2. タイムライン作成（1080x1920, 30fps）
3. クリップ配置 → テキスト → BGM → 書き出し

### Step 11: KPI 記録（投稿後）

```bash
acs kpi genz-money vid-nisa-001 \
  --title "新NISAの始め方" \
  --type shorts \
  --views 500 --ctr 5.0 --retention 45 \
  --hook "月100円から始められるって知ってた？" \
  --topic "新NISAの始め方" \
  --manifest content/genz-money/metadata/<ts>_*_manifest.json
```

### 一括実行版（Step 2-5, 8, 10 を一括）

**API設定時:**
```bash
# 計画フェーズのみ（Claude APIで自動生成）
acs produce-plan genz-money "新NISAの始め方" --format shorts \
  --sources https://www.fsa.go.jp/policy/nisa2/

# 全工程（外部API未設定分は手動フォールバック）
acs produce genz-money "新NISAの始め方" --format shorts \
  --sources https://www.fsa.go.jp/policy/nisa2/
```

**ハイブリッドモード:**
```bash
# produce-plan / produce を実行すると:
# → 台本プロンプトが content/_prompts/ に書き出される
# → 台本未生成のため後続ステップ（shot-plan, narration, handoff）はスキップ
# → マニフェストに全ステップが manual で記録される

# 推奨: ハイブリッドモードでは一括コマンドより個別ステップ実行
# 1. acs script → Claude Code で台本生成 → 保存
# 2. acs shot-plan <台本パス> → Claude Code で実行 → 保存
# 3. acs narration <台本パス> → ローカルフォールバックで自動
# 4. acs handoff <台本パス> → Claude Code で実行 → 保存
```

---

## E. 手動介入ポイント

### Runway（動画クリップ）

#### 確認ポイント
- [ ] ショットプランの prompt が意図した映像になっているか
- [ ] アスペクト比が 9:16（Shorts用）になっているか
- [ ] モーション（カメラワーク）が不自然でないか
- [ ] テキストオーバーレイ部分の余白が確保されているか

#### 失敗時の代替手順
- Runway で再生成（promptを微調整）
- それでもダメなら静止画（Runway の image gen）+ Ken Burns で対応
- 最悪は Canva / PowerPoint で図解を作成してスクリーンショット

### ElevenLabs（ナレーション音声）

#### 確認ポイント
- [ ] 発音の正確さ（金融用語: NISA, つみたて等）
- [ ] テンポが速すぎ/遅すぎないか
- [ ] 音量が均一か
- [ ] 不自然な間（ポーズ）がないか

#### 失敗時の代替手順
- テキストを分割して再生成
- stability / similarity_boost を調整（安定性↑ = 0.8, 抑揚↓）
- 最悪は自分で録音（スマホ OK）

### Descript（AI編集）

#### 確認ポイント
- [ ] 動画と音声が正常にインポートされたか
- [ ] Studio Sound 適用後に音質が改善されたか
- [ ] 字幕が正確に生成されたか（日本語の精度）
- [ ] タイムラインの同期がずれていないか

#### 失敗時の代替手順
- Descript をスキップして DaVinci に直接持ち込む
- 字幕は DaVinci のテキスト機能で手動追加
- 整音は DaVinci の Fairlight で対応

### DaVinci Resolve Free（最終仕上げ）

#### 確認ポイント
- [ ] handoff.md の指示通りにタイムラインが構成できるか
- [ ] テキストオーバーレイの視認性（背景との contrast）
- [ ] 音声レベル（speech -14 LUFS, BGM -25 LUFS 目安）
- [ ] 書き出し設定（H.264, 1080x1920, 30fps）
- [ ] 最終尺が 60秒以内（Shorts制約）

#### 失敗時の代替手順
- テンプレートが合わない → 手動でタイムライン再構成
- 書き出しエラー → codec を H.265 に変更して再試行
- 最悪は CapCut で代替（モバイル書き出し）

---

## F. MVP完了条件 + 次フェーズ

### 完了条件チェックリスト

- [ ] `topic-gen` でトピック候補が3件以上生成された
- [ ] `script` で台本が生成され、`[SOURCE:]` マーカーが含まれる
- [ ] `_sources.json` が生成され、一次情報URLが構造化されている
- [ ] `check` でコンプラスコアが出力される（pass or warn）
- [ ] `shot-plan` でショットプランJSONが生成される
- [ ] `narration` でナレーションテキスト（.json + .txt）が生成される
- [ ] ElevenLabs（手動 or API）でMP3音声が生成される
- [ ] Runway（手動 or API）で動画クリップが1本以上生成される
- [ ] `handoff --package` でパッケージディレクトリが生成される
- [ ] manifest JSON が生成され、全ステップの状態が記録されている
- [ ] 自動化できた工程と手動工程が整理されている
- [ ] 詰まったポイントが記録されている
- [ ] 次に直すべき箇所が優先順位付きで出ている

### ハイブリッドモード追加チェック

- [ ] `content/_prompts/` にプロンプトファイルが正しく書き出される
- [ ] プロンプトファイルに System Prompt と User Prompt が含まれている
- [ ] Claude Code でプロンプト実行 → 期待するフォーマットの出力が得られる
- [ ] 出力を正しいパスに保存 → 後続コマンドが正常に認識する
- [ ] `acs narration` がローカルフォールバックで動作する（API未設定時）
- [ ] `acs produce-plan` で台本未生成時、後続ステップが安全にスキップされる
- [ ] マニフェストに manual ステップが正しく記録される

### MVP成功基準

**上記13項目（+ ハイブリッド7項目）のうち、合計15項目以上がチェックできれば MVP 成功。**
残り項目は「どこで壊れたか」の記録として十分な価値がある。

### 次フェーズ提案

#### Phase 2: 品質磨き込み（MVP後 1-2週間）
1. MVPで詰まった箇所の修正
2. ElevenLabs voice_id の確定 → config/tools.js 更新
3. ショットプランの prompt 品質改善（Runway 出力の評価ループ）
4. コンプラチェックの閾値調整（実際の台本で検証）

#### Phase 3: 外部API接続（2-4週間後）
5. RUNWAY_API_KEY 設定 → 自動動画生成の検証
6. ELEVENLABS_API_KEY 設定 → 自動TTS生成の検証
7. DESCRIPT_API_KEY 設定（beta API の安定性次第で保留可）
8. `produce` 全自動実行の検証

#### Phase 4: 量産体制（1-2ヶ月後）
9. Shorts 3本/週のペースで genz-money を運用
10. KPI学習ループの回転（win/lose → 次回生成に反映）
11. japanese-mindset の並走開始
12. 収益化導線（アフィリエイト設置）の開始

#### Phase 5: スケール（3ヶ月後）
13. 長尺化（勝ちテーマの Shorts → Longform 転換）
14. マルチプラットフォーム（YouTube + TikTok + Instagram 同時投稿）
15. chill-culture チャンネル開始検討
16. ツール拡張検討（Firefly, Veo 3.1 等の再評価）
