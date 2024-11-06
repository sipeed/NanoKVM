const hu = {
  translation: {
    language: 'Nyelv',
    changePassword: 'Jelszó megváltoztatása',
    logout: 'Kijelentkezés',
    settings: 'Beállítások',
    showMouse: 'Egér mutatása',
    hideMouse: 'Egér elrejtése',
    power: 'Bekapcsolás',
    reset: 'Újraindítás',
    powerShort: 'Bekapcsolás (rövid kattintás)',
    powerLong: 'Bekapcsolás (hosszú kattintás)',
    hddLed: 'HDD LED',
    checkLibFailed: 'Nem sikerült ellenőrizni a futási könyvtárat, próbálja újra',
    updateLibFailed: 'Nem sikerült frissíteni a futási könyvtárat, próbálja újra',
    updatingLib:
      'A futási könyvtár frissítése folyamatban. Kérem, frissítse az oldalt a frissítés után.',
    checkForUpdate: 'Frissítés keresése',
    head: {
      desktop: 'Távoli Asztal',
      login: 'Bejelentkezés',
      changePassword: 'Jelszó megváltoztatása',
      terminal: 'Terminál'
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
      error: 'Váratlan hiba',
      changePassword: 'Jelszó megváltoztatása',
      changePasswordDesc:
        'Az eszköz biztonsága érdekében módosítsa a webes bejelentkezési jelszót.',
      differentPassword: 'A jelszavak nem egyeznek',
      illegalUsername: 'A felhasználónév illegális karaktereket tartalmaz',
      illegalPassword: 'A jelszó illegális karaktereket tartalmaz',
      forgetPassword: 'Jelszó-emlékeztető',
      resetPassword: 'Jelszó alaphelyzetbe állítása',
      reset1: 'Ha elfelejtette a jelszót, kövesse az alábbi lépéseket:',
      reset2: '1. Jelentkezzen be a NanoKVM eszközre SSH-n keresztül;',
      reset3: '2. Törölje a fájlt az eszközről:',
      reset4: '3. Használja az alapértelmezett fiókot a bejelentkezéshez:',
      ok: 'Ok',
      cancel: 'Mégse'
    },
    screen: {
      video: 'Videó mód',
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
        'Elemzi a képkockák közötti különbségeket. A videó stream küldése leáll, ha a távoli gép képernyőjén nem történik változás.'
    },
    keyboard: {
      paste: 'Beillesztés',
      tips: 'Csak a szabványos billentyűzet betűi és szimbólumai támogatottak',
      placeholder: 'Írja be',
      submit: 'Elküldés',
      virtual: 'Billentyűzet'
    },
    mouse: {
      default: 'Alapértelmezett kurzor',
      pointer: 'Mutató kurzor',
      cell: 'Cella kurzor',
      text: 'Szöveg kurzor',
      grab: 'Markoló kurzor',
      hide: 'Kurzor elrejtése',
      mode: 'Egér mód',
      absolute: 'Abszolút mód',
      relative: 'Relatív mód',
      requestPointer:
        'Relatív mód használata. Kattintson az asztalra, hogy megjelenjen az egérmutató.',
      resetHid: 'HID alaphelyzetbe állítása'
    },
    image: {
      title: 'Képek',
      loading: 'Betöltés...',
      empty: 'Nem található semmi',
      mountFailed: 'Csatlakoztatás sikertelen',
      mountDesc:
        'Egyes rendszerekben szükséges lehet a virtuális lemez eltávolítása a távoli gépen, mielőtt a képet csatlakoztatja.',
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
      confirm: 'Ok'
    },
    wol: {
      sending: 'Parancs küldése...',
      sent: 'Parancs elküldve',
      input: 'Adja meg a MAC címet',
      ok: 'Ok'
    },
    about: {
      title: 'NanoKVM Névjegy',
      information: 'Információ',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'Alkalmazás verzió',
      image: 'Képfájl verzió',
      deviceKey: 'Eszköz kulcs',
      queryFailed: 'Lekérdezés sikertelen',
      community: 'Közösség'
    },
    update: {
      title: 'Frissítés keresése',
      queryFailed: 'Verzió lekérdezése sikertelen',
      updateFailed: 'Frissítés sikertelen. Kérem, próbálja újra.',
      isLatest: 'Ön már a legfrissebb verziót használja.',
      available: 'Frissítés elérhető. Biztos, hogy frissít?',
      updating: 'Frissítés elkezdődött. Kérem várjon...',
      confirm: 'Megerősítés',
      cancel: 'Mégse'
    },
    virtualDevice: {
      network: 'Virtuális hálózat',
      disk: 'Virtuális lemez'
    },
    tailscale: {
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
      logout2: 'Biztos, hogy kijelentkezik?'
    }
  }
};

export default hu;
