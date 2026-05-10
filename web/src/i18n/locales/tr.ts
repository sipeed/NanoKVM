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
      noAccount:
        'Kullanıcı verileri alınırken hata yaşandı, lütfen sayfayı yenileyiniz ya da şifrenizi sıfırlayınız',
      invalidUser: 'Yanlış kullanıcı adı ya da şifre',
      locked: 'Çok fazla giriş yapıldı, lütfen daha sonra tekrar deneyin',
      globalLocked: 'Sistem koruma altında, lütfen daha sonra tekrar deneyin',
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
        change4:
          'Şifreleri sıfırlamak için NanoKVM üzerinde bulunan BOOT tuşuna 10 saniye boyunca basılı tutun.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'NanoKVM için Wi-Fi ayarlarını ayarlayın',
      success: "NanoKVM'in bağlantı durumunu kontrol edin ve yeni IP adresini ziyaret edin.",
      failed: 'İşlem başarısız oldu, lütfen tekrar deneyiniz.',
      invalidMode:
        'Geçerli mod ağ kurulumunu desteklemiyor. Lütfen cihazınıza gidin ve Wi-Fi yapılandırma modunu etkinleştirin.',
      confirmBtn: 'Tamam',
      finishBtn: 'Bitti',
      ap: {
        authTitle: 'Kimlik Doğrulaması Gerekli',
        authDescription: 'Devam etmek için lütfen AP şifresini girin',
        authFailed: 'Geçersiz AP şifresi',
        passPlaceholder: 'AP şifre',
        verifyBtn: 'Doğrula'
      }
    },
    screen: {
      scale: 'Ölçek',
      title: 'Ekran',
      video: 'Görüntü modu',
      videoDirectTips: 'kullanmak için "Ayarlar > Cihaz" HTTPS aktif edin',
      resolution: 'Çözünürlük',
      auto: 'Otomatik',
      autoTips:
        'Belirli çözünürlüklerde ekran yırtılması veya fare kayması meydana gelebilir. Bu durumda uzak ana bilgisayarın çözünürlüğünü ayarlamayı ya da otomatik modu devre dışı bırakmayı deneyin.',
      fps: 'Saniyedeki kare sayısı',
      customizeFps: 'Kişiselleştir',
      quality: 'Kalite',
      qualityLossless: 'Kayıpsız',
      qualityHigh: 'Yüksek',
      qualityMedium: 'Orta',
      qualityLow: 'Düşük',
      frameDetect: 'Kareleri algıla',
      frameDetectTip:
        'Gönderilen kareler arasındaki farkı hesaplar. Uzak ana bilgisayardan gönderilen yayında bir değişiklik yoksa görüntü yayınını durdurur.',
      resetHdmi: 'HDMI sıfırla'
    },
    keyboard: {
      title: 'Klavye',
      paste: 'Yapıştır',
      tips: 'Sadece standart klavye harfleri ve sembolleri desteklenmektedir.',
      placeholder: 'Girdi',
      submit: 'Gönder',
      virtual: 'Klavye',
      readClipboard: 'Panodan Oku',
      clipboardPermissionDenied:
        'Pano izni reddedildi. Lütfen tarayıcınızda pano erişimine izin verin.',
      clipboardReadError: 'Pano okunamadı',
      dropdownEnglish: 'İngilizce',
      dropdownGerman: 'Almanca',
      dropdownFrench: 'Fransızca',
      dropdownRussian: 'Rusça',
      shortcut: {
        title: 'Kısayollar',
        custom: 'Özel',
        capture: 'Kısayolu yakalamak için burayı tıklayın',
        clear: 'Temizle',
        save: 'Kaydet',
        captureTips:
          'Windows tuşu gibi sistem düzeyi tuşları yakalamak için tam ekran izni gerekir.',
        enterFullScreen: 'Tam ekran moduna geçiş yapın.'
      },
      leaderKey: {
        title: 'Leader Tuşu',
        desc: 'Tarayıcı kısıtlamalarını atlayın ve sistem kısayollarını doğrudan uzak ana bilgisayara gönderin.',
        howToUse: 'Nasıl Kullanılır',
        simultaneous: {
          title: 'Eşzamanlı Mod',
          desc1: 'Leader tuşunu basılı tutun, ardından kısayola basın.',
          desc2: 'Sezgisel, ancak sistem kısayollarıyla çakışabilir.'
        },
        sequential: {
          title: 'Sıralı Mod',
          desc1: 'Leader tuşuna basın → kısayola sırayla basın → Leader tuşuna tekrar basın.',
          desc2: 'Daha fazla adım gerektirir ancak sistem çakışmalarını tamamen önler.'
        },
        enable: 'Leader tuşunu etkinleştir',
        tip: 'Leader tuşu olarak atandığında bu tuş yalnızca kısayol tetikleyici olarak çalışır ve varsayılan davranışını kaybeder.',
        placeholder: 'Leader tuşuna basın',
        shiftRight: 'Sağ Shift',
        ctrlRight: 'Sağ Ctrl',
        metaRight: 'Sağ Win',
        submit: 'Gönder',
        recorder: {
          rec: 'KAYIT',
          activate: 'Tuşları etkinleştir',
          input: 'Lütfen kısayola basın...'
        }
      }
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
      direction: 'Kaydırma tekerleği yönü',
      scrollUp: 'Yukarı kaydır',
      scrollDown: 'Aşağı kaydır',
      speed: 'Kaydırma tekerleği hızı',
      fast: 'Hızlı',
      slow: 'Yavaş',
      requestPointer: 'Bağıl fare modu kullanılıyor. Masaüstüne tıklayarak imleç elde edinin.',
      resetHid: 'HID’yi sıfırla',
      hidOnly: {
        title: 'Yalnızca HID modu',
        desc: 'Fare ve klavye yanıt vermeyi durdurursa ve HID sıfırlama yardımcı olmazsa, NanoKVM ile cihaz arasında bir uyumluluk sorunu olabilir. Daha iyi uyumluluk için yalnızca HID modunu etkinleştirmeyi deneyin.',
        tip1: 'Yalnızca HID modunu etkinleştirmek sanal U-disk’i ve sanal ağı ayırır',
        tip2: 'Yalnızca HID modunda imaj bağlama devre dışıdır',
        tip3: 'NanoKVM mod değişiminden sonra kendiliğinden yeniden başlatılacaktır',
        enable: 'Yalnızca HID modunu etkinleştir',
        disable: 'Yalnızca HID modunu devre dışı bırak'
      }
    },
    image: {
      title: 'Disk İmajları',
      loading: 'Yükleniyor...',
      empty: 'Hiçbir şey bulunamadı',
      mountMode: 'Montaj modu',
      mountFailed: 'Bağlantı başarısız oldu',
      mountDesc:
        'Bazı sistemlerde, disk imajını bağlamadan önce uzak ana bilgisayardaki sanal diski çıkarmak gerekir.',
      unmountFailed: 'Bağlantıyı kesme işlemi başarısız oldu',
      unmountDesc:
        'Bazı sistemlerde, görüntünün bağlantısını kesmeden önce uzak ana bilgisayardan manuel olarak çıkarmanız gerekir.',
      refresh: 'Disk imajı listesini yenile',
      attention: 'Dikkat',
      deleteConfirm: 'Bu resmi silmek istediğinizden emin misiniz?',
      okBtn: 'Evet',
      cancelBtn: 'Hayır',
      tips: {
        title: 'Nasıl yüklenir',
        usb1: "NanoKVM'i bilgisayarınıza USB ile bağlayın.",
        usb2: 'Sanal diskin bağlı olduğundan emin olun (Ayarlar - Sanal Disk).',
        usb3: 'Sanal diski bilgisayarınızda açın ve disk imajı dosyanızı sanal diskin kök dizinine kopyalayın.',
        scp1: 'NanoKVM ve bilgisayarınızın aynı yerel ağda bulunduğundan emin olun.',
        scp2: "Bilgisayarınızda uçbirimi açın ve disk imajı dosyanını SCP komudunu kullanarak NanoKVM'in /data dizinine yükleyin.",
        scp3: 'Örnek: scp senin-disk-imajı-dizinin root@senin-nanokvm-ip:/data',
        tfCard: 'micro SD kart',
        tf1: 'Bu yöntem Linux sistemlerde desteklenmektedir.',
        tf2: "NanoKVM'den micro SD kartı çıkartın(TAM sürüm için öncelikle kutuyu sökün).",
        tf3: 'micro SD kartı kart okuyucusuna takın ve bilgisayarınıza bağlayın.',
        tf4: 'Disk imajı dosyanını micro SD kartın /data dizinine kopyalayın.',
        tf5: "micro SD kartı NanoKVM'e geri yerleştirin."
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
      serialPort: 'Seri port',
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
      input: 'Uzak imaj URL’sini girin',
      ok: 'Tamam',
      disabled: '/data bölüntüsü salt okunur modda, disk imajı indirilemiyor.',
      uploadbox: 'Dosyayı buraya bırakın veya seçmek için tıklayın',
      inputfile: 'Lütfen resim dosyasını giriniz',
      NoISO: 'ISO yok'
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
        hostname: 'Ana makine adı',
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
        languageDesc: 'Arayüz için dili seçin',
        webTitle: 'Site başlığı',
        webTitleDesc: 'Görünen site başlığını güncelleyin',
        menuBar: {
          title: 'Menü Çubuğu',
          mode: 'Görüntüleme Modu',
          modeDesc: 'Ekranda menü çubuğunu görüntüle',
          modeOff: 'Kapalı',
          modeAuto: 'Otomatik gizle',
          modeAlways: 'Her zaman görünür',
          icons: 'Alt Menü Simgeleri',
          iconsDesc: 'Menü çubuğunda alt menü simgelerini görüntüle'
        }
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
        ssh: {
          description: 'Güvenli Kabuk Bağlantısı (SSH) aktif et',
          tip: 'Aktifleştirmeden önce güçlü bir şifreye sahip olduğunuzdan emin olun (Hesap - Şifremi Değiştir)'
        },
        advanced: 'Gelişmiş Ayarlar',
        swap: {
          title: 'Swap',
          disable: 'Aktifleştir',
          description: 'Swap dosyasının boyutunu belirle',
          tip: 'Bu özelliği aktifleştirmek micro SD kartınızın ömrünü kısaltabilir!'
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
          tip: 'Kullanmıyorsanız devre dışı bırakabilirsiniz'
        },
        hdmi: {
          description: 'HDMI/Momitör çıktısını aktifleştir'
        },
        autostart: {
          title: 'Otomatik Başlatılan Komut Dosyaları Ayarları',
          description:
            'Sistem başlangıcında otomatik olarak çalıştırılan komut dosyalarını yönetme',
          new: 'Yeni',
          deleteConfirm: 'Bu dosyayı silmek istediğinden emin misin?',
          yes: 'Evet',
          no: 'Hayır',
          scriptName: 'Otomatik Başlatma Komut Dosyası Adı',
          scriptContent: 'Otomatik Başlatılan Komut Dosyası İçeriği',
          settings: 'Ayarlar'
        },
        hidOnly: 'Yalnızca HID modu',
        hidOnlyDesc:
          'Yalnızca temel HID kontrolünü koruyarak sanal aygıtları taklit etmeyi bırakın',
        disk: 'Sanal Disk',
        diskDesc: "Sanal U-disk'i uzak ana bilgisayara bağla",
        network: 'Sanal Ağ',
        networkDesc: 'Sanal ağ kartını uzak ana bilgisayara bağla',
        reboot: 'Yeniden Başlat',
        rebootDesc: "NanoKVM'i yeniden başlatmak istediğinizden emin misiniz?",
        okBtn: 'Evet',
        cancelBtn: 'Hayır'
      },
      network: {
        title: 'Ağ',
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi ayarlayın',
          apMode: "AP modu etkin, QR kodu tarayarak Wi-Fi'ye bağlanın",
          connect: "Wi-Fi'ye bağlan",
          connectDesc1: "Lütfen ağ SSID'sini ve parolayı girin",
          connectDesc2: 'Bu ağa katılmak için parolayı girin',
          disconnect: 'Ağ bağlantısını kesmek istediğinizden emin misiniz?',
          failed: 'Bağlantı başarısız, lütfen tekrar deneyin.',
          ssid: 'Ad',
          password: 'Parola',
          joinBtn: 'Katıl',
          confirmBtn: 'Tamam',
          cancelBtn: 'İptal'
        },
        tls: {
          description: 'HTTPS protokolünü etkinleştir',
          tip: 'HTTPS protokolü bağlantıda gecikmeye sebep olabilir, özellikle MJPEG görüntü modu ile.'
        },
        dns: {
          title: 'DNS',
          description: 'NanoKVM için DNS sunucularını yapılandır',
          mode: 'Mod',
          dhcp: 'DHCP',
          manual: 'Manuel',
          add: 'DNS ekle',
          save: 'Kaydet',
          invalid: 'Geçerli bir IP adresi girin',
          noDhcp: 'Şu anda DHCP DNS mevcut değil',
          saved: 'DNS ayarları kaydedildi',
          saveFailed: 'DNS ayarları kaydedilemedi',
          unsaved: 'Kaydedilmemiş değişiklikler',
          maxServers: 'En fazla {{count}} DNS sunucusuna izin verilir',
          dnsServers: 'DNS Sunucuları',
          dhcpServersDescription: "DNS sunucuları DHCP'den otomatik olarak alınır",
          manualServersDescription: 'DNS sunucuları manuel olarak düzenlenebilir',
          networkDetails: 'Ağ Ayrıntıları',
          interface: 'Arayüz',
          ipAddress: 'IP Adresi',
          subnetMask: 'Alt Ağ Maskesi',
          router: 'Yönlendirici',
          none: 'Yok'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Bellek optimizasyonu',
          tip: "Bellek kullanımı sınırı aştığında, belleği boşaltmak amacıyla çöp toplama işlemi daha agresif bir şekilde gerçekleştirilir. Tailscale kullanıyorsanız bu değerin 75 MB olarak ayarlanması önerilir. Değişikliğin etkili olabilmesi için Tailscale'in yeniden başlatılması gerekir."
        },
        swap: {
          title: 'Belleği değiştir',
          tip: 'Bellek optimizasyonunu etkinleştirdikten sonra sorunlar devam ederse, takas belleğini etkinleştirmeyi deneyin. Bu, takas dosyası boyutunu varsayılan olarak 256MB olarak ayarlar ve bu, "Ayarlar > Cihaz" bölümünden ayarlanabilir.'
        },
        restart: "Tailscale'i yeniden başlat?",
        stop: "Tailscale'i durdur?",
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
        upTailscale: "tailscale dosyasını NanoKVM'in /usr/bin dizinine yükleyin",
        upTailscaled: "tailscaled dosyasını NanoKVM'in /usr/sbin dizinine yükleyin",
        refresh: 'İçinde bulunduğunuz sayfayı yenileyin',
        notRunning: 'Tailscale çalışmıyor. Devam etmek için lütfen başlatın.',
        run: 'Başlat',
        notLogin: 'Cihaz bağlı değil. Lütfen giriş yapıp cihazınızı hesabınıza bağlayın.',
        urlPeriod: 'Adres sadece 10 ndakika boyunca geçerlidir',
        login: 'Giriş yap',
        loginSuccess: 'Giriş yapıldı',
        enable: "Tailscale'i etkinleştir",
        deviceName: 'Cihaz Adı',
        deviceIP: 'Cihaz IP adresi',
        account: 'Hesap',
        logout: 'Çıkış yap',
        logoutDesc: 'Çıkış yapmak istediğinizden emin misiniz?',
        uninstall: "Tailscale'i kaldır",
        uninstallDesc: "Tailscale'i kaldırmak istediğinizden emin misiniz?",
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
          'Ön izleme güncellemelerinin tamamlanmamış olduğunu ve sorunlara sebep olabileceğini unutmayın!',
        offline: {
          title: 'Çevrimdışı Güncellemeler',
          desc: 'Yerel kurulum paketi aracılığıyla güncelleme',
          upload: 'Yükle',
          invalidName: 'Geçersiz dosya adı biçimi. Lütfen GitHub sürümlerinden indirin.',
          updateFailed: 'Güncelleme başarısız oldu. Lütfen tekrar deneyin.'
        }
      },
      users: {
        title: 'Kullanıcı Yönetimi',
        addUser: 'Kullanıcı Ekle',
        colUsername: 'Kullanıcı Adı',
        colRole: 'Rol',
        colEnabled: 'Aktif',
        colActions: 'Eylemler',
        rolesTitle: 'Roller Genel Bakış',
        roleAdmin: 'Tam erişim + kullanıcı yönetimi',
        roleOperator: 'KVM kullanımı: yayın, klavye, fare, güç düğmeleri',
        roleViewer: 'Yalnızca yayın görüntüleme',
        changePassword: 'Şifre Değiştir',
        newPassword: 'Yeni Şifre',
        confirmPassword: 'Şifreyi Onayla',
        pwdMismatch: 'Şifreler eşleşmiyor',
        pwdSuccess: 'Şifre başarıyla değiştirildi',
        pwdFailed: 'Şifre değiştirilemedi',
        password: 'Şifre',
        delete: 'Sil',
        deleteConfirm: 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
        createSuccess: 'Kullanıcı oluşturuldu',
        createFailed: 'Oluşturma başarısız',
        deleteSuccess: 'Kullanıcı silindi',
        deleteFailed: 'Silme başarısız',
        updateSuccess: 'Güncellendi',
        updateFailed: 'Güncelleme başarısız',
        loadFailed: 'Kullanıcılar yüklenemedi',
        usernameRequired: 'Kullanıcı adı girin',
        passwordRequired: 'Şifre girin',
        okBtn: 'Tamam',
        cancelBtn: 'İptal'
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
    picoclaw: {
      title: 'PicoClaw Asistan',
      empty: 'Paneli açın ve başlamak için bir görevi başlatın.',
      inputPlaceholder: "PicoClaw'nin ne yapmasını istediğinizi açıklayın",
      newConversation: 'Yeni görüşme',
      processing: 'İşleniyor...',
      agent: {
        defaultTitle: 'Genel Asistan',
        defaultDescription: 'Genel sohbet, arama ve çalışma alanı yardımı.',
        kvmTitle: 'Uzaktan Kontrol',
        kvmDescription: 'Uzak ana bilgisayarı NanoKVM aracılığıyla çalıştırın.',
        switched: 'Temsilci rolü değiştirildi',
        switchFailed: 'Temsilci rolü değiştirilemedi'
      },
      send: 'Gönder',
      cancel: 'İptal',
      status: {
        connecting: 'Ağ geçidine bağlanılıyor...',
        connected: 'PicoClaw oturumu bağlandı',
        disconnected: 'PicoClaw oturumu bağlantısı kesildi',
        stopped: 'Durdurma isteği gönderildi',
        runtimeStarted: 'PicoClaw runtime başlatıldı',
        runtimeStartFailed: 'PicoClaw runtime başlatılamadı',
        runtimeStopped: 'PicoClaw runtime durduruldu',
        runtimeStopFailed: 'PicoClaw runtime durdurulamadı'
      },
      connection: {
        runtime: {
          checking: 'Kontrol ediliyor',
          ready: 'Runtime hazır',
          stopped: 'Runtime durduruldu',
          unavailable: 'Runtime mevcut değil',
          configError: 'Yapılandırma hatası'
        },
        transport: {
          connecting: 'Bağlanıyor',
          connected: 'Bağlandı'
        },
        run: {
          idle: 'Boşta',
          busy: 'Meşgul'
        }
      },
      message: {
        toolAction: 'Eylem',
        observation: 'Gözlem',
        screenshot: 'Ekran Görüntüsü'
      },
      overlay: {
        locked: 'PicoClaw cihazı kontrol ediyor. Manuel giriş duraklatıldı.'
      },
      install: {
        install: 'Yükle PicoClaw',
        installing: 'PicoClaw yükleniyor',
        success: 'PicoClaw başarıyla yüklendi',
        failed: 'PicoClaw yüklenemedi',
        uninstalling: 'Runtime kaldırılıyor...',
        uninstalled: 'Runtime başarıyla kaldırıldı.',
        uninstallFailed: 'Kaldırma başarısız oldu.',
        requiredTitle: 'PicoClaw kurulu değil',
        requiredDescription: "PicoClaw runtime'ı başlatmadan önce PicoClaw'ı yükleyin.",
        progressDescription: 'PicoClaw indiriliyor ve kuruluyor.',
        stages: {
          preparing: 'Hazırlanıyor',
          downloading: 'İndiriliyor',
          extracting: 'Çıkarılıyor',
          installing: 'Yükleniyor',
          installed: 'Yüklendi',
          install_timeout: 'Zaman Aşımı',
          install_failed: 'Başarısız'
        }
      },
      model: {
        requiredTitle: 'Model yapılandırması gerekli',
        requiredDescription: 'PicoClaw sohbetini kullanmadan önce PicoClaw modelini yapılandırın.',
        docsTitle: 'Yapılandırma Kılavuzu',
        docsDesc: 'Desteklenen modeller ve protokoller',
        menuLabel: 'Modeli yapılandır',
        modelIdentifier: 'Model Tanımlayıcı',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API Anahtarı',
        apiKeyPlaceholder: 'Model API anahtarını girin',
        save: 'Kaydet',
        saving: 'Kaydediliyor',
        saved: 'Model yapılandırması kaydedildi',
        saveFailed: 'Model yapılandırması kaydedilemedi',
        invalid: 'Model tanımlayıcı, API Base URL ve API anahtarı gereklidir'
      },
      uninstall: {
        menuLabel: 'Kaldırma',
        confirmTitle: 'Kaldırma PicoClaw',
        confirmContent:
          "PicoClaw'yi kaldırmak istediğinizden emin misiniz? Bu, yürütülebilir dosyayı ve tüm yapılandırma dosyalarını siler.",
        confirmOk: 'Kaldırma',
        confirmCancel: 'İptal'
      },
      history: {
        title: 'Geçmiş',
        loading: 'Oturumlar yükleniyor...',
        emptyTitle: 'Henüz geçmiş yok',
        emptyDescription: 'Önceki PicoClaw oturumlar burada görünecek.',
        loadFailed: 'Oturum geçmişi yüklenemedi',
        deleteFailed: 'Oturum silinemedi',
        deleteConfirmTitle: 'Oturumu sil',
        deleteConfirmContent: '"{{title}}" silmek istediğinizden emin misiniz?',
        deleteConfirmOk: 'Sil',
        deleteConfirmCancel: 'İptal',
        messageCount_one: '{{count}} mesaj',
        messageCount_other: '{{count}} mesaj'
      },
      config: {
        startRuntime: "PicoClaw'ı Başlat",
        stopRuntime: "PicoClaw'ı Durdur"
      },
      start: {
        title: "PicoClaw'ı Başlat",
        description: "PicoClaw yardımcısını kullanmaya başlamak için runtime'ı başlatın."
      }
    },
    error: {
      title: 'Bir hata oldu!',
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
