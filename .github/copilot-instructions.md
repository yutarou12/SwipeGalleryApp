# GitHub Copilot / AI 向け簡潔ガイド (SwipeGalleryApp)

このリポジトリはローカルで動くシンプルな画像ギャラリーです。以下はAIエージェントが作業を始める際に知っておくべき重要事項です。

- 目的: `public/data/<number>/` に置かれた画像をフォルダ単位で一覧表示し、フォルダをクリックするとそのフォルダ内の画像を名前順でプレビュー・スワイプできるアプリ。
- 技術スタック: Vite (ESM), React + TypeScript, MUI (Material UI)。静的ファイルは `public/` 下に置く。
- 画像一覧の取得方法: ブラウザからはディレクトリを直接列挙できないため、`public/gallery.json` を利用する。これはルートの `scripts/generate-manifest.js` が `public/data` をスキャンして生成する。
  - 開発中は `npm run start`（`generate-manifest` を先に実行）で起動する想定。
  - 画像追加後は `npm run generate-manifest` を実行して `gallery.json` を更新する。
- 主要ファイル:
  - `scripts/generate-manifest.js` — `public/data` のフォルダ/画像を走査して `public/gallery.json` を作る。サンプル画像を自動作成するロジックがある。
  - `public/gallery.json` — ブラウザが読み込むランタイムのメタデータ（JSON 形式: { "1": ["/data/1/img1.svg", ...], ... }）。
  - `src/App.tsx` — 主要 UI（フォルダ一覧、ライトボックス、スワイプの簡易処理を実装）。
  - `index.html`, `src/main.tsx`, `src/styles.css` — エントリとスタイル。
- UI/UX の実装方針（発見されたパターン）:
  - フォルダカードは `Card` + `CardActionArea`（MUI）で実装。カードのサムネはフォルダ内最初の画像を使用。
  - ライトボックスは MUI の `Dialog` を用い、キーボードの左右・Esc、及びタッチの開始/終了差分でスワイプ動作を実現。
  - 画像は `gallery.json` 内の配列を名前順にソートして表示する。
- 開発ワークフローの注意点:
  - 依存を追加・更新する場合は `package.json` を更新し、ローカルで `npm install` を実行する。
  - `public/data` に画像を追加した場合、`npm run generate-manifest` を忘れない。
- 追加実装で有用なファイル/場所:
  - UI 拡張: `src/components/` を作りコンポーネント分割する（`FolderGrid`, `Lightbox` など）。
  - テスト: 現在テストは無い。小規模なユニットや E2E（Playwright）を後で追加可能。

短い作業ルール（AI 向け）:
- 変更はまず少量のファイルで行い、動作確認手順を README に追記する。
- 既存の `gallery.json`/`public/data` ロジックを壊さない（ブラウザは `gallery.json` を期待する）。
- 新しい依存を追加する際には `package.json` の scripts に `generate-manifest` などを繋ぐこと。

以上を踏まえ、改善提案や不明点があればこのファイルを更新してください。