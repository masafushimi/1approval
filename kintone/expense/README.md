# 経費精算アプリ一式（kintone）構築スクリプト

仕様書：https://claude.ai/artifact/YA7iBWZo1DtYrRHuVRqear

`build.js` は、ログイン済みのkintone画面で `kintone.api()` を使い、次の3アプリを作ります。

1. 勘定科目マスタ（経費精算）：フィールド5つ＋初期データ7件
2. 部門マスタ（経費精算）：フィールド3つ＋初期データ3件
3. 経費精算（DenHo連携）：ヘッダー・明細テーブル・ルックアップ・計算式、プロセス管理、アプリ／レコード／フィールドのアクセス権、一覧3つ、JavaScriptカスタマイズ（PC・モバイル）

## 手順

1. kintone（`https://ld8ff6ztoycv.cybozu.com/k/`）にAdministratorsのユーザーでログインする
2. 開発者ツールのコンソールに `build.js` の中身をすべて貼り付けて実行する
3. 1つずつ実行し、その都度kintoneの画面で確認する

```js
await expenseBuild.step1()   // 勘定科目マスタ
await expenseBuild.step2()   // 部門マスタ
await expenseBuild.step3()   // 経費精算
await expenseBuild.test()    // テスト1件：下書き→上長承認待ち→経理確認待ち→精算確定
expenseBuild.state()         // 作成したアプリIDとURL
```

- 同名のアプリがあれば作らずにエラーで止まります。既存のアプリは変更しません。
- 途中で失敗しても、もう一度同じステップを実行すれば続きから進みます（IDはブラウザのlocalStorageに保存）。
- 経理グループの代わりに `Administrators` を使っています。

## 画面で行う残作業

- DenHo for kintone プラグインの読み込みと項目の対応（契約後）
- CSV書き出しの項目パターンの保存（一覧「仕訳出力対象」、明細テーブルを含める、Shift-JIS）
- 上長を自動で作業者にする場合のプロセス管理の変更（任意）
