# DMP-editor

**Data Management Plan (DMP)** を **GakuNin RDM** と連携して保存・編集できる Web アプリケーション

**GitHub Pages 環境として、[https://nii-dg.github.io/dmp-editor/](https://nii-dg.github.io/dmp-editor/) が用意されています。**

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
docker compose -f compose.dev.yml exec app npm run dev
```

### Environmental variables

開発環境においては、必要に応じて以下の環境変数を設定してください。

- `VITE_KAKEN_APP_ID`: KAKEN API の application ID。
    - 「DMP 編集」ページの「2. プロジェクト情報」ステップにて、「KAKEN番号で自動補完」機能を利用する場合に必要です。
    - 当該 ID の発行方法は「[CiNii全般 - メタデータ・API - API利用登録](https://support.nii.ac.jp/ja/cinii/api/developer)」をご参照ください。

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
