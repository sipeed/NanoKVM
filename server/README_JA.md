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
├── service      // コアサービスの実装
├── utils        // ユーティリティ関数
└── main.go
```

## 設定

設定ファイルのパスは `/etc/kvm/server.yaml` です。

```yaml
proto: http
host: ""
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

jwt:
   # JWT 秘密鍵の設定。 空のままにすると、サーバー起動時にランダムな 64 バイトの鍵が自動的に生成されます。
   secretKey: ""
   # JWT トークンの有効期限（秒単位）。 デフォルト: 2678400 (31 日)
   refreshTokenDuration: 2678400
   # ユーザーがログアウトすると、すべての JWT トークンが無効になります。 デフォルト: true
   revokeTokensOnLogout: true

security:
   loginLockoutDuration: 0
   loginMaxFailures: 5
   # X-Forwarded-Host / X-Forwarded-Proto を供給できるリバースプロキシの IP または CIDR。既定では loopback のみを信頼します。
   trustedProxies:
     - 127.0.0.1/32
     - ::1/128
   # 追加で許可するブラウザー Origin。scheme、host、非既定 port を含む完全一致です。
   allowedOrigins: []

# カスタム STUN サーバーのアドレス
stun: stun.l.google.com:19302

# カスタム TURN サーバーのアドレスと認証情報
turn:
    turnAddr: turn.cloudflare.com:3478
    turnUser: example_user
    turnCred: example_cred
```

## Web ユーザー

NanoKVM にはデバイス全体で二つのロールがあります。`admin` は KVM とユーザー、システム、ネットワーク、更新、ストレージ、端末、スクリプト、MCP、PicoClaw を管理できます。`user` は KVM 映像、キーボード、マウス、貼り付け、電源/リセット、Wake-on-LAN を利用できます。

アカウントは **設定 > アカウント** から管理します。データは `/etc/kvm/pwd` に保存され、旧単一アカウント形式はその場で移行されます。ユーザー自身がパスワードを変更する場合は現在のパスワードが必要です。管理者はデバイス所有者以外のパスワードをリセットできます。デバイス所有者は自分のユーザー名とパスワードを変更できます。このパスワードは Linux root にも同期されます。所有者アカウントの制限はアカウント管理での誤操作を防ぐものであり、端末またはスクリプトにアクセスできる管理者をサンドボックス化するものではありません。

## リバースプロキシ

リバースプロキシでは、ブラウザーから見える host と scheme を保持してください。HID、H.264、端末、PicoClaw の WebSocket は `Origin` を検証するため、通常の HTTP ページが表示できてもヘッダーが不足すると WebSocket の handshake は `403` になります。

nginx では少なくとも次と同等に設定します。

```nginx
location / {
    proxy_pass http://127.0.0.1:80;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

最後のプロキシ hop は、ブラウザーから見える値で `Host`、`X-Forwarded-Host`、
`X-Forwarded-Proto` を上書き（追加ではなく）し、クライアントが注入した転送ヘッダーを消去してください。
多段構成では各 hop から次の hop へ値を渡し、最終 hop のアドレスだけを `security.trustedProxies` に登録します。
`Host $proxy_host` を使う古い設定は移行が必要です。これは upstream のアドレスになるため、特に公開 URL が
非標準ポートの場合に WebSocket の Origin 検証を失敗させます。

`X-Forwarded-Host` と `X-Forwarded-Proto` は、接続先 peer が `security.trustedProxies` に一致するときだけ使われます。既定値は `127.0.0.1/32` と `::1/128` です。非 loopback proxy はその IP/CIDR を追加し、信頼できないクライアントネットワークは追加しないでください。元の host を保存できない場合だけ、`security.allowedOrigins` に `https://kvm.example.com` のような完全な Origin を追加できます（scheme、host、port は完全一致）。これは wildcard ではなく例外リストで、信頼する proxy の設定の代わりにはなりません。

## API と自動化の認証

`POST /api/auth/login` は既定ではブラウザーログインです。HttpOnly セッション Cookie を設定し、token を含まない通常の成功応答を返します。自動化クライアントは `X-NanoKVM-Return-Token: true` を送ると応答の JWT を明示的に要求できます。この場合も Cookie は設定されます。以後は `Authorization: Bearer <JWT>` を使います。`Authorization` ヘッダーが存在して無効な場合、Cookie へフォールバックせず unauthorized になります。

認証およびユーザー管理 API のパスワードは平文ではありません。passphrase `nanokvm-sipeed-2024` を使う CryptoJS / OpenSSL salted 形式です。これは転送の難読化だけなので、リモートアクセスには必ず HTTPS を使ってください。以下の shell 関数は raw Base64 を生成します（CryptoJS 互換のため `-md md5` が必要です）。`curl --data-urlencode` と一緒に使うと、curl が HTTP form encoding を一度だけ行います。JSON クライアントは従来の percent-encoded CryptoJS 値も送れます。

```sh
encrypt_password() {
  printf %s "$1" | openssl enc -aes-256-cbc -salt -a -A -md md5 \
    -pass pass:nanokvm-sipeed-2024
}
```

ログインして token を取得する例です（token の取り出しに `jq` を使用）。

```sh
BASE='https://kvm.example.com'
TOKEN=$(curl --fail --silent --show-error \
  -H 'X-NanoKVM-Return-Token: true' \
  --data-urlencode 'username=admin' \
  --data-urlencode "password=$(encrypt_password 'replace-with-password')" \
  "$BASE/api/auth/login" | jq -er '.data.token')
curl --fail --silent --show-error -H "Authorization: Bearer $TOKEN" "$BASE/api/auth/account"
```

管理者はユーザーを作成し、所有者以外のユーザー名変更とパスワードリセットを行えます。デバイス所有者は
自分のアカウントだけを名前変更できます。以下は所有者の token で既定の `admin` 所有者アカウントを名前変更する例です。

```sh
curl --fail --silent --show-error -X POST -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'username=operator' \
  --data-urlencode "password=$(encrypt_password 'operator-password')" \
  --data-urlencode 'role=user' "$BASE/api/auth/users"
curl --fail --silent --show-error -X POST -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "password=$(encrypt_password 'new-operator-password')" \
  "$BASE/api/auth/users/operator/password"
curl --fail --silent --show-error -X PUT -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'username=owner' "$BASE/api/auth/users/admin"
```

ログイン中の所有者を改名すると `$TOKEN` は直ちに無効になります。そのため、改名は例の最後に置いています。以後の API 呼び出しでは新しいユーザー名で再ログインしてください。

現在ログインしているユーザー自身のパスワード変更には、暗号化した `currentPassword` と `password` を `/api/auth/password` に送信します。以前の `{username, password}` 本文を送るクライアントは移行が必要で、旧形式は受け付けられません。

## コンパイルとデプロイ

注意: Linux オペレーティングシステム (x86-64) と Go 1.25 以降を使用してください。このビルドプロセスは ARM、Windows、macOS では互換性がありません。

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

## 手動更新

> ファイルのアップロードには SSH が必要です。Web 設定で有効にしてください: `設定 > SSH`

1. [GitHub](https://github.com/sipeed/NanoKVM/releases) から最新のアプリケーションをダウンロードします。
2. ダウンロードしたファイルを解凍し、解凍したフォルダーの名前を `kvmapp` に変更します。
3. NanoKVM 上の既存の `/kvmapp` ディレクトリをバックアップし、新しい `kvmapp` フォルダーに置き換えます。
4. NanoKVM で `/etc/init.d/S95nanokvm restart` を実行してサービスを再起動します。
