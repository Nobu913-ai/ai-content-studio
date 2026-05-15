# Agent Context — お金の初期設定 (genz-money)

This document consolidates brand strategy, production lessons, and accumulated decisions for the `genz-money` channel. It is the canonical context for AI coding agents (Claude Code, OpenAI Codex, etc.) working on this project.

**Last updated**: 2026-05-14

---

## 1. Brand Strategy

### Identity (確定 2026-05-12)

| 項目 | 内容 |
|---|---|
| channelId (リポジトリ内識別子) | `genz-money` (維持) |
| 公開ブランド名 | **お金の初期設定** |
| 表示名 | お金の初期設定｜20代の投資とポイ活 |
| ハンドル | **@okane_setup** |
| コアコンセプト | 20代から整えたい、お金の初期設定。 |
| タグライン | 60秒で、未来の自分をラクにする。 |
| カテゴリ | 新NISA / クレカ積立 / ポイ活 / 家計管理 |

旧名「Z世代マネー教室」と旧ハンドル「@genz-money」は **2026-05-12 廃止**。

### Why この名前

- 「教室」「Z世代」は古い・上から目線、Z世代当事者にとって主語ズレ
- 「初期設定」は Z世代ネイティブ語感（スマホ/アプリ/ゲームの「初期設定」）
- 「お金」直球で金融感、煽りなし、calm-trust トーンと完全一致
- 30代以降も自然に含められる包括性

### ブランド・トーン規則

- **calm-trust 統一**: 煽らない、断定しない、出典明記
- **NG表現**: 「儲かる」「絶対」「必ず」「最大化」「損する」「もったいない」
- **OK表現**: 「整える」「やさしく」「目安」「検討する人向け」「条件に応じて」
- **数字表現**: 「投資100万円」(誤読=元本) ではなく **「利益100万円」** を明記

### ポジショニング

- 「投資の先生」ではなく **「生活導線に接続した実務金融ブランド」**
- 18-29歳の金融教育受講率 48.5% (知識はあるが未実行) を行動起動で刺す
- 制作: **人の信頼=実写・音声、情報密度=Remotion** のハイブリッドが理想
- KPI: 再生数より「保存率・プロフCTR・LINE登録」(行動変換)

### 配色 (デザイントークン)

| 用途 | カラー | HEX |
|---|---|---|
| 基調 (背景・パネル) | ダークグレー / 紺グラデ | 紺基調: `#1A237E` / `#0D1452` |
| アクセント | ミントグリーン | brand mint |
| テキスト | 白 | `#FFFFFF` |
| サブテキスト | 灰 | `#B0BEC5` |
| ポジティブ | グリーン | `#00E676` |
| ネガティブ | レッド | `#FF5252` |
| ハイライト | イエロー | `#FFD600` |

### 各社ブランドカラー (証券会社・カード等)

| ブランド | カラー | HEX | 由来 |
|---|---|---|---|
| SBI証券 | 青 | `#0066B2` | コーポレートブルー |
| 楽天証券 | 赤 | `#BF0000` | 楽天レッド |
| マネックス証券 | 山吹色 | `#E8A436` | MONEX イエロー |
| 楽天カード | 赤 | (継承) | 楽天レッド |
| dカード | 赤 | (検討中) | ドコモレッド |
| 三井住友カード | 緑 | (検討中) | コーポレートカラー |

---

## 2. Voice & Audio (VOICEVOX)

### 採用キャラクター

- **四国めたん ノーマル** (speakerId=2)
- 3 Voice 比較 (春日部つむぎ / 四国めたん / もち子さん) の結果、四国めたんが金融系説明の信頼感とフックの強さでバランス最良
- preset: `genz-money-shorts` (speed 1.12, volume 1.16, segmentGap 100ms)

### クレジット表記 (必須)

VOICEVOX 利用規約により **「VOICEVOX:四国めたん」のクレジット表記が必須**。

| プラットフォーム | 記載場所 |
|---|---|
| YouTube | 説明欄末尾（ハッシュタグ直前） |
| TikTok | キャプション内 |
| Instagram | 動画 reels 投稿時はキャプション内 |
| X | 動画ポスト時のスレッド最後 |
| note | 音声未使用なら不要、動画埋込時のみ必須 |

説明欄テンプレ:

```text
【クレジット】
・ナレーション: VOICEVOX:四国めたん
```

### イントネーション戦略 — フレーズ変更を第一選択

VOICEVOX の不自然なアクセントは **辞書登録より フレーズ変更で回避** が第一選択:

