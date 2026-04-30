# SE Palette (genz-money Shorts)

zapsplat 由来の8ファイルを「**役割固定**」で運用する。  
ChatGPT SE Palette 分析 (2026-04-29) の推奨に基づく構成。

## 基本パレット (常用) — 5種

| Type | ファイル | 役割 | 推奨用途 |
|------|---------|------|---------|
| `pop` | `pop.mp3` | UI基本pop | 数字出現、小見出し、情報確定 (CTAの軽い強調) |
| `tick` | `tick.mp3` | tick / tap | step進行、phoneStepsDemoタップ、チェック点灯 |
| `whoosh` | `whoosh.mp3` | 基本whoosh | 通常遷移、clean な横移動、パネル切替 |
| `whooshSoft` | `whoosh-soft.mp3` | 柔らかい大遷移 | カード遷移、CTA導入、phone UI画面切替 |
| `softImpact` | `soft-impact.mp3` | 基本impact | 見出し確定、CTA確定、大事な数字の着地 |

## 限定パレット (1動画あたり1〜2回まで) — 3種

| Type | ファイル | 役割 | 推奨用途 |
|------|---------|------|---------|
| `popStrong` | `pop-strong.mp3` | 強調pop | CTA直前の強調、大事な比較1発、タイトル確定の補助 |
| `whooshPower` | `whoosh-power.mp3` | 強い遷移 | 最後のCTA、冒頭の一番大きい比較カット (1動画1回限定) |
| `specialImpact` | `special-impact.mp3` | 特殊impact | 1動画1回だけの大きいパネル着地 (clean infographic 想定なら保留推奨) |

## 運用ルール

### ルール1: 1カットにSEを入れすぎない
- 基本は **1カット 0〜2音** まで
- 例外は `progressSteps` や `phoneStepsDemo` (step毎に tick OK)

### ルール2: 同じ役割には同じ音を使う
- 数字出現 → `pop`
- step進行 → `tick`
- 見出し着地 → `softImpact`
- 通常遷移 → `whoosh`

### ルール3: 強いSEは1動画に1〜2回だけ
- `whooshPower`、`specialImpact` の連発は禁止

### ルール4: SEは「聞かせる」のではなく「支える」
- ナレーションより前に出さない
- 音量は `volume: 0.4 〜 0.6` を基本とする
- 余韻が長いものは shot を伸ばすか音量を下げる

## shot plan での使い方

```json
{
  "shot_id": "08-01",
  "duration_sec": 7.7,
  "seEvents": [
    { "type": "whoosh",     "atSec": 0.0,  "volume": 0.4 },
    { "type": "pop",        "atSec": 3.5,  "volume": 0.5 },
    { "type": "softImpact", "atSec": 5.5,  "volume": 0.55 }
  ]
}
```

`atSec` は shot 開始からの相対秒。`volume` 省略時は 0.6。

## オリジナルファイルの保管場所

`public/se/zapsplat/` に zapsplat の元ファイル名のまま保管。  
役割マッピングを変更する場合はここから新しくコピーする。

## ライセンス

zapsplat.com のライセンス条件に従う:
- 個人/商用利用OK
- credit 表記推奨 (`Sound effects from Zapsplat.com`)
- 動画概要欄やブログ末尾に記載
