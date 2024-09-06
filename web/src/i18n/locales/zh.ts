const zh = {
  translation: {
    currentVersion: '版本',
    latestVersion: '最新版本：',
    changePassword: '修改密码',
    logout: '登出',
    settings: '设置',
    showMouse: '显示鼠标',
    hideMouse: '隐藏鼠标',
    power: '电源',
    reset: '重启',
    powerShort: '电源（短按）',
    powerLong: '电源（长按）',
    hddLed: '硬盘指示灯',
    checkLibFailed: '检查运行库失败，请重试',
    updateLibFailed: '更新运行库失败，请重试',
    updatingLib: '正在更新运行库。更新完成后请刷新页面。',
    head: {
      desktop: '远程桌面',
      login: '登录',
      changePassword: '修改密码',
      terminal: '终端'
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
      differentPassword: '两次密码不一致',
      illegalUsername: '用户名中包含非法字符',
      illegalPassword: '密码中包含非法字符',
      forgetPassword: '忘记密码',
      resetPassword: '重置密码',
      reset1: '如果您忘记了登录密码，请按照以下步骤重置密码：',
      reset2: '1. 通过 SSH 登录到您的 NanoKVM 设备',
      reset3: '2. 删除设备中的文件：',
      reset4: '3. 使用默认的账号登录： ',
      ok: '确定',
      cancel: '取消'
    },
    screen: {
      resolution: '分辨率',
      fps: '帧率',
      customizeFps: '自定义',
      quality: '图像质量',
      frameDetect: '帧差检测',
      frameDetectTip: '计算帧之间的差异，当检测到远程主机画面不变时，停止传输视频流',
      fitInWindow: '适应窗口'
    },
    keyboard: {
      paste: '粘贴',
      tips: '仅支持标准键盘的字母和符号',
      placeholder: '请输入内容',
      submit: '确定',
      virtual: '虚拟键盘'
    },
    mouse: {
      default: '默认指针',
      pointer: '悬浮指针',
      cell: '单元指针',
      text: '文本指针',
      grab: '抓取指针',
      hide: '隐藏指针',
      mode: '鼠标模式',
      absolute: '绝对模式',
      relative: '相对模式',
      requestPointer: '正在使用鼠标相对模式，请点击桌面获取鼠标指针。',
      resetHid: '重置 HID'
    },
    image: {
      title: '镜像',
      loading: '加载中',
      empty: '无镜像文件',
      tips: {
        title: '如何上传',
        usb1: '将 NanoKVM 通过 USB 连接到你的电脑；',
        usb2: '确保已经挂载了虚拟U盘（设置 - 虚拟U盘）；',
        usb3: '在电脑上打开虚拟U盘，将镜像文件拷贝到虚拟U盘的根目录下。',
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
      sending: '指令发送中...',
      sent: '指令已发送',
      input: '请输入MAC地址',
      ok: '确定'
    },
    about: {
      title: '关于 NanoKVM',
      information: '信息',
      ip: 'IP',
      mdns: 'mDNS',
      firmware: '应用版本',
      image: '镜像版本',
      deviceKey: '设备码',
      queryFailed: '查询失败',
      community: '社区'
    },
    update: {
      title: '检查更新',
      queryFailed: '获取版本号失败',
      updateFailed: '更新失败，请重试',
      isLatest: '已经是最新版本。',
      available: '有新的可用版本，确定要更新吗？',
      updating: '更新中，请稍候...',
      confirm: '确定',
      cancel: '取消'
    },
    virtualDevice: {
      network: '虚拟网口',
      usb: '虚拟U盘'
    },
    tailscale: {
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
      logout2: '确认退出？'
    }
  }
};

export default zh;