- 例: 「慣れたら」(関西訛り風) → **「慣れてきたら」** (自然に分割される)
- 例: 「年120万円」(誤読「とし120」) → **「年間120万円」**
- 例: 「dカード」 → 発音辞書で「ディーカード」に登録 (`config/pronunciation-dictionary.json` の `channel_overrides.genz-money`)

辞書登録の罠 (避ける):

1. **読点なしだと user_dict accent_type が無視される** (前後語と結合して別 accent_phrase に組み込まれるため)
2. **word_type の落とし穴**: VERB だと活用形が拾えない、PROPER_NOUN は priority 上限が低い → **COMMON_NOUN priority=10** が最も信頼できる
3. **heiban (accent_type=0) は棒読み**: pitch 変化が極小、自然な抑揚が欲しいなら N型 (1-N) を使う

### 発音辞書 (`config/pronunciation-dictionary.json`)

現在登録済の主要エントリ:

```json
{
  "entries": {
    "新NISA": "しんニーサ",
    "NISA": "ニーサ",
    "投資信託": "とうししんたく",
    "元本割れ": "がんぽんわれ",
    "売却": "ばいきゃく",
    "翌営業日": "よくえいぎょうび",
    "翌年": "よくねん"
  },
  "categories": {
    "finance": {
      "entries": {
        "積立": "つみたて",
        "信用取引": "しんようとりひき",
        "約定": "やくじょう",
        "配当金": "はいとうきん",
        "確定申告": "かくていしんこく"
      }
    }
  },
  "channel_overrides": {
    "genz-money": {
      "dカード": "ディーカード"
    }
  }
}
```

---

## 3. Visual & Remotion Component Rules

### 1カット1メッセージ原則

冒頭・選択誘導カットでは **左右並列比較は使わない**。代わりに:

- **冒頭の税金/手数料/コスト比較** → `taxFlowDemo` (時系列フロー: 元本提示→税金剥がれ→中央モーフ100→80→左右カード分割→差額バッジ)
  - `taxSavingsDemo` の左右並列は初心者には重い、使わない
- **選択誘導カット** → `recommendationFocus` (focus 拡大 + secondary opacity 0.2)
  - `compareSplit` だと比較に見える、使わない

### 主役/脇役カードの非対称化

- **主役**: `cardScale: 1.10`, `cardOpacity: 1.0`, border 3px, glow有, ✓ アイコン
- **脇役**: `cardScale: 0.94`, `cardOpacity: 0.85`, border 2px, glow無, ✓ アイコン無

### 共通演出基盤

- **captionSegments[]**: ライブテロップ。各 segment が中央ビジュアルの stage と同期する
- **bgVariant**: AnimatedBackground 3変種 (`impact` / `data` / `action` / `default`)、component種別から自動推定
- **seEvents**: 8役割 SE パレット (`pop` / `popStrong` / `tick` / `whoosh` / `whooshSoft` / `whooshPower` / `softImpact` / `specialImpact`)

### SE 配置レシピ (60秒で 7-9 events 目安)

| シーン種別 | SE 配置 |
|---|---|
| 主役シーン (税金比較/数字着地) | whoosh導入 + softImpact着地 (2音まで) |
| 数字段階表示 (年枠120/240/360等) | 最後の総額着地 softImpact 1発のみ。途中数字 tick 不要 |
| 新コンセプト出現 (NumberHero) | pop 1発 (軽さ重視) |
| 説明パート / brand紹介 / リスク注意 | **完全静音** |
| phoneStepsDemo STEP1 (説明) | 静音 |
| phoneStepsDemo STEP2 (進行確認) | whooshSoft @ 0.05s, vol 0.16-0.18 |
| progressSteps | 最終ハイライトに softImpact 1発のみ |
| CTA | softImpact 1発で締め |

音量基準: whoosh 0.18-0.32 / pop, tick 0.28-0.32 / softImpact 0.45-0.50 / whooshPower 0.50 (1動画1回限定)

NG パターン:
- 全シーンに反応音 (うるさい)
- 「シーン開始 whoosh + 要素出現 tick + 着地 softImpact」の3段構え
- 同系統音 (tick + pop) を3秒以内に近接 → 別family (whooshSoft) に置換
- 追加 SE で感情表現 (悲しさを音で出すと安っぽい)

### IconGrid バリアント (拡張済み)

`src/remotion/components/IconGrid.tsx` には3つの variant がある:

