const ja = {
  translation: {
    head: {
      desktop: 'リモートデスクトップ',
      login: 'ログイン',
      changePassword: 'パスワード変更',
      terminal: 'ターミナル',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'ログイン',
      placeholderUsername: 'ユーザー名を入力してください',
      placeholderPassword: 'パスワードを入力してください',
      placeholderPassword2: 'パスワードをもう一度入力してください',
      noEmptyUsername: 'ユーザー名は空にできません',
      noEmptyPassword: 'パスワードは空にできません',
      noAccount: 'ユーザー情報の取得に失敗しました。ページを更新してもう一度お試しいただくか、パスワードをリセットしてください。',
      invalidUser: 'ユーザー名またはパスワードが正しくありません',
      error: '不明なエラー',
      changePassword: 'パスワード変更',
      changePasswordDesc: 'デバイスのセキュリティのために、パスワードを変更してください！',
      differentPassword: 'パスワードが一致しません',
      illegalUsername: 'ユーザー名に不正な文字が含まれています',
      illegalPassword: 'パスワードに不正な文字が含まれています',
      forgetPassword: 'パスワードを忘れた',
      ok: 'OK',
      cancel: 'キャンセル',
      loginButtonText: 'ログイン',
      tips: {
        reset1: 'パスワードをリセットするには、NanoKVM の BOOT ボタンを 10 秒間押し続けます。',
        reset2: '詳細な手順については、次のドキュメントを参照してください：',
        reset3: 'ウェブデフォルトアカウント：',
        reset4: 'SSH デフォルトアカウント：',
        change1: 'この操作により、以下のパスワードも更新されることに注意してください：',
        change2: 'ウェブログインパスワード',
        change3: 'システム root パスワード（SSH ログインパスワード）',
        change4: 'パスワードを忘れた場合は、NanoKVM の BOOT ボタンを長押ししてパスワードをリセットする必要があります。'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'NanoKVM の Wi-Fi を設定する',
      success: 'NanoKVM のネットワークステータスを確認するにはデバイスにアクセスしてください。',
      failed: '操作に失敗しました。もう一度お試しください。',
      invalidMode: '現在のモードではネットワーク設定はサポートされていません。デバイスで Wi-Fi 設定モードを有効にしてください。',
      confirmBtn: 'OK',
      finishBtn: '完了'
    },
    screen: {
      scale: '倍率',
      title: '画面',
      video: 'ビデオモード',
      videoDirectTips: 'このモードを使用するには「設定 - デバイス」で HTTPS を有効にしてください',
      resolution: '解像度',
      auto: '自動',
      autoTips:
        '特定の解像度で画面のちらつきやマウスカーソルのずれが発生する場合があります。リモートホストの解像度を調整するか、自動モードを無効にしてください。',
      fps: 'フレームレート',
      customizeFps: 'カスタマイズ',
      quality: '画質',
      qualityLossless: 'ロスレス',
      qualityHigh: '高',
      qualityMedium: '中',
      qualityLow: '低',
      frameDetect: 'フレーム差分検出',
      frameDetectTip: 'フレーム間の差異を計算し、リモートホストの画面が変更されない場合はビデオストリームの送信を停止します',
      resetHdmi: 'HDMI をリセット'
    },
    keyboard: {
      title: 'キーボード',
      paste: '貼り付け',
      tips: '標準的なキーボードの文字と記号のみをサポートしています',
      placeholder: '入力してください',
      submit: '送信',
      virtual: '仮想キーボード',
      shortcut: {
        title: 'ショートカット',
        custom: 'カスタム',
        capture: 'ショートカットをキャプチャするにはここをクリックしてください',
        clear: 'クリア',
        save: '保存',
        captureTips: 'システムレベルのキー（Windows キーなど）をキャプチャするには、全画面表示の権限が必要です。',
        enterFullScreen: '全画面モードに切り替えます。'
      },
      leaderKey: {
        title: 'リーダーキー',
        desc: 'ブラウザの制限を回避して、システムによってブロックされているショートカットキーをリモートホストに送信します。',
        howToUse: '使用方法',
        simultaneous: {
          title: '同時モード',
          desc1: 'リーダーキーを押したまま、ショートカットキーを押します。',
          desc2: '操作は直感的ですが、システムの使用状況により一部のショートカットキーが機能しない場合があります。'
        },
        sequential: {
          title: 'シーケンシャルモード',
          desc1: '【リーダーキー】をクリックして開始 →【ショートカットキー】を順にクリック →【リーダーキー】をクリックして終了します。',
          desc2: 'いくつかの手順が必要ですが、システムキーの競合を完全に回避します。'
        },
        enable: 'リーダーキーを有効化',
        tip: 'リーダーキーとして設定すると、このキーはショートカットキーをトリガーするためにのみ使用され、通常のキーとしては使用できなくなります。',
        placeholder: 'リーダーキーを押してください',
        shiftRight: '右 Shift',
        ctrlRight: '右 Ctrl',
        metaRight: '右 Win',
        submit: '送信',
        recorder: {
          rec: 'REC',
          activate: 'キーを有効にする',
          input: 'ショートカットキーを押してください...'
        }
      }
    },
    mouse: {
      title: 'マウス',
      cursor: 'ポインター形状',
      default: 'デフォルトポインター',
      pointer: 'ポインターカーソル',
      cell: 'セルポインター',
      text: 'テキストカーソル',
      grab: 'つかむポインター',
      hide: 'ポインターを非表示',
      mode: 'マウスモード',
      absolute: '絶対モード',
      relative: '相対モード',
      direction: 'ホイール方向',
      scrollUp: '上',
      scrollDown: '下',
      speed: 'ホイール速度',
      fast: '速い',
      slow: '遅い',
      requestPointer: '相対モードを使用中です。マウスポインターを取得するには、デスクトップをクリックしてください。',
      resetHid: 'HID をリセット',
      hidOnly: {
        title: 'HID-Only モード',
        desc: '使用中にマウスとキーボードが反応しなくなり、HID をリセットしても効果がない場合は、NanoKVM とデバイス間の互換性に問題がある可能性があります。互換性を向上させるために、HID-Only モードを有効にすることをお勧めします。',
        tip1: 'このモードを有効にすると仮想 USB ドライブと仮想ネットワークアダプターが無効になります。',
        tip2: 'このモードではイメージマウント機能は使用できません。',
        tip3: 'モードを切り替えると、NanoKVM は自動的に再起動します。',
        enable: 'HID-Only モードを有効化',
        disable: 'HID-Only モードを無効化'
      }
    },
    image: {
      title: 'イメージ',
      loading: '読み込み中',
      empty: 'イメージファイルがありません',
      mountMode: 'マウントモード',
      mountFailed: 'マウントに失敗しました',
      mountDesc: '一部のシステムでは、イメージをマウントする前にリモートホストで仮想ディスクをアンマウントする必要があります。',
      unmountFailed: 'アンマウントに失敗しました',
      unmountDesc: '一部のシステムでは、イメージをアンマウントする前にリモートホストから手動で取り出す必要があります。',
      refresh: 'イメージリストを更新',
      attention: '注意',
      deleteConfirm: 'このイメージを削除してもよろしいですか？',
      okBtn: 'はい',
      cancelBtn: 'いいえ',
      tips: {
        title: 'アップロード方法',
        usb1: 'NanoKVM を USB 経由でコンピュータに接続します；',
        usb2: '仮想ディスクがマウントされていることを確認します（設定 - 仮想ディスク）；',
        usb3: 'コンピュータ上で仮想ディスクを開き、イメージファイルを仮想ディスクのルートディレクトリにコピーします。',
        scp1: 'NanoKVM とコンピュータが同じローカルエリアネットワークに接続されていることを確認します；',
        scp2: 'コンピュータでターミナルを開き、SCP コマンドを使用してイメージファイルを NanoKVM の /data ディレクトリにアップロードします。',
        scp3: '例：scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'TF カード',
        tf1: 'この方法は Linux システムでサポートされています',
        tf2: 'NanoKVM から TF カードを取り出します（フルバージョンでは、まずケースを分解してください）；',
        tf3: 'TF カードをカードリーダーに挿入してコンピュータに接続します；',
        tf4: 'コンピューターから TF カードの /data ディレクトリにイメージファイルをコピーします；',
        tf5: 'TF カードを NanoKVM に挿入します。'
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
      nanokvm: 'NanoKVM ターミナル',
      serial: 'シリアルポートターミナル',
      serialPort: 'シリアルポート',
      serialPortPlaceholder: 'シリアルポートを入力してください',
      baudrate: 'ボーレート',
      confirm: 'OK'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'コマンドを送信中...',
      sent: 'コマンドを送信しました',
      input: 'MAC アドレスを入力してください',
      ok: 'OK'
    },
    download: {
      title: 'イメージダウンローダー',
      input: 'イメージのダウンロードアドレスを入力してください',
      ok: 'OK',
      disabled: '/data パーティションは読み取り専用であり、イメージのダウンロードには使用できません'
    },
    power: {
      title: '電源',
      showConfirm: '確認メッセージ',
      showConfirmTip: '電源操作の確認メッセージを表示する',
      reset: 'リセット',
      power: '電源',
      powerShort: '電源（クリック）',
      powerLong: '電源（長押し）',
      resetConfirm: '再起動を実行しますか？',
      powerConfirm: '電源操作を実行しますか？',
      okBtn: 'はい',
      cancelBtn: 'いいえ'
    },
    settings: {
      title: '設定',
      about: {
        title: 'NanoKVM について',
        information: '情報',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'アプリケーションバージョン',
        applicationTip: 'NanoKVM ウェブアプリケーションバージョン',
        image: 'イメージバージョン',
        imageTip: 'NanoKVM システムイメージバージョン',
        deviceKey: 'デバイスキー',
        community: 'コミュニティ',
        hostname: 'ホスト名',
        hostnameUpdated: 'ホスト名は正常に変更され、再起動後に有効になります'
      },
      appearance: {
        title: '外観',
        display: '表示',
        language: '言語',
        languageDesc: 'インターフェース言語の選択',
        webTitle: 'ウェブページタイトル',
        webTitleDesc: 'ウェブページタイトルのカスタマイズ',
        menuBar: {
          title: 'メニューバー',
          mode: '表示モード',
          modeDesc: 'メニューバーの画面表示方法',
          modeOff: '閉じる',
          modeAuto: '自動非表示',
          modeAlways: '常に表示',
          icons: 'メニューアイコン',
          iconsDesc: 'メニューバーでのサブメニューアイコンの表示'
        }
      },
      device: {
        title: 'デバイス',
        oled: {
          title: 'OLED',
          description: 'OLED 画面の自動スリープ時間',
          0: '無効',
          15: '15秒',
          30: '30秒',
          60: '1分',
          180: '3分',
          300: '5分',
          600: '10分',
          1800: '30分',
          3600: '1時間'
        },
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi 設定',
          apMode: 'AP モードが有効になりました。QR コードをスキャンして Wi-Fi に接続してください。',
          connect: 'Wi-Fi に接続',
          connectDesc1: 'SSID とパスワードを入力してください',
          connectDesc2: 'このネットワークに接続するためのパスワードを入力してください',
          disconnect: 'このネットワーク接続を切断しますか？',
          failed: '接続に失敗しました。もう一度お試しください。',
          ssid: 'SSID',
          password: 'パスワード',
          joinBtn: '接続',
          confirmBtn: 'OK',
          cancelBtn: 'キャンセル'
        },
        ssh: {
          description: 'SSH リモートアクセスを有効にする',
          tip: '使用する前に必ず強力なパスワードを設定してください（アカウント - パスワードの変更）'
        },
        tls: {
          description: 'HTTPS プロトコルを有効にする',
          tip: '注意：HTTPS を使用すると、特に MJPEG ビデオモードで遅延が増加する可能性があります。'
        },
        advanced: '詳細設定',
        swap: {
          disable: '無効',
          description: 'スワップファイルのサイズを設定する',
          tip: 'この機能を有効にすると、SD カードの寿命が短くなる可能性があります！'
        },
        mouseJiggler: {
          title: 'マウスジグラー',
          description: 'リモートホストの休止を防ぐ',
          disable: '閉じる',
          absolute: '絶対モード',
          relative: '相対モード'
        },
        mdns: {
          description: 'mDNS 検出サービスを有効にする',
          tip: 'この機能を使用していない場合は、オフにすることをお勧めします'
        },
        hdmi: {
          description: 'HDMI/モニター 出力機能を有効にする'
        },
        autostart: {
          title: '自動起動スクリプト設定',
          description: 'NanoKVM の起動時に自動的に実行されるスクリプトファイルを管理します',
          new: '新しいスクリプトを作成する',
          deleteConfirm: 'このファイルを削除してもよろしいですか？',
          yes: 'はい',
          no: 'いいえ',
          scriptName: '自動起動スクリプト名',
          scriptContent: '自動起動スクリプト内容',
          settings: '設定'
        },
        hidOnly: 'HID-Only モード',
        hidOnlyDesc: 'このモードでは仮想デバイスはマウントされなくなり、基本的な HID 制御機能のみが保持されます。',
        disk: '仮想ディスク',
        diskDesc: 'リモートホストに仮想 USB ドライブをマウントする',
        network: '仮想ネットワークカード',
        networkDesc: 'リモートホストに仮想ネットワークカードをマウントする',
        okBtn: 'はい',
        cancelBtn: 'いいえ'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'メモリ最適化',
          tip: "メモリ使用量が上限を超えると、メモリ解放のためにより積極的にガベージコレクションが実行されます。Tailscale を使用する場合は 50MB に設定することをお勧めします。この設定を有効にするには Tailscale を再起動する必要があります。",
        },
        swap: {
          title: 'スワップメモリ',
          tip: 'メモリ最適化を有効にしても問題が解決しない場合は、スワップメモリ​​を有効にしてみてください。有効にするとスワップファイルが 256MB に設定されます。このサイズは「設定 - デバイス」で変更できます。'
        },
        restart: 'Tailscale を再起動しますか？',
        stop: 'Tailscale を停止しますか？',
        stopDesc: 'Tailscale からログアウトし、起動時の自動実行を無効にします。',
        loading: '読み込み中...',
        notInstall: 'Tailscale が見つかりません。インストールしてください。',
        install: 'インストール',
        installing: 'インストール中',
        failed: 'インストールに失敗しました',
        retry: 'ページを更新してもう一度お試しいただくか、手動でインストールしてください',
        download: 'ダウンロードして',
        package: 'インストールパッケージを',
        unzip: '解凍してください',
        upTailscale: 'tailscale ファイルを NanoKVM の /usr/bin ディレクトリにアップロードします',
        upTailscaled: 'tailscaled ファイルを NanoKVM の /usr/sbin ディレクトリにアップロードします',
        refresh: 'ページを更新します',
        notRunning: 'Tailscale はまだ実行されていません。起動操作を実行してください',
        run: '起動',
        notLogin: 'このデバイスはまだバインドされていません。ログインしてデバイスをアカウントにバインドしてください。',
        urlPeriod: 'この URL は 10 分間有効です',
        login: 'ログイン',
        loginSuccess: 'ログイン成功',
        enable: 'Tailscale を有効化',
        deviceName: 'デバイス名',
        deviceIP: 'デバイスアドレス',
        account: 'アカウント',
        logout: 'ログアウト',
        logoutDesc: 'ログアウトしてもよろしいですか？',
        uninstall: 'Tailscale をアンインストール',
        uninstallDesc: 'Tailscale をアンインストールしてもよろしいですか？',
        reboot: '再起動',
        rebootDesc: 'NanoKVM を再起動してもよろしいですか？',
        okBtn: 'はい',
        cancelBtn: 'いいえ'
      },
      update: {
        title: 'アップデート',
        queryFailed: 'バージョン番号の取得に失敗しました',
        updateFailed: 'アップデートに失敗しました。もう一度お試しください。',
        isLatest: 'すでに最新バージョンです。',
        available: '新しいバージョンが利用可能です。アップデートしてもよろしいですか？',
        updating: 'アップデート中、お待ちください...',
        confirm: 'はい',
        cancel: 'いいえ',
        preview: 'プレビューアップデート',
        previewDesc: '新機能や改善をいち早く体験する',
        previewTip: 'プレビューアップデートには不安定な部分や不完全な機能が含まれる場合があります！',
        offline: {
          title: 'オフラインアップデート',
          desc: 'ローカルインストールパッケージでアップデートする',
          upload: 'アップロード',
          invalidName: 'ファイル名の形式が正しくありません。GitHub リリースページにアクセスしてインストールパッケージをダウンロードしてください。',
          updateFailed: 'アップデートに失敗しました。もう一度お試しください。'
        }
      },
      account: {
        title: 'アカウント',
        webAccount: 'ウェブアカウント名',
        password: 'パスワード',
        updateBtn: '変更',
        logoutBtn: 'ログアウト',
        logoutDesc: 'ログアウトしてもよろしいですか？',
        confirm: 'はい',
        cancel: 'いいえ'
      }
    },
    error: {
      title: 'エラーが発生しました',
      refresh: '更新'
    },
    fullscreen: {
      toggle: '全画面表示切り替え'
    },
    menu: {
      collapse: 'メニューを折りたたむ',
      expand: 'メニューを展開する'
    }
  }
};

export default ja;
