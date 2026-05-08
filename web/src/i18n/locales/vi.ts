const vi = {
  translation: {
    head: {
      desktop: 'Màn hình từ xa',
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
      locked: 'Đăng nhập quá nhiều, vui lòng thử lại sau',
      globalLocked: 'Hệ thống đang được bảo vệ, vui lòng thử lại sau',
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
        reset2: 'Để biết các bước chi tiết, vui lòng xem tài liệu này:',
        reset3: 'Tài khoản web mặc định:',
        reset4: 'Tài khoản SSH mặc định:',
        change1: 'Lưu ý rằng thao tác này sẽ thay đổi các mật khẩu sau:',
        change2: 'Mật khẩu đăng nhập web',
        change3: 'Mật khẩu root hệ thống (mật khẩu đăng nhập SSH)',
        change4: 'Để đặt lại mật khẩu, hãy nhấn và giữ nút BOOT trên NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Cấu hình Wi-Fi cho NanoKVM',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'Thao tác thất bại, vui lòng thử lại.',
      invalidMode:
        'Chế độ hiện tại không hỗ trợ thiết lập mạng. Vui lòng truy cập thiết bị của bạn và bật chế độ cấu hình Wi-Fi.',
      confirmBtn: 'Ok',
      finishBtn: 'Hoàn tất',
      ap: {
        authTitle: 'Yêu cầu xác thực',
        authDescription: 'Vui lòng nhập mật khẩu AP để tiếp tục',
        authFailed: 'Mật khẩu AP không hợp lệ',
        passPlaceholder: 'AP mật khẩu',
        verifyBtn: 'Xác minh'
      }
    },
    screen: {
      scale: 'Quy mô',
      title: 'Màn hình',
      video: 'Chế độ video',
      videoDirectTips: 'Bật HTTPS trong "Cài đặt > Thiết bị" để sử dụng chế độ này',
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
      resetHdmi: 'Đặt lại HDMI'
    },
    keyboard: {
      title: 'Bàn phím',
      paste: 'Dán',
      tips: 'Chỉ hỗ trợ các chữ cái và ký hiệu bàn phím tiêu chuẩn',
      placeholder: 'Vui lòng nhập',
      submit: 'Gửi',
      virtual: 'Bàn phím',
      readClipboard: 'Đọc từ Clipboard',
      clipboardPermissionDenied:
        'Quyền bảng nhớ tạm bị từ chối. Vui lòng cho phép truy cập clipboard trong trình duyệt của bạn.',
      clipboardReadError: 'Không đọc được bảng nhớ tạm',
      dropdownEnglish: 'Tiếng Anh',
      dropdownGerman: 'Tiếng Đức',
      dropdownFrench: 'Tiếng Pháp',
      dropdownRussian: 'Tiếng Nga',
      shortcut: {
        title: 'Phím tắt',
        custom: 'Tùy chỉnh',
        capture: 'Bấm vào đây để chụp phím tắt',
        clear: 'Rõ ràng',
        save: 'Lưu',
        captureTips:
          'Việc ghi nhận các phím cấp hệ thống (như phím Windows) yêu cầu quyền toàn màn hình.',
        enterFullScreen: 'Chuyển sang chế độ toàn màn hình.'
      },
      leaderKey: {
        title: 'Phím Leader',
        desc: 'Bỏ qua các hạn chế của trình duyệt và gửi các phím tắt hệ thống trực tiếp đến máy chủ từ xa.',
        howToUse: 'Cách sử dụng',
        simultaneous: {
          title: 'Chế độ đồng thời',
          desc1: 'Nhấn giữ phím Leader, rồi nhấn phím tắt.',
          desc2: 'Trực quan nhưng có thể xung đột với các phím tắt hệ thống.'
        },
        sequential: {
          title: 'Chế độ tuần tự',
          desc1: 'Nhấn phím Leader → nhấn phím tắt theo thứ tự → nhấn lại phím Leader.',
          desc2: 'Yêu cầu nhiều bước hơn nhưng hoàn toàn tránh được xung đột hệ thống.'
        },
        enable: 'Bật phím Leader',
        tip: 'Khi được gán làm phím Leader, phím này chỉ hoạt động như bộ kích hoạt phím tắt và mất hành vi mặc định.',
        placeholder: 'Vui lòng nhấn phím Leader',
        shiftRight: 'Shift phải',
        ctrlRight: 'Ctrl phải',
        metaRight: 'Win phải',
        submit: 'Gửi',
        recorder: {
          rec: 'REC',
          activate: 'Kích hoạt phím',
          input: 'Hãy nhấn phím tắt...'
        }
      }
    },
    mouse: {
      title: 'Chuột',
      cursor: 'Kiểu con trỏ',
      default: 'Con trỏ mặc định',
      pointer: 'Con trỏ trỏ',
      cell: 'Con trỏ ô',
      text: 'Con trỏ văn bản',
      grab: 'Con trỏ nắm',
      hide: 'Ẩn con trỏ',
      mode: 'Chế độ chuột',
      absolute: 'Chế độ tuyệt đối',
      relative: 'Chế độ tương đối',
      direction: 'Hướng bánh xe cuộn',
      scrollUp: 'Cuộn lên',
      scrollDown: 'Cuộn xuống',
      speed: 'Tốc độ bánh xe cuộn',
      fast: 'Nhanh lên',
      slow: 'Chậm',
      requestPointer:
        'Đang sử dụng chế độ tương đối. Vui lòng nhấp vào màn hình để lấy con trỏ chuột.',
      resetHid: 'Đặt lại HID',
      hidOnly: {
        title: 'Chế độ chỉ HID',
        desc: 'Nếu chuột và bàn phím của bạn ngừng phản hồi và việc đặt lại HID không có tác dụng thì đó có thể là sự cố tương thích giữa NanoKVM và thiết bị. Hãy thử bật chế độ HID-Only để tương thích tốt hơn.',
        tip1: 'Kích hoạt HID-Chế độ chỉ sẽ ngắt kết nối đĩa U ảo và mạng ảo',
        tip2: 'Ở chế độ HID-Chỉ, tính năng gắn hình ảnh bị tắt',
        tip3: 'NanoKVM sẽ tự động khởi động lại sau khi chuyển chế độ',
        enable: 'Bật chế độ HID-Chỉ',
        disable: 'Tắt chế độ HID-Chỉ'
      }
    },
    image: {
      title: 'Hình ảnh',
      loading: 'Đang tải...',
      empty: 'Không tìm thấy',
      mountMode: 'Chế độ gắn kết',
      mountFailed: 'Mount thất bại',
      mountDesc: 'Trong một số hệ thống, cần phải eject đĩa ảo trên máy remote trước khi mount.',
      unmountFailed: 'Tháo lắp không thành công',
      unmountDesc:
        'Trên một số hệ thống, bạn cần đẩy hình ảnh ra khỏi máy chủ từ xa theo cách thủ công trước khi ngắt kết nối hình ảnh.',
      refresh: 'Làm mới danh sách hình ảnh',
      attention: 'Chú ý',
      deleteConfirm: 'Bạn có chắc chắn muốn xóa hình ảnh này không?',
      okBtn: 'Có',
      cancelBtn: 'Không',
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
      parity: 'Tính chẵn lẻ',
      parityNone: 'Không có',
      parityEven: 'Chẵn',
      parityOdd: 'Lẻ',
      flowControl: 'Kiểm soát luồng',
      flowControlNone: 'Không có',
      flowControlSoft: 'Phần mềm',
      flowControlHard: 'Phần cứng',
      dataBits: 'Bit dữ liệu',
      stopBits: 'Bit dừng',
      confirm: 'OK'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Đang gửi lệnh...',
      sent: 'Đã gửi lệnh',
      input: 'Vui lòng nhập địa chỉ MAC',
      ok: 'OK'
    },
    download: {
      title: 'Trình tải xuống hình ảnh',
      input: 'Vui lòng nhập hình ảnh từ xa URL',
      ok: 'OK',
      disabled: '/data phân vùng là RO nên không tải được image',
      uploadbox: 'Thả file vào đây hoặc bấm vào để chọn',
      inputfile: 'Vui lòng nhập File hình ảnh',
      NoISO: 'Không có ISO'
    },
    power: {
      title: 'Nguồn',
      showConfirm: 'Xác nhận',
      showConfirmTip: 'Hoạt động cấp nguồn yêu cầu xác nhận bổ sung',
      reset: 'Đặt lại',
      power: 'Nguồn',
      powerShort: 'Nguồn (nhấp ngắn)',
      powerLong: 'Nguồn (nhấp dài)',
      resetConfirm: 'Tiến hành thao tác đặt lại?',
      powerConfirm: 'Tiếp tục vận hành nguồn điện?',
      okBtn: 'Có',
      cancelBtn: 'Không'
    },
    settings: {
      title: 'Cài đặt',
      about: {
        title: 'Giới thiệu về NanoKVM',
        information: 'Thông tin',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Phiên bản Ứng dụng',
        applicationTip: 'Phiên bản ứng dụng web NanoKVM',
        image: 'Phiên bản Hình ảnh',
        imageTip: 'Phiên bản image hệ thống NanoKVM',
        deviceKey: 'Khóa Thiết bị',
        community: 'Cộng đồng',
        hostname: 'Tên máy chủ',
        hostnameUpdated: 'Đã cập nhật tên máy chủ. Khởi động lại để áp dụng.',
        ipType: {
          Wired: 'Có dây',
          Wireless: 'Không dây',
          Other: 'Khác'
        }
      },
      appearance: {
        title: 'Giao diện',
        display: 'Hiển thị',
        language: 'Ngôn ngữ',
        languageDesc: 'Chọn ngôn ngữ cho giao diện',
        webTitle: 'Tiêu đề trang web',
        webTitleDesc: 'Tùy chỉnh tiêu đề trang web',
        menuBar: {
          title: 'Thanh menu',
          mode: 'Chế độ hiển thị',
          modeDesc: 'Hiển thị thanh menu trên màn hình',
          modeOff: 'Tắt',
          modeAuto: 'Tự động ẩn',
          modeAlways: 'Luôn hiển thị',
          icons: 'Biểu tượng menu con',
          iconsDesc: 'Hiển thị biểu tượng menu con trên thanh menu'
        }
      },
      device: {
        title: 'Thiết bị',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Không bao giờ',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 giờ'
        },
        ssh: {
          description: 'Kích hoạt SSH truy cập từ xa',
          tip: 'Đặt mật khẩu mạnh trước khi kích hoạt (Tài khoản - Đổi mật khẩu)'
        },
        advanced: 'Cài đặt nâng cao',
        swap: {
          title: 'Hoán đổi',
          disable: 'Tắt',
          description: 'Đặt kích thước tệp hoán đổi',
          tip: 'Kích hoạt tính năng này có thể rút ngắn thời gian sử dụng thẻ SD của bạn!'
        },
        mouseJiggler: {
          title: 'Máy lắc lư chuột',
          description: 'Ngăn máy chủ từ xa ngủ',
          disable: 'Tắt',
          absolute: 'Chế độ tuyệt đối',
          relative: 'Chế độ tương đối'
        },
        mdns: {
          description: 'Kích hoạt dịch vụ khám phá mDNS',
          tip: 'Tắt đi nếu không cần thiết'
        },
        hdmi: {
          description: 'Kích hoạt HDMI/đầu ra màn hình'
        },
        autostart: {
          title: 'Cài đặt tập lệnh tự khởi động',
          description: 'Quản lý các tập lệnh chạy tự động khi khởi động hệ thống',
          new: 'Mới',
          deleteConfirm: 'Bạn có chắc chắn muốn xóa tệp này không?',
          yes: 'Có',
          no: 'Không',
          scriptName: 'Tên tập lệnh tự khởi động',
          scriptContent: 'Nội dung tập lệnh tự khởi động',
          settings: 'Cài đặt'
        },
        hidOnly: 'HID-Chế độ chỉ',
        hidOnlyDesc: 'Dừng mô phỏng các thiết bị ảo, chỉ giữ lại điều khiển HID cơ bản',
        disk: 'Đĩa ảo',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Mạng ảo',
        networkDesc: 'Gắn card mạng ảo trên máy chủ từ xa',
        reboot: 'Khởi động lại',
        rebootDesc: 'Bạn có chắc chắn muốn khởi động lại NanoKVM không?',
        okBtn: 'Có',
        cancelBtn: 'Không'
      },
      network: {
        title: 'Mạng',
        wifi: {
          title: 'Wi-Fi',
          description: 'Cấu hình Wi-Fi',
          apMode: 'Chế độ AP đang bật, hãy kết nối Wi-Fi bằng cách quét mã QR',
          connect: 'Kết nối Wi-Fi',
          connectDesc1: 'Vui lòng nhập SSID mạng và mật khẩu',
          connectDesc2: 'Vui lòng nhập mật khẩu để tham gia mạng này',
          disconnect: 'Bạn có chắc muốn ngắt kết nối mạng không?',
          failed: 'Kết nối thất bại, vui lòng thử lại.',
          ssid: 'Tên',
          password: 'Mật khẩu',
          joinBtn: 'Tham gia',
          confirmBtn: 'OK',
          cancelBtn: 'Hủy'
        },
        tls: {
          description: 'Bật giao thức HTTPS',
          tip: 'Lưu ý: Sử dụng HTTPS có thể tăng độ trễ, đặc biệt trong chế độ video MJPEG.'
        },
        dns: {
          title: 'DNS',
          description: 'Cấu hình máy chủ DNS cho NanoKVM',
          mode: 'Chế độ',
          dhcp: 'DHCP',
          manual: 'Thủ công',
          add: 'Thêm DNS',
          save: 'Lưu',
          invalid: 'Vui lòng nhập địa chỉ IP hợp lệ',
          noDhcp: 'Hiện không có DNS DHCP khả dụng',
          saved: 'Đã lưu cài đặt DNS',
          saveFailed: 'Không thể lưu cài đặt DNS',
          unsaved: 'Thay đổi chưa lưu',
          maxServers: 'Cho phép tối đa {{count}} máy chủ DNS',
          dnsServers: 'Máy chủ DNS',
          dhcpServersDescription: 'Máy chủ DNS được tự động lấy từ DHCP.',
          manualServersDescription: 'Có thể chỉnh sửa máy chủ DNS thủ công.',
          networkDetails: 'Chi tiết mạng',
          interface: 'Giao diện',
          ipAddress: 'Địa chỉ IP',
          subnetMask: 'Mặt nạ mạng con',
          router: 'Bộ định tuyến',
          none: 'Không có'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Tối ưu bộ nhớ',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect."
        },
        swap: {
          title: 'Hoán đổi bộ nhớ',
          tip: 'Nếu sự cố vẫn tiếp diễn sau khi bật tối ưu hóa bộ nhớ, hãy thử bật bộ nhớ trao đổi. Việc này sẽ đặt kích thước tệp hoán đổi thành 256MB theo mặc định, có thể điều chỉnh được trong "Cài đặt > Thiết bị".'
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
        notRunning: 'Tailscale không chạy. Hãy bắt đầu nó để tiếp tục.',
        run: 'Bắt đầu',
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
        logoutDesc: 'Bạn có chắc chắn muốn đăng xuất không?',
        uninstall: 'Gỡ cài đặt Tailscale',
        uninstallDesc: 'Bạn có chắc chắn muốn gỡ cài đặt Tailscale không?',
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
        cancel: 'Hủy',
        preview: 'Bản cập nhật xem trước',
        previewDesc: 'Nhận quyền truy cập sớm vào các tính năng và cải tiến mới',
        previewTip:
          'Xin lưu ý rằng các bản phát hành xem trước có thể có lỗi hoặc chức năng chưa hoàn chỉnh!',
        offline: {
          title: 'Cập nhật ngoại tuyến',
          desc: 'Cập nhật thông qua gói cài đặt cục bộ',
          upload: 'Tải lên',
          invalidName:
            'Định dạng tên tệp không hợp lệ. Vui lòng tải xuống từ bản phát hành GitHub.',
          updateFailed: 'Cập nhật thất bại. Vui lòng thử lại.'
        }
      },
      account: {
        title: 'Tài khoản',
        webAccount: 'Tên tài khoản web',
        password: 'Mật khẩu',
        updateBtn: 'Update',
        logoutBtn: 'Đăng xuất',
        logoutDesc: 'Bạn có chắc chắn muốn đăng xuất không?',
        okBtn: 'Có',
        cancelBtn: 'Không'
      }
    },
    picoclaw: {
      title: 'PicoClaw Trợ lý',
      empty: 'Mở bảng điều khiển và bắt đầu một nhiệm vụ.',
      inputPlaceholder: 'Mô tả những gì bạn muốn PicoClaw làm',
      newConversation: 'Cuộc trò chuyện mới',
      processing: 'Đang xử lý...',
      agent: {
        defaultTitle: 'Trợ lý chung',
        defaultDescription: 'Trợ giúp chung về trò chuyện, tìm kiếm và không gian làm việc.',
        kvmTitle: 'Điều khiển từ xa',
        kvmDescription: 'Vận hành máy chủ từ xa thông qua NanoKVM.',
        switched: 'Vai trò đại lý đã chuyển đổi',
        switchFailed: 'Chuyển đổi vai trò đại lý không thành công'
      },
      send: 'Gửi',
      cancel: 'Hủy',
      status: {
        connecting: 'Đang kết nối với cổng...',
        connected: 'Phiên PicoClaw đã kết nối',
        disconnected: 'Phiên PicoClaw đã ngắt kết nối',
        stopped: 'Đã gửi yêu cầu dừng',
        runtimeStarted: 'Runtime PicoClaw đã bắt đầu',
        runtimeStartFailed: 'Không khởi động được runtime PicoClaw',
        runtimeStopped: 'Runtime PicoClaw đã dừng',
        runtimeStopFailed: 'Không dừng được runtime PicoClaw'
      },
      connection: {
        runtime: {
          checking: 'Đang kiểm tra',
          ready: 'Runtime đã sẵn sàng',
          stopped: 'Đã dừng runtime',
          unavailable: 'Runtime không khả dụng',
          configError: 'Lỗi cấu hình'
        },
        transport: {
          connecting: 'Đang kết nối',
          connected: 'Đã kết nối'
        },
        run: {
          idle: 'Nhàn rỗi',
          busy: 'Bận'
        }
      },
      message: {
        toolAction: 'Hành động',
        observation: 'Quan sát',
        screenshot: 'Ảnh chụp màn hình'
      },
      overlay: {
        locked: 'PicoClaw đang điều khiển thiết bị. Việc nhập thủ công bị tạm dừng.'
      },
      install: {
        install: 'Cài đặt PicoClaw',
        installing: 'Đang cài đặt PicoClaw',
        success: 'PicoClaw cài đặt thành công',
        failed: 'Không cài đặt được PicoClaw',
        uninstalling: 'Đang gỡ cài đặt runtime...',
        uninstalled: 'Đã gỡ cài đặt thành công runtime.',
        uninstallFailed: 'Gỡ cài đặt không thành công.',
        requiredTitle: 'PicoClaw chưa được cài đặt',
        requiredDescription: 'Cài đặt PicoClaw trước khi bắt đầu runtime PicoClaw.',
        progressDescription: 'PicoClaw đang được tải xuống và cài đặt.',
        stages: {
          preparing: 'Đang chuẩn bị',
          downloading: 'Đang tải xuống',
          extracting: 'Đang giải nén',
          installing: 'Đang cài đặt',
          installed: 'Đã cài đặt',
          install_timeout: 'Đã hết thời gian',
          install_failed: 'Không thành công'
        }
      },
      model: {
        requiredTitle: 'Cần có cấu hình mô hình',
        requiredDescription:
          'Định cấu hình mô hình PicoClaw trước khi sử dụng trò chuyện PicoClaw.',
        docsTitle: 'Hướng dẫn cấu hình',
        docsDesc: 'Các mô hình và giao thức được hỗ trợ',
        menuLabel: 'Cấu hình mô hình',
        modelIdentifier: 'Định danh mô hình',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Khóa API',
        apiKeyPlaceholder: 'Nhập khóa API của mô hình',
        save: 'Lưu',
        saving: 'Đang lưu',
        saved: 'Đã lưu cấu hình mô hình',
        saveFailed: 'Không lưu được cấu hình mô hình',
        invalid: 'Bắt buộc nhập mã định danh mô hình, API Base URL và khóa API'
      },
      uninstall: {
        menuLabel: 'Gỡ cài đặt',
        confirmTitle: 'Gỡ cài đặt PicoClaw',
        confirmContent:
          'Bạn có chắc chắn muốn gỡ cài đặt PicoClaw không? Thao tác này sẽ xóa tệp thực thi và tất cả các tệp cấu hình.',
        confirmOk: 'Gỡ cài đặt',
        confirmCancel: 'Hủy'
      },
      history: {
        title: 'Lịch sử',
        loading: 'Đang tải phiên...',
        emptyTitle: 'Chưa có lịch sử',
        emptyDescription: 'Các phiên PicoClaw trước đó sẽ xuất hiện ở đây.',
        loadFailed: 'Không tải được lịch sử phiên',
        deleteFailed: 'Không xóa được phiên',
        deleteConfirmTitle: 'Xóa phiên',
        deleteConfirmContent: 'Bạn có chắc chắn muốn xóa "{{title}}" không?',
        deleteConfirmOk: 'Xóa',
        deleteConfirmCancel: 'Hủy',
        messageCount_one: '{{count}} tin nhắn',
        messageCount_other: '{{count}} tin nhắn'
      },
      config: {
        startRuntime: 'Bắt đầu PicoClaw',
        stopRuntime: 'Dừng PicoClaw'
      },
      start: {
        title: 'Bắt đầu PicoClaw',
        description: 'Bắt đầu runtime để sử dụng trợ lý PicoClaw.'
      }
    },
    error: {
      title: 'Chúng tôi đã gặp sự cố',
      refresh: 'Làm mới'
    },
    fullscreen: {
      toggle: 'Chuyển đổi toàn màn hình'
    },
    menu: {
      collapse: 'Thu gọn Menu',
      expand: 'Mở rộng Menu'
    }
  }
};

export default vi;