| variant | 用途 | 視覚 |
|---|---|---|
| `circle` (default) | 一般的なアイコン | 円形 |
| `card` | クレジットカード文脈 (具体カード) | 横長カード型 (チップ+ストライプ) |
| `badge` | アプリ/サービス文脈 (証券会社等) | 角丸スクエア (アプリアイコン風) |

- badge variant 使用時、`icon` が無ければ `label` 全文を使用
- 兄弟バッジ間で **sharedBadgeFontSize** (longest line 基準) を使い視覚整列維持
- 改行は `\n` 明示 (例: `"icon": "マネックス\n証券"`)
- badge variant では下の label 表示は **自動非表示** (情報重複回避)

### Remotion 日本語テキスト罠集 (新コンポーネント時必須チェック)

1. **`autoFontSize` ではなく `autoFontSizeJa` を使う** (日本語幅を正しく計算)
2. **maxWidth は実 content 幅** (parent 幅 - padding - margin - 隣接要素) で計算
3. **単行テキストは `whiteSpace: "nowrap"`** を明示
4. **長文テキストは smartLineBreak + whiteSpace pre-wrap** (2パスサイジング)
5. **並列描画する複数文字列は共有 fontSize を計算** (longest 基準、e.g. ComparisonTable のセル群)
6. **`whiteSpace: "pre-line"` は手動 \n を尊重するが overflow で auto-wrap する** → `whiteSpace: "pre"` を使うか maxWidth 余裕を確保
7. **flex の default `flexDirection: row`** トラップ。縦方向制御は `flexDirection: "column"` を明示

詳細は memory `feedback_remotion_text_pitfalls.md` 参照 (15個の罠の実例集)。

### レイアウト・縦位置の一貫性

各シーンで主要コンテンツの縦中心 y が揃っていることが視聴体験に重要:

- 標準中央コンテンツ (factCard, numberHero): y ≈ 960 (top: 50%)
- 比較カード等の縦長コンテンツ: y ≈ 830 (中心 -130px)
- 高さがあるコンテンツの中央モーフ (TaxFlowDemo): y ≈ 806 (top: 42%)
- CTA 主要コンテンツ: y ≈ 860 (paddingBottom +128 で上方シフト)
- SubtitleLayer の `paddingBottom: 240` で各プラットフォーム safe zone 内に収める

---

## 4. Production Pipeline (Shorts 制作の7ステップ)

新規 Shorts を作る時の標準フロー:

```bash
# 1. 台本生成 (ハイブリッドモード: ANTHROPIC_API_KEY 未設定なら content/_prompts/ に書き出し)
node src/cli.js script genz-money "<topic>"

# 2. ショットプラン生成
node src/cli.js shot-plan genz-money <script-path>

# 3. ナレーション整形 (TTS向け短文化)
node src/cli.js narration genz-money <script-path>

# 4. VOICEVOX 音声生成
node scripts/generate-genz-audio.js <script.txt> <audio.wav>

# 5. セグメント計測 (各セグメント実音声長を計測 → タイミング整合性検証)
node scripts/measure-segments.js <script.txt> --json <segments.json> --final-wav <audio.wav>

# 6. shot plan → scene JSON 変換
node src/cli.js remotion-scene genz-money <shot-plan.json>

# 7. Remotion レンダリング (MP4出力)
node src/cli.js remotion-render genz-money <scenes.json>
```

### 重要な制約

- VOICEVOX は `http://127.0.0.1:50021` で起動必須
- ANTHROPIC_API_KEY 未設定 = ハイブリッドモード (プロンプトを `content/_prompts/` に書き出し → 別途実行 → 結果を `content/<channel>/metadata/` に保存)
- `content/` 配下は gitignore 対象 (creative output / IP)

### scene JSON のタイミング更新時

ナレーション編集後の手順:

1. script.txt 更新
2. VOICEVOX で音声再生成 (step 4)
3. セグメント再計測 (step 5)
4. 新セグメント情報を元に shot plan / scenes JSON の `start_sec` / `duration_sec` / `total_duration_sec` を更新
5. captionSegments の endSec も対応箇所を更新
6. Remotion 再レンダリング (step 7)

---

## 5. Publish Workflow (公開準備の5ステップ)

Shorts 完成後の公開準備:

### Step 1: SEOメタデータ (`acs seo`)

- ハイブリッドモード: プロンプト書き出し → 別途実行 → seoSchema validate
- 金融系タイトル罠:
  - 「投資100万円」→「利益100万円」と明記必須
  - 「知らないと損する」「絶対」等の煽り削除
- 出力: 10タイトル候補 (本命 / CTR寄せ / 検索寄せ の3セット)
- description 冒頭は前提明示必須

