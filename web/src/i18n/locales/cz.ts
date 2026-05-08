const cz = {
  translation: {
    head: {
      desktop: 'Vzdálená plocha',
      login: 'Přihlášení',
      changePassword: 'Změna hesla',
      terminal: 'Terminál',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Přihlášení',
      placeholderUsername: 'Zadejte prosím uživatelské jméno',
      placeholderPassword: 'Zadejte prosím heslo',
      placeholderPassword2: 'Zadejte prosím heslo znovu',
      noEmptyUsername: 'Uživatelské jméno nesmí být prázdné',
      noEmptyPassword: 'Heslo nesmí být prázdné',
      noAccount:
        'Nepodařilo se získat informace o uživateli, prosím obnovte stránku nebo resetujte heslo',
      invalidUser: 'Neplatné uživatelské jméno nebo heslo',
      locked: 'Příliš mnoho přihlášení, zkuste to znovu později',
      globalLocked: 'Systém je chráněn, zkuste to znovu později',
      error: 'Neočekávaná chyba',
      changePassword: 'Změnit heslo',
      changePasswordDesc:
        'Pro bezpečnost vašeho zařízení prosím změňte heslo pro přihlášení na webu.',
      differentPassword: 'Hesla se neshodují',
      illegalUsername: 'Uživatelské jméno obsahuje nepovolené znaky',
      illegalPassword: 'Heslo obsahuje nepovolené znaky',
      forgetPassword: 'Zapomenuté heslo',
      ok: 'OK',
      cancel: 'Zrušit',
      loginButtonText: 'Přihlášení',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'Podrobné kroky najdete v tomto dokumentu:',
        reset3: 'Výchozí webový účet:',
        reset4: 'Výchozí účet SSH:',
        change1: 'Upozorňujeme, že tato akce změní následující hesla:',
        change2: 'Heslo pro webové přihlášení',
        change3: 'Heslo systémového uživatele root (heslo pro přihlášení SSH)',
        change4: 'Chcete-li hesla resetovat, podržte tlačítko BOOT na NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Nastavit Wi-Fi pro NanoKVM',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'Operace selhala, zkuste to znovu.',
      invalidMode:
        'Aktuální režim nepodporuje nastavení sítě. Přejděte do svého zařízení a povolte konfigurační režim Wi-Fi.',
      confirmBtn: 'Ok',
      finishBtn: 'Dokončeno',
      ap: {
        authTitle: 'Vyžaduje se ověření',
        authDescription: 'Pokračujte zadáním hesla AP',
        authFailed: 'Neplatné heslo AP',
        passPlaceholder: 'AP heslo',
        verifyBtn: 'Ověřte'
      }
    },
    screen: {
      scale: 'Měřítko',
      title: 'Obrazovka',
      video: 'Režim videa',
      videoDirectTips: 'Chcete-li používat tento režim, povolte HTTPS v "Nastavení > Zařízení"',
      resolution: 'Rozlišení',
      auto: 'Automatické',
      autoTips:
        'Může docházet k trhání obrazu nebo posunu myši při určitých rozlišeních. Zvažte úpravu rozlišení vzdáleného hostitele nebo vypněte automatický režim.',
      fps: 'FPS',
      customizeFps: 'Přizpůsobit',
      quality: 'Kvalita',
      qualityLossless: 'Bezeztrátový',
      qualityHigh: 'Vysoký',
      qualityMedium: 'Střední',
      qualityLow: 'Nízký',
      frameDetect: 'Detekce snímků',
      frameDetectTip:
        'Vypočítá rozdíl mezi snímky. Přenos video streamu se zastaví, pokud nejsou detekovány změny na obrazovce vzdáleného hostitele.',
      resetHdmi: 'Resetovat HDMI'
    },
    keyboard: {
      title: 'Klávesnice',
      paste: 'Vložit',
      tips: 'Podporovány jsou pouze standardní písmena a symboly klávesnice',
      placeholder: 'Zadejte text',
      submit: 'Odeslat',
      virtual: 'Klávesnice',
      readClipboard: 'Přečíst ze schránky',
      clipboardPermissionDenied:
        'Oprávnění ke schránce odepřeno. Povolte prosím přístup do schránky ve svém prohlížeči.',
      clipboardReadError: 'Nepodařilo se přečíst schránku',
      dropdownEnglish: 'anglicky',
      dropdownGerman: 'německy',
      dropdownFrench: 'francouzsky',
      dropdownRussian: 'rusky',
      shortcut: {
        title: 'Zkratky',
        custom: 'Vlastní',
        capture: 'Kliknutím sem zachytíte zástupce',
        clear: 'Jasno',
        save: 'Uložit',
        captureTips:
          'Zachycení systémových kláves (například klávesy Windows) vyžaduje oprávnění pro celou obrazovku.',
        enterFullScreen: 'Přepnout režim celé obrazovky.'
      },
      leaderKey: {
        title: 'Klávesa Leader',
        desc: 'Obejít omezení prohlížeče a odeslat systémové zkratky přímo vzdálenému hostiteli.',
        howToUse: 'Jak používat',
        simultaneous: {
          title: 'Simultánní režim',
          desc1: 'Stiskněte a podržte klávesu Leader a poté stiskněte zkratku.',
          desc2: 'Intuitivní, ale může být v rozporu se systémovými zkratkami.'
        },
        sequential: {
          title: 'Sekvenční režim',
          desc1:
            'Stiskněte klávesu Leader → postupně stiskněte zkratku → znovu stiskněte klávesu Leader.',
          desc2: 'Vyžaduje více kroků, ale zcela se vyhne systémovým konfliktům.'
        },
        enable: 'Povolit klávesu Leader',
        tip: 'Když je tato klávesa nastavena jako klávesa Leader, slouží pouze jako spouštěč zkratek a ztrácí své výchozí chování.',
        placeholder: 'Stiskněte klávesu Leader',
        shiftRight: 'Pravý Shift',
        ctrlRight: 'Pravý Ctrl',
        metaRight: 'Pravý Win',
        submit: 'Odeslat',
        recorder: {
          rec: 'REC',
          activate: 'Aktivovat klávesy',
          input: 'Stiskněte prosím zkratku...'
        }
      }
    },
    mouse: {
      title: 'Myš',
      cursor: 'Styl kurzoru',
      default: 'Výchozí kurzor',
      pointer: 'Ukazovací kurzor',
      cell: 'Kurzor buňky',
      text: 'Textový kurzor',
      grab: 'Chytnout kurzor',
      hide: 'Skrýt kurzor',
      mode: 'Režim myši',
      absolute: 'Absolutní režim',
      relative: 'Relativní režim',
      direction: 'Směr kolečka',
      scrollUp: 'Přejděte nahoru',
      scrollDown: 'Přejděte dolů',
      speed: 'Rychlost kolečka',
      fast: 'Rychle',
      slow: 'Pomalu',
      requestPointer:
        'Používá se relativní režim. Klikněte prosím na plochu pro získání kurzoru myši.',
      resetHid: 'Resetovat HID',
      hidOnly: {
        title: 'Režim pouze HID',
        desc: 'Pokud vaše myš a klávesnice přestanou reagovat a resetování HID nepomůže, může jít o problém s kompatibilitou mezi NanoKVM a zařízením. Zkuste povolit režim HID-Only pro lepší kompatibilitu.',
        tip1: 'Povolení režimu HID-Only odpojí virtuální U-disk a virtuální síť',
        tip2: 'V režimu HID-Only je připojení obrazu zakázáno',
        tip3: 'NanoKVM se po přepnutí režimů automaticky restartuje',
        enable: 'Povolit režim HID-Only',
        disable: 'Zakázat režim HID-Only'
      }
    },
    image: {
      title: 'Obrázky',
      loading: 'Načítání...',
      empty: 'Nic nenalezeno',
      mountMode: 'Režim připojení',
      mountFailed: 'Připojení se nezdařilo',
      mountDesc:
        'V některých systémech je nutné před připojením obrazu vysunout virtuální disk na vzdáleném hostiteli.',
      unmountFailed: 'Odpojení se nezdařilo',
      unmountDesc:
        'Na některých systémech se musíte před odpojením obrazu ručně vysunout ze vzdáleného hostitele.',
      refresh: 'Obnovte seznam obrázků',
      attention: 'Pozor',
      deleteConfirm: 'Opravdu chcete smazat tento obrázek?',
      okBtn: 'Ano',
      cancelBtn: 'Ne',
      tips: {
        title: 'Jak nahrát',
        usb1: 'Připojte NanoKVM k vašemu počítači přes USB.',
        usb2: 'Ujistěte se, že je virtuální disk připojen (Nastavení - Virtuální disk).',
        usb3: 'Otevřete virtuální disk na vašem počítači a zkopírujte soubor s obrazem do kořenového adresáře virtuálního disku.',
        scp1: 'Ujistěte se, že jsou NanoKVM a váš počítač ve stejné místní síti.',
        scp2: 'Otevřete terminál na vašem počítači a použijte příkaz SCP pro nahrání souboru s obrazem do adresáře /data na zařízení NanoKVM.',
        scp3: 'Příklad: scp cesta-k-vašemu-obrazu root@ip-nanokvm:/data',
        tfCard: 'SD Karta',
        tf1: 'Tato metoda je podporována na systémech Linux',
        tf2: 'Vyjměte SD kartu z NanoKVM (u plné verze nejprve rozložte krabičku).',
        tf3: 'Vložte SD kartu do čtečky karet a připojte ji k vašemu počítači.',
        tf4: 'Zkopírujte soubor s obrazem do adresáře /data na SD kartě.',
        tf5: 'Vložte SD kartu zpět do NanoKVM.'
      }
    },
    script: {
      title: 'Skript',
      upload: 'Nahrát',
      run: 'Spustit',
      runBackground: 'Spustit na pozadí',
      runFailed: 'Spuštění se nezdařilo',
      attention: 'Pozor',
      delDesc: 'Opravdu chcete tento soubor smazat?',
      confirm: 'Ano',
      cancel: 'Ne',
      delete: 'Smazat',
      close: 'Zavřít'
    },
    terminal: {
      title: 'Terminál',
      nanokvm: 'Terminál NanoKVM',
      serial: 'Terminál sériového portu',
      serialPort: 'Sériový port',
      serialPortPlaceholder: 'Zadejte prosím sériový port',
      baudrate: 'Přenosová rychlost',
      parity: 'Parita',
      parityNone: 'Žádné',
      parityEven: 'Sudá',
      parityOdd: 'Lichá',
      flowControl: 'Řízení toku',
      flowControlNone: 'Žádné',
      flowControlSoft: 'Softwarové',
      flowControlHard: 'Hardwarové',
      dataBits: 'Datové bity',
      stopBits: 'Stop bity',
      confirm: 'OK'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Odesílání příkazu...',
      sent: 'Příkaz odeslán',
      input: 'Zadejte prosím MAC adresu',
      ok: 'OK'
    },
    download: {
      title: 'Stahovač obrazů',
      input: 'Zadejte prosím vzdálený obrázek URL',
      ok: 'OK',
      disabled: 'Oddíl /data je RO, takže obrázek nelze stáhnout',
      uploadbox: 'Přetáhněte soubor sem nebo kliknutím vyberte',
      inputfile: 'Zadejte soubor obrázku',
      NoISO: 'Žádné ISO'
    },
    power: {
      title: 'Napájení',
      showConfirm: 'Potvrzení',
      showConfirmTip: 'Výkonové operace vyžadují další potvrzení',
      reset: 'Resetovat',
      power: 'Napájení',
      powerShort: 'Napájení (krátký stisk)',
      powerLong: 'Napájení (dlouhý stisk)',
      resetConfirm: 'Pokračovat v operaci resetování?',
      powerConfirm: 'Pokračovat v napájení?',
      okBtn: 'Ano',
      cancelBtn: 'Ne'
    },
    settings: {
      title: 'Nastavení',
      about: {
        title: 'O NanoKVM',
        information: 'Informace',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Verze aplikace',
        applicationTip: 'Verze webové aplikace NanoKVM',
        image: 'Verze obrazu',
        imageTip: 'Verze systémového obrazu NanoKVM',
        deviceKey: 'Klíč zařízení',
        community: 'Komunita',
        hostname: 'Název hostitele',
        hostnameUpdated: 'Název hostitele byl aktualizován. Pro použití restartujte.',
        ipType: {
          Wired: 'Kabelové',
          Wireless: 'Bezdrátové',
          Other: 'Jiné'
        }
      },
      appearance: {
        title: 'Vzhled',
        display: 'Zobrazení',
        language: 'Jazyk',
        languageDesc: 'Vyberte jazyk rozhraní',
        webTitle: 'Název webu',
        webTitleDesc: 'Přizpůsobte název webové stránky',
        menuBar: {
          title: 'Panel nabídek',
          mode: 'Režim zobrazení',
          modeDesc: 'Zobrazení panelu nabídek na obrazovce',
          modeOff: 'Vypnuto',
          modeAuto: 'Automatické skrytí',
          modeAlways: 'Vždy viditelné',
          icons: 'Ikony podnabídky',
          iconsDesc: 'Zobrazení ikon podnabídky na liště nabídek'
        }
      },
      device: {
        title: 'Zařízení',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Nikdy',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 hodina'
        },
        ssh: {
          description: 'Povolit vzdálený přístup SSH',
          tip: 'Před povolením nastavte silné heslo (Účet – Změnit heslo)'
        },
        advanced: 'Pokročilá nastavení',
        swap: {
          title: 'Vyměnit',
          disable: 'Zakázat',
          description: 'Nastavte velikost odkládacího souboru',
          tip: 'Povolení této funkce může zkrátit životnost vaší SD karty!'
        },
        mouseJiggler: {
          title: 'Mouse Jiggler',
          description: 'Zabraňte spánku vzdáleného hostitele',
          disable: 'Zakázat',
          absolute: 'Absolutní režim',
          relative: 'Relativní režim'
        },
        mdns: {
          description: 'Povolit službu zjišťování mDNS',
          tip: 'Vypnutí, pokud to není potřeba'
        },
        hdmi: {
          description: 'Povolit výstup HDMI/monitor'
        },
        autostart: {
          title: 'Nastavení automatického spuštění skriptů',
          description: 'Správa skriptů, které se spouštějí automaticky při spuštění systému',
          new: 'Nové',
          deleteConfirm: 'Opravdu chcete tento soubor smazat?',
          yes: 'Ano',
          no: 'Ne',
          scriptName: 'Název skriptu automatického spuštění',
          scriptContent: 'Obsah skriptu automatického spuštění',
          settings: 'Nastavení'
        },
        hidOnly: 'HID-Pouze režim',
        hidOnlyDesc: 'Zastavit emulaci virtuálních zařízení a zachovat pouze základní ovládání HID',
        disk: 'Virtuální disk',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtuální síť',
        networkDesc: 'Připojit virtuální síťovou kartu na vzdáleném hostiteli',
        reboot: 'Restartujte',
        rebootDesc: 'Opravdu chcete restartovat NanoKVM?',
        okBtn: 'Ano',
        cancelBtn: 'Ne'
      },
      network: {
        title: 'Síť',
        wifi: {
          title: 'Wi-Fi',
          description: 'Nastavit Wi-Fi',
          apMode: 'Režim AP je povolen, připojte se k Wi-Fi naskenováním QR kódu',
          connect: 'Připojit Wi-Fi',
          connectDesc1: 'Zadejte SSID sítě a heslo',
          connectDesc2: 'Zadejte heslo pro připojení k této síti',
          disconnect: 'Opravdu chcete síť odpojit?',
          failed: 'Připojení se nezdařilo, zkuste to znovu.',
          ssid: 'Název',
          password: 'Heslo',
          joinBtn: 'Připojit',
          confirmBtn: 'OK',
          cancelBtn: 'Zrušit'
        },
        tls: {
          description: 'Povolit protokol HTTPS',
          tip: 'Upozornění: Použití HTTPS může zvýšit latenci, zejména v režimu videa MJPEG.'
        },
        dns: {
          title: 'DNS',
          description: 'Nastavit DNS servery pro NanoKVM',
          mode: 'Režim',
          dhcp: 'DHCP',
          manual: 'Ručně',
          add: 'Přidat DNS',
          save: 'Uložit',
          invalid: 'Zadejte platnou IP adresu',
          noDhcp: 'Momentálně není k dispozici žádné DHCP DNS',
          saved: 'Nastavení DNS uloženo',
          saveFailed: 'Nastavení DNS se nepodařilo uložit',
          unsaved: 'Neuložené změny',
          maxServers: 'Je povoleno maximálně {{count}} DNS serverů',
          dnsServers: 'DNS servery',
          dhcpServersDescription: 'DNS servery jsou automaticky získávány z DHCP',
          manualServersDescription: 'DNS servery lze upravit ručně',
          networkDetails: 'Podrobnosti sítě',
          interface: 'Rozhraní',
          ipAddress: 'IP adresa',
          subnetMask: 'Maska podsítě',
          router: 'Router',
          none: 'Žádné'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Optimalizace paměti',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect."
        },
        swap: {
          title: 'Vyměňte paměť',
          tip: 'Pokud problémy přetrvávají i po povolení optimalizace paměti, zkuste povolit odkládací paměť. Tím se ve výchozím nastavení nastaví velikost odkládacího souboru na 256MB, kterou lze upravit v „Nastavení > Zařízení“.'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
        loading: 'Načítání...',
        notInstall: 'Tailscale nebyl nalezen! Prosím nainstalujte.',
        install: 'Nainstalovat',
        installing: 'Instalace probíhá',
        failed: 'Instalace se nezdařila',
        retry: 'Obnovte stránku a zkuste to znovu. Nebo zkuste instalaci manuálně',
        download: 'Stáhnout',
        package: 'instalační balíček',
        unzip: 'a rozbalit ho',
        upTailscale: 'Nahrajte Tailscale do adresáře NanoKVM /usr/bin/',
        upTailscaled: 'Nahrajte Tailscaled do adresáře NanoKVM /usr/sbin/',
        refresh: 'Obnovit stránku',
        notRunning: 'Tailscale neběží. Chcete-li pokračovat, spusťte jej.',
        run: 'Spustit',
        notLogin:
          'Zařízení nebylo dosud spárováno. Přihlaste se prosím a spárujte toto zařízení s vaším účtem.',
        urlPeriod: 'Tento odkaz je platný po dobu 10 minut',
        login: 'Přihlášení',
        loginSuccess: 'Přihlášení úspěšné',
        enable: 'Povolit Tailscale',
        deviceName: 'Název zařízení',
        deviceIP: 'IP zařízení',
        account: 'Účet',
        logout: 'Odhlásit se',
        logoutDesc: 'Opravdu se chcete odhlásit?',
        uninstall: 'Odinstalovat Tailscale',
        uninstallDesc: 'Opravdu chcete odinstalovat Tailscale?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Zkontrolovat aktualizaci',
        queryFailed: 'Nepodařilo se získat verzi',
        updateFailed: 'Aktualizace se nezdařila. Zkuste to prosím znovu.',
        isLatest: 'Máte nejnovější verzi.',
        available: 'Je dostupná aktualizace. Opravdu chcete aktualizovat?',
        updating: 'Aktualizace zahájena. Prosím čekejte...',
        confirm: 'Potvrdit',
        cancel: 'Zrušit',
        preview: 'Náhled aktualizací',
        previewDesc: 'Získejte včasný přístup k novým funkcím a vylepšením',
        previewTip:
          'Uvědomte si prosím, že předběžné verze mohou obsahovat chyby nebo neúplné funkce!',
        offline: {
          title: 'Offline aktualizace',
          desc: 'Aktualizace prostřednictvím místního instalačního balíčku',
          upload: 'Nahrát',
          invalidName: 'Neplatný formát souboru. Stáhněte si prosím z vydání GitHubu.',
          updateFailed: 'Aktualizace se nezdařila. Zkuste to prosím znovu.'
        }
      },
      account: {
        title: 'Účet',
        webAccount: 'Název webového účtu',
        password: 'Heslo',
        updateBtn: 'Update',
        logoutBtn: 'Odhlásit',
        logoutDesc: 'Opravdu se chcete odhlásit?',
        okBtn: 'Ano',
        cancelBtn: 'Ne'
      }
    },
    picoclaw: {
      title: 'PicoClaw asistent',
      empty: 'Otevřete panel a spusťte úlohu.',
      inputPlaceholder: 'Popište, co chcete, aby PicoClaw dělal',
      newConversation: 'Nová konverzace',
      processing: 'Zpracovává se...',
      agent: {
        defaultTitle: 'Obecný asistent',
        defaultDescription: 'Obecná nápověda pro chat, vyhledávání a pracovní prostor.',
        kvmTitle: 'Vzdálené ovládání',
        kvmDescription: 'Ovládejte vzdáleného hostitele prostřednictvím NanoKVM.',
        switched: 'Role agenta změněna',
        switchFailed: 'Přepnutí role agenta se nezdařilo'
      },
      send: 'Odeslat',
      cancel: 'Zrušit',
      status: {
        connecting: 'Připojování k bráně...',
        connected: 'Relace PicoClaw připojena',
        disconnected: 'Relace PicoClaw uzavřena',
        stopped: 'Požadavek na zastavení byl odeslán',
        runtimeStarted: 'Spuštěno běhové prostředí PicoClaw',
        runtimeStartFailed: 'Selhalo spuštění běhového prostředí PicoClaw',
        runtimeStopped: 'Běhové prostředí PicoClaw zastaveno',
        runtimeStopFailed: 'Zastavení běhového prostředí PicoClaw se nezdařilo'
      },
      connection: {
        runtime: {
          checking: 'Kontrola',
          ready: 'Běhové prostředí připraveno',
          stopped: 'Běhové prostředí zastaveno',
          unavailable: 'Běhové prostředí není k dispozici',
          configError: 'Chyba konfigurace'
        },
        transport: {
          connecting: 'Připojování',
          connected: 'Připojeno'
        },
        run: {
          idle: 'Nečinný',
          busy: 'Zaneprázdněn'
        }
      },
      message: {
        toolAction: 'Akce',
        observation: 'Pozorování',
        screenshot: 'Snímek obrazovky'
      },
      overlay: {
        locked: 'PicoClaw ovládá zařízení. Ruční zadávání je pozastaveno.'
      },
      install: {
        install: 'Nainstalovat PicoClaw',
        installing: 'Instalace PicoClaw',
        success: 'PicoClaw úspěšně nainstalováno',
        failed: 'Nepodařilo se nainstalovat PicoClaw',
        uninstalling: 'Odinstalování běhového prostředí...',
        uninstalled: 'Běhové prostředí bylo úspěšně odinstalováno.',
        uninstallFailed: 'Odinstalace se nezdařila.',
        requiredTitle: 'PicoClaw není nainstalováno',
        requiredDescription: 'Nainstalujte PicoClaw před spuštěním běhového prostředí PicoClaw.',
        progressDescription: 'PicoClaw se stahuje a instaluje.',
        stages: {
          preparing: 'Příprava',
          downloading: 'Stahování',
          extracting: 'Extrakce',
          installing: 'Instalace probíhá',
          installed: 'Instalováno',
          install_timeout: 'Vypršel časový limit',
          install_failed: 'Selhalo'
        }
      },
      model: {
        requiredTitle: 'Je vyžadována konfigurace modelu',
        requiredDescription: 'Před použitím chatu PicoClaw nakonfigurujte model PicoClaw.',
        docsTitle: 'Průvodce konfigurací',
        docsDesc: 'Podporované modely a protokoly',
        menuLabel: 'Konfigurace modelu',
        modelIdentifier: 'Identifikátor modelu',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Klíč API',
        apiKeyPlaceholder: 'Zadejte klíč API modelu',
        save: 'Uložit',
        saving: 'Ukládání',
        saved: 'Konfigurace modelu uložena',
        saveFailed: 'Nepodařilo se uložit konfiguraci modelu',
        invalid: 'Identifikátor modelu, API Base URL a klíč API jsou povinné'
      },
      uninstall: {
        menuLabel: 'Odinstalovat',
        confirmTitle: 'Odinstalovat PicoClaw',
        confirmContent:
          'Opravdu chcete odinstalovat PicoClaw? Tím smažete spustitelný soubor a všechny konfigurační soubory.',
        confirmOk: 'Odinstalovat',
        confirmCancel: 'Zrušit'
      },
      history: {
        title: 'Historie',
        loading: 'Načítání relací...',
        emptyTitle: 'Zatím žádná historie',
        emptyDescription: 'Zde se zobrazí předchozí relace PicoClaw.',
        loadFailed: 'Nepodařilo se načíst historii relace',
        deleteFailed: 'Smazání relace se nezdařilo',
        deleteConfirmTitle: 'Smazat relaci',
        deleteConfirmContent: 'Opravdu chcete smazat "{{title}}"?',
        deleteConfirmOk: 'Smazat',
        deleteConfirmCancel: 'Zrušit',
        messageCount_one: '{{count}} zpráva',
        messageCount_other: '{{count}} zpráv'
      },
      config: {
        startRuntime: 'Spustit PicoClaw',
        stopRuntime: 'Zastavit PicoClaw'
      },
      start: {
        title: 'Spustit PicoClaw',
        description: 'Spusťte běhové prostředí a začněte používat asistenta PicoClaw.'
      }
    },
    error: {
      title: 'Narazili jsme na problém',
      refresh: 'Obnovit'
    },
    fullscreen: {
      toggle: 'Přepnout na celou obrazovku'
    },
    menu: {
      collapse: 'Sbalit nabídku',
      expand: 'Rozbalte nabídku'
    }
  }
};

export default cz;
