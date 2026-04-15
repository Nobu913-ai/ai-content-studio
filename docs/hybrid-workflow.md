# ハイブリッドモード運用ガイド

## 概要

AI Content Studio は **ハイブリッドモード** で動作します。

| 条件 | 動作 |
|------|------|
| `ANTHROPIC_API_KEY` 設定済み | Claude API で自動生成 |
| `ANTHROPIC_API_KEY` 未設定 | プロンプトを `content/_prompts/` に書き出し → Claude Code で手動実行 |

外部ツール（Runway / ElevenLabs / Descript）も同様に、APIキー未設定時は手動フォールバックします。

---

## プロンプト → 手動実行 → 保存の流れ

```
1. CLI コマンドを実行（APIキー未設定）
   ↓
2. content/_prompts/<ts>_<label>.md にプロンプトが書き出される
   ↓
3. Claude Code でプロンプトファイルを開き、System Prompt と User Prompt を実行
   ↓
4. 生成結果を「期待する保存先」に正しいファイル名で保存
   ↓
5. 次のコマンドを実行（保存したファイルをパスで指定）
```

---

## 成果物マッピング一覧

### 計画系コマンド（Claude API / Claude Code 手動）

| CLI コマンド | プロンプト Label | プロンプト書き出し先 | 期待する保存先 | ファイル名パターン | 出力形式 |
|---|---|---|---|---|---|
| `acs topic-gen <ch>` | `topic-gen` | `content/_prompts/<ts>_topic-gen.md` | `content/<ch>/metadata/` | `<ts>_topic_ideas.json` | JSON |
| `acs script <ch> <topic>` | `script` | `content/_prompts/<ts>_script.md` | `content/<ch>/scripts/` | `<ts>_<slug>.md` | Markdown |
| `acs shot-plan <ch> <script>` | `shot-plan` | `content/_prompts/<ts>_shot-plan.md` | `content/<ch>/metadata/` | `<ts>_<slug>_shotplan.json` | JSON |
| `acs narration <ch> <script>` | `narration` | `content/_prompts/<ts>_narration.md` | `content/<ch>/metadata/` + `content/<ch>/scripts/` | `<ts>_<slug>_narration.json` + `<ts>_<slug>_narration.txt` | JSON + TXT |
| `acs handoff <ch> <script>` | `handoff` | `content/_prompts/<ts>_handoff.md` | `content/<ch>/metadata/` | `<ts>_<slug>_handoff.md` | Markdown |
| `acs check <ch> <script>` | `compliance` | `content/_prompts/<ts>_compliance.md` | `content/<ch>/metadata/` | `<ts>_<slug>_compliance.json` | JSON |
| `acs seo <ch> <script>` | `seo` | `content/_prompts/<ts>_seo.md` | `content/<ch>/metadata/` | `<ts>_<slug>_seo.json` | JSON |
| `acs shorts <ch> <script>` | `shorts` | `content/_prompts/<ts>_shorts.md` | `content/<ch>/scripts/` | `<ts>_<slug>_shorts.json` | JSON |
| `acs shorts-first <ch> <topic>` | `shorts-first` | `content/_prompts/<ts>_shorts-first.md` | `content/<ch>/scripts/` | `<ts>_<slug>_shorts_test.json` | JSON |
| `acs repurpose <ch> <script>` | `repurpose` | `content/_prompts/<ts>_repurpose.md` | `content/<ch>/metadata/` | `<ts>_<slug>_repurpose.json` | JSON |
| `acs calendar <ch>` | `calendar` | `content/_prompts/<ts>_calendar.md` | `content/<ch>/calendar/` | `<ts>_calendar.json` | JSON |

**凡例:**
- `<ts>` = タイムスタンプ（例: `20260415_143000`）
- `<ch>` = チャンネルID（例: `genz-money`）
- `<slug>` = トピック名のスラッグ（例: `新nisaの始め方`）

### 外部ツール系コマンド（外部API / 手動）

