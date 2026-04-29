# GAS カレンダーテンプレート生成ツール

iPad の GoodNotes 無限キャンバス用に、4月始まりの 12 か月カレンダー (上下 6 か月ずつ) を SVG/PDF で生成する Google Apps Script プロジェクトです。**ブラウザの Web UI から年を選んでボタンを押すだけ**で生成できます。

## 構成

```
gas/
├── Code.js            ← 本体 (doGet + 生成ロジック)
├── index.html         ← Web UI
├── appsscript.json    ← GAS マニフェスト
├── .clasp.json        ← デプロイ先 scriptId
├── .claspignore       ← clasp アップロード対象の絞り込み
└── README.md          ← この手順書
```

## セットアップ (初回のみ)

### 1. clasp をインストール

```bash
npm i -g @google/clasp
```

### 2. Apps Script API を有効化

https://script.google.com/home/usersettings を開いて「On」にする。

### 3. ログイン

```bash
clasp login
```

### 4. ソースをアップロード

```bash
cd gas
clasp push
```

`.clasp.json` に scriptId が書いてあるので、対象プロジェクトに直接反映されます。

### 5. Web App としてデプロイ

GAS エディタを開く:

```bash
clasp open
```

ブラウザの GAS エディタで:

1. 右上の「**デプロイ**」→「**新しいデプロイ**」
2. 種類: **ウェブアプリ**
3. 説明: 任意 (例: `v1`)
4. 次のユーザーとして実行: **自分**
5. アクセスできるユーザー: **自分のみ** (推奨)
6. 「**デプロイ**」を押す
7. 初回は **Drive アクセスの承認**を求められるので許可
8. 表示された **ウェブアプリの URL** をブックマーク

> コード変更後は `clasp push` → エディタで「デプロイ」→「**デプロイを管理**」→ 鉛筆 → バージョン「新しいバージョン」→「デプロイ」で更新。
> 同じ URL のまま中身だけ更新されます。

## 使い方 (運用時)

1. ブックマークした Web App URL を開く
2. 出力年を選ぶ (当年 ±数年が選択肢に出る)
3. 「**生成して Drive に保存**」を押す
4. 10〜30 秒で完了 → 表示された PDF/SVG リンクから Drive で開く
5. PDF を iPad の GoodNotes に読み込み or テンプレート登録

## 出力されるもの (マイドライブ直下)

- `calendar_<year>_apr_start.svg` — ベクター原本 (拡大無限 OK)
- `calendar_<year>_apr_start.pdf` — GoodNotes 取り込み用

## カレンダー仕様

- 4 月始まり、12 か月ぶん (例: 2026/4 〜 2027/3)
- 上段: 4〜9 月 / 下段: 10〜翌 3 月 (6 か月ずつ)
- 月曜始まり、土曜=青、日曜=赤
- 1 マス 300×260pt → 拡大すれば 400 字程度のメモが書ける広さ
- SVG/PDF どちらもベクターなので無限拡大しても劣化なし

## トラブルシュート

- **「承認が必要です」と出る** → デプロイ時または初回実行時の Google 承認ダイアログを許可してください
- **タイムアウト** → 6 分超は GAS の制限。本生成は通常 30 秒以内に終わります
- **別の GAS プロジェクトに切り替えたい** → `gas/.clasp.json` の `scriptId` を書き換えて `clasp push`
