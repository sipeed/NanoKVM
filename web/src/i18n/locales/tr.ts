const tr = {
  translation: {
    head: {
      desktop: 'Uzak masaüstü',
      login: 'Giriş',
      changePassword: 'Şifreyi değiştir',
      terminal: 'Uçbirim',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Giriş',
      placeholderUsername: 'Kullanıcı Adı',
      placeholderPassword: 'Şifre',
      placeholderPassword2: 'Şifrenizi tekrar deneyiniz',
      noEmptyUsername: 'Kullanıcı adı gereklidir',
      noEmptyPassword: 'Şifre gereklidir',
      noAccount: 'Kullanıcı verileri alınırken hata yaşandı, lütfen sayfayı yenileyiniz ya da şifrenizi sıfırlayınız',
      invalidUser: 'Yanlış kullanıcı adı ya da şifre',
      error: 'Beklenmedik bir hata',
      changePassword: 'Şifrenizi değiştiriniz',
      changePasswordDesc: 'Güvenlik sebebiyle lütfen şifrenizi değiştiriniz!',
      differentPassword: 'Şifreler eşleşmemektedir',
      illegalUsername: 'Kullanıcı adı istenmeyen karakterler içermektedir',
      illegalPassword: 'Şifre istenmeyen karakterler içermektedir',
      forgetPassword: 'Şifremi unuttum',
      ok: 'Tamam',
      cancel: 'İptal',
      loginButtonText: 'Giriş',
      tips: {
        reset1:
          'Şifreleri sıfırlamak için NanoKVM üzerinde bulunan BOOT tuşuna 10 saniye boyunca basılı tutun.',
        reset2: 'Ayrıntılı adımlar için dökümana göz atın:',
        reset3: 'Arayüz varsayılan hesap:',
        reset4: 'Güvenli Kabuk Bağlantısı (SSH) varsayılan hesap:',
        change1: 'Bu işlem şu şifreleri değiştiricektir:',
        change2: 'Arayüz giriş şifresi',
        change3: 'Sistem yöneticisi şifresi (Güvenli Kabuk Bağlantısı (SSH) giriş şifresi)',
        change4: 'Şifreleri sıfırlamak için NanoKVM üzerinde bulunan BOOT tuşuna 10 saniye boyunca basılı tutun.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'NanoKVM için Wi-Fi ayarlarını ayarlayın',
      success: 'NanoKVM\'in bağlantı durumunu kontrol edin ve yeni IP adresini ziyaret edin.',
      failed: 'İşlem başarısız oldu, lütfen tekrar deneyiniz.',
      confirmBtn: 'Tamam',
      finishBtn: 'Bitti'
    },
    screen: {
      title: 'Ekran',
      video: 'Görüntü modu',
      videoDirectTips: 'kullanmak için "Ayarlar > Cihaz" HTTPS aktif edin',
      resolution: 'Çözünürlük',
      auto: 'Otomatik',
      autoTips:
        "Belirli çözünürlüklerde ekran yırtılması veya fare kayması meydana gelebilir. Bu durumda uzak ana bilgisayarın çözünürlüğünü ayarlamayı ya da otomatik modu devre dışı bırakmayı deneyin.",
      fps: 'Saniyedeki kare sayısı',
      customizeFps: 'Kişiselleştir',
      quality: 'Kalite',
      qualityLossless: 'Kayıpsız',
      qualityHigh: 'Yüksek',
      qualityMedium: 'Orta',
      qualityLow: 'Düşük',
      frameDetect: 'Kareleri algıla',
      frameDetectTip:
        "Gönderilen kareler arasındaki farkı hesaplar. Uzak ana bilgisayardan gönderilen yayında bir değişiklik yoksa görüntü yayınını durdurur.",
      resetHdmi: 'HDMI sıfırla'
    },
    keyboard: {
      title: 'Klavye',
      paste: 'Yapıştır',
      tips: 'Sadece standart klavye harfleri ve sembolleri desteklenmektedir.',
      placeholder: 'Girdi',
      submit: 'Gönder',
      virtual: 'Klavye',
      ctrlaltdel: 'Ctrl+Alt+Del'
    },
    mouse: {
      title: 'Fare',
      cursor: 'İmleç sitili',
      default: 'Varsayılan imleç',
      pointer: 'Nokta imleç',
      cell: 'Artı imleç',
      text: 'Yazı imleç',
      grab: 'El imleç',
      hide: 'İmleci gizle',
      mode: 'Fare modu',
      absolute: 'Mutlak fare modu',
      relative: 'Bağıl fare modu',
      speed: 'Tekerlek hızı',
      fast: 'Hızlı',
      slow: 'Yavaş',
      requestPointer: 'Bağıl fare modu kullanılıyor. Masaüstüne tıklayarak imleç elde edinin.',
      resetHid: 'İnsan Arayüz Cihazı\'nı sıfırlayın',
      hidOnly: {
        title: 'Sadece İnsan Arayüz Cihazı modu',
        desc: "Eğer fare ve klavye çalışmayı bırakırsa ve İnsan Arayüz Cihazı\'nı sıfırlamak sorunu çözmezse bunun sebebi cihazınız ve NanoKVM arasındaki bir uyumluluk sorunu olabilir. Uyumluluğu arttırmak için Sadece İnsan Arayüz Cihazı modunu kullanın.",
        tip1: 'Sadece İnsan Arayüz Cihazı modunu aktifleştirmek, sanal U-disk’i ve sanal ağı devre dışı bırakacaktır.',
        tip2: 'Sadece İnsan Arayüz Cihazı modunda disk imajı bağlama özelliği devre dışı bırakılır',
        tip3: 'NanoKVM mod değişiminden sonra kendiliğinden yeniden başlatılacaktır',
        enable: 'Sadece İnsan Arayüz Cihazı modunu aktifleştir',
        disable: 'Sadece İnsan Arayüz Cihazı modunu devre dışı bırak'
      }
    },
    image: {
      title: 'Disk İmajları',
      loading: 'Yükleniyor...',
      empty: 'Hiçbir şey bulunamadı',
      cdrom: 'Disk imajını CD-ROM modunda bağlayın.',
      mountFailed: 'Bağlantı başarısız oldu',
      mountDesc:
        "Bazı sistemlerde, disk imajını bağlamadan önce uzak ana bilgisayardaki sanal diski çıkarmak gerekir.",
      refresh: 'Disk imajı listesini yenile',
      tips: {
        title: 'Nasıl yüklenir',
        usb1: 'NanoKVM\'i bilgisayarınıza USB ile bağlayın.',
        usb2: 'Sanal diskin bağlı olduğundan emin olun (Ayarlar - Sanal Disk).',
        usb3: 'Sanal diski bilgisayarınızda açın ve disk imajı dosyanızı sanal diskin kök dizinine kopyalayın.',
        scp1: 'NanoKVM ve bilgisayarınızın aynı yerel ağda bulunduğundan emin olun.',
        scp2: 'Bilgisayarınızda uçbirimi açın ve disk imajı dosyanını SCP komudunu kullanarak NanoKVM\'in /data dizinine yükleyin.',
        scp3: 'Örnek: scp senin-disk-imajı-dizinin root@senin-nanokvm-ip:/data',
        tfCard: 'micro SD kart',
        tf1: 'Bu yöntem Linux sistemlerde desteklenmektedir.',
        tf2: 'NanoKVM\'den micro SD kartı çıkartın(TAM sürüm için öncelikle kutuyu sökün).',
        tf3: 'micro SD kartı kart okuyucusuna takın ve bilgisayarınıza bağlayın.',
        tf4: 'Disk imajı dosyanını micro SD kartın /data dizinine kopyalayın.',
        tf5: 'micro SD kartı NanoKVM\'e geri yerleştirin.'
      }
    },
    script: {
      title: 'Betikler',
      upload: 'Yükle',
      run: 'Çalıştır',
      runBackground: 'Arka planda çalıştır',
      runFailed: 'Çalıştırma başarısız oldu',
      attention: 'Dikkat',
      delDesc: 'Bu dosyayı silmek istediğinden emin misin?',
      confirm: 'Evet',
      cancel: 'Hayır',
      delete: 'Sil',
      close: 'Kapat'
    },
    terminal: {
      title: 'Uçbirim',
      nanokvm: 'NanoKVM Uçbirimi',
      serial: 'Serial Port Uçbirimi',
      serialPort: 'Serial Port',
      serialPortPlaceholder: 'Lütfen serial portunu giriniz',
      baudrate: 'Baud hızı',
      parity: 'Eşlik kontrolü',
      parityNone: 'Yok',
      parityEven: 'Çift',
      parityOdd: 'Tek',
      flowControl: 'Akış kontrolü',
      flowControlNone: 'Yok',
      flowControlSoft: 'Yazılımsal',
      flowControlHard: 'Donanımsal',
      dataBits: 'Veri bitleri',
      stopBits: 'Dur bitleri',
      confirm: 'Tamam'
    },
    wol: {
      title: 'Ağ Üzerinden Uyandırma (WOL)',
      sending: 'Komut gönderiliyor...',
      sent: 'Komut gönderildi',
      input: 'MAC adresi girin',
      ok: 'Tamam'
    },
    download: {
      title: 'Disk İmajı İndirici',
      input: 'Uzaktaki disk imajı adresini girin',
      ok: 'Tamam',
      disabled: '/data bölüntüsü salt okunur modda, disk imajı indirilemiyor.'
    },
    power: {
      title: 'Güç',
      showConfirm: 'Doğrulama',
      showConfirmTip: 'Güç ile ilgili işlemler fazladan doğrulama gerektirir',
      reset: 'Sıfırla',
      power: 'Güç',
      powerShort: 'Güç tuşu (bas-çek)',
      powerLong: 'Güç tuşu (uzun bas)',
      resetConfirm: 'Sıfırlama işlemine devam etmek istediğinizden emin misiniz?',
      powerConfirm: 'Güç işlemine devam etmek istediğinizden emin misiniz?',
      okBtn: 'Evet',
      cancelBtn: 'Hayır'
    },
    settings: {
      title: 'Ayarlar',
      about: {
        title: 'NanoKVM Hakkında',
        information: 'Bilgi',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Uygulama sürümü',
        applicationTip: 'NanoKVM web uygulaması sürümü',
        image: 'İmaj Sürümü',
        imageTip: 'NanoKVM sistem imajı sürümü',
        deviceKey: 'Cihaz Anahtarı',
        community: 'Topluluk',
        hostname: 'Hostname',
        hostnameUpdated: 'Hostname güncellendi. Uygulamak için yeniden başlatın.',
        ipType: {
          Wired: 'Kablolu bağlantı',
          Wireless: 'Kablosuz bağlantı',
          Other: 'Diğer'
        }
      },
      appearance: {
        title: 'Görünüm',
        display: 'Ekran',
        language: 'Dil',
        menuBar: 'Menü çubuğu',
        menuBarDesc: 'Menü çubuğunda ikonları göster',
        webTitle: 'Site başlığı',
        webTitleDesc: 'Görünen site başlığını güncelleyin'
      },
      device: {
        title: 'Cihaz',
        oled: {
          title: 'OLED',
          description: 'Oled ekranı ... sonra kapatın',
          0: 'Hiçbir zaman',
          15: '15 saniye',
          30: '30 saniye',
          60: '1 dakika',
          180: '3 dakika',
          300: '5 dakika',
          600: '10 dakika',
          1800: '30 dakika',
          3600: '1 saat'
        },
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi ayarlayın',
          setBtn: 'Ayarla'
        },
        ssh: {
          description: 'Güvenli Kabuk Bağlantısı (SSH) aktif et',
          tip: 'Aktifleştirmeden önce güçlü bir şifreye sahip olduğunuzdan emin olun (Hesap - Şifremi Değiştir)'
        },
        tls: {
          description: 'HTTPS protokolünü etkinleştir',
          tip: 'HTTPS protokolü bağlantıda gecikmeye sebep olabilir, özellikle MJPEG görüntü modu ile.'
        },
        advanced: 'Gelişmiş Ayarlar',
        swap: {
          title: 'Swap',
          disable: 'Aktifleştir',
          description: 'Swap dosyasının boyutunu belirle',
          tip: "Bu özelliği aktifleştirmek micro SD kartınızın ömrünü kısaltabilir!"
        },
        mouseJiggler: {
          title: 'Fare Oynatıcı',
          description: 'Uzak ana bilgisayarın uykuya geçmesini engeller',
          disable: 'Devre dışı bırak',
          absolute: 'Mutlak mod',
          relative: 'Bağıl mod'
        },
        mdns: {
          description: 'mDNS keşif hizmetini etkinleştir',
          tip: "Kullanmıyorsanız devre dışı bırakabilirsiniz"
        },
        hdmi: {
          description: 'HDMI/Momitör çıktısını aktifleştir'
        },
        hidOnly: 'Sadece İnsan Arayüz Cihazı modu',
        disk: 'Sanal Disk',
        diskDesc: 'Sanal U-disk\'i uzak ana bilgisayara bağla',
        network: 'Sanal Ağ',
        networkDesc: 'Sanal ağ kartını uzak ana bilgisayara bağla',
        reboot: 'Yeniden Başlat',
        rebootDesc: 'NanoKVM\'i yeniden başlatmak istediğinizden emin misiniz?',
        okBtn: 'Evet',
        cancelBtn: 'Hayır'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Bellek optimizasyonu',
          tip: "Bellek kullanımı sınırı aştığında, belleği boşaltmak amacıyla çöp toplama işlemi daha agresif bir şekilde gerçekleştirilir. Tailscale kullanıyorsanız bu değerin 75 MB olarak ayarlanması önerilir. Değişikliğin etkili olabilmesi için Tailscale'in yeniden başlatılması gerekir.",
          disable: 'Devre dışı bırak'
        },
        restart: 'Tailscale\'i yeniden başlat?',
        stop: 'Tailscale\'i durdur?',
        stopDesc: 'Tailscale oturumundan çıkış yap ve başlangıçta çalışmasını devre dışı bırak.',
        loading: 'Yükleniyor...',
        notInstall: 'Tailscale bulunamadı! Lütfen indirin.',
        install: 'İndir',
        installing: 'İndiriliyor',
        failed: 'İndirme başarısız oldu',
        retry: 'Lütfen sayfayı yenileyin ve tekrar deneyin, ya da manuel indirin',
        download: 'İndir',
        package: 'yükleme paketi',
        unzip: 'sıkışmış dosyayı açın',
        upTailscale: 'tailscale dosyasını NanoKVM\'in /usr/bin dizinine yükleyin',
        upTailscaled: 'tailscaled dosyasını NanoKVM\'in /usr/sbin dizinine yükleyin',
        refresh: 'İçinde bulunduğunuz sayfayı yenileyin',
        notLogin:
          'Cihaz bağlı değil. Lütfen giriş yapıp cihazınızı hesabınıza bağlayın.',
        urlPeriod: 'Adres sadece 10 ndakika boyunca geçerlidir',
        login: 'Giriş yap',
        loginSuccess: 'Giriş yapıldı',
        enable: 'Tailscale\'i etkinleştir',
        deviceName: 'Cihaz Adı',
        deviceIP: 'Cihaz IP adresi',
        account: 'Hesap',
        logout: 'Çıkış yap',
        logoutDesc: 'Çıkış yapmak istediğinizden emin misiniz?',
        uninstall: 'Tailscale\'i kaldır',
        okBtn: 'Evet',
        cancelBtn: 'Hayır'
      },
      update: {
        title: 'Güncelleştirmeleri kontrol et',
        queryFailed: 'Sürüm bilgisi alınamadı',
        updateFailed: 'Güncelleme başarısız oldu. Lütfen tekrar deneyin.',
        isLatest: 'En yeni sürüme sahipsiniz.',
        available: 'Bir güncelleme indirilebilir. Şimdi güncellemek istediğinizden emin misiniz?',
        updating: 'Güncelleme başlatıldı. Lütfen bekleyin...',
        confirm: 'Onayla',
        cancel: 'İptal',
        preview: 'Ön İzleme Güncellemeleri',
        previewDesc: 'En son geliştirmelere ve özelliklere erken erişin',
        previewTip:
          'Ön izleme güncellemelerinin tamamlanmamış olduğunu ve sorunlara sebep olabileceğini unutmayın!'
      },
      account: {
        title: 'Hesap',
        webAccount: 'Web Hesap Adı',
        password: 'Şifre',
        updateBtn: 'Değiştir',
        logoutBtn: 'Çıkış  yap',
        logoutDesc: 'Çıkış yapmak istediğinizden emin misiniz?',
        okBtn: 'Evet',
        cancelBtn: 'Hayır'
      }
    },
    error: {
      title: "Bir hata oldu!",
      refresh: 'Yenile'
    },
    fullscreen: {
      toggle: 'Tam ekrana geç'
    },
    menu: {
      collapse: 'Menüyü küçült',
      expand: 'Menüyü genişlet'
    }
  }
};

export default tr;
