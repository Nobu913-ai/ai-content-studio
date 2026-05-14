# 新NISA Shorts 3本 — 編集ハンドオフノート

## 概要
- チャンネル: お金の初期設定 (channelId: genz-money, handle: @okane_setup)
- フォーマット: YouTube Shorts / TikTok / Instagram Reels
- 解像度: 1080×1920 (9:16)
- FPS: 30
- ナレーション: VOICEVOX 四国めたん ノーマル (speakerId=2)

## 3本の構成

| # | ファイル | テーマ | 切り口 | 長さ |
|---|---------|--------|--------|------|
| 01 | shorts_nisa_01-hook | 新NISAとは | フック型・制度紹介 | 68秒 |
| 02 | shorts_nisa_02-comparison | 複利×税金差 | 数字比較型 | 65秒 |
| 03 | shorts_nisa_03-mistakes | やっちゃダメ3つ | NG集型 | 66秒 |

## ファイル一覧

### 音声
- `content/genz-money/audio/shorts_nisa_01-hook.wav`
- `content/genz-money/audio/shorts_nisa_02-comparison.wav`
- `content/genz-money/audio/shorts_nisa_03-mistakes.wav`

### 台本
- `content/genz-money/scripts/shorts-nisa-01-hook.txt`
- `content/genz-money/scripts/shorts-nisa-02-comparison.txt`
- `content/genz-money/scripts/shorts-nisa-03-mistakes.txt`

### ショットプラン
- `content/genz-money/handoff/shorts-nisa/shot-plan-01-hook.json`
- `content/genz-money/handoff/shorts-nisa/shot-plan-02-comparison.json`
- `content/genz-money/handoff/shorts-nisa/shot-plan-03-mistakes.json`

## デザインガイドライン

### 全体トーン
- 図解・インフォグラフィック寄り（写実的なAI生成映像は使わない）
- 人の顔は使わない
- 情報の可視化を最優先

### カラーパレット
- 背景: ダークネイビー (#1A237E) のグラデーション
- メインテキスト: ホワイト (#FFFFFF)
- ポジティブ数字・OK: グリーン (#00E676)
- 税金・NG・損: レッド (#FF5252)
- 複利・ハイライト: ゴールド (#FFD600)
- サブテキスト: ライトグレー (#B0BEC5)

### フォント
- メイン: Noto Sans JP Bold
- 数字: Noto Sans JP Black
- サイズ: 画面幅の80%を使う大きめのテキスト（スマホで読みやすく）

### アニメーション
- シンプルなモーション（ポップイン、スライドイン、フェード）
- 派手なトランジションは不要
- テキスト表示はナレーションとシンクロさせる
- 数字はカウントアップアニメーションで強調

## 編集手順（DaVinci Resolve Free）

### 1. プロジェクト設定
- 解像度: 1080×1920
- FPS: 30
- カラーサイエンス: DaVinci YRGB

### 2. メディアインポート
- 音声ファイル3本をオーディオトラックにインポート
- 映像素材（Canva / Runway / フリー素材で作成）をビデオトラックにインポート

### 3. タイムライン構築
- ショットプランのstart_sec / duration_secに従ってクリップを配置
- 音声に合わせてテキストオーバーレイを配置

### 4. テキストオーバーレイ
- Fusion Text+ を使用
- ショットプランのtext_overlayフィールドの内容を表示
- ナレーションのタイミングに合わせて表示/非表示

### 5. 書き出し
- フォーマット: H.264 MP4
- 解像度: 1080×1920
- ビットレート: 8-10 Mbps
- オーディオ: AAC 192kbps

## 映像素材の作成方法（推奨）

### 選択肢A: Canva（推奨・最速）
1. Canva で 1080×1920 のデザインを作成
2. ショットプランの各ショットに対応するスライドを作成
3. アニメーションはCanva内で設定可能
4. 動画としてエクスポート → DaVinciに取り込み

### 選択肢B: Runway Web版
1. runway.ml でアカウントにログイン
2. ショットプランのvisualフィールドをプロンプトとして使用
3. 9:16のアスペクト比で生成
4. 背景・抽象的な映像に適している

### 選択肢C: フリー素材 + DaVinci Fusion
1. Pexels / Pixabay でフリー素材を取得
2. DaVinci Resolve の Fusion でテキストアニメーションを直接作成
3. 最もカスタマイズ性が高いが作業時間も多い

## 投稿設定

### YouTube Shorts
- タイトル例: 「月100円から始められる投資制度、知ってた？ #新NISA #投資初心者 #Shorts」
- 説明文: 台本の要約 + アフィリエイトリンク（証券口座開設）
- タグ: #新NISA #NISA #投資初心者 #投資 #資産形成 #Shorts

### TikTok
- キャプション: フック文 + ハッシュタグ
- タグ: #新NISA #投資 #お金の勉強 #Z世代 #資産形成 #金融リテラシー

### Instagram Reels
- キャプション: 台本要約 + CTA
- タグ: #新NISA #投資初心者 #お金の勉強 #資産形成 #20代投資

## VOICEVOX クレジット表記
VOICEVOX使用時は以下のクレジット表記が必要:
- 「VOICEVOX:四国めたん」
- 動画の説明文または概要欄に記載
