const zh = {
  translation: {
    head: {
      desktop: '远程桌面',
      login: '登录',
      changePassword: '修改密码',
      terminal: '终端',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: '登录',
      placeholderUsername: '请输入用户名',
      placeholderPassword: '请输入密码',
      placeholderPassword2: '请再次输入密码',
      noEmptyUsername: '用户名不能为空',
      noEmptyPassword: '密码不能为空',
      noAccount: '获取用户信息失败，请刷新重试或重置密码',
      invalidUser: '用户名或密码错误',
      error: '未知错误',
      changePassword: '修改密码',
      changePasswordDesc: '为了您的设备安全，请修改密码!',
      differentPassword: '两次密码不一致',
      illegalUsername: '用户名中包含非法字符',
      illegalPassword: '密码中包含非法字符',
      forgetPassword: '忘记密码',
      ok: '确定',
      cancel: '取消',
      loginButtonText: '登录',
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
      success: '请前往设备检查 NanoKVM 的网络状态。',
      failed: '操作失败，请重试。',
      invalidMode: '当前模式不支持配置网络。请先前往设备启用 Wi-Fi 配置模式。',
      confirmBtn: '确定',
      finishBtn: '完成'
    },
    screen: {
      scale: '缩放',
      title: '屏幕',
      video: '视频模式',
      videoDirectTips: '该模式需启用 HTTPS，请前往「设置 - 设备」中开启',
      resolution: '分辨率',
      auto: '自动',
      autoTips:
        '在某些分辨率下可能存在花屏或鼠标偏移的情况，请调整远程主机分辨率或者不使用自动模式。',
      fps: '帧率',
      customizeFps: '自定义',
      quality: '图像质量',
      qualityLossless: '无损',
      qualityHigh: '高',
      qualityMedium: '中',
      qualityLow: '低',
      frameDetect: '帧差检测',
      frameDetectTip: '计算帧之间的差异，当检测到远程主机画面不变时，停止传输视频流',
      resetHdmi: '重置 HDMI'
    },
    keyboard: {
      title: '键盘',
      paste: '粘贴',
      tips: '仅支持标准键盘的字母和符号',
      placeholder: '请输入内容',
      submit: '确定',
      virtual: '虚拟键盘',
      shortcut: {
        title: '快捷键',
        custom: '自定义',
        capture: '点击此处捕获快捷键',
        clear: '清空',
        save: '保存',
        captureTips: '捕获系统级按键（如 Windows 键）需要全屏权限。',
        enterFullScreen: '切换全屏模式。'
      },
      leaderKey: {
        title: '引导键',
        desc: '绕过浏览器限制，向远程主机发送被系统拦截的快捷键。',
        howToUse: '使用方法',
        simultaneous: {
          title: '组合按键模式',
          desc1: '按住引导键不放，同时按下目标快捷键。',
          desc2: '操作直观，但少数快捷键可能因系统占用而无法生效。'
        },
        sequential: {
          title: '序列输入模式',
          desc1: '点击【引导键】开始 → 依次点击【快捷键】→ 点击【引导键】结束。',
          desc2: '步骤较多，但能完美避开系统键位冲突。'
        },
        enable: '启用引导键',
        tip: '设为引导键后，该按键将仅用于触发快捷键，不再作为普通按键使用。',
        placeholder: '请按下引导键',
        shiftRight: '右 Shift',
        ctrlRight: '右 Ctrl',
        metaRight: '右 Win',
        submit: '确定',
        recorder: {
          rec: '录制中',
          activate: '激活按键',
          input: '请按下快捷键...'
        }
      }
    },
    mouse: {
      title: '鼠标',
      cursor: '光标样式',
      default: '默认光标',
      pointer: '悬浮指针',
      cell: '单元指针',
      text: '文本指针',
      grab: '抓取指针',
      hide: '隐藏指针',
      mode: '鼠标模式',
      absolute: '绝对模式',
      relative: '相对模式',
      direction: '滚轮方向',
      scrollUp: '向上',
      scrollDown: '向下',
      speed: '滚轮速度',
      fast: '快',
      slow: '慢',
      requestPointer: '正在使用鼠标相对模式，请点击桌面获取鼠标指针。',
      resetHid: '重置 HID',
      hidOnly: {
        title: 'HID-Only 模式',
        desc: '若使用过程中遇到鼠标键盘无响应，且重置 HID 无效，可能是 NanoKVM 与您的设备存在兼容性问题。建议尝试启用 HID-Only 模式以提升兼容性。',
        tip1: '启用该模式会禁用虚拟U盘和虚拟网卡',
        tip2: '该模式下无法使用镜像挂载功能',
        tip3: '切换模式后将自动重启 NanoKVM',
        enable: '启用 HID-Only 模式',
        disable: '关闭 HID-Only 模式'
      }
    },
    image: {
      title: '镜像',
      loading: '加载中',
      empty: '无镜像文件',
      mountMode: '挂载模式',
      mountFailed: '挂载失败',
      mountDesc: '在某些系统中，需要在远程主机中弹出虚拟硬盘后再挂载镜像。',
      unmountFailed: '卸载失败',
      unmountDesc: '在某些系统中，需要在远程主机中手动弹出后再卸载镜像。',
      refresh: '刷新镜像列表',
      attention: '注意',
      deleteConfirm: '确定要删除该镜像吗？',
      okBtn: '确定',
      cancelBtn: '取消',
      tips: {
        title: '如何上传',
        usb1: '将 NanoKVM 通过 USB 连接到你的电脑；',
        usb2: '确保已经挂载了虚拟硬盘（设置 - 虚拟硬盘）；',
        usb3: '在电脑上打开虚拟硬盘，将镜像文件拷贝到虚拟硬盘的根目录下。',
        scp1: '确保 NanoKVM 和你的电脑在同一个局域网内；',
        scp2: '在电脑上打开终端软件，使用 SCP 命令将镜像文件上传到 NanoKVM 的 /data 目录。',
        scp3: '示例：scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'TF 卡',
        tf1: '该方式适用于 Linux 系统',
        tf2: '将 TF 卡从 NanoKVM 中取出（FULL 版本需要先拆开外壳）；',
        tf3: '将 TF 卡插入读卡器并连接到你的电脑；',
        tf4: '从电脑上拷贝镜像文件到 TF 卡的 /data 目录下；',
        tf5: '将 TF 卡重新插入 NanoKVM。'
      }
    },
    script: {
      title: '脚本',
      upload: '上传',
      run: '运行',
      runBackground: '后台运行',
      runFailed: '运行失败',
      attention: '注意',
      delDesc: '确定要删除该文件吗？',
      confirm: '确定',
      cancel: '取消',
      delete: '删除',
      close: '关闭'
    },
    terminal: {
      title: '终端',
      nanokvm: 'NanoKVM 终端',
      serial: '串口终端',
      serialPort: '串口',
      serialPortPlaceholder: '请输入串口',
      baudrate: '波特率',
      confirm: '确定'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: '指令发送中...',
      sent: '指令已发送',
      input: '请输入MAC地址',
      ok: '确定'
    },
    download: {
      title: '下载镜像',
      input: '请输入镜像的下载地址',
      ok: '确定',
      disabled: '/data 是只读分区，无法下载镜像'
    },
    power: {
      title: '电源',
      showConfirm: '显示确认框',
      showConfirmTip: '电源操作需要二次确认',
      reset: '重启',
      power: '电源',
      powerShort: '电源（短按）',
      powerLong: '电源（长按）',
      resetConfirm: '确认执行重启操作吗？',
      powerConfirm: '确认执行电源操作吗？',
      okBtn: '确认',
      cancelBtn: '取消'
    },
    settings: {
      title: '设置',
      about: {
        title: '关于 NanoKVM',
        information: '信息',
        ip: 'IP',
        mdns: 'mDNS',
        application: '应用版本',
        applicationTip: 'NanoKVM 网页应用版本',
        image: '镜像版本',
        imageTip: 'NanoKVM 系统镜像版本',
        deviceKey: '设备码',
        community: '社区',
        hostname: '主机名',
        hostnameUpdated: '主机名修改成功，重启后生效'
      },
      appearance: {
        title: '外观',
        display: '显示',
        language: '语言',
        languageDesc: '选择界面语言',
        webTitle: '网页标题',
        webTitleDesc: '自定义网站页面标题',
        menuBar: {
          title: '菜单栏',
          mode: '显示方式',
          modeDesc: '菜单栏在屏幕上的显示方式',
          modeOff: '关闭',
          modeAuto: '自动隐藏',
          modeAlways: '始终显示',
          icons: '菜单图标',
          iconsDesc: '是否在菜单栏中显示子菜单图标'
        }
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
          apMode: 'AP 模式已启用，该模式下仅支持扫描二维码配网',
          connect: '连接 Wi-Fi',
          connectDesc1: '请输入网络名称和密码',
          connectDesc2: '请输入密码以连接此网络',
          disconnect: '是否要断开该网络连接？',
          failed: '连接失败，请重试',
          ssid: '名称',
          password: '密码',
          joinBtn: '加入',
          confirmBtn: '确定',
          cancelBtn: '取消'
        },
        ssh: {
          description: '启用 SSH 远程访问',
          tip: '启用前请务必设置强密码（帐号 - 修改密码）'
        },
        tls: {
          description: '启用 HTTPS 协议',
          tip: '注意：使用 HTTPS 可能导致延迟增加，特别是在 MJPEG 视频模式下。'
        },
        advanced: '高级设置',
        swap: {
          disable: '禁用',
          description: '设置交换文件大小',
          tip: '启用该功能可能会减少SD卡使用寿命！'
        },
        mouseJiggler: {
          title: '鼠标抖动',
          description: '防止远程主机休眠',
          disable: '关闭',
          absolute: '绝对模式',
          relative: '相对模式'
        },
        mdns: {
          description: '启用 mDNS 发现服务',
          tip: '如果您未使用此功能，建议将其关闭'
        },
        hdmi: {
          description: '启用 HDMI/显示器 输出功能'
        },
        autostart: {
          title: '自动启动脚本设置',
          description: '管理能够在 NanoKVM 启动时自动运行的脚本文件',
          new: '创建新脚本',
          deleteConfirm: '确定要删除该文件吗？',
          yes: '是',
          no: '否',
          scriptName: '自动启动脚本名称',
          scriptContent: '自动启动脚本内容',
          settings: '设置'
        },
        hidOnly: 'HID-Only 模式',
        hidOnlyDesc: '该模式下不再挂载虚拟设备，仅保留基础的 HID 控制功能。',
        disk: '虚拟U盘',
        diskDesc: '在远程主机中挂载虚拟U盘',
        network: '虚拟网卡',
        networkDesc: '在远程主机中挂载虚拟网卡',
        usbDescriptor: {
          title: 'USB Descriptor',
          description: 'Customize how the USB device appears to the target host',
          preset: 'Preset',
          vendorName: 'Manufacturer',
          productName: 'Product Name',
          serialNumber: 'Serial Number',
          chars: 'chars',
          randomize: 'Random',
          readDevice: 'Read Device',
          restoreDefaults: 'Restore Defaults',
          apply: 'Apply Changes',
          applySuccess: 'USB descriptor updated. The target will see a brief USB reconnection.',
          restoreSuccess: 'USB descriptor restored to factory defaults.',
          vidPidWarning:
            'Changing VID/PID may cause the target OS to reinstall USB drivers. Use known values to avoid compatibility issues.',
          confirmTitle: 'Confirm VID/PID Change',
          confirmMessage:
            'Changing the VID or PID may cause the target operating system to reinstall USB drivers. Are you sure you want to continue?',
          confirm: 'Yes, Apply',
          cancel: 'Cancel',
          presetGroups: {
            generic: 'Generic',
            brand: 'Brand',
            custom: 'Custom'
          },
          presets: {
            genericKeyboard: 'Generic Keyboard',
            genericMouse: 'Generic Mouse',
            genericComposite: 'Generic Composite',
            genericHid: 'Generic HID Device',
            logitechKeyboard: 'Logitech Keyboard K120',
            logitechMouse: 'Logitech USB Optical Mouse',
            microsoftKeyboard: 'Microsoft Wired Keyboard',
            dellKeyboard: 'Dell KB216 Keyboard'
          },
          errors: {
            readFailed: 'Failed to read USB descriptor',
            writeFailed: 'Failed to write USB descriptor',
            restoreFailed: 'Failed to restore USB defaults',
            invalidHex: 'VID and PID must be valid hex values (e.g. 0x1234)'
          }
        },
        okBtn: '是',
        cancelBtn: '否'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: '内存优化',
          tip: '当内存占用超过限制时，会更积极地执行垃圾回收来尝试释放内存。需重启 Tailscale 后生效。'
        },
        swap: {
          title: '交换内存',
          tip: '如果启用内存优化后依然存在问题，可以尝试开启交换内存。启用后会将交换文件设置为256MB，可以在「设置 - 设备」中修改该选项。'
        },
        restart: '取定要重启 Tailscale 吗？',
        stop: '确定要停止 Tailscale 吗？',
        stopDesc: '该操作会退出登录，并停止开机自动启动。',
        loading: '加载中...',
        notInstall: '未检测到 Tailscale，请先安装',
        install: '安装',
        installing: '安装中',
        failed: '安装失败',
        retry: '请刷新后重试，或尝试手动安装',
        download: '下载',
        package: '安装包',
        unzip: '并解压',
        upTailscale: '将 tailscale 文件上传到 /usr/bin/ 目录',
        upTailscaled: '将 tailscaled 文件上传到 /usr/sbin/ 目录',
        refresh: '刷新页面',
        notRunning: 'Tailscale 尚未运行，请先执行启动操作',
        run: '启动',
        notLogin: '该设备尚未绑定，请点击登录并将这台设备绑定到您的账号。',
        urlPeriod: '该链接10分钟内有效',
        login: '登录',
        loginSuccess: '登录完成',
        enable: '启用 Tailscale',
        deviceName: '设备名称',
        deviceIP: '设备地址',
        account: '账号',
        logout: '退出',
        logoutDesc: '确定要退出吗？',
        uninstall: '卸载 Tailscale',
        uninstallDesc: '确定要卸载 Tailscale 吗？',
        reboot: '重启',
        rebootDesc: '你确定要重启 NanoKVM 吗？',
        okBtn: '确认',
        cancelBtn: '取消'
      },
      update: {
        title: '检查更新',
        queryFailed: '获取版本号失败',
        updateFailed: '更新失败，请重试',
        isLatest: '已经是最新版本。',
        available: '有新的可用版本，确定要更新吗？',
        updating: '更新中，请稍候...',
        confirm: '确定',
        cancel: '取消',
        preview: '预览更新',
        previewDesc: '率先体验即将推出的新功能和优化',
        previewTip: '预览版更新可能包含一些不稳定因素或未完善的功能！',
        offline: {
          title: '离线更新',
          desc: '通过本地安装包进行更新',
          upload: '上传',
          invalidName: '文件名格式错误，请前往 GitHub 发布页下载安装包。',
          updateFailed: '更新失败，请重试'
        }
      },
      account: {
        title: '帐号',
        webAccount: '网页帐号',
        password: '密码',
        updateBtn: '修改',
        logoutBtn: '退出',
        logoutDesc: '确定要退出吗？',
        confirm: '确定',
        cancel: '取消'
      }
    },
    error: {
      title: '我们遇到了问题',
      refresh: '刷新'
    },
    fullscreen: {
      toggle: '切换全屏'
    },
    menu: {
      collapse: '收起',
      expand: '展开'
    }
  }
};

export default zh;