| ステップ | 必要APIキー | 自動時の保存先 | 手動時の保存先 |
|---|---|---|---|
| Runway 動画生成 | `RUNWAY_API_KEY` | `content/<ch>/assets/video/` | 同左（手動ダウンロード） |
| ElevenLabs TTS | `ELEVENLABS_API_KEY` | `content/<ch>/audio/` | 同左（手動ダウンロード） |
| Descript AI編集 | `DESCRIPT_API_KEY` | Descript クラウド | Descript GUI で手動操作 |
| DaVinci Resolve | なし（常に手動） | — | ハンドオフノート参照で手動仕上げ |

---

## コマンド間の依存関係

```
topic-gen ──→ script ──┬──→ shot-plan ──→ Runway (動画)
                       ├──→ narration ──→ ElevenLabs (音声)
                       ├──→ check (コンプラ)
                       ├──→ seo
                       ├──→ shorts
                       ├──→ repurpose
                       └──→ handoff ──→ DaVinci Resolve
```

**重要:** `script` の出力パスが後続コマンドの入力になります。手動モードで台本を保存する際は、正しいパスを控えておいてください。

---

## 手動実行の具体的手順

### Step 1: プロンプトファイルを確認

```bash
# CLI実行後に出力されるパスを確認
acs script genz-money "新NISAの始め方"
# → [Manual] content/_prompts/20260415_143000_script.md
```

### Step 2: Claude Code でプロンプトを実行

```
# Claude Code で以下のように依頼:
「content/_prompts/20260415_143000_script.md のプロンプトを実行して、
  結果を content/genz-money/scripts/20260415_143000_新nisaの始め方.md に保存してください」
```

プロンプトファイルには `## System Prompt` と `## User Prompt` が含まれています。
Claude Code にそのまま渡して実行してください。

### Step 3: 後続コマンドに保存先パスを渡す

```bash
# 台本パスを指定して後続コマンドを実行
acs shot-plan genz-money content/genz-money/scripts/20260415_143000_新nisaの始め方.md
acs narration genz-money content/genz-money/scripts/20260415_143000_新nisaの始め方.md
acs check genz-money content/genz-money/scripts/20260415_143000_新nisaの始め方.md
```

### Step 4: 各ステップで同様に繰り返す

後続の `shot-plan`, `narration`, `handoff` 等も同様にプロンプトが書き出されます。
各プロンプトを Claude Code で実行し、結果を期待する保存先に保存してください。

---

## ナレーション整形の特殊ケース

`acs narration` は API 未設定時でも **ローカルフォールバック** で動作します。

- Claude API あり → AI がセグメント分割・ペーシング注記付きで整形
- Claude API なし → 正規表現でマーカー除去のみ（基本的なテキスト出力）

ローカルフォールバック時もファイルは正常に保存されるため、ElevenLabs への投入は可能です。ただし品質は API 使用時より劣ります。

---

## produce-plan / produce の挙動

### `acs produce-plan`（計画フェーズ一括）

| ANTHROPIC_API_KEY | 動作 |
|---|---|
| 設定済み | 台本 → ショットプラン → ナレーション → ハンドオフ を自動実行 |
| 未設定 | 台本プロンプト書き出し → 後続はスキップ（台本依存のため） |

台本が未設定でも `--script-path` で既存台本を指定すれば、後続のプロンプト書き出しは実行されます。

### `acs produce`（全工程一括）

| 条件 | 動作 |
|---|---|
| 全APIキー設定済み | 計画 + 生成 を全自動実行 → マニフェストJSON出力 |
| ANTHROPIC のみ | 計画は自動、生成は手動フォールバック → マニフェストに manual 記録 |
| APIキーなし | 計画もプロンプト書き出し → 全ステップ manual → マニフェストに記録 |

マニフェストにはすべてのステップの状態（`done` / `manual` / `skipped` / `error`）が記録されるため、どこから手動介入が必要かを追跡できます。

---

## MVP スモークテストでの使い方

MVP スモークテスト（`docs/mvp-smoke-test.md`）をハイブリッドモードで実行する場合:

1. `.env` に `ANTHROPIC_API_KEY` を設定しない（またはコメントアウト）
2. 各コマンドを実行 → プロンプトが `content/_prompts/` に書き出される
3. Claude Code でプロンプトを1つずつ実行し、結果を正しいパスに保存
4. 後続コマンドに保存先パスを指定して実行

**推奨:** 初回スモークテストは手動モードで実行し、各ステップの出力品質と導線を確認してから API キーを設定する方が安全です。
