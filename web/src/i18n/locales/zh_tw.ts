const zh_tw = {
  translation: {
    head: {
      desktop: '遠端桌面',
      login: '登入',
      changePassword: '更改密碼',
      terminal: '終端機',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: '登入',
      placeholderUsername: '使用者名稱',
      placeholderPassword: '密碼',
      placeholderPassword2: '請再次輸入密碼',
      noEmptyUsername: '使用者名稱不能為空',
      noEmptyPassword: '密碼不能為空',
      noAccount: '取得使用者資訊失敗，請重新整理網頁或重設密碼',
      invalidUser: '使用者名稱或密碼錯誤',
      error: '非預期性錯誤',
      changePassword: '更改密碼',
      changePasswordDesc: '為了您的裝置安全，請修改登入密碼。',
      differentPassword: '密碼不一致',
      illegalUsername: '使用者名稱包含非法字元',
      illegalPassword: '密碼包含非法字元',
      forgetPassword: '忘記密碼',
      ok: '確定',
      cancel: '取消',
      loginButtonText: '登入',
      tips: {
        reset1: '长按 NanoKVM 上的 BOOT 按键 10 秒钟来重置帐号。',
        reset2: '详细操作步骤可参考此文档：',
        reset3: '网页默认帐号：',
        reset4: 'SSH 默认帐号：',
        change1: '请注意，此操作将同时更新以下密码：',
        change2: '网页的登录密码',
        change3: '系统 root 用户的密码（SSH 登录密码）',
        change4: '如果您忘记了密码，需要长按 NanoKVM 上的 BOOT 按键来重置密码。'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: '配置 NanoKVM Wi-Fi 信息',
      success: '请检查 NanoKVM 的网络状态，并访问新的 IP 地址。',
      failed: '操作失败，请重试。',
      confirmBtn: '确定',
      finishBtn: '完成'
    },
    screen: {
      video: '影片模式',
      resolution: '解析度',
      auto: '自動',
      autoTips:
        '在特定解析度下可能會出現畫面撕裂或滑鼠偏移的情況。考慮調整遠端主機的解析度或停用自動模式。',
      fps: '影格速率',
      customizeFps: '自定義',
      quality: '品質',
      qualityLossless: '無損',
      qualityHigh: '高',
      qualityMedium: '中',
      qualityLow: '低',
      frameDetect: '影格檢測',
      frameDetectTip: '計算影格之間的差異。當遠端主機畫面未偵測到任何變更時，停止傳輸視訊串流。'
    },
    keyboard: {
      paste: '貼上',
      tips: '僅支援標準鍵盤字母和符號',
      placeholder: '請輸入內容',
      submit: '送出',
      virtual: '虛擬鍵盤'
    },
    mouse: {
      default: '預設游標',
      pointer: '懸浮游標',
      cell: '儲存格游標',
      text: '文字游標',
      grab: '抓取游標',
      hide: '隱藏游標',
      mode: '滑鼠模式',
      absolute: '絕對模式',
      relative: '相對模式',
      requestPointer: '使用相對模式。請按一下桌面以取得滑鼠游標。',
      resetHid: '重設 HID'
    },
    image: {
      title: '映像',
      loading: '載入中...',
      empty: '未找到任何內容',
      mountFailed: '掛載失敗',
      mountDesc: '在某些系統中，在掛載映像之前需要中斷遠端主機上的虛擬磁碟。',
      tips: {
        title: '如何上傳',
        usb1: '透過 USB 將 NanoKVM 連接到您的電腦。',
        usb2: '確保已安裝虛擬磁碟（設定 - 虛擬磁碟）。',
        usb3: '開啟電腦上的虛擬磁碟，將映像檔案複製到虛擬磁碟的根目錄下。',
        scp1: '確保 NanoKVM 和您的電腦位於同一區域網路。',
        scp2: '開啟電腦上的終端機，使用 SCP 指令將映像檔案上傳到 NanoKVM 的 /data 目錄下。',
        scp3: '範例：scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'microSD 卡',
        tf1: '此方法適用於 Linux 系統',
        tf2: '從 NanoKVM 取得 microSD 卡（FULL 版本請先拆開外殼）。',
        tf3: '將 microSD 卡插入讀卡機並連接至電腦。',
        tf4: '將映像檔案複製到 microSD 卡的 /data 目錄下。',
        tf5: '將 microSD 卡重新插入 NanoKVM。'
      }
    },
    script: {
      title: '腳本',
      upload: '上傳',
      run: '執行',
      runBackground: '背景執行',
      runFailed: '執行失敗',
      attention: '注意',
      delDesc: '確定刪除該檔案？',
      confirm: '確定',
      cancel: '取消',
      delete: '刪除',
      close: '關閉'
    },
    terminal: {
      title: '終端機',
      nanokvm: 'NanoKVM 終端機',
      serial: 'Serial Port 終端機',
      serialPort: 'Serial Port',
      serialPortPlaceholder: '請輸入 Serial Port',
      baudrate: 'Baud rate',
      confirm: '確定'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: '發送指令中...',
      sent: '指令已發送',
      input: '請輸入 MAC 位址',
      ok: '確定'
    },
    power: {
      title: '電源',
      reset: '重新啟動',
      power: '電源',
      powerShort: '電源 (短按)',
      powerLong: '電源 (長按)'
    },
    settings: {
      title: '设置',
      about: {
        title: '關於 NanoKVM',
        information: '資訊',
        ip: 'IP',
        mdns: 'mDNS',
        application: '應用程式版本',
        applicationTip: 'NanoKVM 网页应用版本',
        image: '映像版本',
        imageTip: 'NanoKVM 系统镜像版本',
        deviceKey: '設備序號',
        community: '社群'
      },
      appearance: {
        title: '外观',
        display: '显示',
        language: '语言',
        menuBar: '菜单栏',
        menuBarDesc: '是否在菜单栏中显示图标'
      },
      device: {
        title: '设备',
        oled: {
          title: 'OLED',
          description: '设置 OLED 屏幕自动休眠时间',
          0: '永不',
          15: '15秒',
          30: '30秒',
          60: '1分钟',
          180: '3分钟',
          300: '5分钟',
          600: '10分钟',
          1800: '30分钟',
          3600: '1小时'
        },
        wifi: {
          title: 'Wi-Fi',
          description: '配置 Wi-Fi 信息',
          setBtn: '设置'
        },
        disk: '虚拟U盘',
        diskDesc: '在远程主机中挂载虚拟U盘',
        network: '虚拟网卡',
        networkDesc: '在远程主机中挂载虚拟网卡',
        memory: {
          title: '内存优化',
          tip: '当内存占用超过限制时，会更积极地执行垃圾回收来尝试释放内存',
          disable: '关闭'
        }
      },
      tailscale: {
        title: 'Tailscale',
        loading: '載入中...',
        notInstall: 'Tailscale 未找到！請先安裝。',
        install: '安裝',
        installing: '安裝中',
        failed: '安裝失敗',
        retry: '請重新整理並重試。或嘗試手動安裝',
        download: '下載',
        package: '安裝包',
        unzip: '並解壓縮它',
        upTailscale: '將 tailscale 上傳到 NanoKVM 目錄 /usr/bin/',
        upTailscaled: '將 tailscale 上傳到 NanoKVM 目錄 /usr/sbin/',
        refresh: '重新整理頁面',
        notLogin: '設備尚未綁定。請登入並將該裝置綁定到您的帳戶。',
        urlPeriod: '此網址有效期限為 10 分鐘',
        login: '登入',
        loginSuccess: '登入成功',
        enable: '啟用 Tailscale',
        deviceName: '裝置名稱',
        deviceIP: '裝置 IP',
        account: '帳號',
        logout: '登出',
        logout2: '確認登出?'
      },
      update: {
        title: '檢查更新',
        queryFailed: '取得版本失敗',
        updateFailed: '更新失敗。請重試。',
        isLatest: '您已經擁有最新版本。',
        available: '有可用更新。確定要更新嗎？',
        updating: '正在更新。請稍等...',
        confirm: '確定',
        cancel: '取消'
      },
      account: {
        title: '帐号',
        webAccount: '网页帐号',
        password: '密码',
        updateBtn: '修改',
        logoutBtn: '退出'
      }
    }
  }
};

export default zh_tw;
