const vi = {
  translation: {
    head: {
      desktop: 'Remote Desktop',
      login: 'Đăng nhập',
      changePassword: 'Đổi mật khẩu',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Đăng nhập',
      placeholderUsername: 'Vui lòng nhập tên người dùng',
      placeholderPassword: 'vui lòng nhập mật khẩu',
      placeholderPassword2: 'vui lòng nhập lại mật khẩu',
      noEmptyUsername: 'tên người dùng không được để trống',
      noEmptyPassword: 'mật khẩu không được để trống',
      noAccount:
        'Không thể lấy thông tin người dùng, vui lòng làm mới trang web hoặc đặt lại mật khẩu',
      invalidUser: 'tên người dùng hoặc mật khẩu không hợp lệ',
      error: 'lỗi không mong đợi',
      changePassword: 'Đổi mật khẩu',
      changePasswordDesc: 'Để bảo mật thiết bị của bạn, vui lòng thay đổi mật khẩu đăng nhập web.',
      differentPassword: 'mật khẩu không khớp',
      illegalUsername: 'tên người dùng chứa ký tự không hợp lệ',
      illegalPassword: 'mật khẩu chứa ký tự không hợp lệ',
      forgetPassword: 'Quên mật khẩu',
      ok: 'OK',
      cancel: 'Hủy',
      loginButtonText: 'Đăng nhập',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'For detailed steps, please consult this document:',
        reset3: 'Web default account:',
        reset4: 'SSH default account:',
        change1: 'Please note that this action will change the following passwords:',
        change2: 'Web login password',
        change3: 'System root password (SSH login password)',
        change4: 'To reset the passwords, press and hold the BOOT button on the NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configure Wi-Fi for NanoKVM',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'Operation failed, please try again.',
      confirmBtn: 'Ok',
      finishBtn: 'Finished'
    },
    screen: {
      video: 'Chế độ video',
      resolution: 'Độ phân giải',
      auto: 'Tự động',
      autoTips:
        'Màn hình bị xé hoặc lệch chuột có thể xảy ra ở các độ phân giải nhất định. Hãy xem xét điều chỉnh độ phân giải của máy remote hoặc tắt chế độ tự động.',
      fps: 'FPS',
      customizeFps: 'Tùy chỉnh',
      quality: 'Chất lượng',
      qualityLossless: 'Không mất dữ liệu',
      qualityHigh: 'Cao',
      qualityMedium: 'Trung bình',
      qualityLow: 'Thấp',
      frameDetect: 'Phát hiện khung hình',
      frameDetectTip:
        'Tính toán sự khác biệt giữa các khung hình. Dừng truyền video khi không có thay đổi trên màn hình máy chủ từ xa.',
      resetHdmi: 'Reset HDMI'
    },
    keyboard: {
      paste: 'Dán',
      tips: 'Chỉ hỗ trợ các chữ cái và ký hiệu bàn phím tiêu chuẩn',
      placeholder: 'Vui lòng nhập',
      submit: 'Gửi',
      virtual: 'Bàn phím',
      ctrlaltdel: 'Ctrl+Alt+Del'
    },
    mouse: {
      default: 'Con trỏ mặc định',
      pointer: 'Con trỏ trỏ',
      cell: 'Con trỏ ô',
      text: 'Con trỏ văn bản',
      grab: 'Con trỏ nắm',
      hide: 'Ẩn con trỏ',
      mode: 'Chế độ chuột',
      absolute: 'Chế độ tuyệt đối',
      relative: 'Chế độ tương đối',
      requestPointer:
        'Đang sử dụng chế độ tương đối. Vui lòng nhấp vào màn hình để lấy con trỏ chuột.',
      resetHid: 'Đặt lại HID'
    },
    image: {
      title: 'Hình ảnh',
      loading: 'Đang tải...',
      empty: 'Không tìm thấy',
      mountFailed: 'Mount thất bại',
      mountDesc: 'Trong một số hệ thống, cần phải eject đĩa ảo trên máy remote trước khi mount.',
      tips: {
        title: 'Cách tải lên',
        usb1: 'Kết nối NanoKVM với máy tính của bạn qua USB.',
        usb2: 'Đảm bảo rằng đĩa ảo đã được gắn kết (Cài đặt - Đĩa ảo).',
        usb3: 'Mở đĩa ảo trên máy tính của bạn và sao chép vào thư mục gốc của đĩa ảo.',
        scp1: 'Đảm bảo NanoKVM và máy tính của bạn đang trên cùng một mạng nội bộ.',
        scp2: 'Mở terminal trên máy tính và sử dụng lệnh SCP để tải đĩa ảo lên thư mục /data trên NanoKVM.',
        scp3: 'Ví dụ: scp đường-dẫn-image root@ip-của-nanokvm:/data',
        tfCard: 'Thẻ TF',
        tf1: 'Phương pháp này được hỗ trợ trên hệ thống Linux',
        tf2: 'Lấy thẻ TF từ NanoKVM (với phiên bản FULL, hãy tháo vỏ trước).',
        tf3: 'Chèn thẻ TF vào đầu đọc thẻ và kết nối với máy tính của bạn.',
        tf4: 'Sao chép tệp hình ảnh vào thư mục /data trên thẻ TF.',
        tf5: 'Chèn thẻ TF vào NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Tải lên',
      run: 'Chạy',
      runBackground: 'Chạy nền',
      runFailed: 'Chạy thất bại',
      attention: 'Chú ý',
      delDesc: 'Bạn có chắc chắn muốn xóa tệp này không?',
      confirm: 'Có',
      cancel: 'Không',
      delete: 'Xóa',
      close: 'Đóng'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal NanoKVM',
      serial: 'Terminal Cổng Nối Tiếp',
      serialPort: 'Cổng Nối Tiếp',
      serialPortPlaceholder: 'Vui lòng nhập cổng nối tiếp',
      baudrate: 'Tốc độ Baud',
      confirm: 'OK'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Đang gửi lệnh...',
      sent: 'Đã gửi lệnh',
      input: 'Vui lòng nhập địa chỉ MAC',
      ok: 'OK'
    },
    power: {
      title: 'Nguồn',
      reset: 'Đặt lại',
      power: 'Nguồn',
      powerShort: 'Nguồn (nhấp ngắn)',
      powerLong: 'Nguồn (nhấp dài)'
    },
    settings: {
      title: 'Settings',
      about: {
        title: 'Giới thiệu về NanoKVM',
        information: 'Thông tin',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Phiên bản Ứng dụng',
        applicationTip: 'NanoKVM web application version',
        image: 'Phiên bản Hình ảnh',
        imageTip: 'NanoKVM system image version',
        deviceKey: 'Khóa Thiết bị',
        community: 'Cộng đồng'
      },
      appearance: {
        title: 'Appearance',
        display: 'Display',
        language: 'Language',
        menuBar: 'Menu Bar',
        menuBarDesc: 'Display icons in the menu bar'
      },
      device: {
        title: 'Device',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Never',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 hour'
        },
        wifi: {
          title: 'Wi-Fi',
          description: 'Configure Wi-Fi',
          setBtn: 'Config'
        },
        disk: 'Virtual Disk',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtual Network',
        networkDesc: 'Mount virtual network card on the remote host',
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
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Memory optimization',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect.",
          disable: 'Disable'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
        loading: 'Đang tải...',
        notInstall: 'Không tìm thấy Tailscale! Vui lòng cài đặt.',
        install: 'Cài đặt',
        installing: 'Đang cài đặt',
        failed: 'Cài đặt thất bại',
        retry: 'Vui lòng làm mới và thử lại. Hoặc thử cài đặt thủ công',
        download: 'Tải xuống',
        package: 'gói cài đặt',
        unzip: 'và giải nén nó',
        upTailscale: 'Tải tailscale lên thư mục /usr/bin/ của NanoKVM',
        upTailscaled: 'Tải tailscaled lên thư mục /usr/sbin/ của NanoKVM',
        refresh: 'Làm mới trang hiện tại',
        notLogin:
          'Thiết bị chưa được liên kết. Vui lòng đăng nhập và liên kết thiết bị này với tài khoản của bạn.',
        urlPeriod: 'URL này có hiệu lực trong 10 phút',
        login: 'Đăng nhập',
        loginSuccess: 'Đăng nhập thành công',
        enable: 'Kích hoạt Tailscale',
        deviceName: 'Tên Thiết bị',
        deviceIP: 'IP Thiết bị',
        account: 'Tài khoản',
        logout: 'Đăng xuất',
        logout2: 'Bạn có chắc chắn muốn đăng xuất không?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Kiểm tra cập nhật',
        queryFailed: 'Lấy phiên bản thất bại',
        updateFailed: 'Cập nhật thất bại. Vui lòng thử lại.',
        isLatest: 'Bạn đã có phiên bản mới nhất.',
        available: 'Có bản cập nhật mới. Bạn có chắc chắn muốn cập nhật không?',
        updating: 'Bắt đầu cập nhật. Vui lòng chờ...',
        confirm: 'Xác nhận',
        cancel: 'Hủy'
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Name',
        password: 'Password',
        updateBtn: 'Update',
        logoutBtn: 'Logout'
      }
    }
  }
};

export default vi;
