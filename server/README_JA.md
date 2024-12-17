# NanoKVM サーバー

これは NanoKVM のバックエンドサーバーの実装です。

詳細なドキュメントについては、[Wiki](https://wiki.sipeed.com/nanokvm) を参照してください。

## 構造

```shell
server
├── common       // 共通ユーティリティコンポーネント
├── config       // サーバー設定
├── dl_lib       // 共有オブジェクトライブラリ
├── include      // 共有オブジェクトのヘッダーファイル
├── logger       // ロギングシステム
├── middleware   // サーバーミドルウェアコンポーネント
├── proto        // API リクエスト/レスポンス定義
├── router       // API ルートハンドラ
├── service      // コアサービスの実��
├── utils        // ユーティリティ関数
└── main.go
```

## 設定

設定ファイルのパスは `/etc/kvm/server.yaml` です。

```yaml
proto: http
port:
    http: 80
    https: 443
cert:
    crt: server.crt
    key: server.key

# ログレベル (debug/info/warn/error)
# 注意: 本番環境では 'info' または 'error' を使用し、'debug' は開発環境でのみ使用してください
logger:
    level: info
    file: stdout
    
# 認証設定 (enable/disable)
# 注意: 認証を無効にするのは開発環境でのみ行ってください
authentication: enable

# JWT 秘密鍵の設定
# 空のままにすると、サーバー起動時にランダムな鍵が生成されます
secretKey: ""
```

## コンパイルとデプロイ

注意: Linux オペレーティングシステム (x86-64) を使用してください。このビルドプロセスは ARM、Windows、macOS では互換性がありません。

1. ツールチェーンのインストール
    1. 以下のリンクからツールチェーンをダウンロードします: [ダウンロードリンク](https://sophon-file.sophon.cn/sophon-prod-s3/drive/23/03/07/16/host-tools.tar.gz)。
    2. ファイルを解凍し、`host-tools/gcc/riscv64-linux-musl-x86_64/bin` ディレクトリを PATH 環境変数に追加します。
    3. `riscv64-unknown-linux-musl-gcc -v` を実行します。バージョン情報が表示されれば、インストールは成功です。

2. プロジェクトのコンパイル
    1. プロジェクトのルートディレクトリから `cd server` を実行します。
    2. `go mod tidy` を実行して Go の依存関係をインストールします。
    3. `CGO_ENABLED=1 GOOS=linux GOARCH=riscv64 CC=riscv64-unknown-linux-musl-gcc CGO_CFLAGS="-mcpu=c906fdv -march=rv64imafdcv0p7xthead -mcmodel=medany -mabi=lp64d" go build` を実行してプロジェクトをコンパイルします。
    4. コンパイルが完了すると、`NanoKVM-Server` という名前の実行ファイルが生成されます。

3. RPATH の変更
    1. `sudo apt install patchelf` または `pip install patchelf` を実行して patchelf をインストールします。
    2. `patchelf --version` を実行します。バージョンが 0.14 以上であることを確認します。
    3. `patchelf --add-rpath \$ORIGIN/dl_lib NanoKVM-Server` を実行して、実行ファイルの RPATH を変更します。

4. アプリケーションのデプロイ
    1. デプロイ前に、ブラウザでアプリケーションを最新バージョンに更新します。手順は[こちら](https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/system/updating.html)を参照してください。
    2. コンパイルして生成された `NanoKVM-Server` ファイルを使用して、NanoKVM の `/kvmapp/server/` ディレクトリ内の元のファイルを置き換えます。
    3. NanoKVM で `/etc/init.d/S95nanokvm restart` を実行してサービスを再起動します。
