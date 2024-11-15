const ja = {
  translation: {
    language: '言語',
    changePassword: 'パスワード変更',
    logout: 'ログアウト',
    settings: '設定',
    showMouse: 'マウスを表示',
    hideMouse: 'マウスを非表示',
    power: '電源',
    reset: 'リセット',
    powerShort: '電源（短いクリック）',
    powerLong: '電源（長いクリック）',
    hddLed: 'HDD LED',
    checkLibFailed: 'ランタイムライブラリのチェックに失敗しました。再試行してください。',
    updateLibFailed: 'ランタイムライブラリの更新に失敗しました。再試行してください。',
    updatingLib: 'ランタイムライブラリを更新中です。更新後にページをリフレッシュしてください。',
    checkForUpdate: 'アップデートの確認',
    head: {
      desktop: 'リモートデスクトップ',
      login: 'ログイン',
      changePassword: 'パスワード変更',
      terminal: 'ターミナル'
    },
    auth: {
      login: 'ログイン',
      placeholderUsername: 'ユーザー名を入力してください',
      placeholderPassword: 'パスワードを入力してください',
      placeholderPassword2: '再度パスワードを入力してください',
      noEmptyUsername: 'ユーザー名は空にできません',
      noEmptyPassword: 'パスワードは空にできません',
      noAccount:
        'ユーザー情報の取得に失敗しました。ウェブページをリフレッシュするか、パスワードをリセットしてください。',
      invalidUser: '無効なユーザー名またはパスワード',
      error: '予期しないエラー',
      changePassword: 'パスワード変更',
      changePasswordDesc:
        'デバイスのセキュリティのために、ウェブログインのパスワードを変更してください。',
      differentPassword: 'パスワードが一致しません',
      illegalUsername: 'ユーザー名に不正な文字が含まれています',
      illegalPassword: 'パスワードに不正な文字が含まれています',
      forgetPassword: 'パスワードを忘れた',
      resetPassword: 'パスワードリセット',
      reset1: 'パスワードを忘れた場合は、以下の手順に従ってリセットしてください：',
      reset2: '1. SSHを介してNanoKVMデバイスにログインします。',
      reset3: '2. デバイス内のファイルを削除します：',
      reset4: '3. デフォルトのアカウントでログインします：',
      ok: 'OK',
      cancel: 'キャンセル',
      loginButtonText: 'ログイン'
    },
    screen: {
      video: 'ビデオモード',
      resolution: '解像度',
      auto: '自動',
      autoTips:
        '特定の解像度で画面のティアリングやマウスのオフセットが発生する可能性があります。リモートホストの解像度を調整するか、自動モードを無効にすることを検討してください。',
      fps: 'FPS',
      customizeFps: 'カスタマイズ',
      quality: '品質',
      qualityLossless: 'ロスレス',
      qualityHigh: '高い',
      qualityMedium: '中くらい',
      qualityLow: '低い',
      frameDetect: 'フレーム検出',
      frameDetectTip:
        'フレーム間の差を計算します。リモートホストの画面で変更が検出されない場合、ビデオストリームの送信を停止します。'
    },
    keyboard: {
      paste: '貼り付け',
      tips: '標準的なキーボードの文字と記号のみがサポートされています',
      placeholder: '入力してください',
      submit: '送信',
      virtual: 'キーボード'
    },
    mouse: {
      default: 'デフォルトカーソル',
      pointer: 'ポインターカーソル',
      cell: 'セルカーソル',
      text: 'テキストカーソル',
      grab: 'つかむカーソル',
      hide: 'カーソルを非表示',
      mode: 'マウスモード',
      absolute: '絶対モード',
      relative: '相対モード',
      requestPointer:
        '相対モードを使用中です。デスクトップをクリックしてマウスポインタを取得してください。',
      resetHid: 'HIDをリセット'
    },
    image: {
      title: 'イメージ',
      loading: '読み込み中...',
      empty: '見つかりませんでした',
      mountFailed: 'マウントに失敗しました',
      mountDesc:
        '一部のシステムでは、イメージをマウントする前にリモートホストで仮想ディスクをアンマウントする必要があります。',
      tips: {
        title: 'アップロード方法',
        usb1: 'NanoKVMをUSB経由でコンピュータに接続します。',
        usb2: '仮想ディスクがマウントされていることを確認します（設定 - 仮想ディスク）。',
        usb3: 'コンピュータ上で仮想ディスクを開き、イメージファイルを仮想ディスクのルートディレクトリにコピーします。',
        scp1: 'NanoKVMとコンピュータが同じローカルネットワークに接続されていることを確認します。',
        scp2: 'コンピュータのターミナルを開き、SCPコマンドを使用してイメージファイルをNanoKVMの/dataディレクトリにアップロードします。',
        scp3: '例: scp あなたのイメージパス root@あなたのナノKVMのIP:/data',
        tfCard: 'TFカード',
        tf1: 'この方法はLinuxシステムでサポートされています',
        tf2: 'NanoKVMからTFカードを取り出します（フルバージョンの場合、まずケースを分解してください）。',
        tf3: 'TFカードをカードリーダーに挿入し、コンピュータに接続します。',
        tf4: 'TFカードの/dataディレクトリにイメージファイルをコピーします。',
        tf5: 'TFカードをNanoKVMに挿入します。'
      }
    },
    script: {
      title: 'スクリプト',
      upload: 'アップロード',
      run: '実行',
      runBackground: 'バックグラウンドで実行',
      runFailed: '実行に失敗しました',
      attention: '注意',
      delDesc: 'このファイルを削除してもよろしいですか？',
      confirm: 'はい',
      cancel: 'いいえ',
      delete: '削除',
      close: '閉じる'
    },
    terminal: {
      title: 'ターミナル',
      nanokvm: 'NanoKVMターミナル',
      serial: 'シリアルポートターミナル',
      serialPort: 'シリアルポート',
      serialPortPlaceholder: 'シリアルポートを入力してください',
      baudrate: 'ボーレート',
      confirm: 'OK'
    },
    wol: {
      sending: 'コマンドを送信中...',
      sent: 'コマンドを送信しました',
      input: 'MACを入力してください',
      ok: 'OK'
    },
    about: {
      title: 'NanoKVMについて',
      information: '情報',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'アプリケーションバージョン',
      image: 'イメージバージョン',
      firmware: 'ファームウェアバージョン',
      deviceKey: 'デバイスキー',
      queryFailed: 'クエリに失敗しました',
      community: 'コミュニティ'
    },
    update: {
      title: 'アップデートの確認',
      queryFailed: 'バージョンの取得に失敗しました',
      updateFailed: '更新に失敗しました。再試行してください。',
      isLatest: '最新のバージョンを既に持っています。',
      available: 'アップデートが利用可能です。更新してもよろしいですか？',
      updating: '更新を開始しました。お待ちください...',
      confirm: '確認',
      cancel: 'キャンセル'
    },
    virtualDevice: {
      network: '仮想ネットワーク',
      disk: '仮想ディスク'
    },
    tailscale: {
      loading: '読み込み中...',
      notInstall: 'Tailscaleが見つかりません！インストールしてください。',
      install: 'インストール',
      installing: 'インストール中',
      failed: 'インストールに失敗しました',
      retry: 'ページをリフレッシュして再試行してください。または手動でインストールしてください',
      download: 'インストールパッケージをダウンロードして',
      package: '解凍してください',
      upTailscale: 'tailscaleをNanoKVMのディレクトリ/usr/bin/にアップロードしてください',
      upTailscaled: 'tailscaledをNanoKVMのディレクトリ/usr/sbin/にアップロードしてください',
      refresh: '現在のページをリフレッシュします',
      notLogin:
        'デバイスはまだバインドされていません。ログインしてこのデバイスをアカウントにバインドしてください。',
      urlPeriod: 'このURLは10分間有効です',
      login: 'ログイン',
      loginSuccess: 'ログイン成功',
      enable: 'Tailscaleを有効化',
      deviceName: 'デバイス名',
      deviceIP: 'デバイスIP',
      account: 'アカウント',
      logout: 'ログアウト',
      logout2: 'ログアウトしてもよろしいですか？'
    }
  }
};

export default ja;
