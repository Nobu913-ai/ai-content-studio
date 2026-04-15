# AI Content Studio MVP 実装計画

## 1. MVP の実装方針

**完全自動化より、壊れにくい半自動運用を優先する。**

- Claude Code をオーケストレーターとして使い、4ツールを順番に呼び出す
- API キーが未設定のツールは自動スキップし、手動ステップとして記録
- 最終書き出しは DaVinci Resolve Free の手動仕上げ前提
- Descript は import / 編集自動化を優先、export は手動前提
- 金融系コンテンツは一次情報URL、取得日、免責文、禁止表現チェック必須

### 設計原則
1. **段階的自動化**: まず計画フェーズ（Claude APIのみ）を安定させてから外部API連携
2. **Graceful degradation**: 外部API障害時もパイプラインは計画フェーズまで完走
3. **手動介入ポイント明示**: 自動化できない工程はハンドオフノートで引き継ぐ
4. **マニフェストで追跡**: 全工程の出力を1つのJSONマニフェストに集約

## 2. ディレクトリ構成

```
ai-content-studio/
├── config/
│   ├── channels.js          # チャンネル設定
│   ├── monetization.js      # 収益化戦略
│   └── tools.js             # ツール設定・Voice routing・Shot style
├── src/
│   ├── cli.js               # メインCLI（22コマンド）
│   ├── clients/             # 外部APIクライアント（リトライ付き）
│   │   ├── runway-client.js
│   │   ├── elevenlabs-client.js
│   │   └── descript-client.js
│   ├── generators/          # 生成エンジン
│   │   ├── topic-generator.js       # AIトピック生成
│   │   ├── script-generator.js      # 台本生成
│   │   ├── seo-generator.js         # SEOメタデータ
│   │   ├── shorts-generator.js      # Shorts生成
│   │   ├── shot-planner.js          # Runway用ショットプラン
│   │   ├── narration-formatter.js   # ElevenLabs用ナレーション整形
│   │   ├── handoff-generator.js     # DaVinciハンドオフ+パッケージ
│   │   ├── production-pipeline.js   # 統合パイプライン+マニフェスト
│   │   ├── compliance-checker.js    # コンプライアンスチェック
│   │   ├── kpi-tracker.js           # KPIフィードバック
│   │   ├── repurpose-generator.js   # マルチプラットフォーム
│   │   ├── calendar-generator.js    # カレンダー
│   │   └── batch-generator.js       # バッチ統合
│   ├── utils/
│   │   ├── claude-client.js         # Claude API（リトライ付き）
│   │   ├── api-retry.js             # 外部API共通リトライ
│   │   ├── schemas.js               # zodスキーマ
│   │   ├── source-extractor.js      # 金融ソースメタデータ
│   │   ├── validators.js            # 入力バリデーション
│   │   └── file-helpers.js          # ファイル操作
│   └── tests/               # ユニットテスト
├── content/<channel>/       # 生成コンテンツ
│   ├── scripts/             # 台本・ナレーション
│   ├── metadata/            # SEO・ショットプラン・マニフェスト
│   ├── audio/               # 生成音声
│   ├── handoff/             # DaVinciパッケージ
│   ├── calendar/            # カレンダー
│   └── kpi/                 # KPIデータ
└── docs/                    # ドキュメント
```

## 3. 必要な環境変数

| 変数名 | 必須 | 用途 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | Yes | Claude API（台本・SEO・ショットプラン等） |
| `RUNWAY_API_KEY` | No | Runway 動画生成 |
| `ELEVENLABS_API_KEY` | No | ElevenLabs ナレーション音声 |
| `DESCRIPT_API_KEY` | No | Descript AI編集 |

- `ANTHROPIC_API_KEY` のみで計画フェーズ（台本→ショットプラン→ナレーション→ハンドオフ）は完全に動作
- 外部API キーは追加するごとに自動化範囲が広がる

## 4. 実装優先順位

### P0: 最小動作（Claude APIのみ）
1. [x] topic generate — AIトピック生成
2. [x] script generate — 台本生成（金融ルール強制）
3. [x] finance source metadata extract — ソースメタデータ構造化
4. [x] visual prompt / shotlist generate — ショットプラン生成
5. [x] narration text format — ナレーション整形
6. [x] compliance check — コンプライアンスチェック
7. [x] davinci handoff package export — ハンドオフパッケージ
8. [x] output manifest json — マニフェストJSON

### P1: 外部API連携
9. [x] tts generate with ElevenLabs — 音声生成クライアント
10. [x] video asset generation orchestration for Runway — 動画生成クライアント
11. [x] descript import and edit automation — Descript編集クライアント

### P2: 品質・運用
12. [x] API retry with exponential backoff — 全外部クライアント
13. [x] zod schema validation — 全出力
14. [x] KPI learning loop — 勝ちパターン抽出
15. [x] ESLint / Prettier — コード品質

## 5. API連携設計