### Step 2: マルチプラットフォーム展開 (`acs repurpose`)

- 4プラットフォーム + アフィリエイト推奨
- アフィリエイト優先順位 (リード獲得最優先):
  1. LINE公式 / 無料チェックリスト
  2. SBI証券
  3. 楽天証券
  4. デジタル商品 (PDFガイド)
  5. 楽天カード (クレカ積立 Shorts 用)
  6. マネーフォワード ME (家計管理系)
- **表現の中立化**: 「おすすめ」→「検討する人向け」
- **PR表記**: Twitter最終ツイート + Instagram プロフィール誘導前 + YouTube description 末尾

### Step 3: コンプライアンスチェック (`acs check`)

- 禁止表現: 「必ず儲かる」「絶対損しない」「誰でも勝てる」
- 出典明記: description 側で対応 (Shorts 本体は短尺ゆえ)
- 「投資は自己責任」disclaimer は description / 各プラットフォーム caption 必須

### Step 4: ハンドオフパッケージ作成

```text
content/<channel>/handoff/<date>_<topic>-publish/
├── handoff.md           # 公開チェックリスト 15項目
├── package.json         # アセット manifest + missing_assets + publish_blockers
├── docs/                # script.txt + shot-plan.json + segments.json + seo.json + repurpose.json + compliance.json
└── assets/{video,audio,stills}/README.md
```

- package.json の status: **`ready_after_url_replacement`** + `publish_blockers` 配列で未取得アセット明示
- placeholder 残存チェック: `grep -R -E '\{\{(AFFILIATE_URL|DIGITAL_PRODUCT|LINE_OFFICIAL|YOUTUBE_SHORTS|CHANNEL_URL)' docs/`

### Step 5: 手動アップロード + アフィリエイト連携

- YouTube アップロード: タイトル prefix「【秒でわかる】」を使い再生リスト「秒でわかる投資とポイ活」に追加
- 視聴者層「子ども向けではない」必須、カテゴリ「教育」、AI自動機能 (チャプター/場所/コンセプト) 全 OFF
- アフィリリンク含む場合は **「有償プロモーション」にチェック必須**
- 公開直後: 固定コメント投稿 → ピン留め (Shorts では説明欄より固定コメントが機能)

---

## 6. SNS戦略・ファネル設計

「お金の初期設定」全体の運用設計。各プラットフォームの位置づけ・視聴者動線・アフィリエイト導線の整理。

### 全体ファネル（5層構造）

```text
[第1層] 発見 (Discovery)
  YouTube Shorts / TikTok / Instagram Reels / X
                       ↓
[第2層] プロフィール訪問・関心醸成
  動画固定コメント / 概要欄 / プロフィールbio / Linktree
                       ↓
[第3層] オウンドメディア・深掘り
  note 完全ガイド / LINE公式 (未来) / ブログ (将来)
                       ↓
[第4層] 収益化 (Monetization)
  アフィリエイト / デジタル商品 / スポンサー (将来)
                       ↓
[第5層] 再接触・ロイヤルティ
  LINE通知で動画告知 / メルマガ / リテンション
```

### 各プラットフォームの役割

| プラットフォーム | 主役割 | 強み | 弱み |
|---|---|---|---|
| **YouTube** (主力) | 蓄積・SEO検索流入 | 長期資産化・登録者ベースの安定性・収益化条件で広告収益 | 初期成長が遅い |
| **TikTok** (拡散) | 爆発的リーチ | アルゴリズム拡散力 No.1 | 寿命短い・収益化弱い |
| **Instagram Reels** (ブランド構築) | ライフスタイル接点 | 発見タブ流入・カルーセル併用可 | リーチは TikTok より劣る |
| **X** (告知・専門性) | ニュース性・対話 | 即時性・専門家コミュニティ | リーチ少 |
| **note** (深掘り SEO) | 検索流入入口・信頼 | 文章メディアの安定性・外部 SEO | 動画拡散はない |
| **Linktree** (ハブ) | 全リンク集約 | 整理・更新容易 | UX的にワンステップ多い |
| **LINE公式** (未来) | リード獲得・継続接触 | プッシュ通知でリテンション最強 | フォロー獲得ハードル高 |

### 典型的な視聴者動線

**パターンA: 新規発見ルート (最頻出)**

TikTok/Reels で動画発見 → プロフィール → Linktree → note完全ガイド → アフィリエイトで申込

**パターンB: YouTube直接ルート (理想形)**

YouTube検索 → 動画視聴 + 説明欄リンク → note完全ガイド → アフィリエイトで申込 → チャンネル登録

