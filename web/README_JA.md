# NanoKVM フロントエンド

これは NanoKVM のウェブプロジェクトです。詳細なドキュメントについては、[Wiki](https://wiki.sipeed.com/nanokvm) を参照してください。

## 構造

```shell
src
├── api                // バックエンド API
├── assets             // 静的リソース
├── components         // 公共コンポーネント
├── i18n               // 言語リソース
├── jotai              // グローバル jotai 変数
├── lib                // ユーティリティライブラリ
├── pages              // ウェブページ
│    ├── auth             // ログインとパスワード
│    ├── desktop          // リモートデスクトップ
│    └── terminal         // ウェブターミナル
├── router.tsx         // ルーター
└── types              // 型定義
```

## ローカル開発

CORS 制限のため、ローカル開発中は認証を無効にする必要があります。

認証機能を開発するには、プロジェクトをビルドして NanoKVM でテストする必要があります。

1. SSH を介して NanoKVM にログインします：`ssh root@your-nanokvm-ip`（デフォルトのパスワードは root です）。
2. 設定ファイル `/etc/kvm/server.yaml/` を開き、`authentication: disable` を追加します。⚠️注意：このオプションはすべての認証を無効にし、本番環境では有効にしないでください！
3. サービスを再起動します：`/etc/init.d/S95nanokvm restart`。
4. `.env.development` ファイルを編集し、`VITE_SERVER_IP` を NanoKVM の IP アドレスに変更します。
5. `pnpm dev` を実行してサーバーを起動し、ブラウザで http://localhost:3001/ にアクセスします。


開発中のアクセス問題を避けるため、ブラウザのキャッシュを無効にすることをお勧めします：

1. ブラウザの開発者ツールを開きます；
2. `Network` タブに移動します；
3. `Disable cache` オプションをチェックします；
4. ページをリフレッシュします。

## デプロイ

ビルド：

```shell
cd web
pnpm install
pnpm build
```

1. コンパイルが完了すると、`dist` フォルダが生成されます。
2. フォルダの名前を `web` に変更します。
3. `web` を NanoKVM の `/kvmapp/server/` にアップロードします。
4. NanoKVM で `/etc/init.d/S95nanokvm restart` を実行してサービスを再起動します。

また、ブラウザに古いバージョンのキャッシュが残っている可能性があります。ページが開かない場合は、強制リフレッシュまたはキャッシュのクリアを試してください。
