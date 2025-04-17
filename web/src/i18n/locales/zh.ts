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
      success: '请检查 NanoKVM 的网络状态，并访问新的 IP 地址。',
      failed: '操作失败，请重试。',
      confirmBtn: '确定',
      finishBtn: '完成'
    },
    screen: {
      video: '视频模式',
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
      paste: '粘贴',
      tips: '仅支持标准键盘的字母和符号',
      placeholder: '请输入内容',
      submit: '确定',
      virtual: '虚拟键盘',
      ctrlaltdel: 'Ctrl+Alt+Del'
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
      requestPointer: '正在使用鼠标相对模式，请点击桌面获取鼠标指针。',
      resetHid: '重置 HID',
      enableHid: '启用 HID',
      disableHid: '禁用 HID',
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
      cdrom: '以 CD-ROM 模式挂载镜像',
      mountFailed: '挂载失败',
      mountDesc: '在某些系统中，需要在远程主机中弹出虚拟硬盘后再挂载镜像。',
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
        menuBar: '菜单栏',
        menuBarDesc: '是否在菜单栏中显示图标',
        webTitle: '网站标题',
        webTitleDesc: '自定义网站页面标题'
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
        ssh: {
          description: '启用 SSH 远程访问',
          tip: '启用前请务必设置强密码（帐号 - 修改密码）'
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
        hidOnly: 'HID-Only 模式',
        disk: '虚拟U盘',
        diskDesc: '在远程主机中挂载虚拟U盘',
        network: '虚拟网卡',
        networkDesc: '在远程主机中挂载虚拟网卡',
        reboot: '重启',
        rebootDesc: '你确定要重启 NanoKVM 吗？',
        okBtn: '是',
        cancelBtn: '否'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: '内存优化',
          tip: '当内存占用超过限制时，会更积极地执行垃圾回收来尝试释放内存。如果使用 Tailscale 推荐设置为 50MB，需重启 Tailscale 后生效。',
          disable: '关闭'
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
        previewTip: '预览版更新可能包含一些不稳定因素或未完善的功能！'
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
