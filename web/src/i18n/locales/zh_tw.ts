const zh_tw = {
  translation: {
    head: {
      desktop: '遠端桌面',
      login: '登入',
      changePassword: '更改密碼',
      terminal: '終端機',
      wifi: 'Wi-Fi',
      storage: '映像檔掛載 / 檔案共享'
    },
    auth: {
      login: '登入',
      placeholderUsername: '使用者名稱',
      placeholderPassword: '密碼',
      placeholderPassword2: '請再次輸入密碼',
      noEmptyUsername: '使用者名稱不能為空',
      noEmptyPassword: '密碼不能為空',
      noAccount: '找不到使用者，請重新整理網頁或重設密碼',
      invalidUser: '使用者名稱或密碼錯誤',
      locked: '登入次數過多，請稍後重試',
      globalLocked: '系統受保護，請稍後重試',
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
        reset1: '長按 NanoKVM 上的 BOOT 按鍵 10 秒鐘來重設帳號。',
        reset2: '詳細操作方法可參閱本文件：',
        reset3: '網頁預設帳號：',
        reset4: 'SSH 預設帳號：',
        change1: '請注意，此操作將同時更新下列密碼：',
        change2: '網頁登入密碼',
        change3: 'root user 密碼 (SSH登入密碼)',
        change4: '如果您忘記密碼，需要長按 NanoKVM 上的 BOOT 按鍵來重設密碼。'
      },
      placeholderCurrentPassword: '請輸入目前密碼',
      passwordLength: '密碼長度必須為 8 到 72 個字元',
      invalidCurrentPassword: '目前密碼錯誤'
    },
    wifi: {
      title: 'Wi-Fi',
      description: '設定 NanoKVM Wi-Fi',
      success: '請檢查 NanoKVM 的網路狀態，並存取新的 IP 位址。',
      failed: '操作失敗，請重試。',
      invalidMode: '目前模式不支援設定網路。請先前往裝置啟用 Wi-Fi 配置模式。',
      confirmBtn: '確定',
      finishBtn: '完成',
      ap: {
        authTitle: '需要身份驗證',
        authDescription: '請輸入 AP 密碼繼續',
        authFailed: 'AP 密碼無效',
        passPlaceholder: 'AP 密碼',
        verifyBtn: '驗證'
      }
    },
    desktop: {
      readOnly: '唯讀',
      readOnlyTip:
        '此帳號沒有鍵盤與滑鼠操作權限，無法向目標機發送鍵盤與滑鼠事件，主控台僅顯示畫面。'
    },
    screen: {
      scale: '缩放',
      title: '螢幕',
      video: '編碼格式',
      videoDirectTips: '本模式需先啟用 HTTPS，請前往「設定 -> 設備」中開啟',
      resolution: '解析度',
      controlRegion: {
        title: '滑鼠校正',
        description:
          '當受控裝置使用非 16:9 解析度，且游標在水平或垂直方向出現偏移時，請使用此設定。',
        off: '關閉',
        auto: '自動',
        autoWarning: '當使用者應用程式使用全黑背景時，校正可能會失敗。',
        manual: '手動',
        selectedResolution: '框選解析度',
        unused: '未使用',
        originalResolution: '原始解析度',
        selectResolution: '選擇原始解析度',
        addResolution: '新增自訂解析度',
        add: '新增',
        duplicateResolution: '此解析度已存在。',
        width: '寬度',
        height: '高度',
        apply: '計算並套用',
        invalidResolution: '請在影片準備完成後輸入有效的原始解析度。',
        select: '選擇區域',
        clear: '恢復自動偵測',
        saveFailed: '無法儲存輸入區域。',
        tooSmall: '所選區域太小。',
        previewUnavailable: '無法預覽',
        clearConfirm: '要恢復自動黑邊偵測嗎？',
        dragHint: '拖曳以選擇遠端桌面區域',
        finish: '完成',
        confirm: '確認',
        cancel: '取消'
      },
      auto: '自動',
      autoTips:
        '在某些特定解析度下可能會出現畫面撕裂或滑鼠偏移的情況。請調整遠端主機的解析度或停用自動模式。',
      fps: '更新頻率',
      customizeFps: '自定義',
      quality: '品質',
      qualityLossless: '無損',
      qualityHigh: '高',
      qualityMedium: '中',
      qualityLow: '低',
      frameDetect: '影格檢測',
      frameDetectTip: '計算影格之間的差異。當遠端主機畫面未偵測到任何變更時，停止視訊傳輸串流。',
      resetHdmi: '重置 HDMI',
      mixedH264: {
        title: 'H.264 串流衝突',
        description:
          '偵測到 H.264 Direct 和 H.264 WebRTC 同時使用，可能導致畫面撕裂或影片損壞。請只保留一種 H.264 模式。'
      },
      webrtcConnectionFailed: {
        title: 'WebRTC 連線失敗',
        description: '請檢查網路連線或切換影片模式。'
      },
      captureStatus: {
        hdmiError: 'HDMI 畫面異常',
        unsupportedResolution: '目前解析度不支援',
        retrieving: '正在取得畫面...',
        changingResolution: '正在切換解析度...',
        updateFailed: '畫面暫時無法更新',
        videoError: '影片顯示異常',
        noHdmi: '未偵測到 HDMI 訊號',
        unavailable: '畫面暫時無法顯示'
      }
    },
    keyboard: {
      title: '鍵盤',
      paste: '貼上',
      tips: '僅支援標準鍵盤的字母和符號',
      placeholder: '請輸入內容',
      submit: '送出',
      virtual: '虛擬鍵盤',
      readClipboard: '從剪貼簿讀取',
      clipboardPermissionDenied: '剪貼簿權限被拒絕。請允許您的瀏覽器存取剪貼簿。',
      clipboardReadError: '無法讀取剪貼簿',
      dropdownEnglish: '英語',
      dropdownGerman: '德語',
      dropdownFrench: '法語',
      dropdownRussian: '俄語',
      shortcut: {
        title: '快捷鍵',
        custom: '自定義',
        capture: '點選此處錄製快捷鍵',
        clear: '清空',
        save: '儲存',
        captureTips: '擷取系統級按鍵（如 Windows 鍵）需要全螢幕權限。',
        enterFullScreen: '切換全螢幕模式。'
      },
      leaderKey: {
        title: '引導鍵',
        desc: '繞過瀏覽器限制並將系統捷徑直接傳送到遠端主機。',
        howToUse: '如何使用',
        simultaneous: {
          title: '同步模式',
          desc1: '按住引導鍵不放，同時按下目標快捷鍵。',
          desc2: '直觀，但可能與系統快速鍵衝突。'
        },
        sequential: {
          title: '順序模式',
          desc1: '點擊引導鍵開始 → 依序點擊快捷鍵 → 再次點擊引導鍵結束。',
          desc2: '需要更多步驟，但完全避免了系統衝突。'
        },
        enable: '啟用引導鍵',
        tip: '設為引導鍵後，該按鍵將僅用於觸發快捷鍵，不再作為普通按鍵使用。',
        placeholder: '請按下引導鍵',
        shiftRight: '右 Shift',
        ctrlRight: '右 Ctrl',
        metaRight: '右 Win',
        submit: '送出',
        recorder: {
          rec: '記錄',
          activate: '啟用按鍵',
          input: '請按快捷鍵...'
        }
      }
    },
    mouse: {
      title: '滑鼠',
      cursor: '游標樣式',
      default: '預設游標',
      pointer: '懸浮游標',
      cell: '儲存格游標',
      text: '文字游標',
      grab: '抓取游標',
      hide: '隱藏游標',
      mode: '滑鼠模式',
      absolute: '絕對模式',
      relative: '相對模式',
      direction: '滾輪方向',
      scrollUp: '向上',
      scrollDown: '向下',
      speed: '滾輪速度',
      fast: '快',
      slow: '慢',
      requestPointer: '正在使用滑鼠相對模式。請按一下桌面以取得滑鼠游標。',
      resetHid: '重設 HID',
      hidOnly: {
        title: 'HID-Only 模式',
        desc: '如果您的滑鼠和鍵盤沒有反應，且重設 HID 無效，可能是 NanoKVM 與您的裝置間有相容性問題。請嘗試啟用 HID-Only 模式以獲得更好的相容性。',
        tip1: '啟用 HID-Only 模式將會停用虛擬隨身碟和虛擬網卡的功能',
        tip2: '在 HID-Only 模式下，映像檔掛載功能將被停用',
        tip3: 'NanoKVM 將在切換模式後自動重新啟動',
        enable: '啟用 HID-Only 模式',
        disable: '停用 HID-Only 模式'
      }
    },
    storage: {
      title: '映像檔掛載 / 檔案共享',
      empty: '還沒有映像檔。可以上傳 ISO/IMG，也可以讓受控裝置拷到這張磁碟上。',
      notAttached: '尚未裝載任何媒體',
      attached: '已裝載：{{name}}',
      eject: '彈出',
      mount: '裝載',
      mountMode: '裝載模式',
      mountModeDisk: '磁碟模式',
      mountModeCdrom: '光碟模式',
      openManager: '開啟檔案管理員',
      refresh: '重新整理',
      delete: '刪除',
      deleteTitle: '刪除媒體',
      deleteConfirm: '確定刪除 {{name}}？裡面的檔案會一起遺失。',
      downloadImage: '下載映像檔',
      typePartition: '共享檔案',
      volumeLabel: '可移除磁碟',
      groups: {
        share: '檔案共享',
        images: '映像檔'
      },
      failed: '操作失敗',
      hidOnly: 'HID-Only 模式：虛擬隨身碟無法使用',
      disabled: '虛擬隨身碟未啟用（設定 - 設備）',
      force: {
        title: '強制收回媒體？',
        desc: '受控裝置還掛著這個媒體。強制收回會讓 USB 裝置重新列舉，它還沒寫入磁碟的資料可能會遺失。',
        menuHint: '受控裝置正在使用該媒體，請到檔案管理員頁面強制收回。'
      },
      tips: {
        title: '如何上傳',
        usb1: '透過 USB 將 NanoKVM 連接到您的電腦。',
        usb2: '在本頁面以大容量儲存模式掛載共享檔案；',
        usb3: '開啟電腦上的虛擬磁碟，將映象檔案複製到虛擬磁碟的根目錄下。',
        usb4: '複製完成後退出磁碟，映像檔隨後會出現在清單中。',
        scp1: '確保 NanoKVM 和您的電腦位於同一區域網路。',
        scp2: '開啟電腦上的終端機，使用 SCP 指令將映像檔案上傳到 NanoKVM 的 /data 目錄下。',
        scp3: '範例：scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'microSD 卡',
        tf1: '此方法適用於 Linux 系統',
        tf2: '從 NanoKVM 拔出 microSD 卡（FULL 版本請先拆開外殼）。',
        tf3: '使用 USB 讀卡機將 microSD 卡連接至電腦。',
        tf4: '將映像檔複製到 microSD 卡的 /data 目錄下。',
        tf5: '將 microSD 卡重新插回 NanoKVM。'
      },
      job: {
        running: '正在處理 {{name}}'
      },
      enableDisk: {
        title: '啟用虛擬隨身碟？',
        desc: '裝載媒體需要虛擬隨身碟，目前它是關閉的。現在啟用？受控裝置的鍵盤與滑鼠會短暫中斷。',
        menuHint: '虛擬隨身碟未啟用，請到 設定 - 設備 開啟。',
        askDevice: '虛擬磁碟目前已關閉，需要擁有「設備設定」權限的帳號先將其開啟。'
      },
      add: {
        title: '新增媒體',
        upload: '上傳 ISO / IMG',
        fromUrl: '從 URL 下載',
        url: '映像檔網址',
        urlRequired: '請輸入映像檔網址',
        onlyImages: '只能掛載 .iso 和 .img 檔案',
        dropHint: '把 ISO / IMG 拖到這裡，或點擊選擇檔案',
        cdromOnlyIso: '光碟模式只能掛載 ISO 光碟映像檔',
        uploadFailed: '上傳失敗',
        downloadFailed: '下載失敗',
        uploading: '正在上傳 {{name}}',
        downloading: '正在下載 {{name}}',
        done: '{{name}} 已就緒',
        checksumFailed: '映像檔與 SHA-256 校驗值不符。',
        blocked: '受控裝置正在使用這張磁碟',
        copyHint: '也可以透過 SCP 把映像檔放進資料分割區，或在受控裝置上直接複製。'
      },
      files: {
        selectMedium: '選擇一個媒體，查看裡面的檔案。',
        reasonAttached: '該媒體正裝載給受控裝置使用。',
        reasonAttachedHint: '請先彈出：受控裝置必須釋放這張磁碟，裡面的檔案才能讀取。',
        reasonNotBrowsable: '這個媒體裡的檔案系統無法在網頁端開啟。',
        reasonNoLoop: '本機不支援掛載磁碟映像檔（核心未啟用 loop）。',
        reasonISOImage: 'ISO 光碟映像檔不支援在網頁端瀏覽目錄，映像檔本身仍可正常掛載給受控裝置',
        empty: '這個資料夾是空的',
        noMatch: '沒有符合的檔案',
        free: '剩餘 {{size}}',
        search: '搜尋目前資料夾',
        sort: {
          name: '名稱',
          size: '大小',
          type: '類型',
          asc: '升冪',
          desc: '降冪'
        },
        upload: '上傳檔案到媒體',
        deleteFolderTitle: '刪除資料夾',
        deleteFolderConfirm: '刪除資料夾 {{name}} 及其中的所有內容？此操作無法復原。',
        uploading: '正在上傳…',
        uploadFailed: '上傳失敗',
        download: '下載',
        delete: '刪除',
        deleteTitle: '刪除檔案',
        deleteConfirm: '確定從媒體中刪除 {{name}}？'
      },
      yes: '確定',
      no: '取消'
    },
    script: {
      title: '指令碼',
      upload: '上傳',
      run: '執行',
      runBackground: '背景執行',
      runFailed: '執行失敗',
      attention: '注意',
      delDesc: '確定要刪除該檔案嗎？',
      confirm: '確定',
      cancel: '取消',
      delete: '刪除',
      close: '關閉'
    },
    terminal: {
      title: '終端機',
      nanokvm: 'NanoKVM 終端機',
      serial: 'Serial Port 終端機',
      serialPort: '序列埠',
      serialPortPlaceholder: '請輸入 Serial Port',
      baudrate: '鮑率',
      parity: '同位檢查',
      parityNone: 'None',
      parityEven: '偶同位',
      parityOdd: '奇同位',
      flowControl: '流量控制',
      flowControlNone: 'None',
      flowControlSoft: '軟體',
      flowControlHard: '硬體',
      dataBits: '資料位元',
      stopBits: '停止位元',
      confirm: '確定'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: '發送指令中...',
      sent: '指令已發送',
      input: '請輸入 MAC 位址',
      ok: '確定'
    },
    download: {
      disabled:
        '共享資料夾正被受控裝置使用，/data 目前唯讀：無法寫入新映像檔，既有檔案仍可正常下載。',
      sha256: 'SHA-256（可選）',
      sha256Placeholder: '請輸入 64 位元 SHA-256 校驗和',
      invalidSHA256: 'SHA-256 必須是 64 位元十六進位字串',
      cancel: '取消',
      cancelFailed: '取消下載失敗'
    },
    power: {
      title: '電源控制',
      showConfirm: '顯示確認框',
      showConfirmTip: '電源操作需要二次確認',
      reset: '重新啟動',
      power: '電源',
      powerShort: '電源 (短按)',
      powerLong: '電源 (長按)',
      resetConfirm: '確認執行重新啟動的按鍵操作嗎？',
      powerConfirm: '確認執行電源的按鍵操作嗎？',
      okBtn: '確認',
      cancelBtn: '取消'
    },
    settings: {
      title: '設定',
      mcp: {
        title: 'MCP 服務',
        service: 'MCP 遠端控制',
        serviceDesc: '允許受信任的 MCP 用戶端控制鍵盤、滑鼠並擷取螢幕截圖',
        securityWarning:
          '任何持有此 API Key 的人都可以控制遠端主機並查看螢幕。請使用 HTTPS，且只在受信任的網路中啟用。',
        endpoint: '服務位址',
        apiKey: 'API Key',
        regenerateConfirmTitle: '重新產生 MCP API Key？',
        regenerateConfirmDesc: '目前的 Key 將立即失效。',
        enableConfirmTitle: '啟用外部 MCP 控制？',
        enableConfirmDesc: '啟用 MCP 將停止 PicoClaw，並關閉目前作用中的 PicoClaw 工作階段。',
        failed: 'MCP 操作失敗',
        copyFailed: '複製失敗，請手動複製。',
        okBtn: '確認',
        cancelBtn: '取消'
      },
      about: {
        title: '關於 NanoKVM',
        information: '資訊',
        ip: 'IP',
        mdns: 'mDNS',
        application: '應用程式版本',
        applicationTip: 'NanoKVM 網頁程式版本',
        image: '韌體版本',
        imageTip: 'NanoKVM 系统韌體版本',
        deviceKey: '設備序號',
        community: '社群',
        hostname: '主機名稱',
        hostnameUpdated: '已更新主機名稱. 請重新啟動以生效',
        ipType: {
          Wired: '有線',
          Wireless: '無線',
          Other: '其他'
        }
      },
      appearance: {
        title: '外觀',
        display: '顯示',
        language: '語言',
        languageDesc: '選擇介面語言',
        webTitle: '網頁標題',
        webTitleDesc: '自訂網頁標題',
        menuBar: {
          title: '選單列',
          mode: '顯示方式',
          modeDesc: '選單欄在螢幕上的顯示方式',
          modeOff: '關閉',
          modeAuto: '自動隱藏',
          modeAlways: '始終顯示',
          keyboardLedStatus: '鍵盤鎖定狀態指示燈',
          keyboardLedStatusDesc: '顯示遠端電腦的 Num Lock、Caps Lock 與 Scroll Lock 狀態',
          icons: '選單圖示',
          iconsDesc: '是否在選單欄中顯示子選單圖示'
        }
      },
      keyboardLedStatus: {
        groupLabel: '遠端鍵盤鎖定狀態',
        indicatorLabel: '{{label}}：{{state}}',
        numLock: '數字鎖定',
        numLockShort: '數',
        capsLock: '大寫鎖定',
        capsLockShort: '大',
        scrollLock: '捲動鎖定',
        scrollLockShort: '捲',
        on: '開啟',
        off: '關閉',
        unknown: '未知'
      },
      device: {
        title: '設備',
        oled: {
          title: 'OLED',
          description: '設定 OLED 螢幕自動睡眠時間',
          0: '永不',
          15: '15 秒',
          30: '30 秒',
          60: '1 分鐘',
          180: '3 分鐘',
          300: '5 分鐘',
          600: '10 分鐘',
          1800: '30 分鐘',
          3600: '1 小時'
        },
        ssh: {
          description: '啟用 SSH 伺服器',
          tip: '啟用前請務必設定強密碼（帳號 - 更改密碼）'
        },
        advanced: '進階設定',
        swap: {
          title: 'Swap',
          disable: '停用',
          description: '設定 Swap 檔大小',
          tip: '啟用此功能可能會減少SD卡的使用壽命！'
        },
        mouseJiggler: {
          title: '滑鼠抖動模式 (Mouse Jiggler)',
          description: '避免遠端主機進入休眠狀態',
          disable: '停用',
          absolute: '絕對模式',
          relative: '相對模式'
        },
        mdns: {
          description: '啟用 mDNS 發現服務',
          tip: '若無需求，建議關閉此功能'
        },
        hdmi: {
          description: '啟用 HDMI/螢幕 輸出',
          idleTimeoutTitle: '擷取閒置逾時',
          idleTimeoutDescription: '沒有活躍觀看者時，在指定時間後停止 HDMI 擷取',
          minutes: '分鐘'
        },
        autostart: {
          title: '啟動時指令碼設定',
          description: '管理能夠在 NanoKVM 啟動時自動執行的相關指令碼',
          new: '建立新指令碼',
          deleteConfirm: '確定要刪除該檔案嗎？',
          yes: '是',
          no: '否',
          scriptName: 'Script 名稱',
          scriptContent: 'Script 內容',
          settings: '設定'
        },
        hidOnly: 'HID-Only 模式',
        hidOnlyDesc: '停止模擬虛擬設備，僅保留基礎 HID 控制',
        disk: '虛擬隨身碟',
        diskDesc: '在遠端主機上連接虛擬隨身碟',
        network: '虛擬網卡',
        networkDesc: '在遠端主機上新增虛擬網卡',
        reboot: '重新啟動',
        rebootDesc: '您確定要重新啟動 NanoKVM?',
        okBtn: '確定',
        cancelBtn: '取消',
        diskLocked: '掛載映像檔期間已關閉（開啟會取消映像檔掛載）',
        diskCancelMount:
          '開啟虛擬隨身碟會取消目前掛載的映像檔，並中斷正在進行的映像檔下載或上傳，是否繼續？',
        diskBreakDownload: '開啟虛擬隨身碟會中斷映像檔下載功能，是否繼續？',
        attention: '注意'
      },
      network: {
        title: '網路',
        wifi: {
          title: 'Wi-Fi',
          description: '設定 Wi-Fi',
          apMode: 'AP 模式已啟用，請掃描 QRCode 連接 Wi-Fi',
          connect: '連線 Wi-Fi',
          connectDesc1: '請輸入網路名稱和密碼',
          connectDesc2: '請輸入密碼以連線此網路',
          disconnect: '是否要中斷該網路連線？',
          failed: '連線失敗，請重試',
          ssid: 'SSID 名稱',
          password: '密碼',
          joinBtn: '加入',
          confirmBtn: '確定',
          cancelBtn: '取消'
        },
        tls: {
          description: '啟用 HTTPS 協議',
          tip: '啟用 HTTPS 可以提高安全性，但可能會增加傳輸延遲，特別是使用 MJPEG 格式傳輸時。'
        },
        dns: {
          title: 'DNS',
          description: '設定 NanoKVM 使用的 DNS 伺服器',
          mode: '模式',
          dhcp: 'DHCP',
          manual: '手動',
          add: '新增 DNS',
          save: '儲存',
          invalid: '請輸入有效的 IP 位址',
          noDhcp: '目前未取得 DHCP DNS',
          saved: 'DNS 設定已儲存',
          saveFailed: '儲存 DNS 設定失敗',
          unsaved: '有未儲存的變更',
          maxServers: '最多允許 {{count}} 個 DNS 伺服器',
          dnsServers: 'DNS 伺服器',
          dhcpServersDescription: 'DNS 伺服器由 DHCP 自動取得',
          manualServersDescription: 'DNS 伺服器可以手動編輯',
          networkDetails: '網路詳細資訊',
          interface: '介面',
          ipAddress: 'IP 位址',
          subnetMask: '子網路遮罩',
          router: '路由器',
          none: '無'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: '記憶體最佳化',
          tip: '當記憶體使用量超過限制時，會更積極的進行垃圾回收來嘗試釋放記憶體。若使用 Tailscale 建議設定為 50MB，於重啟 Tailscale 後生效。'
        },
        swap: {
          title: 'Swap',
          tip: '如果啟用記憶體最佳化後依然存在問題，可以嘗試開啟 Swap。啟用後會將交換檔案設定為 256MB，可以在「設定 - 裝置」中修改該選項。'
        },
        restart: '確定要重啟 Tailscale 嗎？',
        stop: '確定要停止 Tailscale 嗎？',
        stopDesc: '登出 Tailscale 並停用開機自動啟動。',
        loading: '載入中...',
        notInstall: '未找到 Tailscale ！請先安裝。',
        install: '安裝',
        installing: '安裝中',
        failed: '安裝失敗',
        retry: '請重新整理並重試。或嘗試手動安裝',
        download: '下載',
        package: '安裝包',
        unzip: '並解壓縮它',
        upTailscale: '將 Tailscale 上傳到 NanoKVM 的 /usr/bin/ 資料夾',
        upTailscaled: '將 Tailscale 上傳到 NanoKVM 的 /usr/sbin/ 資料夾',
        refresh: '重新整理頁面',
        notRunning: 'Tailscale 尚未執行',
        run: '啟動',
        notLogin: '設備尚未綁定。請登入並將該裝置綁定到您的帳戶。',
        urlPeriod: '此網址有效期限為 10 分鐘',
        login: '登入',
        loginSuccess: '登入成功',
        enable: '啟用 Tailscale',
        deviceName: '裝置名稱',
        deviceIP: '裝置 IP',
        account: '帳號',
        logout: '登出',
        logoutDesc: '確認要登出嗎？',
        uninstall: '移除 Tailscale',
        uninstallDesc: '確定要解除安裝 Tailscale 嗎？',
        okBtn: '確認',
        cancelBtn: '取消'
      },
      update: {
        title: '檢查更新',
        queryFailed: '取得版本號失敗',
        updateFailed: '更新失敗。請重試。',
        isLatest: '您已經是最新版本。',
        available: '發現有可用更新。您確定要更新嗎？',
        updating: '更新中，請稍候...',
        confirm: '確定',
        cancel: '取消',
        preview: '預覽更新',
        previewDesc: '預覽版本，搶先體驗新功能和改進',
        previewTip: '請注意，預覽版本可能包含一些不穩定因素或未完善的功能！',
        customServer: {
          title: '自訂更新伺服器',
          desc: '從指定伺服器檢查並下載線上更新',
          invalidUrl:
            '請輸入有效的 HTTP 或 HTTPS 伺服器目錄，不可包含查詢參數、片段或 latest.json。',
          loadFailed: '讀取更新伺服器設定失敗。',
          saveFailed: '儲存更新伺服器設定失敗。',
          saved: '更新伺服器設定已儲存。',
          save: '儲存',
          confirmTitle: '使用自訂更新伺服器？',
          confirmDesc:
            'SHA-512 只能驗證安裝套件與該伺服器提供的清單一致，不能證明安裝套件來自 NanoKVM 官方。錯誤或惡意的伺服器可能導致裝置無法使用、資料遺失或系統遭到接管。',
          confirm: '仍然使用',
          previewDisabled: '啟用自訂更新伺服器時，預覽更新無法使用'
        },
        offline: {
          title: '離線更新',
          desc: '透過本地安裝包進行更新',
          upload: '上傳',
          checksumPlaceholder: 'SHA-256 校驗和（選填）',
          invalidChecksum: 'SHA-256 校驗和必須包含 64 個十六進位字元。',
          checksumMismatch: 'SHA-256 驗證失敗。套件可能已損毀。',
          invalidName: '檔名格式錯誤，請前往 GitHub 釋出頁下載安裝包。',
          updateFailed: '更新失敗，請重試'
        }
      },
      account: {
        title: '帳號',
        webAccount: '網頁帳號',
        password: '密碼',
        updateBtn: '修改',
        logoutBtn: '登出',
        logoutDesc: '您確定要登出嗎?',
        okBtn: '確定',
        cancelBtn: '取消',
        role: '角色',
        roles: {
          admin: '管理員',
          user: '一般使用者'
        },
        users: {
          title: '使用者管理',
          create: '建立使用者',
          enabled: '已啟用',
          disabled: '已停用',
          deviceOwner: '裝置擁有者',
          resetPassword: '重設密碼',
          delete: '刪除',
          deleteConfirm: '刪除此使用者並撤銷其全部工作階段？',
          created: '使用者已建立',
          deleted: '使用者已刪除',
          passwordUpdated: '密碼已更新',
          loadFailed: '載入使用者失敗',
          saveFailed: '儲存使用者失敗',
          deleteFailed: '刪除使用者失敗',
          editPermissions: '權限'
        },
        permissions: {
          title: '功能權限',
          consoleGroup: '主控台操作',
          manageGroup: '設備管理',
          consoleView: '檢視畫面',
          consoleControl: '鍵盤與滑鼠',
          power: '電源控制',
          mediaMount: '裝載與讀取映像檔',
          mediaManage: '映像檔與檔案管理',
          terminal: '終端機與腳本',
          device: '設備設定',
          network: '網路設定',
          update: '系統更新',
          mcp: 'MCP 服務',
          mcpNote:
            'MCP 服務會核發設備級 API Key，可在 Web 工作階段之外控制鍵盤滑鼠並取得螢幕截圖；即使撤銷此權限，該 Key 仍然有效，直到重新產生。',
          tailscale: 'Tailscale',
          ai: 'AI 助理',
          aiNote:
            'AI 助理透過本機內部介面操作設備，不受其他權限限制，因此授予此項等同於授予完整的設備控制權。'
        }
      }
    },
    picoclaw: {
      title: 'PicoClaw 助理',
      empty: '打開面板並啟動一個任務來開始。',
      inputPlaceholder: '描述您希望 PicoClaw 執行的操作',
      newConversation: '新對話',
      processing: '正在處理...',
      agent: {
        defaultTitle: '通用助理',
        defaultDescription: '一般聊天、搜尋和工作區域幫助。',
        kvmTitle: '遠端控制',
        kvmDescription: '透過 NanoKVM 操作遠端主機。',
        switched: '代理角色已切換',
        switchFailed: '代理角色切換失敗'
      },
      send: '發送',
      cancel: '取消',
      status: {
        connecting: '正在連線 Gateway...',
        connected: 'PicoClaw 會話已連線',
        disconnected: 'PicoClaw 會話已關閉',
        stopped: '已發送停止請求',
        runtimeStarted: 'PicoClaw Runtime 已啟動',
        runtimeStartFailed: '啟動 PicoClaw Runtime 失敗',
        runtimeStopped: 'PicoClaw Runtime 已停止',
        runtimeStopFailed: '停止 PicoClaw Runtime 失敗',
        controlSwitchedToMCP: '控制權已切換至外部 MCP 服務'
      },
      connection: {
        runtime: {
          checking: '檢查中',
          restoring: '正在恢復 PicoClaw',
          ready: 'Runtime 已就緒',
          stopped: 'Runtime 未啟動',
          blockedByMCP: '外部 MCP 控制已啟用',
          readyBlockedByMCP: 'Runtime 正在執行，但外部 MCP 目前控制裝置輸入。',
          readyWithoutControl: 'Runtime 正在執行，請先授予 PicoClaw 裝置控制權後再重新連線。',
          unavailable: 'Runtime 不可用',
          configError: '設定錯誤'
        },
        transport: {
          connecting: '連接中',
          connected: '已連接',
          disconnected: '未連線',
          reconnect: '重新連線',
          reconnectDescription: '重新連線到正在執行的 PicoClaw 會話。',
          reconnectBlocked: 'PicoClaw 需要先取得裝置控制權才能重新連線。'
        },
        run: {
          idle: '空閒',
          busy: '忙'
        }
      },
      message: {
        toolAction: '行動',
        observation: '觀察',
        screenshot: '截圖'
      },
      overlay: {
        locked: 'PicoClaw 正在控制設備。手動輸入已暫停。'
      },
      control: {
        picoclaw: '設備控制：PicoClaw',
        picoclawDescription: 'PicoClaw 可以寫入鍵鼠，手動輸入可能會被暫停。',
        mcp: '設備控制：外部 MCP',
        mcpDescription: '外部 MCP 可以寫入裝置，PicoClaw 不會接管鍵鼠。',
        off: '設備控制：關閉',
        offDescription: 'AI 不會寫入鍵鼠，手動控制保持可用。',
        transitioning: '裝置控制：正在切換',
        transitioningDescription: '正在同步裝置控制權，請稍候。',
        grant: '授予控制權',
        release: '釋放',
        releasing: '正在釋放...',
        switching: '正在切換...',
        releasingLabel: '裝置控制：正在釋放',
        releasingDescription: '正在交還裝置控制，PicoClaw 已停止目前寫入。',
        granted: '已授予 PicoClaw 控制權',
        released: '已釋放 PicoClaw 控制權',
        grantFailed: '授予 PicoClaw 控制權失敗',
        releaseFailed: '釋放 PicoClaw 控制權失敗',
        grantConfirmTitle: '將設備控制切換至 PicoClaw？',
        grantConfirmDesc: '外部 MCP 的設備寫入將被中斷。'
      },
      install: {
        install: '安裝 PicoClaw',
        installing: '正在安裝 PicoClaw',
        success: 'PicoClaw 安裝成功',
        failed: 'PicoClaw 安裝失敗',
        uninstalling: '正在解除安裝 Runtime...',
        uninstalled: 'Runtime 解除安裝成功。',
        uninstallFailed: '解除安裝失敗。',
        requiredTitle: 'PicoClaw 未安裝',
        requiredDescription: '在啟動 PicoClaw Runtime 之前，請先安裝 PicoClaw。',
        progressDescription: '正在下載並安裝 PicoClaw。',
        stages: {
          preparing: '準備中',
          downloading: '下載中',
          extracting: '解壓縮中',
          verifying: '驗證中',
          installing: '安裝中',
          installed: '已安裝',
          install_timeout: '超時',
          install_failed: '失敗'
        }
      },
      model: {
        requiredTitle: '需要設定模型',
        requiredDescription: '在使用 PicoClaw 聊天之前，請先設定 PicoClaw 模型。',
        docsTitle: '設定指南',
        docsDesc: '支援的模型與通訊協定',
        menuLabel: '設定模型',
        modelIdentifier: '模型標識符',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API Key',
        apiKeyPlaceholder: '請輸入模型 API Key',
        save: '儲存',
        saving: '儲存中',
        saved: '模型設定已儲存',
        saveFailed: '儲存模型設定失敗',
        invalid: '模型標識、API Base URL 和 API Key 不能為空'
      },
      uninstall: {
        menuLabel: '解除安裝',
        confirmTitle: '解除安裝 PicoClaw',
        confirmContent: '您確定要解除安裝 PicoClaw 嗎？這將刪除可執行檔和所有設定檔。',
        confirmOk: '解除安裝',
        confirmCancel: '取消'
      },
      history: {
        title: '歷史會話',
        loading: '正在載入會話...',
        emptyTitle: '還沒有歷史記錄',
        emptyDescription: '之前的 PicoClaw 會話將會出現在此。',
        loadFailed: '無法載入會話歷史記錄',
        deleteFailed: '刪除會話失敗',
        deleteConfirmTitle: '刪除會話',
        deleteConfirmContent: '您確定要刪除「{{title}}」嗎？',
        deleteConfirmOk: '刪除',
        deleteConfirmCancel: '取消',
        messageCount_one: '{{count}} 則訊息',
        messageCount_other: '{{count}} 則訊息',
        messageCount: '{{count}} 則訊息'
      },
      config: {
        startRuntime: '啟動 PicoClaw',
        stopRuntime: '停止 PicoClaw'
      },
      start: {
        enableConfirmTitle: '將控制權切換至 PicoClaw？',
        enableConfirmDesc: '啟動 PicoClaw 將停用外部 MCP 服務。',
        enableConfirmOk: '啟動 PicoClaw',
        enableConfirmCancel: '取消',
        title: '啟動 PicoClaw',
        description: '啟動 Runtime 後即可開始使用 PicoClaw 助理。',
        switchFromMCP: '切換到 PicoClaw 並啟動',
        takeoverAndStart: '接管並啟動'
      }
    },
    error: {
      title: '我們遇到了一些問題',
      refresh: '重新整理'
    },
    fullscreen: {
      toggle: '進入全螢幕模式'
    },
    menu: {
      collapse: '收起選單',
      expand: '展開選單'
    }
  }
};

export default zh_tw;
