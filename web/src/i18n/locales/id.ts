const id = {
  translation: {
    head: {
      desktop: 'Desktop jarak jauh',
      login: 'Masuk',
      changePassword: 'Ubah Sandi',
      terminal: 'Terminal',
      wifi: 'Wi-Fi',
      storage: 'Gambar dan berbagi file'
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
      },
      placeholderCurrentPassword: 'Kata sandi saat ini',
      passwordLength: 'Kata sandi harus antara 8 dan 72 karakter',
      invalidCurrentPassword: 'Kata sandi saat ini salah'
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
    desktop: {
      readOnly: 'Hanya lihat',
      readOnlyTip:
        'Akun ini tidak dapat mengirim input keyboard atau tikus ke mesin target, sehingga konsol hanya menampilkan layar.'
    },
    noConsole: {
      title: 'Akun ini tidak memiliki akses konsol',
      description:
        'Akun ini diberi kemampuan lain. Buka salah satu halaman yang dapat dipakai, atau minta administrator memberikan akses konsol.',
      nothing: 'Akun ini belum memiliki izin apa pun. Minta administrator memberikannya.'
    },
    screen: {
      scale: 'Skala',
      title: 'Layar',
      video: 'Mode Video',
      videoDirectTips: 'Aktifkan HTTPS di "Pengaturan > Perangkat" untuk menggunakan mode ini',
      resolution: 'Resolusi',
      controlRegion: {
        title: 'Kalibrasi Tetikus',
        description:
          'Gunakan pengaturan ini saat perangkat yang dikontrol menggunakan resolusi selain 16:9 dan posisi kursor tidak sejajar secara horizontal atau vertikal.',
        off: 'Nonaktif',
        auto: 'Otomatis',
        autoWarning:
          'Kalibrasi mungkin gagal jika aplikasi pengguna menggunakan latar belakang hitam pekat.',
        manual: 'Manual',
        selectedResolution: 'Resolusi Area Terpilih',
        unused: 'Tidak digunakan',
        originalResolution: 'Resolusi Asli',
        selectResolution: 'Pilih resolusi asli',
        addResolution: 'Tambahkan resolusi khusus',
        add: 'Tambah',
        duplicateResolution: 'Resolusi ini sudah ada.',
        width: 'Lebar',
        height: 'Tinggi',
        apply: 'Hitung dan Terapkan',
        invalidResolution: 'Masukkan resolusi asli yang valid setelah video siap.',
        select: 'Pilih Area',
        clear: 'Pulihkan Otomatis',
        saveFailed: 'Gagal menyimpan area input.',
        tooSmall: 'Area yang dipilih terlalu kecil.',
        previewUnavailable: 'Pratinjau tidak tersedia',
        clearConfirm: 'Pulihkan deteksi batas hitam otomatis?',
        dragHint: 'Seret untuk memilih area desktop jarak jauh',
        finish: 'Selesai',
        confirm: 'Konfirmasi',
        cancel: 'Batal'
      },
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
      resetHdmi: 'Atur ulang HDMI',
      mixedH264: {
        title: 'Konflik aliran H.264',
        description:
          'H.264 Direct dan H.264 WebRTC sedang digunakan secara bersamaan. Hal ini dapat menyebabkan layar robek atau video rusak. Harap gunakan hanya satu mode H.264.'
      },
      webrtcConnectionFailed: {
        title: 'Koneksi WebRTC gagal',
        description: 'Periksa koneksi jaringan atau ganti mode video.'
      },
      captureStatus: {
        hdmiError: 'Kesalahan layar HDMI',
        unsupportedResolution: 'Resolusi saat ini tidak didukung',
        retrieving: 'Mengambil layar...',
        changingResolution: 'Mengganti resolusi...',
        updateFailed: 'Layar tidak dapat diperbarui saat ini',
        videoError: 'Kesalahan tampilan video',
        noHdmi: 'Sinyal HDMI tidak terdeteksi',
        unavailable: 'Layar tidak dapat ditampilkan saat ini'
      }
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
    storage: {
      title: 'Gambar dan berbagi file',
      empty: 'Belum ada gambar. Unggah ISO atau IMG, atau salin satu ke disk dari komputer target.',
      notAttached: 'Tidak ada yang terpasang',
      attached: 'Terpasang: {{name}}',
      eject: 'Keluarkan',
      mount: 'Pasang',
      mountMode: 'Mode pemasangan',
      mountModeDisk: 'Penyimpanan massal',
      mountModeCdrom: 'CD-ROM',
      openManager: 'Buka pengelola file',
      refresh: 'Segarkan',
      delete: 'Hapus',
      deleteTitle: 'Hapus media',
      deleteConfirm: 'Hapus {{name}}? File di dalamnya akan hilang.',
      downloadImage: 'Unduh gambar',
      typePartition: 'File bersama',
      volumeLabel: 'Disk yang dapat dilepas',
      groups: {
        share: 'Berbagi file',
        images: 'Gambar'
      },
      failed: 'Operasi gagal',
      hidOnly: 'Mode hanya HID: disk virtual tidak tersedia',
      disabled: 'Disk virtual dinonaktifkan (Pengaturan - Perangkat)',
      force: {
        title: 'Ambil kembali media dengan paksa?',
        desc: 'Komputer target masih menggunakan media ini. Mengambilnya kembali akan menghitung ulang perangkat USB dan dapat kehilangan apa pun yang belum ditulisnya ke disk.',
        menuHint:
          'Komputer target sedang menggunakan media ini. Buka pengelola file untuk mengambilnya kembali dengan paksa.'
      },
      tips: {
        title: 'Cara mengunggah',
        usb1: 'Hubungkan NanoKVM ke komputer Anda melalui USB.',
        usb2: 'Di halaman ini, pasang berkas bersama dalam mode penyimpanan massal.',
        usb3: 'Buka disk virtual di komputer Anda dan salin file gambar ke direktori root disk virtual.',
        usb4: 'Keluarkan disk setelah penyalinan selesai: image kemudian muncul di daftar.',
        scp1: 'Pastikan NanoKVM dan komputer Anda berada di jaringan lokal yang sama.',
        scp2: 'Buka terminal di komputer Anda dan gunakan perintah SCP untuk mengunggah file gambar ke direktori /data di NanoKVM.',
        scp3: 'Contoh: scp jalur-gambar-anda root@ip-nanokvm-anda:/data',
        tfCard: 'Kartu TF',
        tf1: 'Metode ini didukung di sistem linux',
        tf2: 'Dapatkan Kartu TF dari NanoKVM (untuk versi LENGKAP, bongkar casingnya terlebih dahulu).',
        tf3: 'Masukkan Kartu TF ke pembaca kartu dan hubungkan ke komputer Anda.',
        tf4: 'Salin berkas gambar ke direktori /data pada Kartu TF.',
        tf5: 'Masukkan Kartu TF ke dalam NanoKVM.'
      },
      job: {
        running: 'Memproses {{name}}'
      },
      enableDisk: {
        title: 'Aktifkan disk virtual?',
        desc: 'Untuk memasang media diperlukan disk virtual, yang saat ini dimatikan. Aktifkan sekarang? Papan ketik dan tetikus komputer target akan terputus sebentar.',
        menuHint: 'Disk virtual dinonaktifkan. Aktifkan di Pengaturan - Perangkat.',
        askDevice:
          'Disk virtual nonaktif. Akun dengan izin perangkat harus mengaktifkannya terlebih dahulu.'
      },
      add: {
        title: 'Tambah media',
        upload: 'Unggah ISO atau IMG',
        fromUrl: 'Unduh dari URL',
        url: 'URL gambar',
        urlRequired: 'Masukkan URL',
        onlyImages: 'Hanya file .iso dan .img yang dapat dipasang',
        dropHint: 'Seret ISO atau IMG ke sini, atau klik untuk memilih file',
        cdromOnlyIso: 'CD-ROM hanya dapat berisi citra ISO 9660',
        uploadFailed: 'Unggahan gagal',
        downloadFailed: 'Unduhan gagal',
        uploading: 'Mengunggah {{name}}',
        downloading: 'Mengunduh {{name}}',
        done: '{{name}} siap',
        checksumFailed: 'Image tidak cocok dengan checksum SHA-256.',
        blocked: 'Komputer target sedang menggunakan disk',
        copyHint:
          'Anda juga dapat menyalin citra ke partisi data lewat SCP, atau dari komputer target.'
      },
      files: {
        selectMedium: 'Pilih media untuk melihat file di dalamnya.',
        reasonAttached: 'Media ini terpasang ke komputer target.',
        reasonAttachedHint:
          'Keluarkan dulu: komputer target harus melepaskan disk sebelum filenya dapat dibaca.',
        reasonNotBrowsable:
          'Media ini berisi sistem berkas yang tidak dapat dibuka pengelola file.',
        reasonNoLoop: 'Perangkat ini tidak dapat memasang image disk (tanpa dukungan loop).',
        reasonISOImage:
          'Citra ISO 9660 tidak dapat dijelajahi di sini. Citra tetap dapat dipasang ke komputer target.',
        empty: 'Folder ini kosong',
        noMatch: 'Tidak ada file yang cocok dengan pencarian.',
        free: '{{size}} kosong',
        search: 'Cari di folder ini',
        sort: {
          name: 'Nama',
          size: 'Ukuran',
          type: 'Jenis',
          asc: 'Naik',
          desc: 'Turun'
        },
        upload: 'Unggah file ke media',
        deleteFolderTitle: 'Hapus folder',
        deleteFolderConfirm:
          'Hapus folder {{name}} beserta seluruh isinya? Tindakan ini tidak dapat dibatalkan.',
        uploading: 'Mengunggah…',
        uploadFailed: 'Unggahan gagal',
        download: 'Unduh',
        delete: 'Hapus',
        deleteTitle: 'Hapus file',
        deleteConfirm: 'Hapus {{name}} dari media?'
      },
      yes: 'Ya',
      no: 'Tidak'
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
      disabled:
        'Partisi data bersifat hanya-baca selama komputer target memakainya: citra baru tidak dapat ditulis, file yang ada tetap dapat diunduh.',
      sha256: 'SHA-256 (opsional)',
      sha256Placeholder: 'Masukkan checksum SHA-256 64 karakter',
      invalidSHA256: 'SHA-256 harus berupa string heksadesimal 64 karakter',
      cancel: 'Batal',
      cancelFailed: 'Gagal membatalkan unduhan'
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
      mcp: {
        title: 'Layanan MCP',
        service: 'Kontrol jarak jauh MCP',
        serviceDesc:
          'Izinkan klien MCP tepercaya mengontrol keyboard dan mouse serta mengambil tangkapan layar',
        securityWarning:
          'Siapa pun yang memiliki kunci API ini dapat mengontrol host jarak jauh dan melihat layarnya. Gunakan HTTPS dan aktifkan hanya pada jaringan tepercaya.',
        endpoint: 'Endpoint',
        apiKey: 'Kunci API',
        regenerateConfirmTitle: 'Buat ulang kunci API MCP?',
        regenerateConfirmDesc: 'Kunci saat ini akan langsung berhenti berfungsi.',
        enableConfirmTitle: 'Aktifkan kontrol MCP eksternal?',
        enableConfirmDesc:
          'Mengaktifkan MCP akan menghentikan PicoClaw dan menutup semua sesi PicoClaw yang aktif.',
        failed: 'Operasi MCP gagal',
        copyFailed: 'Gagal menyalin. Salin secara manual.',
        okBtn: 'Konfirmasi',
        cancelBtn: 'Batal'
      },
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
          keyboardLedStatus: 'Indikator kunci keyboard',
          keyboardLedStatusDesc:
            'Tampilkan status Num Lock, Caps Lock, dan Scroll Lock komputer jarak jauh',
          icons: 'Ikon Submenu',
          iconsDesc: 'Menampilkan ikon submenu di bilah menu'
        }
      },
      keyboardLedStatus: {
        groupLabel: 'Status kunci keyboard jarak jauh',
        indicatorLabel: '{{label}}: {{state}}',
        numLock: 'Num Lock',
        numLockShort: 'Num',
        capsLock: 'Caps Lock',
        capsLockShort: 'Caps',
        scrollLock: 'Scroll Lock',
        scrollLockShort: 'Scr',
        on: 'Aktif',
        off: 'Nonaktif',
        unknown: 'Tidak diketahui'
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
          description: 'Aktifkan keluaran HDMI/monitor',
          idleTimeoutTitle: 'Batas waktu tangkapan tidak aktif',
          idleTimeoutDescription: 'Hentikan tangkapan HDMI setelah tidak ada penonton aktif selama',
          minutes: 'mnt'
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
        cancelBtn: 'Tidak',
        diskLocked: 'Off while an image is mounted (turning it on cancels the mount)',
        diskCancelMount:
          'Enabling the virtual disk cancels the mounted image and interrupts a running image download or upload. Continue?',
        diskBreakDownload: 'Enabling the virtual disk interrupts the image download. Continue?',
        attention: 'Perhatian',
        updateFailed: 'Gagal memperbarui perangkat virtual'
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
        customServer: {
          title: 'Server Pembaruan Kustom',
          desc: 'Periksa dan unduh pembaruan daring dari server yang ditentukan',
          invalidUrl:
            'Masukkan direktori server HTTP atau HTTPS yang valid tanpa kueri, fragmen, atau latest.json.',
          loadFailed: 'Gagal memuat konfigurasi server pembaruan.',
          saveFailed: 'Gagal menyimpan konfigurasi server pembaruan.',
          saved: 'Konfigurasi server pembaruan telah disimpan.',
          save: 'Simpan',
          confirmTitle: 'Gunakan server pembaruan kustom?',
          confirmDesc:
            'SHA-512 hanya memeriksa bahwa paket cocok dengan manifes yang disediakan oleh server ini. Pemeriksaan ini tidak membuktikan bahwa paket tersebut merupakan rilis resmi NanoKVM. Server yang bermasalah atau berbahaya dapat membuat perangkat tidak dapat digunakan, menyebabkan kehilangan data, atau membahayakan sistem.',
          confirm: 'Tetap Gunakan',
          previewDisabled:
            'Pembaruan Pratinjau tidak tersedia saat server pembaruan kustom diaktifkan.'
        },
        offline: {
          title: 'Pembaruan Offline',
          desc: 'Perbarui melalui paket instalasi lokal',
          upload: 'Mengunggah',
          checksumPlaceholder: 'Checksum SHA-256 (opsional)',
          invalidChecksum: 'Checksum SHA-256 harus berisi 64 karakter heksadesimal.',
          checksumMismatch: 'Verifikasi SHA-256 gagal. Paket mungkin rusak.',
          invalidName: 'Format nama file tidak valid. Silakan unduh dari rilis GitHub.',
          updateFailed: 'Gagal memperbarui, tolong coba lagi.'
        }
      },
      account: {
        title: 'Akun',
        webAccount: 'Nama akun web',
        password: 'Kata sandi',
        updateBtn: 'Update',
        logoutBtn: 'Keluar',
        logoutDesc: 'Apakah Anda yakin ingin logout?',
        okBtn: 'Ya',
        cancelBtn: 'Tidak',
        role: 'Peran',
        roles: {
          admin: 'Administrator',
          user: 'Pengguna'
        },
        users: {
          title: 'Pengguna',
          create: 'Buat pengguna',
          enabled: 'Diaktifkan',
          disabled: 'Dinonaktifkan',
          deviceOwner: 'Pemilik perangkat',
          resetPassword: 'Setel ulang kata sandi',
          delete: 'Hapus',
          deleteConfirm: 'Hapus pengguna ini dan cabut semua sesinya?',
          created: 'Pengguna dibuat',
          deleted: 'Pengguna dihapus',
          passwordUpdated: 'Kata sandi diperbarui',
          loadFailed: 'Gagal memuat pengguna',
          saveFailed: 'Gagal menyimpan pengguna',
          deleteFailed: 'Gagal menghapus pengguna',
          editPermissions: 'Izin'
        },
        permissions: {
          title: 'Izin',
          editTitle: 'Edit izin',
          save: 'Simpan',
          saved: 'Tersimpan',
          close: 'Tutup',
          groupConsole: 'Konsol',
          groupTarget: 'Mesin target',
          groupLibrary: 'Pustaka media',
          groupHost: 'Perangkat ini',
          groupServices: 'Layanan',
          consoleView: 'Lihat layar',
          consoleControl: 'Keyboard dan mouse',
          power: 'Daya dan bangunkan',
          mediumAttach: 'Pasang media',
          libraryRead: 'Jelajahi pustaka',
          libraryWrite: 'Kelola pustaka',
          terminal: 'Terminal dan skrip',
          device: 'Pengaturan perangkat',
          network: 'Pengaturan jaringan',
          update: 'Pembaruan sistem',
          mcp: 'Layanan MCP',
          tailscale: 'Tailscale',
          ai: 'Asisten AI',
          effectConsoleView:
            'Menampilkan layar target dan mengatur mode video, resolusi, laju bingkai, serta kualitas yang dipakai bersama semua penonton.',
          effectConsoleControl: 'Mengirim masukan keyboard dan mouse ke mesin target.',
          effectPower:
            'Menyalakan, mematikan, dan memulai ulang mesin target, serta mengelola daftar perangkat Wake-on-LAN.',
          effectMediumAttach:
            'Memasang dan melepas media pada mesin target, serta bertukar berkas dengannya melalui partisi bersama.',
          effectLibraryRead: 'Menampilkan dan mengunduh image beserta berkas di dalamnya.',
          effectLibraryWrite:
            'Mengunggah, membuat, dan menghapus image, serta mengubah berkas di dalamnya.',
          effectTerminal: 'Memberi shell root di perangkat ini tanpa melalui sesi web.',
          effectDevice:
            'Memungkinkan mengaktifkan SSH (juga root), memulai ulang perangkat, menyerahkan partisi data mentah ke mesin target, dan mengubah pengaturan OLED, HDMI, mDNS, memori, serta swap.',
          effectNetwork:
            'Mengubah Wi-Fi, DNS, dan TLS, yang dapat memutus perangkat ini dari jaringan.',
          effectUpdate: 'Memasang firmware dan paket aplikasi.',
          effectMcp:
            'Menerbitkan kunci API untuk seluruh perangkat yang mengendalikan keyboard, mouse, dan tangkapan layar di luar sesi web; kunci tetap berlaku setelah izin ini dicabut sampai dibuat ulang.',
          effectTailscale: 'Menghubungkan perangkat ini ke jaringan VPN.',
          effectAi:
            'Mengendalikan perangkat melalui antarmuka lokal yang tidak dibatasi izin lain, sehingga setara dengan kendali penuh atas perangkat.',
          fullControlWarning: 'Izin ini setara dengan kendali penuh atas perangkat:',
          emptyWarning: 'Akun ini tidak akan memiliki fitur apa pun dan hanya bisa masuk.',
          impliedBy: 'Termasuk oleh {{name}}',
          grantCount: '{{count}} izin',
          adminAll: 'Administrator memiliki semua izin',
          catalogFailed: 'Daftar izin gagal dimuat. Tutup dialog ini dan coba lagi.'
        }
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
        runtimeStopFailed: 'Gagal menghentikan Runtime PicoClaw',
        controlSwitchedToMCP: 'Kontrol dialihkan ke layanan MCP eksternal'
      },
      connection: {
        runtime: {
          checking: 'Memeriksa',
          restoring: 'Restoring PicoClaw',
          ready: 'Runtime siap',
          stopped: 'Runtime dihentikan',
          blockedByMCP: 'Kontrol MCP eksternal sedang aktif',
          readyBlockedByMCP:
            'The runtime is running, but external MCP currently controls device input.',
          readyWithoutControl:
            'The runtime is running. Grant PicoClaw device control before reconnecting.',
          unavailable: 'Runtime tidak tersedia',
          configError: 'Kesalahan konfigurasi'
        },
        transport: {
          connecting: 'Menghubungkan',
          connected: 'Terhubung',
          disconnected: 'Disconnected',
          reconnect: 'Reconnect',
          reconnectDescription: 'Reconnect to the running PicoClaw session.',
          reconnectBlocked: 'PicoClaw needs device control before reconnecting.'
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
      control: {
        picoclaw: 'Kontrol perangkat: PicoClaw',
        picoclawDescription: 'PicoClaw can write keyboard and mouse input. Manual input may pause.',
        mcp: 'Kontrol perangkat: MCP eksternal',
        mcpDescription: 'External MCP can write to the device. PicoClaw will not take over input.',
        off: 'Kontrol perangkat: nonaktif',
        offDescription:
          'AI will not write keyboard or mouse input. Manual control remains available.',
        transitioning: 'Device control: switching',
        transitioningDescription: 'Device control is syncing. Please wait.',
        grant: 'Berikan kontrol',
        release: 'Lepaskan',
        releasing: 'Releasing...',
        switching: 'Switching...',
        releasingLabel: 'Device control: releasing',
        releasingDescription:
          'Device control is being returned. PicoClaw has stopped current writes.',
        granted: 'Kontrol PicoClaw diberikan',
        released: 'Kontrol PicoClaw dilepaskan',
        grantFailed: 'Gagal memberikan kontrol PicoClaw',
        releaseFailed: 'Gagal melepaskan kontrol PicoClaw',
        grantConfirmTitle: 'Alihkan kontrol perangkat ke PicoClaw?',
        grantConfirmDesc: 'Penulisan perangkat MCP eksternal akan dihentikan.'
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
          verifying: 'Memverifikasi',
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
        messageCount_other: '{{count}} pesan',
        messageCount: '{{count}} pesan'
      },
      config: {
        startRuntime: 'Mulai PicoClaw',
        stopRuntime: 'Hentikan PicoClaw'
      },
      start: {
        enableConfirmTitle: 'Alihkan kontrol ke PicoClaw?',
        enableConfirmDesc: 'Memulai PicoClaw akan menonaktifkan layanan MCP eksternal.',
        enableConfirmOk: 'Mulai PicoClaw',
        enableConfirmCancel: 'Batal',
        title: 'Mulai PicoClaw',
        description: 'Mulai runtime untuk mulai menggunakan asisten PicoClaw.',
        switchFromMCP: 'Switch to PicoClaw and start',
        takeoverAndStart: 'Take over and start'
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