**パターンC: ブランド忠誠ルート (中長期)**

LINE登録 (無料チェックリスト等) → LINE通知で動画案内 → note記事で深掘り → 時々アフィリエイトで行動 → 固定読者化

### 投稿フォーマット早見表

| プラットフォーム | 最適形式 | 頻度 | 寿命 |
|---|---|---|---|
| YouTube Shorts | 60-75秒の縦動画 (Remotion生成) | 週1-2本 | 永続 |
| YouTube 長尺 (将来) | 10-15分の解説 | 月1-2本 | 永続 |
| TikTok | YouTube と同じ mp4 流用 | 週1-2本 | 数週〜数ヶ月 |
| Instagram Reels | 同 mp4 流用 + IG用キャプション | 週1-2本 | 永続 |
| Instagram ストーリーズ | 公開告知 + アンケート | 動画公開時 + 週1-2 | 24時間 |
| Instagram カルーセル | note画像を10枚展開 | 月1-2本 | 永続 |
| X | 動画告知ポスト + スレッド解説 | 動画公開時 + 週2-3 | 数日 |
| note | Shorts に対応する完全ガイド | 動画公開と同日 | 永続 (SEO) |

### アフィリエイト導線の最適配置

| 場所 | アフィリ配置 | 理由 |
|---|---|---|
| YouTube 動画内 | ❌ 配置しない | CTAは「note/プロフィール」のみ |
| YouTube 説明欄 | ✅ 配置 (PR表記必須) | 検索流入向け |
| YouTube 固定コメント | ✅ 配置 | Shortsでは説明欄より読まれる |
| TikTok bio | ✅ Linktree経由 | 動画→bio→Linktree→アフィリ |
| Instagram bio | ✅ Linktree経由 | 同上 |
| X 固定ポスト | △ 必要に応じ (PR表記) | ニュース性時のみ |
| **note 記事内** | ✅ 配置 (PR表記必須) | **検索流入の主戦場・収益化しやすい** |
| LINE (未来) | ✅ 配置 | 直接配信・リテンション活用 |

### アフィリエイト優先順位 (リード獲得最優先)

1. **LINE公式 / 無料チェックリスト** (リード獲得＝長期運用の起点)
2. **SBI証券** (NISA口座、幅広く)
3. **楽天証券** (楽天経済圏向け)
4. **デジタル商品** (PDFガイド、将来)
5. **楽天カード** (クレカ積立 Shorts 用)
6. **マネーフォワード ME** (家計管理系・将来)

### コンテンツ制作の標準サイクル

```text
月曜 | 先週の数字振り返り、勝ちテーマ特定
火-水 | Shorts 制作 (台本→音声→動画レンダリング)
木   | note 完全ガイド執筆 + 画像生成
金   | 公開準備 (SEO/repurpose) + 予約投稿セット
土   | 公開 (YouTube/TikTok/Instagram/X 同時)
日   | 各プラットフォームで反応確認、次週ネタ出し
```

### 現状のボトルネック (2026-05-14)

| 階層 | 未整備 | 影響 |
|---|---|---|
| 第3層 | LINE公式未開設 | リード獲得導線が note のみ・継続接触なし |
| 第3層 | ブログ未開設 | SEO戦略が note 一本 |
| 第4層 | TGアフィリエイト未登録 | SBI証券口座開設報酬が取れない |
| 第4層 | 楽天アフィリエイト未登録 | 楽天カード/楽天市場のアフィリ無効 |
| 第4層 | アクセストレード提携承認待ち | 各種証券会社のアフィリ未稼働 |
| 第5層 | LINE未開設 | リテンション施策ゼロ |

これらが揃うと第3〜5層の収益化機能が起動。

### 戦略的優先順位 (基本フロー上の改善)

**短期 (1-2週間)**

- TGアフィリエイト登録 (SBI証券口座開設報酬)
- 楽天アフィリエイト登録 (楽天カード)
- LINE公式アカウント開設
- Shorts #03 制作

**中期 (1-2ヶ月)**

- Instagram カルーセル投稿 (保存率の高い深い解説)
- YouTube 長尺動画 (収益化条件達成への貢献)
- X スレッド投稿 (専門性アピール)

**長期 (3-6ヶ月)**

- ブログ開設 (SEO主戦場)
- デジタル商品制作 (PDF/Notion テンプレート)
- YouTube 収益化条件達成 (登録者1,000人 / 4,000h視聴)

---

## 7. Cross-Platform Publishing Patterns

