const cz = {
  translation: {
    language: 'Jazyk',
    changePassword: 'Změnit heslo',
    logout: 'Odhlásit se',
    settings: 'Nastavení',
    showMouse: 'Zobrazit kurzor myši',
    hideMouse: 'Skrýt kurzor myši',
    power: 'Napájení',
    reset: 'Resetovat',
    powerShort: 'Napájení (krátký stisk)',
    powerLong: 'Napájení (dlouhý stisk)',
    hddLed: 'HDD LED',
    checkLibFailed: 'Nepodařilo se zkontrolovat runtime knihovnu, zkuste to prosím znovu',
    updateLibFailed: 'Nepodařilo se aktualizovat runtime knihovnu, zkuste to prosím znovu',
    updatingLib: 'Aktualizuji runtime knihovnu. Po dokončení aktualizace prosím obnovte stránku.',
    checkForUpdate: 'Zkontrolovat aktualizaci',
    head: {
      desktop: 'Vzdálená plocha',
      login: 'Přihlášení',
      changePassword: 'Změna hesla',
      terminal: 'Terminál'
    },
    auth: {
      login: 'Přihlášení',
      placeholderUsername: 'Zadejte prosím uživatelské jméno',
      placeholderPassword: 'Zadejte prosím heslo',
      placeholderPassword2: 'Zadejte prosím heslo znovu',
      noEmptyUsername: 'Uživatelské jméno nesmí být prázdné',
      noEmptyPassword: 'Heslo nesmí být prázdné',
      noAccount: 'Nepodařilo se získat informace o uživateli, prosím obnovte stránku nebo resetujte heslo',
      invalidUser: 'Neplatné uživatelské jméno nebo heslo',
      error: 'Neočekávaná chyba',
      changePassword: 'Změnit heslo',
      differentPassword: 'Hesla se neshodují',
      illegalUsername: 'Uživatelské jméno obsahuje nepovolené znaky',
      illegalPassword: 'Heslo obsahuje nepovolené znaky',
      forgetPassword: 'Zapomenuté heslo',
      resetPassword: 'Resetovat heslo',
      reset1: 'Pokud jste zapomněli heslo, postupujte podle následujících kroků pro reset:',
      reset2: '1. Přihlaste se k zařízení NanoKVM pomocí SSH;',
      reset3: '2. Smažte soubor v zařízení: ',
      reset4: '3. Přihlaste se pomocí výchozího účtu: ',
      ok: 'OK',
      cancel: 'Zrušit'
    },
    screen: {
      resolution: 'Rozlišení',
      auto: 'Automatické',
      autoTips:
        'Může docházet k trhání obrazu nebo posunu myši při určitých rozlišeních. Zvažte úpravu rozlišení vzdáleného hostitele nebo vypněte automatický režim.',
      fps: 'FPS',
      customizeFps: 'Přizpůsobit',
      quality: 'Kvalita',
      frameDetect: 'Detekce snímků',
      frameDetectTip:
        'Vypočítá rozdíl mezi snímky. Přenos video streamu se zastaví, pokud nejsou detekovány změny na obrazovce vzdáleného hostitele.'
    },
    keyboard: {
      paste: 'Vložit',
      tips: 'Podporovány jsou pouze standardní písmena a symboly klávesnice',
      placeholder: 'Zadejte text',
      submit: 'Odeslat',
      virtual: 'Klávesnice'
    },
    mouse: {
      default: 'Výchozí kurzor',
      pointer: 'Ukazovací kurzor',
      cell: 'Kurzor buňky',
      text: 'Textový kurzor',
      grab: 'Chytnout kurzor',
      hide: 'Skrýt kurzor',
      mode: 'Režim myši',
      absolute: 'Absolutní režim',
      relative: 'Relativní režim',
      requestPointer: 'Používá se relativní režim. Klikněte prosím na plochu pro získání kurzoru myši.',
      resetHid: 'Resetovat HID'
    },
    image: {
      title: 'Obrázky',
      loading: 'Načítání...',
      empty: 'Nic nenalezeno',
      mountFailed: 'Připojení se nezdařilo',
      mountDesc:
        'V některých systémech je nutné před připojením obrazu vysunout virtuální disk na vzdáleném hostiteli.',
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
      confirm: 'OK'
    },
    wol: {
      sending: 'Odesílání příkazu...',
      sent: 'Příkaz odeslán',
      input: 'Zadejte prosím MAC adresu',
      ok: 'OK'
    },
    about: {
      title: 'O NanoKVM',
      information: 'Informace',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'Verze aplikace',
      image: 'Verze obrazu',
      deviceKey: 'Klíč zařízení',
      queryFailed: 'Dotaz se nezdařil',
      community: 'Komunita'
    },
    update: {
      title: 'Zkontrolovat aktualizaci',
      queryFailed: 'Nepodařilo se získat verzi',
      updateFailed: 'Aktualizace se nezdařila. Zkuste to prosím znovu.',
      isLatest: 'Máte nejnovější verzi.',
      available: 'Je dostupná aktualizace. Opravdu chcete aktualizovat?',
      updating: 'Aktualizace zahájena. Prosím čekejte...',
      confirm: 'Potvrdit',
      cancel: 'Zrušit'
    },
    virtualDevice: {
      network: 'Virtuální síť',
      disk: 'Virtuální disk'
    },
    tailscale: {
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
      notLogin: 'Zařízení nebylo dosud spárováno. Přihlaste se prosím a spárujte toto zařízení s vaším účtem.',
      urlPeriod: 'Tento odkaz je platný po dobu 10 minut',
      login: 'Přihlášení',
      loginSuccess: 'Přihlášení úspěšné',
      enable: 'Povolit Tailscale',
      deviceName: 'Název zařízení',
      deviceIP: 'IP zařízení',
      account: 'Účet',
      logout: 'Odhlásit se',
      logout2: 'Opravdu se chcete odhlásit?'
    }
  }
};

export default cz;
