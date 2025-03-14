# DMP-editor

**Data Management Plan (DMP)** を **GakuNin RDM** と連携して保存・編集できる Web アプリケーション

## Deploy

ローカル環境で DMP-editor を実行するには、以下のコマンドを実行します。

```bash
docker network create dmp-editor-network
docker compose up -d

# ブラウザで localhost:3000 にアクセス
```

## Development

開発環境のセットアップ:

```bash
docker network create dmp-editor-network
docker compose -f compose.dev.yml up -d --build
docker compose exec app npm run dev
```

## Release

新しいバージョンをリリースするには、以下のスクリプトを実行します。

```bash
bash release.sh <version>

# 1. 設定ファイルのバージョンを更新
# 2. `git commit`, `git tag`, `git push`
# 3. GitHub Actions により以下が自動生成・公開される:
#    - Docker イメージ
#    - GitHub Release
#    - GitHub Pages
```

## License

This project is licensed under [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).
See the [LICENSE](./LICENSE) file for details.
