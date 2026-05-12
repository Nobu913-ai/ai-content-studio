# Shorts #01 公開ハンドオフ — 新NISA入門

**日付:** 2026-05-01
**チャンネル:** お金の初期設定 (channelId: `genz-money`)
**表示名:** お金の初期設定｜20代の投資とポイ活
**ハンドル:** @okane_setup
**動画:** shorts-nisa-01-hook-v8 (NISAシリーズ第1弾、新NISA入門)
**ステータス:** `ready_after_url_replacement` — メタデータ・導線設計は完了。URL placeholder の置換 + プロフィール bio 整備 + LINE/Linktree 設定が終われば公開可能

---

## 0. 動画概要

| 項目 | 値 |
|---|---|
| タイトル本命 | 利益100万円が手元80万円に？新NISAなら税金0円の理由 |
| 長さ | 60.0秒 |
| 解像度 | 1080x1920 (9:16) |
| FPS | 30 |
| 形式 | H.264 / MP4 |
| 音声 | 四国めたん (VOICEVOX) / 既にミックス済み |
| ナレーション原稿 | `docs/script.txt` (18 segments) |
| シーン構成 | `docs/shot-plan.json` (11 shots) |

---

## 1. アセット manifest

| 種類 | パス | 状態 |
|---|---|---|
| 最終動画 (MP4) | `content/genz-money/video/2026-04-30T14-24-57_2026-04-30T14-24-50_shot-plan-01-hook-v8.mp4` | ✅ レンダー完了 |
| ソース音声 (WAV) | `content/genz-money/audio/shorts_nisa_01-hook-v8.wav` | ✅ ミックス済 (動画に同梱) |
| 段境界 JSON | `docs/segments.json` | ✅ 整合性 OK (audio diff 0.000s) |
| ナレーション台本 | `docs/script.txt` | ✅ lint pass |
| Shot plan v2 | `docs/shot-plan.json` | ✅ lint pass |
| SEO メタデータ | `docs/seo.json` | ✅ schema valid |
| マルチプラットフォーム | `docs/repurpose.json` | ✅ schema valid |
| コンプラ監査 | `docs/compliance.json` | ✅ schema valid (verdict: warn — public 前確認必須) |

---

## 2. 公開前 必須チェックリスト (15項目)

### 2-1. メタデータ準備 (5項目)

- [ ] **タイトル**: `docs/seo.json` の本命 #1 を採用 → 「利益100万円が手元80万円に？新NISAなら税金0円の理由」
- [ ] **description**: `docs/repurpose.json` の `youtube_description` を貼り付け
- [ ] **タグ**: `docs/seo.json` の `tags` (20個) を YouTube tags 欄に
- [ ] **サムネ**: 動画最初フレーム自動 OR カスタム作成 (`docs/seo.json` thumbnail_ideas 参照)
- [ ] **placeholder 残存チェック**: `grep -R -E '\{\{(AFFILIATE_URL\|DIGITAL_PRODUCT\|LINE_OFFICIAL\|YOUTUBE_SHORTS\|CHANNEL_URL)' docs/` で 0件であることを確認 (リテラル `{{` プレフィックスで keyword 名の説明文ヒットを除外)

### 2-2. アフィリエイト準備 (4項目)

- [ ] **A8.net 申し込み (SBI証券)**: 最優先 — 1〜2日で承認
- [ ] **A8.net 申し込み (楽天証券)**: 最優先 — 1〜2日で承認
- [ ] **A8.net 申し込み (楽天カード)**: Shorts #02 クレカ積立用の **先行取得**。Shorts #01 では前面に出さず、#02 公開タイミングまでに承認完了させる
- [ ] **LINE公式アカウント設定**: 「投資スタートチェックリスト」配布フロー設定 (リード獲得が長期運用の起点)
- [ ] **Linktree (or Lit.link) 作成**: プロフィールリンク用 → LINE → SBI → 楽天 → Shorts #02 予告 の順
- [ ] **取得した URL を各 placeholder に置換**:
  - `LINE_OFFICIAL_URL` / `AFFILIATE_URL_SBI` / `AFFILIATE_URL_RAKUTEN_SEC` / `DIGITAL_PRODUCT_NISA_GUIDE` / `CHANNEL_URL` / `YOUTUBE_SHORTS_URL`
  - `AFFILIATE_URL_RAKUTEN_CARD` は #02 公開時に置換 (#01 は不使用)

### 2-3. プラットフォーム別アップロード (4項目)

- [ ] **YouTube Shorts**:
  - 動画アップロード
  - タイトル / description / タグ
  - **「有償プロモーション、スポンサーシップ、または推奨を含む」にチェック** ⚠️必須
  - 公開直後に固定コメント投稿 → ピン留め