### 配信プラットフォーム整備状況 (2026-05-14)

| プラットフォーム | URL / ハンドル | 状態 |
|---|---|---|
| YouTube | <https://www.youtube.com/@okane_setup> | 運用中 |
| TikTok | <https://www.tiktok.com/@okane_setup> | 運用中 |
| Instagram | <https://www.instagram.com/okane_setup> | 運用中 (クリエイターアカウント) |
| X | <https://x.com/okane_setup> | 運用中 |
| note | <https://note.com/okane_setup> | 運用中 |
| Linktree | <https://linktr.ee/okane_setup> | 全リンク集約 |
| LINE公式 | 未開設 | TODO |

### note記事の構成パターン (5ステップ + コンプラ表記)

各 Shorts に対応する完全ガイド note記事 を1本作成:

1. 冒頭: 情報確認日・対象・PR告知 + 「この記事で分かること」5項目 + 動画への**直リンク** + 免責
2. ステップ1〜5: テーマを5段階に分割、各ステップに出典明記
3. チェックリスト (☐ 絵文字でアクション促進)
4. まとめ: 「次にやること」3点
5. 関連動画・SNS + 参考・出典 + ご注意

**動画 → note → 動画の循環導線**を画像内・テキスト内で構築。

### YouTube タイトル規則

- prefix: **「【秒でわかる】」**(シリーズ統一)
- 動画CTAと一致するフック
- 「投資100万円」「最大化」等の煽り/誤読リスクを避ける
- 数字インパクト + 疑問符 + 「やさしく解説」のバランス

例:
- #01: `【秒でわかる】利益100万円が手元80万円に？新NISAなら税金0円の理由`
- #02: `【秒でわかる】クレカ積立で年間6,000円分？新NISAで使える3社をサクッと比較`

### YouTube Studio の自動機能設定 (金融系)

| 設定 | 推奨 | 理由 |
|---|---|---|
| チャプターの自動生成 | **OFF** | description で手動指定済み |
| 場所の自動表示 | **OFF** | 全国向け、ローカル流入不要 |
| コンセプトの自動説明 (β) | **OFF** | AI が煽り表現を勝手に追加するリスク |
| タイトルにハッシュタグ | **不要** | 説明欄末尾の最初3つが自動でタイトル上に出る |

### 予約投稿の活用

複数プラットフォーム同時公開:

- YouTube: Studio で予約投稿
- TikTok: **Web版のみ可**、モバイルアプリ不可
- X: Web版で予約可能 (無料)
- Instagram フィード: Meta Business Suite で可能、ストーリーズは予約不可

### Instagram ハッシュタグ仕様変更 (2026-05-14 知見)

Instagram は 2024年〜2025年にかけてハッシュタグ運用を大幅に変更:

- **キャプションのハッシュタグは 5個まで** (仕様レベルでの制限、超過分は無視される or 投稿不可)
- **Instagram公式推奨は 3-5個**
- アルゴリズム評価軸が「ハッシュタグ多用」→「コンテンツ品質・最初の3秒のフック」に移行
- 多すぎる (5個超え) はスパム判定リスクあり

「お金の初期設定」での 5個厳選戦略 (3層ミックス):

| 層 | 個数 | 役割 | 例 |
|---|---|---|---|
| 大ボリューム (検索本命) | 1 | 検索流入の主経路 | #新NISA |
| ターゲット絞り込み | 2-3 | 濃い視聴者を引き寄せ | #投資初心者 #20代投資 #ポイ活 |
| ブランド集約 | 1 | シリーズ追跡 | #お金の初期設定 |

実例:

- Shorts #01 (新NISA基本): `#新NISA #投資初心者 #20代投資 #お金の勉強 #お金の初期設定`
- Shorts #02 (クレカ積立): `#新NISA #クレカ積立 #投資初心者 #ポイ活 #お金の初期設定`

5個に絞った分、**キャプション本文中に関連キーワード** (例: SBI証券 / 楽天証券 / 三井住友 / つみたて投資枠 等) を自然に入れて、Instagram の自然言語処理に拾わせる戦略を併用する。

### YouTube 動画 URL 形式の使い分け (2026-05-14 知見)

| プラットフォーム | 推奨URL形式 | 理由 |
|---|---|---|
| **X (Twitter)** | `https://youtu.be/<id>` | 短縮URLの方が動画プレビュー (カード) が生成されやすい。`/shorts/` 形式は X がプレビュー化しないケースあり |
| **note** | `https://youtube.com/shorts/<id>` | Shorts であることが視聴者に伝わる、note 内表示でサムネ取得可能 |
| **note 記事間の一貫性** | 形式を統一する | バラバラだと運用が散乱する |
| **メール・LINE 等** | `https://youtu.be/<id>` | リンク短くて見やすい |
| **YouTube 説明欄の関連動画リンク** | `https://youtu.be/<id>` | コンパクト |

