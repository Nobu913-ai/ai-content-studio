# 90日実行計画

> 開始日目安: 2026年4月  
> 目標: 3アカウント合計 月5万〜10万円の収益化基盤を構築

---

## Phase 1: 基盤構築（Day 1〜30）

### 運用アカウント
- **本命**: genz-money (channelId) — 公開ブランド「お金の初期設定」(handle: @okane_setup)
- **並走**: japanese-mindset（Japanese Mindset）
- **待機**: chill-culture（後からスタート）

### やること

| 週 | genz-money | japanese-mindset |
|----|-----------|-----------------|
| Week 1 | チャンネル開設・ブランディング設定<br>ASP登録（A8.net, もしもアフィリエイト）<br>Shorts 3本テスト投稿 | チャンネル開設・ブランディング設定<br>Shorts 2本テスト投稿 |
| Week 2 | Shortsの反応分析<br>勝ちフック特定<br>追加Shorts 3本 | Shorts 2本追加<br>フック検証 |
| Week 3 | 初の長尺動画（勝ちテーマ）<br>アフィリエイトリンク設置<br>Shorts 3本 | Shorts 3本<br>反応分析 |
| Week 4 | 長尺2本目<br>デジタル商品（Notion家計簿テンプレ）準備<br>Shorts 3本 | 初の長尺動画<br>Shorts 2本 |

### KPI
- **genz-money**: Shorts 12本、長尺 2本、チャンネル登録 100人目標
- **japanese-mindset**: Shorts 9本、長尺 1本
- **収益目標**: ¥5,000（アフィリエイト初成約）

### CLI活用
```bash
# Shorts先行テスト
acs shorts-first genz-money "新NISAの始め方"
acs shorts-first genz-money "貯金できない人の特徴"

# 勝ちテーマを長尺化
acs pipeline genz-money "新NISAの始め方"

# コンプラチェック
acs check genz-money content/genz-money/scripts/xxxxx.md
```

---

## Phase 2: 検証と最適化（Day 31〜60）

### 運用アカウント
- **主力**: genz-money（データに基づく最適化）
- **成長枠**: japanese-mindset（本格運用開始）
- **実験枠**: chill-culture（テスト開始）

### やること

| 週 | genz-money | japanese-mindset | chill-culture |
|----|-----------|-----------------|--------------|
| Week 5 | Phase 1の分析・勝ちパターン特定<br>長尺 + Shorts 連動開始 | 長尺 2本<br>Shorts 3本 | チャンネル開設<br>Shorts 2本テスト |
| Week 6 | 長尺2本<br>デジタル商品販売開始<br>Twitter/Instagram展開 | Shorts 3本<br>SNS展開開始 | Shorts 2本 |
| Week 7 | 長尺2本<br>アフィリエイト最適化 | 長尺 2本<br>Shorts 3本 | Shorts 2本<br>反応分析 |
| Week 8 | 長尺2本<br>コミュニティ構築開始 | 長尺 1本<br>Shorts 3本 | 初の長尺（反応良ければ） |

### KPI
- **genz-money**: 登録 500人、Shorts平均再生 1,000回
- **japanese-mindset**: 登録 200人
- **chill-culture**: Shorts 8本テスト完了
- **収益目標**: ¥20,000（アフィリエイト + デジタル商品）

### CLI活用
```bash
# 全プラットフォーム展開
acs pipeline genz-money "家計簿のつけ方"
acs repurpose genz-money content/genz-money/scripts/xxxxx.md

# 収益化状況確認
acs monetize
acs monetize genz-money
```

---

## Phase 3: スケールと収益化（Day 61〜90）

### 運用アカウント
- **主力**: genz-money（収益化本格稼働）
- **成長枠**: japanese-mindset（収益化条件に向けて）
- **実験枠**: chill-culture（方向性確定）

### やること

| 週 | genz-money | japanese-mindset | chill-culture |
|----|-----------|-----------------|--------------|
| Week 9 | 週2本長尺ペース確立<br>YouTube収益化申請準備 | 長尺 2本<br>Shorts 3本 | 方向性確定<br>本格運用 or 撤退判断 |
| Week 10 | スポンサー案件交渉開始<br>メンバーシップ検討 | SNS連動最適化<br>長尺 2本 | 確定した方針で運用 |
| Week 11 | コンテンツカレンダー4週分自動生成<br>運用効率化 | 長尺 2本<br>Shorts 3本 | 運用継続 |
| Week 12 | 90日振り返り<br>次の90日計画策定 | 振り返り・次期計画 | 振り返り・方向性決定 |

### KPI
- **genz-money**: 登録 1,000人（YouTube収益化条件の10%）、月間再生 10,000回
- **japanese-mindset**: 登録 500人
- **収益目標**: ¥50,000（アフィリ ¥25,000 + デジタル商品 ¥15,000 + 広告 ¥5,000 + その他 ¥5,000）

---

## 運用ワークフロー（定常化後）

### 1本の動画制作フロー

```
1. acs shorts-first <channel> <topic>    # Shorts 3本でテスト
2. 投稿 → 1-2週間反応を見る
3. 勝ちテーマのみ:
   acs pipeline <channel> <topic>        # 長尺 + SEO + Shorts切り出し + SNS展開 + コンプラチェック
4. 人間レビュー:
   - コンプラチェック結果を確認
   - AI臭い箇所に独自エピソード追加
   - サムネ文言から選定
5. 投稿 → 概要欄にアフィリエイトリンク設置
```

### 週次ルーティン
- **月曜**: 先週の分析（再生数、CTR、視聴維持率）
- **火〜水**: Shorts先行テスト投稿
- **木〜金**: 勝ちテーマの長尺制作
- **土曜**: 長尺投稿 + SNS展開
- **日曜**: 翌週のネタ出し（`acs topics` + `acs calendar`）

---

## 収益源の優先順位

| 優先度 | 収益源 | 開始時期 | 期待月収 |
|--------|--------|----------|----------|
| 1 | アフィリエイト（証券口座開設等） | Month 1 | ¥10,000〜30,000 |
| 2 | デジタル商品（Notionテンプレ、PDF） | Month 1 | ¥5,000〜20,000 |
| 3 | YouTube広告収益 | Month 4〜6 | ¥3,000〜10,000 |
| 4 | TikTok Creator Rewards | Month 2〜3 | ¥1,000〜5,000 |
| 5 | スポンサー案件 | Month 3〜 | ¥10,000〜50,000 |

---

## 注意事項

- **3アカウント均等運用はしない** — genz-moneyが主力、残りはフェーズに応じて
- **AI量産感を出さない** — 必ず人間の編集・独自視点を入れる
- **金融コンテンツのコンプラは最優先** — 毎回 `acs check` を実行
- **Shorts先行テスト** — いきなり長尺は作らない。反応を確認してから
- **数より質** — 週2本の高品質長尺 > 毎日の低品質投稿
