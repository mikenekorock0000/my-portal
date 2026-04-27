# GAS カレンダーテンプレート生成ツール

iPad の GoodNotes 無限キャンバス用に、4月始まりの 12 か月カレンダー (上下 6 か月ずつ) を SVG/PDF で生成する Google Apps Script プロジェクトです。

## 構成

```
gas/
├── Code.js            ← 本体スクリプト
├── appsscript.json    ← GAS マニフェスト
├── .claspignore       ← clasp アップロード対象の絞り込み
└── README.md          ← この手順書
```

## デプロイ手順 (clasp)

### 1. clasp をインストール

```bash
npm i -g @google/clasp
```

### 2. Google Apps Script API を有効化

ブラウザで開いて「On」にする (1 回だけ):

https://script.google.com/home/usersettings

### 3. ログイン

```bash
clasp login
```

ブラウザが開くので Google アカウントで認証してください。

### 4. このディレクトリに移動

```bash
cd gas
```

### 5. GAS プロジェクトを新規作成

```bash
clasp create --type standalone --title "Yearly Calendar Template" --rootDir .
```

このコマンドで `.clasp.json` が自動生成されます (Git には含めません)。

> 既存の GAS プロジェクトに反映したい場合は `clasp clone <scriptId> --rootDir .` を使ってください。

### 6. ソースをアップロード

```bash
clasp push
```

`Code.js` と `appsscript.json` だけが GAS にアップロードされます。

### 7. ブラウザで開いて実行

```bash
clasp open
```

GAS エディタが開くので:

1. 関数選択メニューで `run` を選ぶ
2. 「実行」をクリック
3. 初回は Drive へのアクセス権限承認ダイアログが出るので許可
4. 「実行ログ」に SVG / PDF の URL が出る → Drive で確認

## 出力年を変える

`Code.js` の `run()` の中の数字を変えるだけです:

```js
function run() {
  createCalendarTemplate(2026); // ← ここを 2027, 2028 ... に
}
```

修正後に `clasp push` で再アップロード。

## 出力されるもの (マイドライブ直下)

- `calendar_<year>_apr_start.svg` — ベクター原本 (拡大無限OK)
- `calendar_<year>_apr_start.pdf` — GoodNotes 取り込み用

## カレンダー仕様

- 4月始まり、12 か月ぶん
- 上段: 4〜9月 / 下段: 10〜翌3月 (6 か月ずつ)
- 月曜始まり、土曜=青、日曜=赤
- 1 マス 300×260pt → 拡大すると 400 字程度のメモが書ける広さ