Shorts #02 公開時の実例: X 予約ポストに `/shorts/` 形式を入れたところプレビューが出ず、`youtu.be/` 形式に差し替えで解決。

---

## 8. アフィリエイト・収益化戦略

### ASP登録状況 (2026-05-14)

| ASP | 状態 | 用途 |
|---|---|---|
| A8.net | 登録済 | 一般案件 (証券会社系少なめ) |
| アクセストレード | 登録済・提携申請中 (SBI/楽天/松井/三菱UFJ eスマート) | 金融特化 |
| TGアフィリエイト | **未登録** | SBI証券 (高単価口座開設報酬狙い) |
| 楽天アフィリエイト | **未登録** | 楽天カード/楽天市場 (Shorts #02 用) |
| もしも | **未登録** | 楽天系の物販補完 |

### 重要な発見

- **SBI証券は A8 にも もしも にもない**。アクセストレード / TGアフィリエイト / JANet / felmat / TCSアフィリエイトのみ
- **アクセストレードでの SBI証券 案件**は **「資料請求」(¥300) のみが成果対象**、口座開設では報酬発生せず。口座開設報酬を狙うなら TGアフィリエイト 登録が必要
- 楽天証券 / 楽天カードは A8 / アクセストレードどちらにも無い

### 振込手数料の節約

A8.net・アクセストレードどちらも振込元は三井住友銀行。三井住友銀行（他支店）への振込手数料は ¥110 (他行は ¥770)。**ゆうちょ最安 ¥30** だが三井住友の他支店でも妥当。

---

## 9. KPI & Performance Tracking

### Shorts 特有の KPI

通常動画と異なり、Shorts は2セクションで計測:

**動画パフォーマンス:**
- Viewed vs Swiped Away (冒頭 hook 評価)
- 平均視聴維持率 (> 50% pass / > 65% 良)
- 完視聴率 (60秒最後まで)
- engaged views (10秒以上、アルゴリズム高評価指標)
- いいね率 / コメント率

**導線パフォーマンス:**
- 固定コメント CTR
- LINE クリック数
- ASP クリック数 / 承認数

### 1週間後の目安

| 視聴回数 | 評価 | アクション |
|---|---|---|
| < 500 | fail | タイトル/サムネ A/B 入替検討 |
| 1,000-3,000 | pass | 計画通り、継続 |
| 3,000-10,000 | 良 | テーマ深掘りで #03 即制作 |
| > 10,000 | ヒット | 本動画の長尺化 + 同テーマ深掘り |

### 初動データ (Shorts #01, 公開24時間後)

- YouTube: 視聴回数 1,266 / 視聴維持率 65.6% / 登録 +1 → **想定以上の好スタート**
- note: ビュー 11 / スキ 6 (スキ率 54%) → 質の高い反応
- X: インプレッション 1 (新規アカウント特有のスロースタート)
- TikTok: 初動 0 (シャドウバン疑いなし、別アカウントから視聴可・徐々に拡散される傾向)

---

## 10. Recent Decisions Log (2026-05-12 〜 2026-05-14)

### 2026-05-12

- **リブランド確定**: 「Z世代マネー教室」→ **「お金の初期設定」**、ハンドル **@okane_setup**
- **二層構造で運用**: channelId `genz-money` 維持、公開ブランドのみ変更
- 全ドキュメント・config・handoff更新

### 2026-05-13

- **Shorts #01 v8 公開** (YouTube/TikTok/Instagram/X/note)
- **note #01 完全ガイド公開**
- SNS整備完了 (Linktree / プロアカウント切替 / VOICEVOX クレジット表記)
- A8.net 登録完了、アクセストレード 提携申請

### 2026-05-14

- **Shorts #01 初動 KPI 計測** (YouTube 1,266 views, 維持率 65.6%)
- **Shorts #02 v1 改善**:
  - 「年間6,000円**ぶん**」→「年間6,000円**分**」(テキスト統一)
  - ネット証券のビジュアル: 色付き円 → クレカ風カード → **アプリアイコン風 badge** (証券会社の文脈と整合)
  - 各社カラー: SBI 緑→**青 #0066B2**、マネックス 青→**山吹 #E8A436** (公式色合わせ)
  - 「マネックスカード 最大1.1%」→ **「dカード 最大3.1%」** (2024年9月のドコモ × マネックス連携を反映)
  - dカード発音辞書追加 (「ディーカード」)
- **Shorts #02 v1 公開準備**: SEO/repurpose/handoff 完了、19:00 予約投稿セット (YouTube/TikTok/X)
- **note #02 完全ガイド公開** (ChatGPT レビュー 5項目反映済み: 「最大化」削除、還元率「代表例」明記、出典補強、「積立はむしろチャンス」削除等)
- **content/ 全体を gitignore に追加** (creative output / IP として git 管理外に)
- **`AGENTS.md` と本ドキュメント新規作成** (Codex 等の他AI agent との文脈共有用)

---

## 11. Open Tasks / Continuing Work

### 短期 (1〜2日内)

- [ ] Shorts #02 公開後の初動 KPI 計測 (24時間後)
- [ ] アクセストレード 提携承認連絡待ち (1〜2週間)
- [ ] note 記事冒頭 YouTube リンクを **チャンネルURL → 該当動画直リンク**に修正 (#01, #02 両方)

### 中期 (1〜2週間内)

- [ ] **TGアフィリエイト登録** (SBI証券口座開設報酬・最重要)
- [ ] **楽天アフィリエイト登録** (Shorts #02 のクレカ積立アフィリ用)
- [ ] ASP承認後のアフィリエイトリンクを YouTube概要欄・note記事に追記
- [ ] **LINE公式アカウント開設** (リード獲得・長期資産)

### 長期 (1〜3ヶ月内)

- [ ] Shorts #03 制作 (テーマ: 家計管理 or ポイ活 or ふるさと納税 等)
- [ ] 各証券会社の正規アフィリエイト素材取得 → 動画ロゴの正式化
- [ ] note 記事の SEO 効果検証 (検索流入レポート)
- [ ] 長尺動画 (10-15分) の制作着手 (アルゴリズム評価で必要)

---

## 12. File / Path Reference

### 重要ファイル

```text
config/channels.js                    # チャンネル設定 (お金の初期設定)
config/pronunciation-dictionary.json  # VOICEVOX 発音辞書 (dカード対応)
config/monetization.js                # 収益化戦略
config/tools.js                       # ツール設定・Voice routing・voicevoxPresets
src/cli.js                            # メインCLI (37コマンド)
src/remotion/components/              # Remotion 部品 (IconGrid, TaxFlowDemo 等)
scripts/generate-genz-audio.js        # VOICEVOX 音声生成
scripts/measure-segments.js           # セグメント実音声長計測
scripts/lib/pronunciation-loader.js   # 発音辞書ローダー
```

### コンテンツ (gitignore対象)

```text
content/genz-money/scripts/           # 台本テキスト
content/genz-money/metadata/          # scene JSON, segments JSON 等
content/genz-money/audio/             # VOICEVOX wav
content/genz-money/video/             # Remotion レンダリング mp4
content/genz-money/handoff/           # 公開パッケージ・shot plan
content/_prompts/                     # ハイブリッドモードのプロンプト出力先
```

### Claude メモリ (Claude Code 専用)

```text
~/.claude/projects/C--Users-nobuyoshi-ohhara/memory/
├── MEMORY.md                                    # インデックス
├── project_genz_money_brand_setup.md            # ブランド確定 (2026-05-12)
├── project_genz_money_positioning.md            # 戦略ポジショニング
├── project_genz_money_voice_decision.md         # 四国めたん採用
├── project_genz_money_voicevox_credit.md        # クレジット表記ルール
├── project_genz_money_shorts_01_v8_base.md      # v8 ベース固定
├── project_genz_money_shorts_se_recipe.md       # SE 配置レシピ
├── project_genz_money_one_message_per_cut.md    # 1カット1メッセージ原則
├── project_genz_money_publish_workflow.md       # 公開準備5ステップ
├── feedback_voicevox_intonation_strategy.md     # イントネーション戦略
└── feedback_remotion_text_pitfalls.md           # Remotion 罠集 15個
```

---

## 13. Update Policy

- **本ドキュメントの更新権限**: 全 AI agent (Claude / Codex) + 人間
- **更新タイミング**: 重大な決定が確定したら、または毎週1回の振り返り時
- **更新箇所**: §9 Recent Decisions Log に append、関連する他セクションも同期
- **同期確認**: Claude memory (`~/.claude/projects/.../memory/`) との内容差分を月1回確認、本ドキュメントを正とする方針
