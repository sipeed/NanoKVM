const pl = {
  translation: {
    head: {
      desktop: 'Zdalny pulpit',
      login: 'Logowanie',
      changePassword: 'Zmień Hasło',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Logowanie',
      placeholderUsername: 'Wprowadź nazwę użykownika',
      placeholderPassword: 'wprowadź hasło',
      placeholderPassword2: 'wprowadź hasło ponownie',
      noEmptyUsername: 'nazwa użykownika nie może być pusta',
      noEmptyPassword: 'hasło nie może być puste',
      noAccount:
        'Nie udało się uzyskać informacji o użytkowniku, odśwież stronę lub zresetuj hasło',
      invalidUser: 'Błędne hasło lub nazwa użykownika',
      locked: 'Zbyt wiele loginów, spróbuj ponownie później',
      globalLocked: 'System chroniony, spróbuj ponownie później',
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
        reset2: 'Szczegółowe kroki znajdziesz w tym dokumencie:',
        reset3: 'Domyślne konto web:',
        reset4: 'Domyślne konto SSH:',
        change1: 'Pamiętaj, że ta operacja zmieni następujące hasła:',
        change2: 'Hasło logowania web',
        change3: 'Hasło roota systemu (hasło logowania SSH)',
        change4: 'Aby zresetować hasła, naciśnij i przytrzymaj przycisk BOOT na NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Skonfiguruj Wi-Fi dla NanoKVM',
      success: 'Proszę podejść do urządzenia, aby sprawdzić stan sieci NanoKVM.',
      failed: 'Operacja nie powiodła się, spróbuj ponownie.',
      invalidMode:
        'Bieżący tryb nie obsługuje konfiguracji sieci. Przejdź do swojego urządzenia i włącz tryb konfiguracji Wi-Fi.',
      confirmBtn: 'Ok',
      finishBtn: 'Zakończono',
      ap: {
        authTitle: 'Wymagane uwierzytelnienie',
        authDescription: 'Aby kontynuować, wprowadź AP hasło',
        authFailed: 'Nieprawidłowe hasło AP',
        passPlaceholder: 'AP hasło',
        verifyBtn: 'Sprawdź'
      }
    },
    screen: {
      scale: 'Skala',
      title: 'Ekran',
      video: 'Tryb wideo',
      videoDirectTips: 'Włącz HTTPS w „Ustawienia > Urządzenie”, aby korzystać z tego trybu',
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
        'Obliczanie różnicy między klatkami. Zatrzymaj transmisję strumienia wideo, gdy na ekranie zdalnego hosta nie zostaną wykryte żadne zmiany.',
      resetHdmi: 'Resetuj HDMI'
    },
    keyboard: {
      title: 'Klawiatura',
      paste: 'Wklej',
      tips: 'Tylko standardowe klawiaturowe znaki i symbole są obsługiwane.',
      placeholder: 'Proszę wprowadzić coś',
      submit: 'Prześlij',
      virtual: 'Klawiatura',
      readClipboard: 'Czytaj ze schowka',
      clipboardPermissionDenied:
        'Odmowa dostępu do schowka. Zezwól na dostęp do schowka w przeglądarce.',
      clipboardReadError: 'Nie udało się odczytać schowka',
      dropdownEnglish: 'Angielski',
      dropdownGerman: 'niemiecki',
      dropdownFrench: 'Francuski',
      dropdownRussian: 'Rosyjski',
      shortcut: {
        title: 'Skróty',
        custom: 'Niestandardowe',
        capture: 'Kliknij tutaj, aby przechwycić skrót',
        clear: 'Jasne',
        save: 'Zapisz',
        captureTips:
          'Przechwytywanie klawiszy systemowych (takich jak klawisz Windows) wymaga uprawnienia do pełnego ekranu.',
        enterFullScreen: 'Przełącz tryb pełnoekranowy.'
      },
      leaderKey: {
        title: 'Klawisz Leader',
        desc: 'Omiń ograniczenia przeglądarki i wyślij skróty systemowe bezpośrednio do zdalnego hosta.',
        howToUse: 'Jak używać',
        simultaneous: {
          title: 'Tryb symultaniczny',
          desc1: 'Naciśnij i przytrzymaj klawisz Leader, a następnie naciśnij skrót.',
          desc2: 'Intuicyjne, ale może kolidować ze skrótami systemowymi.'
        },
        sequential: {
          title: 'Tryb sekwencyjny',
          desc1:
            'Naciśnij klawisz Leader → naciśnij skrót w sekwencji → ponownie naciśnij klawisz Leader.',
          desc2:
            'Wymaga większej liczby kroków, ale całkowicie pozwala uniknąć konfliktów systemowych.'
        },
        enable: 'Włącz klawisz Leader',
        tip: 'Po przypisaniu jako klawisz Leader ten klawisz działa wyłącznie jako wyzwalacz skrótów i traci swoje domyślne zachowanie.',
        placeholder: 'Naciśnij klawisz Leader',
        shiftRight: 'Prawy Shift',
        ctrlRight: 'Prawy Ctrl',
        metaRight: 'Prawy Win',
        submit: 'Prześlij',
        recorder: {
          rec: 'NAGR',
          activate: 'Aktywuj klawisze',
          input: 'Proszę nacisnąć skrót...'
        }
      }
    },
    mouse: {
      title: 'Mysz',
      cursor: 'Styl kursora',
      default: 'Domyślny kursor',
      pointer: 'Wskazujący kursor',
      cell: 'Kursor komórki',
      text: 'Kursor tekstowy',
      grab: 'Kursor chwytania',
      hide: 'Ukruj kursor',
      mode: 'Tryb myszki',
      absolute: 'Tryb bezwzględny',
      relative: 'Tryb względny',
      direction: 'Kierunek kółka przewijania',
      scrollUp: 'Przewiń w górę',
      scrollDown: 'Przewiń w dół',
      speed: 'Szybkość kółka przewijania',
      fast: 'Szybko',
      slow: 'Powoli',
      requestPointer: 'Korzystanie z trybu względnego. Kliknij pulpit, aby uzyskać wskaźnik myszy.',
      resetHid: 'Zresetuj HID',
      hidOnly: {
        title: 'Tryb tylko HID',
        desc: 'Jeśli mysz i klawiatura przestaną odpowiadać, a resetowanie HID nie pomoże, może to oznaczać problem ze zgodnością między NanoKVM a urządzeniem. Spróbuj włączyć tryb HID-Only, aby uzyskać lepszą kompatybilność.',
        tip1: 'Włączenie trybu HID-Only spowoduje odmontowanie wirtualnego dysku U i sieci wirtualnej',
        tip2: 'W trybie HID-Only montowanie obrazu jest wyłączone',
        tip3: 'NanoKVM automatycznie uruchomi się ponownie po przełączeniu trybów',
        enable: 'Włącz tryb HID-Only',
        disable: 'Wyłącz tryb HID-Tylko'
      }
    },
    image: {
      title: 'Obrazy',
      loading: 'Ładowanie...',
      empty: 'Nic nie znaleziono',
      mountMode: 'Tryb montowania',
      mountFailed: 'Nie udało się zamontować obrazu',
      mountDesc:
        'W niektórych systemach wymagane jest wyjęcie dysku wirtualnego na zdalnym hoście przed zamontowaniem obrazu.',
      unmountFailed: 'Odmontowanie nie powiodło się',
      unmountDesc:
        'W niektórych systemach należy ręcznie wysunąć obraz ze zdalnego hosta przed odmontowaniem obrazu.',
      refresh: 'Odśwież listę obrazów',
      attention: 'Uwaga',
      deleteConfirm: 'Czy na pewno chcesz usunąć to zdjęcie?',
      okBtn: 'Tak',
      cancelBtn: 'Nie',
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
      parity: 'Kontrola parzystości',
      parityNone: 'Brak kontroli',
      parityEven: 'Parzysta',
      parityOdd: 'Nieparzysta',
      flowControl: 'Kontrola przepływu',
      flowControlNone: 'Brak kontroli',
      flowControlSoft: 'Programowe',
      flowControlHard: 'Sprzętowe',
      dataBits: 'Bity danych',
      stopBits: 'Bity stopu',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Wysyłanie komendy...',
      sent: 'Komenda wysłana',
      input: 'Wprowadź numer adresu MAC',
      ok: 'Ok'
    },
    download: {
      title: 'Narzędzie do pobierania obrazów',
      input: 'Proszę wprowadzić zdalny obraz URL',
      ok: 'Ok',
      disabled: '/data partycja to RO, więc nie możemy pobrać obrazu',
      uploadbox: 'Upuść plik tutaj lub kliknij, aby wybrać',
      inputfile: 'Proszę wprowadzić plik obrazu',
      NoISO: 'Brak ISO'
    },
    power: {
      title: 'Zasilanie',
      showConfirm: 'Potwierdzenie',
      showConfirmTip: 'Operacje zasilania wymagają dodatkowego potwierdzenia',
      reset: 'Resetuj',
      power: 'Zasilanie',
      powerShort: 'Zasilanie (krótkie kliknięcie)',
      powerLong: 'Zasilanie (długie kliknięcie)',
      resetConfirm: 'Kontynuować operację resetowania?',
      powerConfirm: 'Kontynuować zasilanie?',
      okBtn: 'Tak',
      cancelBtn: 'Nie'
    },
    settings: {
      title: 'Ustawienia',
      about: {
        title: 'NanoKVM - informacje',
        information: 'Informacje o systemie',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Wersja oprogramowania',
        applicationTip: 'Wersja aplikacji web NanoKVM',
        image: 'Wersja obrazu',
        imageTip: 'Wersja obrazu systemu NanoKVM',
        deviceKey: 'Klucz urządzenia',
        community: 'Społeczność',
        hostname: 'Nazwa hosta',
        hostnameUpdated: 'Zaktualizowano nazwę hosta. Uruchom ponownie, aby zastosować.',
        ipType: {
          Wired: 'Przewodowy',
          Wireless: 'Bezprzewodowe',
          Other: 'Inne'
        }
      },
      appearance: {
        title: 'Wygląd',
        display: 'Ekran',
        language: 'Język',
        languageDesc: 'Wybierz język interfejsu',
        webTitle: 'Tytuł strony internetowej',
        webTitleDesc: 'Dostosuj tytuł strony internetowej',
        menuBar: {
          title: 'Pasek menu',
          mode: 'Tryb wyświetlania',
          modeDesc: 'Wyświetl pasek menu na ekranie',
          modeOff: 'Wyłączone',
          modeAuto: 'Automatyczne ukrywanie',
          modeAlways: 'Zawsze widoczny',
          icons: 'Ikony podmenu',
          iconsDesc: 'Wyświetla ikony podmenu na pasku menu'
        }
      },
      device: {
        title: 'Urządzenie',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Nigdy',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 godzina'
        },
        ssh: {
          description: 'Włącz SSH zdalny dostęp',
          tip: 'Ustaw silne hasło przed włączeniem (Konto - Zmień hasło)'
        },
        advanced: 'Ustawienia zaawansowane',
        swap: {
          title: 'Zamień',
          disable: 'Wyłącz',
          description: 'Ustaw rozmiar pliku wymiany',
          tip: 'Włączenie tej funkcji może skrócić żywotność karty SD!'
        },
        mouseJiggler: {
          title: 'Jiggler myszy',
          description: 'Uniemożliwia uśpienie zdalnego hosta',
          disable: 'Wyłącz',
          absolute: 'Tryb absolutny',
          relative: 'Tryb względny'
        },
        mdns: {
          description: 'Włącz usługę wykrywania mDNS',
          tip: 'Wyłączanie, jeśli nie jest potrzebne'
        },
        hdmi: {
          description: 'Włącz HDMI/wyjście monitora'
        },
        autostart: {
          title: 'Ustawienia skryptów autostartu',
          description:
            'Zarządzaj skryptami uruchamianymi automatycznie podczas uruchamiania systemu',
          new: 'Nowy',
          deleteConfirm: 'Czy na pewno chcesz usunąć ten plik?',
          yes: 'Tak',
          no: 'Nie',
          scriptName: 'Nazwa skryptu autostartu',
          scriptContent: 'Treść skryptu autostartu',
          settings: 'Ustawienia'
        },
        hidOnly: 'HID – tylko tryb',
        hidOnlyDesc:
          'Przestań emulować urządzenia wirtualne, zachowując jedynie podstawową kontrolę HID',
        disk: 'Dysk wirtualny',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Sieć wirtualna',
        networkDesc: 'Zamontuj wirtualną kartę sieciową na zdalnym hoście',
        reboot: 'Uruchom ponownie',
        rebootDesc: 'Czy na pewno chcesz ponownie uruchomić NanoKVM?',
        okBtn: 'Tak',
        cancelBtn: 'Nie'
      },
      network: {
        title: 'Sieć',
        wifi: {
          title: 'Wi-Fi',
          description: 'Skonfiguruj Wi-Fi',
          apMode: 'Tryb AP jest włączony, połącz z Wi-Fi skanując kod QR',
          connect: 'Połącz Wi-Fi',
          connectDesc1: 'Wprowadź SSID sieci i hasło',
          connectDesc2: 'Wprowadź hasło, aby połączyć się z tą siecią',
          disconnect: 'Czy na pewno chcesz rozłączyć sieć?',
          failed: 'Połączenie nie powiodło się, spróbuj ponownie.',
          ssid: 'Nazwa',
          password: 'Hasło',
          joinBtn: 'Połącz',
          confirmBtn: 'OK',
          cancelBtn: 'Anuluj'
        },
        tls: {
          description: 'Włącz protokół HTTPS',
          tip: 'Uwaga: użycie HTTPS może zwiększyć opóźnienie, szczególnie w trybie wideo MJPEG.'
        },
        dns: {
          title: 'DNS',
          description: 'Skonfiguruj serwery DNS dla NanoKVM',
          mode: 'Tryb',
          dhcp: 'DHCP',
          manual: 'Ręcznie',
          add: 'Dodaj DNS',
          save: 'Zapisz',
          invalid: 'Wprowadź prawidłowy adres IP',
          noDhcp: 'Brak obecnie dostępnego DNS z DHCP',
          saved: 'Ustawienia DNS zapisane',
          saveFailed: 'Nie udało się zapisać ustawień DNS',
          unsaved: 'Niezapisane zmiany',
          maxServers: 'Dozwolone jest maksymalnie {{count}} serwerów DNS',
          dnsServers: 'Serwery DNS',
          dhcpServersDescription: 'Serwery DNS są automatycznie pobierane z DHCP',
          manualServersDescription: 'Serwery DNS można edytować ręcznie',
          networkDetails: 'Szczegóły sieci',
          interface: 'Interfejs',
          ipAddress: 'Adres IP',
          subnetMask: 'Maska podsieci',
          router: 'Router',
          none: 'Brak'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Optymalizacja pamięci',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect."
        },
        swap: {
          title: 'Zamień pamięć',
          tip: 'Jeśli po włączeniu optymalizacji pamięci problemy nadal występują, spróbuj włączyć pamięć wymiany. Spowoduje to ustawienie domyślnego rozmiaru pliku wymiany na 256MB, który można dostosować w „Ustawienia > Urządzenie”.'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
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
        notRunning: 'Tailscale nie działa. Rozpocznij, aby kontynuować.',
        run: 'Rozpocznij',
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
        logoutDesc: 'Czy na pewno chcesz się wylogować?',
        uninstall: 'Odinstaluj Tailscale',
        uninstallDesc: 'Czy na pewno chcesz odinstalować Tailscale?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Sprawdź aktualizacje',
        queryFailed: 'Uzyskanie wersji nie powiodło się',
        updateFailed: 'Aktualizacja nie powiodła się. Spróbuj ponownie.',
        isLatest: 'Oprogramowanie jest aktualne.',
        available: 'Aktualizacja jest dostępna. Czy na pewno chcesz dokonać aktualizacji?',
        updating: 'Aktualizacja rozpoczęta. Proszę czekać...',
        confirm: 'Potwierdź',
        cancel: 'Anuluj',
        preview: 'Podgląd aktualizacji',
        previewDesc: 'Uzyskaj wcześniejszy dostęp do nowych funkcji i ulepszeń',
        previewTip:
          'Należy pamiętać, że wersje poglądowe mogą zawierać błędy lub niekompletną funkcjonalność!',
        offline: {
          title: 'Aktualizacje offline',
          desc: 'Aktualizacja poprzez lokalny pakiet instalacyjny',
          upload: 'Prześlij',
          invalidName: 'Nieprawidłowy format nazwy pliku. Proszę pobrać z wydań GitHub.',
          updateFailed: 'Aktualizacja nie powiodła się. Spróbuj ponownie.'
        }
      },
      users: {
        title: 'Zarządzanie użytkownikami',
        addUser: 'Dodaj użytkownika',
        colUsername: 'Nazwa użytkownika',
        colRole: 'Rola',
        colEnabled: 'Aktywny',
        colActions: 'Akcje',
        rolesTitle: 'Przegląd ról',
        roleAdmin: 'Pełny dostęp + zarządzanie użytkownikami',
        roleOperator: 'Korzystanie z KVM: stream, klawiatura, mysz, przyciski zasilania',
        roleViewer: 'Tylko podgląd streamu',
        changePassword: 'Zmień hasło',
        newPassword: 'Nowe hasło',
        confirmPassword: 'Potwierdź hasło',
        pwdMismatch: 'Hasła nie pasują do siebie',
        pwdSuccess: 'Hasło zostało zmienione',
        pwdFailed: 'Nie udało się zmienić hasła',
        password: 'Hasło',
        delete: 'Usuń',
        deleteConfirm: 'Czy na pewno chcesz usunąć tego użytkownika?',
        createSuccess: 'Użytkownik utworzony',
        createFailed: 'Utworzenie nie powiodło się',
        deleteSuccess: 'Użytkownik usunięty',
        deleteFailed: 'Usunięcie nie powiodło się',
        updateSuccess: 'Zaktualizowano',
        updateFailed: 'Aktualizacja nie powiodła się',
        loadFailed: 'Nie udało się wczytać użytkowników',
        usernameRequired: 'Wprowadź nazwę użytkownika',
        passwordRequired: 'Wprowadź hasło',
        okBtn: 'OK',
        cancelBtn: 'Anuluj'
      },
      account: {
        title: 'Konto',
        webAccount: 'Nazwa konta web',
        password: 'Hasło',
        updateBtn: 'Update',
        logoutBtn: 'Wyloguj',
        logoutDesc: 'Czy na pewno chcesz się wylogować?',
        okBtn: 'Tak',
        cancelBtn: 'Nie'
      }
    },
    picoclaw: {
      title: 'PicoClaw Asystent',
      empty: 'Otwórz panel i rozpocznij zadanie.',
      inputPlaceholder: 'Opisz, co chcesz, aby PicoClaw zrobił',
      newConversation: 'Nowa rozmowa',
      processing: 'Przetwarzanie...',
      agent: {
        defaultTitle: 'Asystent ogólny',
        defaultDescription: 'Ogólna pomoc dotycząca czatu, wyszukiwania i przestrzeni roboczej.',
        kvmTitle: 'Zdalne sterowanie',
        kvmDescription: 'Sterowanie zdalnym hostem poprzez NanoKVM.',
        switched: 'Rola agenta została zmieniona',
        switchFailed: 'Nie udało się zmienić roli agenta'
      },
      send: 'Wyślij',
      cancel: 'Anuluj',
      status: {
        connecting: 'Łączenie z bramką...',
        connected: 'Sesja PicoClaw połączona',
        disconnected: 'Sesja PicoClaw zamknięta',
        stopped: 'Wysłano żądanie zatrzymania',
        runtimeStarted: 'Runtime PicoClaw uruchomiony',
        runtimeStartFailed: 'Nie udało się uruchomić runtime PicoClaw',
        runtimeStopped: 'Runtime PicoClaw zatrzymany',
        runtimeStopFailed: 'Nie udało się zatrzymać runtime PicoClaw'
      },
      connection: {
        runtime: {
          checking: 'Sprawdzam',
          ready: 'Runtime gotowy',
          stopped: 'Runtime zatrzymany',
          unavailable: 'Runtime niedostępny',
          configError: 'Błąd konfiguracji'
        },
        transport: {
          connecting: 'Łączenie',
          connected: 'Połączono'
        },
        run: {
          idle: 'Bezczynność',
          busy: 'Zajęty'
        }
      },
      message: {
        toolAction: 'Akcja',
        observation: 'Obserwacja',
        screenshot: 'Zrzut ekranu'
      },
      overlay: {
        locked: 'PicoClaw steruje urządzeniem. Wprowadzanie ręczne zostało wstrzymane.'
      },
      install: {
        install: 'Zainstaluj PicoClaw',
        installing: 'Instalowanie PicoClaw',
        success: 'PicoClaw zainstalowano pomyślnie',
        failed: 'Nie udało się zainstalować PicoClaw',
        uninstalling: 'Odinstalowywanie runtime...',
        uninstalled: 'Runtime został pomyślnie odinstalowany.',
        uninstallFailed: 'Odinstalowanie nie powiodło się.',
        requiredTitle: 'PicoClaw nie jest zainstalowany',
        requiredDescription: 'Zainstaluj PicoClaw przed uruchomieniem runtime PicoClaw.',
        progressDescription: 'PicoClaw jest pobierany i instalowany.',
        stages: {
          preparing: 'Przygotowanie',
          downloading: 'Pobieranie',
          extracting: 'Wypakowywanie',
          installing: 'Instalowanie',
          installed: 'Zainstalowano',
          install_timeout: 'Upłynął limit czasu',
          install_failed: 'Niepowodzenie'
        }
      },
      model: {
        requiredTitle: 'Wymagana jest konfiguracja modelu',
        requiredDescription: 'Skonfiguruj model PicoClaw przed użyciem czatu PicoClaw.',
        docsTitle: 'Przewodnik konfiguracji',
        docsDesc: 'Obsługiwane modele i protokoły',
        menuLabel: 'Skonfiguruj model',
        modelIdentifier: 'Identyfikator modelu',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Klucz API',
        apiKeyPlaceholder: 'Wprowadź klucz API modelu',
        save: 'Zapisz',
        saving: 'Zapisywanie',
        saved: 'Konfiguracja modelu została zapisana',
        saveFailed: 'Nie udało się zapisać konfiguracji modelu',
        invalid: 'Identyfikator modelu, API Base URL i klucz API są wymagane'
      },
      uninstall: {
        menuLabel: 'Odinstaluj',
        confirmTitle: 'Odinstaluj PicoClaw',
        confirmContent:
          'Czy na pewno chcesz odinstalować PicoClaw? Spowoduje to usunięcie pliku wykonywalnego i wszystkich plików konfiguracyjnych.',
        confirmOk: 'Odinstaluj',
        confirmCancel: 'Anuluj'
      },
      history: {
        title: 'Historia',
        loading: 'Ładowanie sesji...',
        emptyTitle: 'Nie ma jeszcze historii',
        emptyDescription: 'Tutaj pojawią się poprzednie sesje PicoClaw.',
        loadFailed: 'Nie udało się załadować historii sesji',
        deleteFailed: 'Nie udało się usunąć sesji',
        deleteConfirmTitle: 'Usuń sesję',
        deleteConfirmContent: 'Czy na pewno chcesz usunąć „{{title}}”?',
        deleteConfirmOk: 'Usuń',
        deleteConfirmCancel: 'Anuluj',
        messageCount_one: '{{count}} wiadomość',
        messageCount_other: '{{count}} wiadomości'
      },
      config: {
        startRuntime: 'Uruchom PicoClaw',
        stopRuntime: 'Zatrzymaj PicoClaw'
      },
      start: {
        title: 'Uruchom PicoClaw',
        description: 'Uruchom runtime, aby rozpocząć korzystanie z asystenta PicoClaw.'
      }
    },
    error: {
      title: 'Wystąpił problem',
      refresh: 'Odśwież'
    },
    fullscreen: {
      toggle: 'Przełącz tryb pełnoekranowy'
    },
    menu: {
      collapse: 'Zwiń menu',
      expand: 'Rozwiń Menu'
    }
  }
};

export default pl;
