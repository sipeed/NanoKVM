const id = {
  translation: {
    head: {
      desktop: 'Desktop jarak jauh',
      login: 'Masuk',
      changePassword: 'Ubah Sandi',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Masuk',
      placeholderUsername: 'Silahkan masukkan username',
      placeholderPassword: 'Silahkan masukkan password',
      placeholderPassword2: 'Silahkan masukkan password again',
      noEmptyUsername: 'nama user tidak boleh kosong',
      noEmptyPassword: 'sandi  tidak boleh kosong',
      noAccount:
        'Gagal mendapatkan informasi user, silahkan segarkan halaman atau atur ulang sandi',
      invalidUser: 'invalid username or password',
      locked: 'Terlalu banyak login, silakan coba lagi nanti',
      globalLocked: 'Sistem dalam perlindungan, silakan coba lagi nanti',
      error: 'terjadi kesalahan tak terduga',
      changePassword: 'Ganti Sandi',
      changePasswordDesc: 'Untuk keamanan perangkat Anda, silakan ubah kata sandi masuk web.',
      differentPassword: 'sandi tidak sesuai',
      illegalUsername: 'ada karakter ilegal pada nama user',
      illegalPassword: 'ada karakter ilegal pada sandi',
      forgetPassword: 'Lupa Sandi',
      ok: 'Ok',
      cancel: 'Batalkan',
      loginButtonText: 'Masuk',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'Untuk langkah-langkah rinci, lihat dokumen ini:',
        reset3: 'Akun web default:',
        reset4: 'Akun SSH default:',
        change1: 'Perhatikan bahwa tindakan ini akan mengubah kata sandi berikut:',
        change2: 'Kata sandi login web',
        change3: 'Kata sandi root sistem (kata sandi login SSH)',
        change4: 'Untuk mengatur ulang kata sandi, tekan dan tahan tombol BOOT pada NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Konfigurasi Wi-Fi untuk NanoKVM',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'Operasi gagal, silakan coba lagi.',
      invalidMode:
        'Mode saat ini tidak mendukung pengaturan jaringan. Silakan buka perangkat Anda dan aktifkan mode konfigurasi Wi-Fi.',
      confirmBtn: 'Ok',
      finishBtn: 'Selesai',
      ap: {
        authTitle: 'Otentikasi Diperlukan',
        authDescription: 'Silakan masukkan kata sandi AP untuk melanjutkan',
        authFailed: 'Kata sandi AP tidak valid',
        passPlaceholder: 'AP kata sandi',
        verifyBtn: 'Verifikasi'
      }
    },
    screen: {
      scale: 'Skala',
      title: 'Layar',
      video: 'Mode Video',
      videoDirectTips: 'Aktifkan HTTPS di "Pengaturan > Perangkat" untuk menggunakan mode ini',
      resolution: 'Resolusi',
      auto: 'Otomatis',
      autoTips:
        'Tearing layar atau offset tetikus dapat terjadi pada resolusi tertentu. Pertimbangkan untuk menyesuaikan resolusi host jarak jauh atau menonaktifkan mode otomatis.',
      fps: 'FPS',
      customizeFps: 'Sesuaikan',
      quality: 'Kualitas',
      qualityLossless: 'Tanpa Kehilangan',
      qualityHigh: 'Tinggi',
      qualityMedium: 'Sedang',
      qualityLow: 'Rendah',
      frameDetect: 'Deteksi bingkai',
      frameDetectTip:
        'Hitung selisih antar frame. Hentikan transmisi aliran video saat tidak ada perubahan yang terdeteksi di layar host jarak jauh.',
      resetHdmi: 'Atur ulang HDMI'
    },
    keyboard: {
      title: 'Keyboard',
      paste: 'Tempel',
      tips: 'Hanya huruf dan simbol keyboard standar yang didukung',
      placeholder: 'Silahkan isi',
      submit: 'Kirimkan',
      virtual: 'Keyboard',
      readClipboard: 'Membaca dari Papan Klip',
      clipboardPermissionDenied:
        'Izin papan klip ditolak. Harap izinkan akses clipboard di browser Anda.',
      clipboardReadError: 'Gagal membaca papan klip',
      dropdownEnglish: 'Bahasa Inggris',
      dropdownGerman: 'Jerman',
      dropdownFrench: 'Perancis',
      dropdownRussian: 'Rusia',
      shortcut: {
        title: 'Pintasan',
        custom: 'Adat',
        capture: 'Klik di sini untuk mengambil pintasan',
        clear: 'Jelas',
        save: 'Simpan',
        captureTips:
          'Menangkap tombol tingkat sistem (seperti tombol Windows) memerlukan izin layar penuh.',
        enterFullScreen: 'Beralih ke mode layar penuh.'
      },
      leaderKey: {
        title: 'Tombol Leader',
        desc: 'Lewati batasan browser dan kirim pintasan sistem langsung ke host jarak jauh.',
        howToUse: 'Cara Menggunakan',
        simultaneous: {
          title: 'Mode Simultan',
          desc1: 'Tekan dan tahan tombol Leader, lalu tekan pintasan.',
          desc2: 'Intuitif, tetapi mungkin bertentangan dengan pintasan sistem.'
        },
        sequential: {
          title: 'Mode Berurutan',
          desc1:
            'Tekan tombol Leader → tekan pintasan secara berurutan → tekan tombol Leader lagi.',
          desc2: 'Memerlukan lebih banyak langkah, namun sepenuhnya menghindari konflik sistem.'
        },
        enable: 'Aktifkan tombol Leader',
        tip: 'Saat ditetapkan sebagai tombol Leader, tombol ini hanya berfungsi sebagai pemicu pintasan dan kehilangan perilaku defaultnya.',
        placeholder: 'Tekan tombol Leader',
        shiftRight: 'Shift kanan',
        ctrlRight: 'Ctrl kanan',
        metaRight: 'Win kanan',
        submit: 'Kirimkan',
        recorder: {
          rec: 'REKAM',
          activate: 'Aktifkan tombol',
          input: 'Silakan tekan pintasan...'
        }
      }
    },
    mouse: {
      title: 'Tikus',
      cursor: 'Gaya kursor',
      default: 'Kursor bawaan',
      pointer: 'Kursor penunjuk',
      cell: 'Kursor cell',
      text: 'Kursor teks',
      grab: 'Kursor ambil',
      hide: 'Sembunyikan kursor',
      mode: 'Mode tetikus',
      absolute: 'Mode absolut',
      relative: 'Mode relatif',
      direction: 'Arah roda gulir',
      scrollUp: 'Gulir ke atas',
      scrollDown: 'Gulir ke bawah',
      speed: 'Kecepatan roda gulir',
      fast: 'Cepat',
      slow: 'Lambat',
      requestPointer:
        'Menggunakan mode relatf. Silakan klik desktop untuk mendapatkan penunjuk tetikus.',
      resetHid: 'Setel ulang HID',
      hidOnly: {
        title: 'Mode hanya HID',
        desc: 'Jika mouse dan keyboard Anda berhenti merespons dan menyetel ulang HID tidak membantu, mungkin ada masalah kompatibilitas antara NanoKVM dan perangkat. Coba aktifkan mode HID-Only untuk kompatibilitas yang lebih baik.',
        tip1: 'Mengaktifkan mode HID-Hanya akan melepas U-disk virtual dan jaringan virtual',
        tip2: 'Dalam mode HID-Only, pemasangan gambar dinonaktifkan',
        tip3: 'NanoKVM akan otomatis reboot setelah berpindah mode',
        enable: 'Aktifkan mode HID-Hanya',
        disable: 'Nonaktifkan mode HID-Hanya'
      }
    },
    image: {
      title: 'Gambar',
      loading: 'Memuat...',
      empty: 'Tidak ada yang ditemukan',
      mountMode: 'Mode pemasangan',
      mountFailed: 'Pemasangan Gagal',
      mountDesc:
        'Di beberapa sistem, perlu mengeluarkan disk virtual pada host jarak jauh sebelum memasang gambar.',
      unmountFailed: 'Pelepasan gagal',
      unmountDesc:
        'Pada beberapa sistem, Anda perlu mengeluarkan secara manual dari host jarak jauh sebelum melepas gambar.',
      refresh: 'Segarkan daftar gambar',
      attention: 'Perhatian',
      deleteConfirm: 'Apakah Anda yakin ingin menghapus gambar ini?',
      okBtn: 'Ya',
      cancelBtn: 'Tidak',
      tips: {
        title: 'Cara mengunggah',
        usb1: 'Hubungkan NanoKVM ke komputer Anda melalui USB.',
        usb2: 'Pastikan disk virtual telah terpasang (Pengaturan - Disk Virtual).',
        usb3: 'Buka disk virtual di komputer Anda dan salin file gambar ke direktori root disk virtual.',
        scp1: 'Pastikan NanoKVM dan komputer Anda berada di jaringan lokal yang sama.',
        scp2: 'Buka terminal di komputer Anda dan gunakan perintah SCP untuk mengunggah file gambar ke direktori /data di NanoKVM.',
        scp3: 'Contoh: scp jalur-gambar-anda root@ip-nanokvm-anda:/data',
        tfCard: 'Kartu TF',
        tf1: 'Metode ini didukung di sistem linux',
        tf2: 'Dapatkan Kartu TF dari NanoKVM (untuk versi LENGKAP, bongkar casingnya terlebih dahulu).',
        tf3: 'Masukkan Kartu TF ke pembaca kartu dan hubungkan ke komputer Anda.',
        tf4: 'Salin berkas gambar ke direktori /data pada Kartu TF.',
        tf5: 'Masukkan Kartu TF ke dalam NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Mengunggah',
      run: 'Jalankan',
      runBackground: 'Jalankan di belakang',
      runFailed: 'Gagal menjalankan',
      attention: 'Perhatian',
      delDesc: 'Apa kamu yakin menghapus data ini?',
      confirm: 'Ya',
      cancel: 'Tidak',
      delete: 'Hapus',
      close: 'Tutup'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal NanoKVM',
      serial: 'Terminal Port Serial',
      serialPort: 'Port Serial',
      serialPortPlaceholder: 'Silahkan masukkan port serial',
      baudrate: 'Baud rate',
      parity: 'Paritas',
      parityNone: 'Tidak ada',
      parityEven: 'Genap',
      parityOdd: 'Ganjil',
      flowControl: 'Kontrol aliran',
      flowControlNone: 'Tidak ada',
      flowControlSoft: 'Perangkat lunak',
      flowControlHard: 'Perangkat keras',
      dataBits: 'Bit data',
      stopBits: 'Hentikan bit',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Kirim perintah...',
      sent: 'Perintah terkirim',
      input: 'Silahkan masukkan MAC',
      ok: 'Ok'
    },
    download: {
      title: 'Pengunduh Gambar',
      input: 'Silakan masukkan gambar jarak jauh URL',
      ok: 'Ok',
      disabled: 'Partisi /data adalah RO, jadi kami tidak dapat mengunduh gambarnya',
      uploadbox: 'Letakkan file di sini atau klik untuk memilih',
      inputfile: 'Silakan masukkan File gambar',
      NoISO: 'Tidak ada ISO'
    },
    power: {
      title: 'Daya',
      showConfirm: 'Konfirmasi',
      showConfirmTip: 'Pengoperasian listrik memerlukan konfirmasi tambahan',
      reset: 'Mulai Ulang',
      power: 'Daya',
      powerShort: 'Data (tekan sebentar)',
      powerLong: 'Power (tekan lama)',
      resetConfirm: 'Lanjutkan operasi penyetelan ulang?',
      powerConfirm: 'Lanjutkan pengoperasian listrik?',
      okBtn: 'Ya',
      cancelBtn: 'Tidak'
    },
    settings: {
      title: 'Pengaturan',
      about: {
        title: 'Tentang NanoKVM',
        information: 'Informasi',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Versi Aplikasi',
        applicationTip: 'Versi aplikasi web NanoKVM',
        image: 'Version Gambar',
        imageTip: 'Versi image sistem NanoKVM',
        deviceKey: 'Kunci Perangkat',
        community: 'Komunitas',
        hostname: 'Nama Host',
        hostnameUpdated: 'Nama host diperbarui. Nyalakan ulang untuk menerapkan.',
        ipType: {
          Wired: 'Berkabel',
          Wireless: 'Nirkabel',
          Other: 'Lainnya'
        }
      },
      appearance: {
        title: 'Tampilan',
        display: 'Layar',
        language: 'Bahasa',
        languageDesc: 'Pilih bahasa untuk antarmuka',
        webTitle: 'Judul Web',
        webTitleDesc: 'Menyesuaikan judul halaman web',
        menuBar: {
          title: 'Bilah Menu',
          mode: 'Mode Tampilan',
          modeDesc: 'Menampilkan bilah menu di layar',
          modeOff: 'Mati',
          modeAuto: 'Sembunyikan otomatis',
          modeAlways: 'Selalu terlihat',
          icons: 'Ikon Submenu',
          iconsDesc: 'Menampilkan ikon submenu di bilah menu'
        }
      },
      device: {
        title: 'Perangkat',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Tidak pernah',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 jam'
        },
        ssh: {
          description: 'Aktifkan akses jarak jauh SSH',
          tip: 'Tetapkan kata sandi yang kuat sebelum mengaktifkan (Akun - Ubah Kata Sandi)'
        },
        advanced: 'Pengaturan Lanjutan',
        swap: {
          title: 'Tukar',
          disable: 'Nonaktifkan',
          description: 'Atur ukuran file swap',
          tip: 'Mengaktifkan fitur ini dapat mempersingkat masa pakai kartu SD Anda!'
        },
        mouseJiggler: {
          title: 'Tikus Jiggler',
          description: 'Mencegah host jarak jauh tertidur',
          disable: 'Nonaktifkan',
          absolute: 'Mode Absolut',
          relative: 'Mode Relatif'
        },
        mdns: {
          description: 'Aktifkan layanan penemuan mDNS',
          tip: 'Mematikan jika tidak diperlukan'
        },
        hdmi: {
          description: 'Aktifkan keluaran HDMI/monitor'
        },
        autostart: {
          title: 'Pengaturan Skrip Mulai Otomatis',
          description: 'Mengelola skrip yang berjalan secara otomatis saat startup sistem',
          new: 'Baru',
          deleteConfirm: 'Apa kamu yakin menghapus data ini?',
          yes: 'Ya',
          no: 'Tidak',
          scriptName: 'Nama Skrip Mulai Otomatis',
          scriptContent: 'Konten Skrip Mulai Otomatis',
          settings: 'Pengaturan'
        },
        hidOnly: 'HID-Mode Hanya',
        hidOnlyDesc: 'Berhenti meniru perangkat virtual, hanya mempertahankan kontrol dasar HID',
        disk: 'Disk virtual',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Jaringan virtual',
        networkDesc: 'Pasang kartu jaringan virtual pada host jarak jauh',
        reboot: 'Mulai ulang',
        rebootDesc: 'Apakah Anda yakin ingin me-reboot NanoKVM?',
        okBtn: 'Ya',
        cancelBtn: 'Tidak'
      },
      network: {
        title: 'Jaringan',
        wifi: {
          title: 'Wi-Fi',
          description: 'Konfigurasi Wi-Fi',
          apMode: 'Mode AP aktif, sambungkan ke Wi-Fi dengan memindai kode QR',
          connect: 'Hubungkan Wi-Fi',
          connectDesc1: 'Masukkan SSID jaringan dan kata sandi',
          connectDesc2: 'Masukkan kata sandi untuk bergabung ke jaringan ini',
          disconnect: 'Yakin ingin memutuskan jaringan?',
          failed: 'Koneksi gagal, coba lagi.',
          ssid: 'Nama',
          password: 'Kata sandi',
          joinBtn: 'Gabung',
          confirmBtn: 'OK',
          cancelBtn: 'Batal'
        },
        tls: {
          description: 'Aktifkan protokol HTTPS',
          tip: 'Perhatian: Menggunakan HTTPS dapat meningkatkan latensi, terutama pada mode video MJPEG.'
        },
        dns: {
          title: 'DNS',
          description: 'Konfigurasi server DNS untuk NanoKVM',
          mode: 'Mode',
          dhcp: 'DHCP',
          manual: 'Manual',
          add: 'Tambah DNS',
          save: 'Simpan',
          invalid: 'Masukkan alamat IP yang valid',
          noDhcp: 'DNS DHCP saat ini tidak tersedia',
          saved: 'Pengaturan DNS disimpan',
          saveFailed: 'Gagal menyimpan pengaturan DNS',
          unsaved: 'Perubahan belum disimpan',
          maxServers: 'Maksimal {{count}} server DNS diizinkan',
          dnsServers: 'Server DNS',
          dhcpServersDescription: 'Server DNS diperoleh otomatis dari DHCP',
          manualServersDescription: 'Server DNS dapat diedit secara manual',
          networkDetails: 'Detail Jaringan',
          interface: 'Antarmuka',
          ipAddress: 'Alamat IP',
          subnetMask: 'Subnet mask',
          router: 'Router',
          none: 'Tidak ada'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Optimasi memori',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect."
        },
        swap: {
          title: 'Tukar memori',
          tip: 'Jika masalah terus berlanjut setelah mengaktifkan pengoptimalan memori, coba aktifkan memori swap. Ini menetapkan ukuran file swap ke 256MB secara default, yang dapat disesuaikan di "Pengaturan > Perangkat".'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
        loading: 'Memuat...',
        notInstall: 'Tailscale tidak ditemukan! Silahkan pasang.',
        install: 'Memasang',
        installing: 'Memasangkan',
        failed: 'Gagal memasangkan',
        retry: 'Harap segarkan dan coba lagi. Atau coba instal secara manual',
        download: 'Mengunduh',
        package: 'paket instalasi',
        unzip: 'dan unzip itu',
        upTailscale: 'Unggah tailscale ke direktori NanoKVM /usr/bin/',
        upTailscaled: 'Unggah tailscaled ke direktori NanoKVM /usr/sbin/',
        refresh: 'Segarkan halaman ini',
        notRunning: 'Tailscale tidak berjalan. Silakan mulai untuk melanjutkan.',
        run: 'Mulai',
        notLogin:
          'Perangkat belum ditautkan. Silakan masuk dan tautkan perangkat ini ke akun Anda.',
        urlPeriod: 'Url ini berlaku selama 10 menit',
        login: 'Masuk',
        loginSuccess: 'Berhasil masuk',
        enable: 'Aktifkan Tailscale',
        deviceName: 'Nama Perangkat',
        deviceIP: 'IP Perangkat',
        account: 'Akun',
        logout: 'Keluar',
        logoutDesc: 'Apakah Anda yakin ingin logout?',
        uninstall: 'Copot pemasangan Tailscale',
        uninstallDesc: 'Apakah Anda yakin ingin menghapus instalan Tailscale?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Periksa pembaruan',
        queryFailed: 'Gagal mendapatkan versi',
        updateFailed: 'Gagal memperbarui, tolong coba lagi.',
        isLatest: 'Kamu sudah menggunakan versi terbaru.',
        available: 'Ada pembaruan baru. apa kamu mau memperbarui?',
        updating: 'Pembaruan dimulai. Silahkan tunggu...',
        confirm: 'Konfirmasi',
        cancel: 'Batalkan',
        preview: 'Pratinjau Pembaruan',
        previewDesc: 'Dapatkan akses awal ke fitur dan peningkatan baru',
        previewTip:
          'Perlu diketahui bahwa rilis pratinjau mungkin mengandung bug atau fungsi yang tidak lengkap!',
        offline: {
          title: 'Pembaruan Offline',
          desc: 'Perbarui melalui paket instalasi lokal',
          upload: 'Mengunggah',
          invalidName: 'Format nama file tidak valid. Silakan unduh dari rilis GitHub.',
          updateFailed: 'Gagal memperbarui, tolong coba lagi.'
        }
      },
      users: {
        title: 'Manajemen Pengguna',
        addUser: 'Tambah Pengguna',
        colUsername: 'Nama Pengguna',
        colRole: 'Peran',
        colEnabled: 'Aktif',
        colActions: 'Tindakan',
        rolesTitle: 'Ikhtisar Peran',
        roleAdmin: 'Akses penuh + manajemen pengguna',
        roleOperator: 'Penggunaan KVM: stream, keyboard, mouse, tombol daya',
        roleViewer: 'Hanya melihat stream',
        changePassword: 'Ubah Kata Sandi',
        newPassword: 'Kata Sandi Baru',
        confirmPassword: 'Konfirmasi Kata Sandi',
        pwdMismatch: 'Kata sandi tidak cocok',
        pwdSuccess: 'Kata sandi berhasil diubah',
        pwdFailed: 'Gagal mengubah kata sandi',
        password: 'Kata Sandi',
        delete: 'Hapus',
        deleteConfirm: 'Anda yakin ingin menghapus pengguna ini?',
        createSuccess: 'Pengguna dibuat',
        createFailed: 'Gagal membuat pengguna',
        deleteSuccess: 'Pengguna dihapus',
        deleteFailed: 'Gagal menghapus',
        updateSuccess: 'Diperbarui',
        updateFailed: 'Pembaruan gagal',
        loadFailed: 'Gagal memuat pengguna',
        usernameRequired: 'Masukkan nama pengguna',
        passwordRequired: 'Masukkan kata sandi',
        okBtn: 'OK',
        cancelBtn: 'Batal'
      },
      account: {
        title: 'Akun',
        webAccount: 'Nama akun web',
        password: 'Kata sandi',
        updateBtn: 'Update',
        logoutBtn: 'Keluar',
        logoutDesc: 'Apakah Anda yakin ingin logout?',
        okBtn: 'Ya',
        cancelBtn: 'Tidak'
      }
    },
    picoclaw: {
      title: 'PicoClaw Asisten',
      empty: 'Buka panel dan mulai tugas untuk memulai.',
      inputPlaceholder: 'Jelaskan apa yang Anda ingin PicoClaw lakukan',
      newConversation: 'Percakapan baru',
      processing: 'Memproses...',
      agent: {
        defaultTitle: 'Asisten umum',
        defaultDescription: 'Obrolan umum, pencarian, dan bantuan ruang kerja.',
        kvmTitle: 'Kontrol jarak jauh',
        kvmDescription: 'Operasikan host jarak jauh melalui NanoKVM.',
        switched: 'Peran agen dialihkan',
        switchFailed: 'Gagal mengganti peran agen'
      },
      send: 'Kirim',
      cancel: 'Batalkan',
      status: {
        connecting: 'Menghubungkan ke gerbang...',
        connected: 'Sesi PicoClaw terhubung',
        disconnected: 'Sesi PicoClaw ditutup',
        stopped: 'Permintaan penghentian terkirim',
        runtimeStarted: 'Runtime PicoClaw dimulai',
        runtimeStartFailed: 'Gagal memulai Runtime PicoClaw',
        runtimeStopped: 'Runtime PicoClaw dihentikan',
        runtimeStopFailed: 'Gagal menghentikan Runtime PicoClaw'
      },
      connection: {
        runtime: {
          checking: 'Memeriksa',
          ready: 'Runtime siap',
          stopped: 'Runtime dihentikan',
          unavailable: 'Runtime tidak tersedia',
          configError: 'Kesalahan konfigurasi'
        },
        transport: {
          connecting: 'Menghubungkan',
          connected: 'Terhubung'
        },
        run: {
          idle: 'Menganggur',
          busy: 'Sibuk'
        }
      },
      message: {
        toolAction: 'Aksi',
        observation: 'Pengamatan',
        screenshot: 'Tangkapan layar'
      },
      overlay: {
        locked: 'PicoClaw sedang mengendalikan perangkat. Input manual dijeda.'
      },
      install: {
        install: 'Instal PicoClaw',
        installing: 'Menginstal PicoClaw',
        success: 'PicoClaw berhasil diinstal',
        failed: 'Gagal menginstal PicoClaw',
        uninstalling: 'Mencopot pemasangan runtime...',
        uninstalled: 'Runtime berhasil di-uninstall.',
        uninstallFailed: 'Pencopotan pemasangan gagal.',
        requiredTitle: 'PicoClaw tidak diinstal',
        requiredDescription: 'Instal PicoClaw sebelum memulai runtime PicoClaw.',
        progressDescription: 'PicoClaw sedang diunduh dan diinstal.',
        stages: {
          preparing: 'Mempersiapkan',
          downloading: 'Mengunduh',
          extracting: 'Mengekstraksi',
          installing: 'Memasangkan',
          installed: 'Terpasang',
          install_timeout: 'Waktu Habis',
          install_failed: 'Gagal'
        }
      },
      model: {
        requiredTitle: 'Konfigurasi model diperlukan',
        requiredDescription: 'Konfigurasikan model PicoClaw sebelum menggunakan obrolan PicoClaw.',
        docsTitle: 'Panduan Konfigurasi',
        docsDesc: 'Model dan protokol yang didukung',
        menuLabel: 'Konfigurasi model',
        modelIdentifier: 'Pengenal Model',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Kunci API',
        apiKeyPlaceholder: 'Masukkan kunci API model',
        save: 'Simpan',
        saving: 'Menyimpan',
        saved: 'Konfigurasi model disimpan',
        saveFailed: 'Gagal menyimpan konfigurasi model',
        invalid: 'Pengidentifikasi model, API Base URL, dan kunci API wajib diisi'
      },
      uninstall: {
        menuLabel: 'Copot pemasangan',
        confirmTitle: 'Copot pemasangan PicoClaw',
        confirmContent:
          'Apakah Anda yakin ingin menghapus instalan PicoClaw? Ini akan menghapus semua file yang dapat dieksekusi dan konfigurasi.',
        confirmOk: 'Copot pemasangan',
        confirmCancel: 'Batalkan'
      },
      history: {
        title: 'Riwayat',
        loading: 'Memuat sesi...',
        emptyTitle: 'Belum ada riwayat',
        emptyDescription: 'Sesi PicoClaw sebelumnya akan muncul di sini.',
        loadFailed: 'Gagal memuat riwayat sesi',
        deleteFailed: 'Gagal menghapus sesi',
        deleteConfirmTitle: 'Hapus sesi',
        deleteConfirmContent: 'Apakah Anda yakin ingin menghapus "{{title}}"?',
        deleteConfirmOk: 'Hapus',
        deleteConfirmCancel: 'Batalkan',
        messageCount_one: '{{count}} pesan',
        messageCount_other: '{{count}} pesan'
      },
      config: {
        startRuntime: 'Mulai PicoClaw',
        stopRuntime: 'Hentikan PicoClaw'
      },
      start: {
        title: 'Mulai PicoClaw',
        description: 'Mulai runtime untuk mulai menggunakan asisten PicoClaw.'
      }
    },
    error: {
      title: 'Kami mengalami masalah',
      refresh: 'Segarkan'
    },
    fullscreen: {
      toggle: 'Beralih Layar Penuh'
    },
    menu: {
      collapse: 'Tutup Menu',
      expand: 'Perluas Menu'
    }
  }
};

export default id;
