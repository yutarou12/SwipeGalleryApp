# Swipe Gallery App (ローカル画像館)

ローカル使用のためのシンプルな画像ギャラリー (Typescript + React + Vite + MUI)

特徴:
- `public/data/<num>/` に配置した画像をフォルダごとに一覧表示
- フォルダをクリックすると画像を名前順でプレビュー・左右スワイプ可能

使い方（ローカル）:

1. 依存をインストール

```pwsh
npm install
```

2. 開発サーバを起動（起動時に `public/gallery.json` を生成します）

```pwsh
npm run start
```

3. ブラウザで http://localhost:5173 を開く

注意:
- `public/data` が空の場合、起動スクリプトがサンプル画像を自動作成します。
- 画像を追加したあと `npm run generate-manifest` を実行して `gallery.json` を更新してください。
