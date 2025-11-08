Docker でローカル公開する手順
================================

このリポジトリには Docker でローカル公開するためのファイルが含まれています:

- `Dockerfile` - マルチステージでビルドして nginx で配信します。
- `docker-compose.yml` - 簡単にビルド & 起動するための compose 設定（`docker compose` で使用します）。
- `nginx/default.conf` - SPA のフォールバックを有効にする nginx 設定。

使い方（簡易）:

1) Docker ビルド & 実行（単一コマンド）:

```pwsh
docker build -t swipe-gallery-app .
docker run --rm -p 5173:80 swipe-gallery-app
```

2) `docker compose` を使う（推奨）:

```pwsh
docker compose up --build
```

ポイント:
- ブラウザで http://localhost:5173 を開きます。
- 画像を追加した場合はホスト側で `npm run generate-manifest` を実行して `public/gallery.json` を更新してください。
- 開発中にソースを反映させたい場合は、別途 dev 用の compose 設定（`vite` dev サーバをコンテナで動かす）を作ると便利です。

トラブルシューティング:
- イメージビルドで依存の取得に失敗する場合はネットワークを確認してください。
- `public/data` をホストからマウントしているので、ホスト側の更新は反映されますが `gallery.json` を再生成する必要があります。
