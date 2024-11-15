const vi = {
  translation: {
    language: 'Ngôn ngữ',
    changePassword: 'Đổi mật khẩu',
    logout: 'Đăng xuất',
    settings: 'Cài đặt',
    showMouse: 'Hiển thị chuột',
    hideMouse: 'Ẩn chuột',
    power: 'Nguồn',
    reset: 'Đặt lại',
    powerShort: 'Nguồn (nhấp ngắn)',
    powerLong: 'Nguồn (nhấp dài)',
    hddLed: 'Đèn HDD',
    checkLibFailed: 'Kiểm tra thư viện runtime thất bại, vui lòng thử lại',
    updateLibFailed: 'Cập nhật thư viện runtime thất bại, vui lòng thử lại',
    updatingLib: 'Đang cập nhật thư viện runtime. Vui lòng làm mới trang sau khi cập nhật.',
    checkForUpdate: 'Kiểm tra cập nhật',
    head: {
      desktop: 'Remote Desktop',
      login: 'Đăng nhập',
      changePassword: 'Đổi mật khẩu',
      terminal: 'Terminal'
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
      resetPassword: 'Đặt lại mật khẩu',
      reset1: 'Nếu bạn quên mật khẩu, vui lòng làm theo các bước sau để đặt lại:',
      reset2: '1. Đăng nhập vào thiết bị NanoKVM qua SSH;',
      reset3: '2. Xóa tệp trong thiết bị: ',
      reset4: '3. Sử dụng tài khoản mặc định để đăng nhập: ',
      ok: 'OK',
      cancel: 'Hủy',
      loginButtonText: 'Đăng nhập'
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
        'Tính toán sự khác biệt giữa các khung hình. Dừng truyền video khi không có thay đổi trên màn hình máy chủ từ xa.'
    },
    keyboard: {
      paste: 'Dán',
      tips: 'Chỉ hỗ trợ các chữ cái và ký hiệu bàn phím tiêu chuẩn',
      placeholder: 'Vui lòng nhập',
      submit: 'Gửi',
      virtual: 'Bàn phím'
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
      sending: 'Đang gửi lệnh...',
      sent: 'Đã gửi lệnh',
      input: 'Vui lòng nhập địa chỉ MAC',
      ok: 'OK'
    },
    about: {
      title: 'Giới thiệu về NanoKVM',
      information: 'Thông tin',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'Phiên bản Ứng dụng',
      image: 'Phiên bản Hình ảnh',
      deviceKey: 'Khóa Thiết bị',
      queryFailed: 'Truy vấn thất bại',
      community: 'Cộng đồng'
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
    virtualDevice: {
      network: 'Mạng Ảo',
      disk: 'Đĩa Ảo'
    },
    tailscale: {
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
      logout2: 'Bạn có chắc chắn muốn đăng xuất không?'
    }
  }
};

export default vi;
