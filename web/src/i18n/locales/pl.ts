const pl = {
  translation: {
    head: {
      desktop: 'Zdalny pulpit',
      login: 'Login',
      changePassword: 'Zmień Hasło',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Login',
      placeholderUsername: 'Wprowadź nazwę użykownika',
      placeholderPassword: 'wprowadź hasło',
      placeholderPassword2: 'wprowadź hasło ponownie',
      noEmptyUsername: 'nazwa użykownika nie może być pusta',
      noEmptyPassword: 'hasło nie może być puste',
      noAccount:
        'Nie udało się uzyskać informacji o użytkowniku, odśwież stronę lub zresetuj hasło',
      invalidUser: 'Błędne hasło lub nazwa użykownika',
      error: 'niespodziewany błąd',
      changePassword: 'Zmień Hasło',
      changePasswordDesc:
        'Dla bezpieczeństwa Twojego urządzenia, proszę zmień hasło do logowania w sieci.',
      differentPassword: 'hasła nie zgadzają się',
      illegalUsername: 'nazwa użytkownika zawiera niedozwolone znaki',
      illegalPassword: 'hasło zawiera niedozwolone znaki',
      forgetPassword: 'Zapomiałeś hasła?',
      ok: 'Ok',
      cancel: 'Anuluj',
      loginButtonText: 'Zaloguj się',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'For detailed steps, please consult this document:',
        reset3: 'Web default account:',
        reset4: 'SSH default account:',
        change1: 'Please note that this action will change the following passwords:',
        change2: 'Web login password',
        change3: 'System root password (SSH login password)',
        change4: 'To reset the passwords, press and hold the BOOT button on the NanoKVM.'
      }
    },
    screen: {
      video: 'Tryb wideo',
      resolution: 'Rozdzielczość',
      auto: 'Automatyczny',
      autoTips:
        'W określonych rozdzielczościach może wystąpić rozrywanie ekranu lub przesunięcie myszy. Rozważ dostosowanie rozdzielczości zdalnego hosta lub wyłącz tryb automatyczny.',
      fps: 'FPS',
      customizeFps: 'Personalizuj',
      quality: 'Jakość',
      qualityLossless: 'Bezstratny',
      qualityHigh: 'Wysoki',
      qualityMedium: 'Średni',
      qualityLow: 'Niski',
      frameDetect: 'Wykrywanie klatek',
      frameDetectTip:
        'Obliczanie różnicy między klatkami. Zatrzymaj transmisję strumienia wideo, gdy na ekranie zdalnego hosta nie zostaną wykryte żadne zmiany.'
    },
    keyboard: {
      paste: 'Wklej',
      tips: 'Tylko standardowe klawiaturowe znaki i symbole są obsługiwane.',
      placeholder: 'Proszę wprowadzić coś',
      submit: 'Prześlij',
      virtual: 'Klawiatura'
    },
    mouse: {
      default: 'Domyślny kursor',
      pointer: 'Wskazujący kursor',
      cell: 'Kursor komórki',
      text: 'Kursor tekstowy',
      grab: 'Kursor chwytania',
      hide: 'Ukruj kursor',
      mode: 'Tryb myszki',
      absolute: 'Tryb bezwzględny',
      relative: 'Tryb względny',
      requestPointer: 'Korzystanie z trybu względnego. Kliknij pulpit, aby uzyskać wskaźnik myszy.',
      resetHid: 'Zresetuj HID'
    },
    image: {
      title: 'Obrazy',
      loading: 'Ładowanie...',
      empty: 'Nic nie znaleziono',
      mountFailed: 'Nie udało się zamontować obrazu',
      mountDesc:
        'W niektórych systemach wymagane jest wyjęcie dysku wirtualnego na zdalnym hoście przed zamontowaniem obrazu.',
      tips: {
        title: 'Jak przesłać obrazy',
        usb1: 'Podłącz urządzenie NanoKVM do komputera przez USB.',
        usb2: 'Upewnij się, że dysk wirtualny jest zamontowany (Ustawienia - Dysk wirtualny).',
        usb3: 'Otwórz dysk wirtualny na swoim komputerze i skopiuj plik obrazu do katalogu głównego dysku wirtualnego.',
        scp1: 'Upewnij się że NanoKVM i twój komputer są na tej samej sieci lokalnej.',
        scp2: 'Otwórz terminal na komputerze i użyj komendę SCP aby przesłać obraz do katalogu /data na NanoKVM.',
        scp3: 'Przykład: scp lokalizacja-zrodlowego-obrazu root@ip-twojego-nanokvm:/data',
        tfCard: 'Karta SD',
        tf1: 'Ta metoda jest obsługiwana w systemie Linux',
        tf2: 'Usuń kartę SD od NanoKVM (dla wersji FULL, rozbierz obudowę najpierw).',
        tf3: 'Włóż kartę SD do czytnika kart i podłącz do twojego komputera.',
        tf4: 'Kopjuj obraz do katalogu /data na karcie SD.',
        tf5: 'Włóż kartę SD do NanoKVM.'
      }
    },
    script: {
      title: 'Skrypty',
      upload: 'Prześlij',
      run: 'Uruchom',
      runBackground: 'Uruchomiony w tle',
      runFailed: 'Uruchomienie nie powiodło się',
      attention: 'Uwaga',
      delDesc: 'Czy na pewno chcesz usunąć ten plik?',
      confirm: 'Tak',
      cancel: 'Nie',
      delete: 'Usuń',
      close: 'Zamknij'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal NanoKVM',
      serial: 'Terminal portu szeregowego',
      serialPort: 'Port szeregowy',
      serialPortPlaceholder: 'Wprowadź port szeregowy',
      baudrate: 'Szybkość transmisji',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Wysyłanie komendy...',
      sent: 'Komenda wysłana',
      input: 'Wprowadź numer adresu MAC',
      ok: 'Ok'
    },
    power: {
      title: 'Zasilanie',
      reset: 'Reset',
      power: 'Zasilanie',
      powerShort: 'Zasilanie (krótkie kliknięcie)',
      powerLong: 'Zasilanie (długie kliknięcie)'
    },
    settings: {
      title: 'Settings',
      about: {
        title: 'NanoKVM - informacje',
        information: 'Informacje o systemie',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Wersja oprogramowania',
        applicationTip: 'NanoKVM web application version',
        image: 'Wersja obrazu',
        imageTip: 'NanoKVM system image version',
        deviceKey: 'Klucz urządzenia',
        community: 'Społeczność'
      },
      appearance: {
        title: 'Appearance',
        display: 'Display',
        language: 'Language',
        menuBar: 'Menu Bar',
        menuBarDesc: 'Display icons in the menu bar'
      },
      device: {
        title: 'Device',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Never',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 hour'
        },
        wifi: {
          title: 'Wi-Fi',
          description: 'Configure Wi-Fi',
          setBtn: 'Config'
        },
        disk: 'Virtual Disk',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtual Network',
        networkDesc: 'Mount virtual network card on the remote host',
        memory: {
          title: 'Memory optimization',
          tip: 'When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory.',
          disable: 'Disable'
        }
      },
      tailscale: {
        title: 'Tailscale',
        loading: 'Ładowanie...',
        notInstall: 'Nie znaleziono Tailscale! Proszę zainstalować.',
        install: 'Instaluj',
        installing: 'Instalowanie',
        failed: 'Instalowanie nie powiodło się',
        retry: 'Odśwież stronę i spróbuj ponownie, albo spróbuj zainstalować manualnie.',
        download: 'Pobierz',
        package: 'pakiet instalacyjny',
        unzip: 'i wypakuj pliki',
        upTailscale: 'Prześlij tailscale do NanoKVM w katalogu /usr/bin/',
        upTailscaled: 'Prześlij tailscaled do NanoKVM w katalogu /usr/sbin/',
        refresh: 'Odśwież obecną stronę',
        notLogin:
          'Urządzenie nie zostało jeszcze powiązane. Zaloguj się i powiąż to urządzenie ze swoim kontem.',
        urlPeriod: 'Ten URL jest ważny przez 10 minut',
        login: 'Zaloguj',
        loginSuccess: 'Zalogowanie pomyślne',
        enable: 'Włącz Tailscale',
        deviceName: 'Nazwa urządzenia',
        deviceIP: 'Adres IP urządzenia',
        account: 'Konto',
        logout: 'Wyloguj',
        logout2: 'Chcesz się wylogować?'
      },
      update: {
        title: 'Sprawdź aktualizacje',
        queryFailed: 'Uzyskanie wersji nie powiodło się',
        updateFailed: 'Aktualizacja nie powiodła się. Spróbuj ponownie.',
        isLatest: 'Oprogramowanie jest aktualne.',
        available: 'Aktualizacja jest dostępna. Czy na pewno chcesz dokonać aktualizacji?',
        updating: 'Aktualizacja rozpoczęta. Proszę czekać...',
        confirm: 'Potwierdź',
        cancel: 'Anuluj'
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Name',
        password: 'Password',
        updateBtn: 'Update',
        logoutBtn: 'Logout'
      }
    }
  }
};

export default pl;
