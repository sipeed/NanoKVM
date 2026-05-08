const hu = {
  translation: {
    head: {
      desktop: 'Távoli Asztal',
      login: 'Bejelentkezés',
      changePassword: 'Jelszó megváltoztatása',
      terminal: 'Terminál',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Bejelentkezés',
      placeholderUsername: 'Adja meg a felhasználónevet',
      placeholderPassword: 'Adja meg a jelszót',
      placeholderPassword2: 'Adja meg újra a jelszót',
      noEmptyUsername: 'A felhasználónév nem lehet üres',
      noEmptyPassword: 'A jelszó nem lehet üres',
      noAccount:
        'Nem sikerült megszerezni a felhasználói információkat, frissítse az oldalt vagy állítsa vissza a jelszót',
      invalidUser: 'Érvénytelen felhasználónév vagy jelszó',
      locked: 'Túl sok bejelentkezés, kérjük, próbálja újra később',
      globalLocked: 'A rendszer védelem alatt áll, próbálkozzon újra később',
      error: 'Váratlan hiba',
      changePassword: 'Jelszó megváltoztatása',
      changePasswordDesc:
        'Az eszköz biztonsága érdekében módosítsa a webes bejelentkezési jelszót.',
      differentPassword: 'A jelszavak nem egyeznek',
      illegalUsername: 'A felhasználónév illegális karaktereket tartalmaz',
      illegalPassword: 'A jelszó illegális karaktereket tartalmaz',
      forgetPassword: 'Jelszó-emlékeztető',
      ok: 'Ok',
      cancel: 'Mégse',
      loginButtonText: 'Bejelentkezés',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'A részletes lépésekért tekintse meg ezt a dokumentumot:',
        reset3: 'Alapértelmezett webes fiók:',
        reset4: 'Alapértelmezett SSH-fiók:',
        change1: 'Vegye figyelembe, hogy ez a művelet a következő jelszavakat módosítja:',
        change2: 'Webes bejelentkezési jelszó',
        change3: 'Rendszer root jelszava (SSH bejelentkezési jelszó)',
        change4: 'A jelszavak visszaállításához tartsa lenyomva a BOOT gombot a NanoKVM-en.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Wi-Fi beállítása a NanoKVM-hez',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'A művelet sikertelen, próbálja újra.',
      invalidMode:
        'Az aktuális mód nem támogatja a hálózat beállítását. Kérjük, lépjen az eszközére, és engedélyezze a Wi-Fi konfigurációs módot.',
      confirmBtn: 'Ok',
      finishBtn: 'Kész',
      ap: {
        authTitle: 'Hitelesítés szükséges',
        authDescription: 'A folytatáshoz adja meg a AP jelszót',
        authFailed: 'Érvénytelen AP jelszó',
        passPlaceholder: 'AP jelszót',
        verifyBtn: 'Ellenőrizze'
      }
    },
    screen: {
      scale: 'Skála',
      title: 'Képernyő',
      video: 'Videó mód',
      videoDirectTips:
        'Engedélyezze az HTTPS elemet a "Beállítások > Eszköz" menüpontban ennek a módnak a használatához',
      resolution: 'Felbontás',
      auto: 'Automatikus',
      autoTips:
        'Bizonyos felbontások esetén képernyőszakadás vagy egéreltolódás léphet fel. Fontolja meg a távoli gép felbontásának módosítását vagy az automatikus mód kikapcsolását.',
      fps: 'FPS',
      customizeFps: 'Testreszabás',
      quality: 'Minőség',
      qualityLossless: 'Veszteségmentes',
      qualityHigh: 'Magas',
      qualityMedium: 'Közepes',
      qualityLow: 'Alacsony',
      frameDetect: 'Képkocka-figyelés',
      frameDetectTip:
        'Elemzi a képkockák közötti különbségeket. A videó stream küldése leáll, ha a távoli gép képernyőjén nem történik változás.',
      resetHdmi: 'HDMI visszaállítása'
    },
    keyboard: {
      title: 'Billentyűzet',
      paste: 'Beillesztés',
      tips: 'Csak a szabványos billentyűzet betűi és szimbólumai támogatottak',
      placeholder: 'Írja be',
      submit: 'Elküldés',
      virtual: 'Billentyűzet',
      readClipboard: 'Olvasás a vágólapról',
      clipboardPermissionDenied:
        'A vágólap engedélye megtagadva. Kérjük, engedélyezze a vágólaphoz való hozzáférést a böngészőjében.',
      clipboardReadError: 'Nem sikerült beolvasni a vágólapot',
      dropdownEnglish: 'angol',
      dropdownGerman: 'német',
      dropdownFrench: 'francia',
      dropdownRussian: 'orosz',
      shortcut: {
        title: 'Parancsikonok',
        custom: 'Egyedi',
        capture: 'Kattintson ide a parancsikon rögzítéséhez',
        clear: 'Tiszta',
        save: 'Mentés',
        captureTips:
          'A rendszerszintű billentyűk (például a Windows billentyű) rögzítéséhez teljes képernyős engedély szükséges.',
        enterFullScreen: 'Teljes képernyős mód váltása.'
      },
      leaderKey: {
        title: 'Leader billentyű',
        desc: 'Kerülje ki a böngésző korlátozásait, és küldje el a rendszer parancsikonjait közvetlenül a távoli gazdagépnek.',
        howToUse: 'Használat',
        simultaneous: {
          title: 'Egyidejű üzemmód',
          desc1: 'Tartsa lenyomva a Leader billentyűt, majd nyomja meg a gyorsbillentyűt.',
          desc2: 'Intuitív, de ütközhet a rendszer parancsikonjaival.'
        },
        sequential: {
          title: 'Szekvenciális mód',
          desc1:
            'Nyomja meg a Leader billentyűt → nyomja meg sorban a gyorsbillentyűt → nyomja meg újra a Leader billentyűt.',
          desc2: 'Több lépést igényel, de teljesen elkerülhető a rendszerütközések.'
        },
        enable: 'Leader billentyű engedélyezése',
        tip: 'Leader billentyűként beállítva ez a billentyű kizárólag gyorsbillentyű-indítóként működik, és elveszíti alapértelmezett viselkedését.',
        placeholder: 'Nyomja meg a Leader billentyűt',
        shiftRight: 'Jobb Shift',
        ctrlRight: 'Jobb Ctrl',
        metaRight: 'Jobb Win',
        submit: 'Elküldés',
        recorder: {
          rec: 'REC',
          activate: 'Billentyűk aktiválása',
          input: 'Kérjük, nyomja meg a parancsikont...'
        }
      }
    },
    mouse: {
      title: 'Egér',
      cursor: 'Kurzorstílus',
      default: 'Alapértelmezett kurzor',
      pointer: 'Mutató kurzor',
      cell: 'Cella kurzor',
      text: 'Szöveg kurzor',
      grab: 'Markoló kurzor',
      hide: 'Kurzor elrejtése',
      mode: 'Egér mód',
      absolute: 'Abszolút mód',
      relative: 'Relatív mód',
      direction: 'Görgő iránya',
      scrollUp: 'Görgessen felfelé',
      scrollDown: 'Görgessen le',
      speed: 'Görgő sebessége',
      fast: 'Gyors',
      slow: 'Lassú',
      requestPointer:
        'Relatív mód használata. Kattintson az asztalra, hogy megjelenjen az egérmutató.',
      resetHid: 'HID alaphelyzetbe állítása',
      hidOnly: {
        title: 'Csak HID mód',
        desc: 'Ha az egér és a billentyűzet nem válaszol, és az HID alaphelyzetbe állítása nem segít, akkor az NanoKVM és az eszköz közötti kompatibilitási probléma lehet. Próbálja engedélyezni az HID-Csak módot a jobb kompatibilitás érdekében.',
        tip1: 'Az HID-Csak mód engedélyezése leválasztja a virtuális U-lemezt és a virtuális hálózatot',
        tip2: 'HID-Csak módban a képrögzítés le van tiltva',
        tip3: 'A NanoKVM automatikusan újraindul az üzemmódváltás után',
        enable: 'Engedélyezze a HID-Csak módot',
        disable: 'A HID-Csak mód letiltása'
      }
    },
    image: {
      title: 'Képek',
      loading: 'Betöltés...',
      empty: 'Nem található semmi',
      mountMode: 'Felszerelési mód',
      mountFailed: 'Csatlakoztatás sikertelen',
      mountDesc:
        'Egyes rendszerekben szükséges lehet a virtuális lemez eltávolítása a távoli gépen, mielőtt a képet csatlakoztatja.',
      unmountFailed: 'A leválasztás nem sikerült',
      unmountDesc:
        'Egyes rendszereken manuálisan kell kiadnia a távoli gazdagépről a kép leválasztása előtt.',
      refresh: 'Frissítse a képlistát',
      attention: 'Figyelem',
      deleteConfirm: 'Biztosan törli ezt a képet?',
      okBtn: 'Igen',
      cancelBtn: 'Nem',
      tips: {
        title: 'Hogyan tölts fel képeket',
        usb1: 'Csatlakoztassa a NanoKVM-t a számítógépéhez USB-n keresztül.',
        usb2: 'Győződjön meg róla, hogy a virtuális lemez csatlakoztatva van (Beállítások - Virtuális lemez).',
        usb3: 'Nyissa meg a virtuális lemezt a számítógépén, és másolja a kép fájlt a virtuális lemez gyökérkönyvtárába.',
        scp1: 'Győződjön meg róla, hogy a NanoKVM és a számítógépe ugyanazon a helyi hálózaton van.',
        scp2: 'Nyisson meg egy terminált a számítógépén, és használja az SCP parancsot a kép fájl feltöltésére a /data könyvtárba a NanoKVM-en.',
        scp3: 'Példa: scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'TF Kártya',
        tf1: 'Ez a módszer támogatott Linux rendszeren',
        tf2: 'Vegye ki a TF kártyát a NanoKVM-ből (a TELJES verzióhoz, először szedje szét a házat).',
        tf3: 'Helyezze a TF kártyát egy kártyaolvasóba, és csatlakoztassa a számítógépéhez.',
        tf4: 'Másolja a képfájlt a TF kártya /data könyvtárába.',
        tf5: 'Helyezze vissza a TF kártyát a NanoKVM-be.'
      }
    },
    script: {
      title: 'Szkriptek',
      upload: 'Feltöltés',
      run: 'Futtatás',
      runBackground: 'Háttérben futtatás',
      runFailed: 'Futtatás sikertelen',
      attention: 'Figyelem',
      delDesc: 'Biztosan törli ezt a fájlt?',
      confirm: 'Igen',
      cancel: 'Nem',
      delete: 'Törlés',
      close: 'Bezárás'
    },
    terminal: {
      title: 'Terminál',
      nanokvm: 'NanoKVM Terminál',
      serial: 'Soros port terminál',
      serialPort: 'Soros port',
      serialPortPlaceholder: 'Adja meg a soros portot',
      baudrate: 'Baudráta',
      parity: 'Paritás',
      parityNone: 'Nincs',
      parityEven: 'Páros',
      parityOdd: 'Páratlan',
      flowControl: 'Áramlásszabályozás',
      flowControlNone: 'Nincs',
      flowControlSoft: 'Szoftveres',
      flowControlHard: 'Hardveres',
      dataBits: 'Adatbitek',
      stopBits: 'Stop bitek',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Parancs küldése...',
      sent: 'Parancs elküldve',
      input: 'Adja meg a MAC címet',
      ok: 'Ok'
    },
    download: {
      title: 'Képletöltő',
      input: 'Adjon meg egy távoli képet URL',
      ok: 'Ok',
      disabled: '/data partíció RO, ezért nem tudjuk letölteni a képet',
      uploadbox: 'Dobja ide a fájlt, vagy kattintson a kiválasztáshoz',
      inputfile: 'Kérjük, írja be a képfájlt',
      NoISO: 'Nincs ISO'
    },
    power: {
      title: 'Bekapcsolás',
      showConfirm: 'Megerősítés',
      showConfirmTip: 'Az áramellátási műveletekhez külön megerősítés szükséges',
      reset: 'Újraindítás',
      power: 'Bekapcsolás',
      powerShort: 'Bekapcsolás (rövid kattintás)',
      powerLong: 'Bekapcsolás (hosszú kattintás)',
      resetConfirm: 'Folytatja a visszaállítási műveletet?',
      powerConfirm: 'Folytatja az áramellátást?',
      okBtn: 'Igen',
      cancelBtn: 'Nem'
    },
    settings: {
      title: 'Beállítások',
      about: {
        title: 'NanoKVM Névjegy',
        information: 'Információ',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Alkalmazás verzió',
        applicationTip: 'NanoKVM webalkalmazás verziója',
        image: 'Képfájl verzió',
        imageTip: 'NanoKVM rendszerkép verziója',
        deviceKey: 'Eszköz kulcs',
        community: 'Közösség',
        hostname: 'Gazdanév',
        hostnameUpdated: 'Gazdanév frissítve. Az alkalmazáshoz indítsa újra.',
        ipType: {
          Wired: 'Vezetékes',
          Wireless: 'Vezeték nélküli',
          Other: 'Egyéb'
        }
      },
      appearance: {
        title: 'Megjelenés',
        display: 'Kijelző',
        language: 'Nyelv',
        languageDesc: 'Válassza ki a felület nyelvét',
        webTitle: 'Webcím',
        webTitleDesc: 'A weboldal címének testreszabása',
        menuBar: {
          title: 'Menüsor',
          mode: 'Megjelenítési mód',
          modeDesc: 'Menüsor megjelenítése a képernyőn',
          modeOff: 'Ki',
          modeAuto: 'Automatikus elrejtés',
          modeAlways: 'Mindig látható',
          icons: 'Almenü ikonok',
          iconsDesc: 'Almenüikonok megjelenítése a menüsorban'
        }
      },
      device: {
        title: 'Eszköz',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Soha',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 óra'
        },
        ssh: {
          description: 'Engedélyezze a SSH távoli hozzáférést',
          tip: 'Az engedélyezés előtt állítson be erős jelszót (Fiók - Jelszó módosítása)'
        },
        advanced: 'Speciális beállítások',
        swap: {
          title: 'Csere',
          disable: 'Letiltás',
          description: 'Állítsa be a swap fájl méretét',
          tip: 'Ennek a funkciónak az engedélyezése lerövidítheti az SD-kártya élettartamát!'
        },
        mouseJiggler: {
          title: 'Mouse Jiggler',
          description: 'A távoli gazdagép alvó állapotának megakadályozása',
          disable: 'Letiltás',
          absolute: 'Abszolút mód',
          relative: 'Relatív mód'
        },
        mdns: {
          description: 'Engedélyezze az mDNS felderítési szolgáltatást',
          tip: 'Kikapcsolás, ha nincs rá szükség'
        },
        hdmi: {
          description: 'HDMI/monitor kimenet engedélyezése'
        },
        autostart: {
          title: 'Automatikus indítási parancsfájlok beállításai',
          description: 'A rendszer indításakor automatikusan futó szkriptek kezelése',
          new: 'Új',
          deleteConfirm: 'Biztosan törli ezt a fájlt?',
          yes: 'Igen',
          no: 'Nem',
          scriptName: 'Automatikusan induló szkript neve',
          scriptContent: 'A szkripttartalom automatikus indítása',
          settings: 'Beállítások'
        },
        hidOnly: 'HID-Csak mód',
        hidOnlyDesc:
          'A virtuális eszközök emulálásának leállítása, csak az alapvető HID vezérlés megtartásával',
        disk: 'Virtuális lemez',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtuális hálózat',
        networkDesc: 'Virtuális hálózati kártya csatlakoztatása a távoli gazdagépen',
        reboot: 'Újraindítás',
        rebootDesc: 'Biztos, hogy újra akarja indítani a NanoKVM-t?',
        okBtn: 'Igen',
        cancelBtn: 'Nem'
      },
      network: {
        title: 'Hálózat',
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi beállítása',
          apMode: 'Az AP mód engedélyezve van, csatlakozzon a Wi-Fihez a QR-kód beolvasásával',
          connect: 'Wi-Fi csatlakoztatása',
          connectDesc1: 'Adja meg a hálózat SSID-jét és jelszavát',
          connectDesc2: 'Adja meg a jelszót a hálózathoz való csatlakozáshoz',
          disconnect: 'Biztosan bontja a hálózati kapcsolatot?',
          failed: 'A csatlakozás sikertelen, próbálja újra.',
          ssid: 'Név',
          password: 'Jelszó',
          joinBtn: 'Csatlakozás',
          confirmBtn: 'OK',
          cancelBtn: 'Mégse'
        },
        tls: {
          description: 'HTTPS protokoll engedélyezése',
          tip: 'Figyelem: A HTTPS használata növelheti a késleltetést, különösen MJPEG videó módban.'
        },
        dns: {
          title: 'DNS',
          description: 'DNS-kiszolgálók beállítása a NanoKVM számára',
          mode: 'Mód',
          dhcp: 'DHCP',
          manual: 'Kézi',
          add: 'DNS hozzáadása',
          save: 'Mentés',
          invalid: 'Adjon meg egy érvényes IP-címet',
          noDhcp: 'Jelenleg nincs elérhető DHCP DNS',
          saved: 'DNS-beállítások mentve',
          saveFailed: 'Nem sikerült menteni a DNS-beállításokat',
          unsaved: 'Nem mentett módosítások',
          maxServers: 'Legfeljebb {{count}} DNS-kiszolgáló engedélyezett',
          dnsServers: 'DNS-kiszolgálók',
          dhcpServersDescription: 'A DNS-kiszolgálók automatikusan DHCP-n keresztül érkeznek',
          manualServersDescription: 'A DNS-kiszolgálók kézzel szerkeszthetők',
          networkDetails: 'Hálózati részletek',
          interface: 'Interfész',
          ipAddress: 'IP-cím',
          subnetMask: 'Alhálózati maszk',
          router: 'Router',
          none: 'Nincs'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Memóriaoptimalizálás',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect."
        },
        swap: {
          title: 'Memória csere',
          tip: 'Ha a memóriaoptimalizálás engedélyezése után is fennállnak a problémák, próbálja meg engedélyezni a swap memóriát. Ez alapértelmezés szerint a swap fájl méretét 256MB értékre állítja be, amely a "Beállítások > Eszköz" menüpontban állítható be.'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
        loading: 'Betöltés...',
        notInstall: 'Tailscale nem található! Kérem, telepítse.',
        install: 'Telepítés',
        installing: 'Telepítés folyamatban',
        failed: 'Telepítés sikertelen',
        retry: 'Frissítse az oldalt, majd próbálja újra. Vagy próbálja meg manuálisan telepíteni.',
        download: 'Letöltés a',
        package: 'telepítési csomag',
        unzip: 'és kicsomagolás',
        upTailscale: 'Töltsön fel tailscale-t a NanoKVM /usr/bin/ könyvtárába',
        upTailscaled: 'Töltsön fel tailscaled-t a NanoKVM /usr/sbin/ könyvtárába',
        refresh: 'Frissítse az aktuális oldalt',
        notRunning: 'Tailscale nem fut. Kérjük, indítsa el a folytatáshoz.',
        run: 'Indítás',
        notLogin:
          'Az eszköz még nincs kötve. Kérem, jelentkezzen be és kösse az eszközt a fiókjához.',
        urlPeriod: 'Ez az url 10 percig érvényes',
        login: 'Bejelentkezés',
        loginSuccess: 'Sikeres bejelentkezés',
        enable: 'Tailscale engedélyezése',
        deviceName: 'Eszköz neve',
        deviceIP: 'Eszköz IP',
        account: 'Fiók',
        logout: 'Kijelentkezés',
        logoutDesc: 'Biztos, hogy ki szeretne jelentkezni?',
        uninstall: 'Eltávolítás Tailscale',
        uninstallDesc: 'Biztosan eltávolítja a Tailscale alkalmazást?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Frissítés keresése',
        queryFailed: 'Verzió lekérdezése sikertelen',
        updateFailed: 'Frissítés sikertelen. Kérem, próbálja újra.',
        isLatest: 'Ön már a legfrissebb verziót használja.',
        available: 'Frissítés elérhető. Biztos, hogy frissít?',
        updating: 'Frissítés elkezdődött. Kérem várjon...',
        confirm: 'Megerősítés',
        cancel: 'Mégse',
        preview: 'Frissítések előnézete',
        previewDesc: 'Korai hozzáférést kap az új funkciókhoz és fejlesztésekhez',
        previewTip:
          'Kérjük, vegye figyelembe, hogy az előzetes verziók hibákat vagy hiányos funkciókat tartalmazhatnak!',
        offline: {
          title: 'Offline frissítések',
          desc: 'Frissítés helyi telepítőcsomaggal',
          upload: 'Feltöltés',
          invalidName: 'Érvénytelen fájlnévformátum. Kérjük, töltse le a GitHub kiadásaiból.',
          updateFailed: 'Frissítés sikertelen. Kérem, próbálja újra.'
        }
      },
      account: {
        title: 'Fiók',
        webAccount: 'Webes fiók neve',
        password: 'Jelszó',
        updateBtn: 'Update',
        logoutBtn: 'Kijelentkezés',
        logoutDesc: 'Biztos, hogy ki szeretne jelentkezni?',
        okBtn: 'Igen',
        cancelBtn: 'Nem'
      }
    },
    picoclaw: {
      title: 'PicoClaw Asszisztens',
      empty: 'Nyissa meg a panelt, és indítsa el a feladatot.',
      inputPlaceholder: 'Írja le, mit szeretne tenni az PicoClaw-val',
      newConversation: 'Új beszélgetés',
      processing: 'Feldolgozás...',
      agent: {
        defaultTitle: 'Általános asszisztens',
        defaultDescription: 'Általános csevegési, keresési és munkaterületi súgó.',
        kvmTitle: 'Távoli vezérlés',
        kvmDescription: 'Működtesse a távoli gazdagépet az NanoKVM segítségével.',
        switched: 'Ügynöki szerepkör megváltozott',
        switchFailed: 'Nem sikerült váltani az ügynöki szerepkört'
      },
      send: 'Küldés',
      cancel: 'Mégse',
      status: {
        connecting: 'Csatlakozás az átjáróhoz...',
        connected: 'PicoClaw munkamenet csatlakoztatva',
        disconnected: 'PicoClaw munkamenet lezárva',
        stopped: 'Leállítási kérés elküldve',
        runtimeStarted: 'PicoClaw Runtime elindult',
        runtimeStartFailed: 'Nem sikerült elindítani a PicoClaw Runtime-ot',
        runtimeStopped: 'PicoClaw Runtime leállt',
        runtimeStopFailed: 'Nem sikerült leállítani a PicoClaw Runtime-ot'
      },
      connection: {
        runtime: {
          checking: 'Ellenőrzés',
          ready: 'Runtime kész',
          stopped: 'Runtime leállt',
          unavailable: 'Runtime nem érhető el',
          configError: 'Konfigurációs hiba'
        },
        transport: {
          connecting: 'Csatlakozás',
          connected: 'Csatlakoztatva'
        },
        run: {
          idle: 'Üresjárat',
          busy: 'Elfoglalt'
        }
      },
      message: {
        toolAction: 'Akció',
        observation: 'Megfigyelés',
        screenshot: 'Képernyőkép'
      },
      overlay: {
        locked: 'PicoClaw vezérli az eszközt. A kézi bevitel szünetel.'
      },
      install: {
        install: 'PicoClaw telepítése',
        installing: 'PicoClaw telepítése folyamatban',
        success: 'PicoClaw sikeresen telepítve',
        failed: 'Nem sikerült telepíteni PicoClaw',
        uninstalling: 'Runtime eltávolítása...',
        uninstalled: 'A Runtime sikeresen eltávolítva.',
        uninstallFailed: 'Az eltávolítás nem sikerült.',
        requiredTitle: 'PicoClaw nincs telepítve',
        requiredDescription:
          'Telepítse a PicoClaw alkalmazást a PicoClaw Runtime elindítása előtt.',
        progressDescription: 'PicoClaw letöltése és telepítése folyamatban van.',
        stages: {
          preparing: 'Felkészülés',
          downloading: 'Letöltés',
          extracting: 'Kibontás',
          installing: 'Telepítés folyamatban',
          installed: 'Telepítve',
          install_timeout: 'Időtúllépés',
          install_failed: 'Sikertelen'
        }
      },
      model: {
        requiredTitle: 'Modellkonfiguráció szükséges',
        requiredDescription: 'A PicoClaw chat használata előtt konfigurálja az PicoClaw modellt.',
        docsTitle: 'Konfigurációs útmutató',
        docsDesc: 'Támogatott modellek és protokollok',
        menuLabel: 'Modell konfigurálása',
        modelIdentifier: 'Modellazonosító',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API-kulcs',
        apiKeyPlaceholder: 'Adja meg a modell API-kulcsát',
        save: 'Mentés',
        saving: 'Mentés',
        saved: 'A modell konfigurációja mentve',
        saveFailed: 'Nem sikerült menteni a modellkonfigurációt',
        invalid: 'A modellazonosító, az API Base URL és az API-kulcs megadása kötelező'
      },
      uninstall: {
        menuLabel: 'Eltávolítás',
        confirmTitle: 'Eltávolítás PicoClaw',
        confirmContent:
          'Biztosan eltávolítja a következőt: PicoClaw? Ezzel törli a végrehajtható fájlt és az összes konfigurációs fájlt.',
        confirmOk: 'Eltávolítás',
        confirmCancel: 'Mégse'
      },
      history: {
        title: 'Előzmények',
        loading: 'Munkamenetek betöltése...',
        emptyTitle: 'Még nincs előzmény',
        emptyDescription: 'A korábbi PicoClaw munkamenetek itt jelennek meg.',
        loadFailed: 'Nem sikerült betölteni a munkamenet-előzményeket',
        deleteFailed: 'Nem sikerült törölni a munkamenetet',
        deleteConfirmTitle: 'Munkamenet törlése',
        deleteConfirmContent: 'Biztos, hogy törölni szeretné a következőt: "{{title}}"?',
        deleteConfirmOk: 'Törlés',
        deleteConfirmCancel: 'Mégse',
        messageCount_one: '{{count}} üzenet',
        messageCount_other: '{{count}} üzenet'
      },
      config: {
        startRuntime: 'PicoClaw indítása',
        stopRuntime: 'PicoClaw leállítása'
      },
      start: {
        title: 'PicoClaw indítása',
        description: 'Indítsa el a Runtime-ot a PicoClaw segéd használatának megkezdéséhez.'
      }
    },
    error: {
      title: 'Problémába ütköztünk',
      refresh: 'Frissítés'
    },
    fullscreen: {
      toggle: 'Teljes képernyő váltás'
    },
    menu: {
      collapse: 'Menü összecsukása',
      expand: 'Bontsa ki a menüt'
    }
  }
};

export default hu;