- [ ] **TikTok**:
  - 動画アップロード
  - キャプション (Twitter スレッド #1 を流用 + ハッシュタグ調整)
  - bio リンクは LINE 優先
- [ ] **Instagram Reels**:
  - 動画アップロード
  - `docs/repurpose.json` の `instagram_caption` を貼り付け
  - bio リンクは Linktree
- [ ] **Twitter/X**:
  - スレッド5ツイート投稿 (`docs/repurpose.json` の `twitter_thread`)
  - 最終ツイートに YouTube Shorts URL 埋め込み

### 2-4. コンプラ最終確認 (2項目)

- [ ] description に「投資は自己責任でお願いします」が含まれている
- [ ] description に「PR (アフィリエイトリンクを含みます)」が含まれている

---

## 3. 推奨公開タイミング

| 曜日・時間帯 | 理由 |
|---|---|
| **平日 19-23時** | Z世代の通勤・夕食後・就寝前のピーク |
| **週末 14-22時** | 週末の余暇時間ピーク |

genz-money のターゲット (18-28歳) は仕事/学業後の時間帯にスマホでの投稿視聴が多いため、平日 21時前後が一番刺さる時間帯。

---

## 4. 公開後の KPI 計測

### 4-1. 計測タイミング

- **公開24時間後**: 初速確認 (再生数 / 平均視聴維持率 / コメント感情)
- **公開1週間後**: バイラル傾向確認 (再生数の増減カーブ)
- **公開2週間後**: 確定値として記録

### 4-2. 記録コマンド

```bash
acs kpi genz-money <video-id> --views <数> --ctr <%> --retention <%>
acs kpi-summary genz-money
```

### 4-3. 記録すべき指標

Shorts は通常動画と異なり、**サムネCTRよりも『冒頭スワイプされない / 最後まで見られる / CTAに遷移する』** が重要。下記2セクションに分けて計測。

#### 動画パフォーマンス (Shorts特有指標)

| 指標 | 目標 (genz-money 1本目の参考値) |
|---|---|
| 再生数 (1週間) | > 1,000 → pass / > 3,000 → 良 / > 10,000 → ヒット |
| **Viewed vs Swiped Away** | 視聴開始 vs 即スワイプ離脱の比率。冒頭3秒の hook 評価 |
| **平均視聴維持率** | > 50% → pass / > 65% → 良 |
| **完視聴率** | 60秒最後まで観た割合 |
| **engaged views** | 10秒以上視聴された数 (アルゴリズムが高評価する指標) |
| いいね率 | > 3% → 良 |
| コメント率 | > 0.5% → 良 |

#### 導線パフォーマンス (CTA / アフィリエイト)

| 指標 | 取得元 |
|---|---|
| **固定コメント CTR** | YouTube アナリティクス |
| **LINE クリック数** | LINE公式アカウント管理画面 |
| **ASP クリック数** | A8.net / もしもアフィリエイト 管理画面 |
| **アフィリエイト承認数** | ASP管理画面 (口座開設成立など) |
| **チャンネル登録増加数** | YouTube アナリティクス |

### 4-4. KPI を踏まえた次手

- **ヒット (再生 10K+)**: 同テーマ深掘り Shorts (#03) を即制作。本動画の長尺化も検討
- **想定通り (再生 1-3K)**: クレカ積立 #02 を予定通り公開、傾向データを蓄積
- **不発 (再生 < 500)**: タイトル/サムネを A/B 入れ替え、または本動画を非公開化

---

## 5. 関連動画ロードマップ

| 動画 | テーマ | 状態 |
|---|---|---|
| **#01** (本動画) | 新NISA入門 | ✅ 公開準備完了 |
| **#02** | クレカ積立 (NISA × クレカ × ポイ活) | ✅ レンダー完了、公開待機 |
| #03 (案) | 複利の威力 (月3万円30年で◯◯円) | 未着手 |
| #04 (案) | NISA × iDeCo どっち優先? | 未着手 |

#01 と #02 は両方公開準備済み。#01 を先行公開して KPI を取り、結果次第で #02 のタイミングと訴求調整を判断。

---

## 6. 公開後やるべきこと

### 6-1. 即座 (公開直後)
- 固定コメント投稿 + ピン留め
- 各 SNS でクロス通知 (X/Instagram で「YouTube Shorts に新動画 → 」)

### 6-2. 24-48時間以内
- コメント返信 (20代向け、丁寧かつカジュアル、calm-trust トーン)
- 再生数の動きを見て必要なら追加 SNS プッシュ

### 6-3. 1週間後
- KPI 記録 (`acs kpi`)
- コメントから次動画のヒント抽出
- アフィリエイト発生を ASP 管理画面で確認

### 6-4. 2週間後
- 最終 KPI 記録
- #02 公開タイミング決定
- 次テーマ (#03 / #04) 候補のリサーチ開始

---

## 付録: コマンド早見表

```bash
# 公開後 KPI 記録
acs kpi genz-money <video-id> --views 2500 --ctr 8.5 --retention 62

# KPI サマリ
acs kpi-summary genz-money

# Shorts #02 公開時のテーマ調整
acs topic-gen genz-money -n 5
```