### Runway
```
Shot Plan JSON → Runway API (image_to_video) → Poll (tasks/{id}) → Video URL
```
- ショット単位で順次生成
- ポーリング間隔: 10秒、最大60回（10分タイムアウト）
- 失敗ショットは記録し、残りは続行
- リトライ: 429/5xx は指数バックオフで3回

### ElevenLabs
```
Narration Text → ElevenLabs API (text-to-speech/{voice_id}) → Audio MP3
```
- チャンネル別 Voice Routing（config/tools.js）
- 日本語/英語自動切り替え
- stability / similarity_boost をチャンネルごとに調整
- リトライ: 429/5xx は指数バックオフで3回

### Descript
```
Media URLs → Descript API (projects + media + edits) → Project ready for manual export
```
- プロジェクト作成 → メディアインポート → AI編集（字幕/整音/フィラー除去）
- export は手動前提（APIでは非対応）
- リトライ: 429/5xx は指数バックオフで3回

## 6. DaVinci Resolve ハンドオフ設計

### 基本モード: ハンドオフノート（Markdown）
- タイムライン名、尺、アスペクト比
- ショット別編集指示（トリム、トランジション）
- テキストオーバーレイ指示
- オーディオミックス（LUFS、BGMレベル）
- カラーグレーディング
- 書き出し設定

### パッケージモード: `--package`
- `content/<channel>/handoff/<ts>_<slug>/` ディレクトリを生成
- `package.json`: アセットマニフェスト（全ファイルパス+存在確認）
- `handoff.md`: 編集ノート
- チェックリスト（7項目）で進捗追跡

## 7. エラーハンドリング方針

| レイヤー | 方針 |
|---------|------|
| Claude API | 指数バックオフ 3回（429/529/5xx） |
| 外部API (Runway/ElevenLabs/Descript) | fetchWithRetry: 指数バックオフ 3回（429/5xx/ECONNRESET） |
| APIキー未設定 | エラーではなくスキップ。手動ステップとしてマニフェストに記録 |
| JSON パースエラー | `parseError: true` フラグ付きで raw データを保存。パイプラインは続行 |
| zod 検証エラー | `_schemaWarnings` として保存。データは通す（パースエラーではない） |
| ファイル I/O | 即座にエラー。ディレクトリは自動作成 |
| 入力バリデーション | 即座にエラー（チャンネルID、パストラバーサル等） |

## 8. 実行コマンド例

```bash
# トピック生成
acs topic-gen genz-money

# Shorts先行テスト
acs shorts-first genz-money "新NISAの始め方"

# 制作計画（Claude APIのみ）
acs produce-plan genz-money "新NISAの始め方" --format shorts

# 全工程制作（外部API連携）
acs produce genz-money "新NISAの始め方" --format shorts --sources https://www.fsa.go.jp/...

# 個別ステップ
acs script genz-money "新NISAの始め方" --sources https://www.fsa.go.jp/...
acs shot-plan genz-money content/genz-money/scripts/xxx.md
acs narration genz-money content/genz-money/scripts/xxx.md
acs handoff genz-money content/genz-money/scripts/xxx.md --package

# KPIフィードバック
acs kpi genz-money vid01 --views 2500 --ctr 8.5 --retention 62
acs kpi-summary genz-money

# ツール状態確認
acs tools
```

## 9. 今後の拡張候補（保留ツール）

| 優先度 | ツール | 再検討条件 |
|--------|--------|-----------|
| 高 | Adobe Firefly | genz-money の図解品質が課題になった時 |
| 高 | Vertex AI Veo 3.1 | ショット単位の従量最適化を本格化する時 |
| 中 | FLUX系API | サムネABテストを大量に回したくなった時 |
| 中 | OpusClip | 長尺→Shorts切り出し工数が重くなった時 |
| 中 | Midjourney | ブランド世界観の強化が必要になった時 |
| 低 | HeyGen | 英語講師キャラ型に寄せる時 |

## 10. 未解決論点

### 技術的
1. **Runway API のレート制限**: Standard プランでの同時生成数上限が未検証。大量ショット時にキューイングが必要か
2. **ElevenLabs 文字数制限**: Creator プランの月間文字数上限（100K?）で3チャンネル運用が足りるか
3. **Descript API の安定性**: beta API のため仕様変更リスク。import/edit の信頼性を実運用で検証必要
4. **Voice ID の確定**: config/tools.js の voice_id はプレースホルダー。ElevenLabs で実際に作成/選択後に更新必要

### 運用的
5. **BGM調達**: Suno/Udio を使うか、ロイヤリティフリー素材で固定するか未決定
6. **サムネイル制作**: 現在は Runway の静止画 or 手動。Firefly/FLUX 導入時期の判断基準を明確にすべき
7. **アップロード自動化**: YouTube/TikTok/Instagram への投稿は現在手動。API連携の優先度を検討
8. **マルチチャンネル並行制作**: 3チャンネル同時に produce を走らせた時のAPI クォータ管理

### ビジネス的
9. **収益化タイムライン**: 月5-10万円達成に必要な動画本数/再生数の具体的な計算
10. **コンプラリスク**: 金融系コンテンツの法的レビュー体制（AI生成 + 人間チェックで十分か）
