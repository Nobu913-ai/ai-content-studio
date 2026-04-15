# AI Content Studio 改善ロードマップ

> 作成日: 2026-04-15  
> 現在バージョン: v2.1.0  
> 目標: 「生成が得意な基盤」→「収益運用を閉ループで最適化するプロダクト」

---

## Phase 1: 堅牢化（v2.2.0）— すぐやる

### 即時バグ修正
- [x] `channels` コマンドの言語表示バグ（空文字）修正
- [x] `repurpose-generator.js` の通貨表記切替（USD/JPY）
- [x] `CLAUDE.md` と `monetization.js` の priority 整合性
- [x] `package.json` に test/lint スクリプト追加

### High-1: 金融系一次情報レイヤー
- [x] 台本生成時に一次情報URL・更新日の入力を必須化
- [x] 免責事項の自動挿入保証
- [x] 「制度説明」「一般論」「主観」の区分強制
- [x] 特定銘柄・断定表現の禁止ルールをコード化
- [x] 一次情報がない場合は compliance check で fail/warn

### High-2: JSON Schema Validation
- [x] `zod` ライブラリ導入
- [x] 各 generator 出力のスキーマ定義
  - SEO: titles(10件), thumbnail_texts(5件), tags(15-20件)
  - Shorts: shorts(3件), 各60-90秒
  - Repurpose: youtube_description, twitter_thread(5件), instagram
  - Compliance: overall_score(0-100), checks, verdict(pass/warn/fail)
- [x] パース後にスキーマ検証 → fail 時に警告付きで保存

### High-3: KPIフィードバック入力
- [x] `acs kpi <channel> <video-id>` コマンド追加
- [x] KPIデータ入力（再生数, CTR, 平均視聴時間, 維持率, コメント数）
- [x] `content/<channel>/kpi/` に蓄積
- [x] `shorts-first` 生成時に過去KPIを参照し、勝ちパターンを反映

---

## Phase 2: 運用最適化（v2.3.0）— 1-2週間後

### Medium-1: 既存動画との重複率チェック
- [ ] タイトル類似度スコア
- [ ] 台本の主要論点比較
- [ ] Hookのテンプレ化率検出
- [ ] CTAのバリエーション監査

### Medium-2: Human-in-the-loop 構造化
- [ ] 台本に `[HUMAN: 独自意見を追加]` マーカー自動挿入
- [ ] 具体例・体験談の挿入箇所を明示
- [ ] 人間メモ欄が空なら warn
- [ ] genz-money で一次情報ソース未指定なら fail

### Medium-3: `status` ダッシュボード化
- [ ] 最新生成日・直近投稿日
- [ ] 直近の勝ちテーマ（KPIデータから）
- [ ] 未制作テーマ一覧
- [ ] コンプラ warn 件数
- [ ] 月次収益 vs 目標の進捗表示

---

## Phase 3: スケール準備（v3.0.0）— 1ヶ月後

### Low-1: CLI出力・表示整備
- [ ] 全コマンドの出力フォーマット統一
- [ ] 色分け・アイコンの一貫性
- [ ] テーブル表示の改善（chalk + columnify）

### Low-2: ドキュメント分離
- [ ] `docs/strategy.md` — 戦略ドキュメント
- [ ] `docs/implementation.md` — 実装仕様
- [ ] `docs/operations.md` — 運用手順書
- [ ] `docs/compliance-policy.md` — コンプライアンス方針

### Low-3: テスト基盤
- [ ] ユニットテスト（validators, file-helpers, schema）
- [ ] 統合テスト（CLI コマンド実行テスト）
- [ ] CI（GitHub Actions）
- [ ] lint（eslint）+ format（prettier）

### Low-4: 将来拡張
- [ ] YouTube Data API 連携（KPI自動取得）
- [ ] TikTok Analytics API 連携
- [ ] アップロード補助（概要欄・タグの自動設定）
- [ ] 月次レポート自動生成

---

## KPI学習ループ設計

### データフロー

```
投稿 → KPI入力（手動 or API）
  → content/<channel>/kpi/<video-id>.json に蓄積
  → 分析エンジンが勝ちパターンを抽出
  → 次回の shorts-first / script 生成に反映
```

### KPIデータ構造
```json
{
  "videoId": "abc123",
  "channel": "genz-money",
  "title": "新NISAの始め方",
  "type": "shorts|longform",
  "publishedAt": "2026-04-15",
  "metrics": {
    "views": 5000,
    "ctr": 8.5,
    "avgWatchTime": 45,
    "retentionRate": 62,
    "likes": 200,
    "comments": 35,
    "shares": 15,
    "subscribers_gained": 20
  },
  "content": {
    "hook": "最初のフレーズ",
    "angle": "初心者向け",
    "topic": "新NISAの始め方"
  },
  "verdict": "win|neutral|lose"
}
```

### 学習反映の仕組み
1. `acs kpi` でデータ入力
2. `shorts-first` 実行時に過去KPIを自動参照
3. 勝ちパターン（高CTR、高維持率）をシステムプロンプトに注入
4. 負けパターン（低再生、低維持率）を回避ルールとして反映

### 勝ち/負け判定基準
- **Win**: 再生数 > チャンネル平均の1.5倍 AND 維持率 > 50%
- **Neutral**: それ以外
- **Lose**: 再生数 < チャンネル平均の0.5倍 OR 維持率 < 30%
