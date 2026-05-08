const de = {
  translation: {
    head: {
      desktop: 'Entfernter Desktop',
      login: 'Anmelden',
      changePassword: 'Passwort ändern',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Anmelden',
      placeholderUsername: 'Benutzername',
      placeholderPassword: 'Passwort',
      placeholderPassword2: 'Bitte Passwort erneut eingeben',
      noEmptyUsername: 'Benutzername benötigt',
      noEmptyPassword: 'Passwort benötigt',
      noAccount:
        'Abfragen der Benutzerdaten fehlgeschlagen, bitte die Seite neu laden oder Passwort zurücksetzen',
      invalidUser: 'Falscher Benutzername oder falsches Passwort',
      locked: 'Zu viele Anmeldungen, bitte versuchen Sie es später noch einmal',
      globalLocked: 'System wird geschützt, bitte versuchen Sie es später erneut',
      error: 'Unerwarteter Fehler',
      changePassword: 'Passwort ändern',
      changePasswordDesc: 'Für die Sicherheit Ihres Geräts ändern Sie bitte das Passwort!',
      differentPassword: 'Passwörter stimmen nicht überein',
      illegalUsername: 'Benutzername enthält ungültige Zeichen',
      illegalPassword: 'Passwort enthält ungültige Zeichen',
      forgetPassword: 'Passwort vergessen',
      ok: 'Ok',
      cancel: 'Abbrechen',
      loginButtonText: 'Anmelden',
      tips: {
        reset1:
          'Um das Passwort zurückzusetzen, drücken und halten Sie den BOOT Knopf auf dem NanoKVM für 10 Sekunden.',
        reset2: 'Für detailliertere Anweisungen lesen Sie folgendes Dokument:',
        reset3: 'Web Standard-Account:',
        reset4: 'SSH Standard-Account:',
        change1: 'Bitte beachten Sie, dass diese Aktion folgende Passwörter ändert:',
        change2: 'Web Anmelde-Passwort',
        change3: 'System root Passwort (SSH Anmelde-Passwort)',
        change4:
          'Um die Passwörter zurückzusetzen, drücken und halten Sie den BOOT Knopf auf dem NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Wi-Fi Konfiguration für NanoKVM',
      success:
        'Bitte überprüfen Sie den Netzwerk-Status des NanoKVM und greifen Sie über die neue IP Adresse darauf zu.',
      failed: 'Aktion fehlgeschlagen, bitte erneut versuchen.',
      invalidMode:
        'Der aktuelle Modus unterstützt keine Netzwerkeinrichtung. Bitte gehen Sie zu Ihrem Gerät und aktivieren Sie den Wi-Fi-Konfigurationsmodus.',
      confirmBtn: 'Ok',
      finishBtn: 'Fertig',
      ap: {
        authTitle: 'Authentifizierung erforderlich',
        authDescription: 'Bitte geben Sie das Passwort AP ein, um fortzufahren',
        authFailed: 'Ungültiges AP Passwort',
        passPlaceholder: 'AP Passwort',
        verifyBtn: 'Überprüfen'
      }
    },
    screen: {
      scale: 'Skala',
      title: 'Bildschirm',
      video: 'Video Modus',
      videoDirectTips:
        'Aktivieren Sie HTTPS unter „Einstellungen > Gerät“, um diesen Modus zu verwenden',
      resolution: 'Auflösung',
      auto: 'Automatisch',
      autoTips:
        'Bildverzerrungen oder ein versetzter Mauszeiger können bei bestimmten Auflösungen auftreten. Versuchen Sie, die Auflösung des entfernten Hosts anzupassen oder den automatischen Modus zu deaktivieren.',
      fps: 'FPS',
      customizeFps: 'Anpassen',
      quality: 'Qualität',
      qualityLossless: 'Verlustfrei',
      qualityHigh: 'Hoch',
      qualityMedium: 'Mittel',
      qualityLow: 'Niedrig',
      frameDetect: 'Bilderkennung',
      frameDetectTip:
        'Berechnet den Unterschied zwischen den Einzelbildern. Beendet die Liveübertragung des Videostreams wenn keine Änderungen auf dem Bildschirm des Hosts festgestellt werden kann.',
      resetHdmi: 'HDMI zurücksetzen'
    },
    keyboard: {
      title: 'Tastatur',
      paste: 'Einfügen',
      tips: 'Server Tastaturbelegung',
      placeholder: 'Bitte eingeben',
      submit: 'Senden',
      virtual: 'Tastatur',
      readClipboard: 'Aus der Zwischenablage lesen',
      clipboardPermissionDenied:
        'Berechtigung für die Zwischenablage verweigert. Bitte erlauben Sie den Zugriff auf die Zwischenablage in Ihrem Browser.',
      clipboardReadError: 'Zwischenablage konnte nicht gelesen werden',
      dropdownEnglish: 'Englisch',
      dropdownGerman: 'Deutsch',
      dropdownFrench: 'Französisch',
      dropdownRussian: 'Russisch',
      shortcut: {
        title: 'Verknüpfungen',
        custom: 'Benutzerdefiniert',
        capture: 'Klicken Sie hier, um die Verknüpfung zu erfassen',
        clear: 'Klar',
        save: 'Speichern',
        captureTips:
          'Das Erfassen systemweiter Tasten (z. B. der Windows-Taste) erfordert die Vollbildberechtigung.',
        enterFullScreen: 'Vollbildmodus umschalten.'
      },
      leaderKey: {
        title: 'Leader-Taste',
        desc: 'Browserbeschränkungen umgehen und Systemverknüpfungen direkt an den Remote-Host senden.',
        howToUse: 'Verwendung',
        simultaneous: {
          title: 'Simultanmodus',
          desc1: 'Halten Sie die Leader-Taste gedrückt und drücken Sie dann die Tastenkombination.',
          desc2: 'Intuitiv, kann jedoch zu Konflikten mit Systemverknüpfungen führen.'
        },
        sequential: {
          title: 'Sequenzieller Modus',
          desc1:
            'Drücken Sie die Leader-Taste → drücken Sie die Tastenkombination nacheinander → drücken Sie erneut die Leader-Taste.',
          desc2: 'Erfordert mehr Schritte, vermeidet jedoch vollständig Systemkonflikte.'
        },
        enable: 'Leader-Taste aktivieren',
        tip: 'Wenn diese Taste als Leader-Taste zugewiesen wird, dient sie ausschließlich als Auslöser für Tastenkombinationen und verliert ihr Standardverhalten.',
        placeholder: 'Bitte drücken Sie die Leader-Taste',
        shiftRight: 'Rechts Shift',
        ctrlRight: 'Rechts Ctrl',
        metaRight: 'Rechts Win',
        submit: 'Senden',
        recorder: {
          rec: 'REC',
          activate: 'Tasten aktivieren',
          input: 'Bitte drücken Sie die Tastenkombination...'
        }
      }
    },
    mouse: {
      title: 'Maus',
      cursor: 'Cursor',
      default: 'Standard Cursor',
      pointer: 'Zeiger Cursor',
      cell: 'Zellen Cursor',
      text: 'Text Cursor',
      grab: 'Greif Cursor',
      hide: 'Versteckter Cursor',
      mode: 'Maus Modus',
      absolute: 'Absoluter Modus',
      relative: 'Relativer Modus',
      direction: 'Scrollrichtung',
      scrollUp: 'Nach oben scrollen',
      scrollDown: 'Scrollen Sie nach unten',
      speed: 'Scrollgeschwindigkeit',
      fast: 'Schnell',
      slow: 'Langsam',
      requestPointer:
        'Relativer Modus aktiv. Klicken Sie auf den Desktop um den Mauszeiger zu sehen.',
      resetHid: 'HID zurücksetzen',
      hidOnly: {
        title: 'HID-Only-Modus',
        desc: 'Wenn Ihre Maus und Tastatur nicht mehr reagieren und das Zurücksetzen der HID-Verbindung nicht hilft, könnte es sich um ein Kompatibilitätsproblem zwischen dem NanoKVM und dem Gerät handeln. Versuchen Sie, den HID-Only Modus zu aktivieren, um die Kompatibilität zu verbessern.',
        tip1: 'Die Aktivierung des HID-Only Modus entfernt das virtuelle U-Laufwerk und das virtuelle Netzwerk.',
        tip2: 'Im HID-Only Modus ist das Einbinden von Systemabbilder deaktiviert.',
        tip3: 'NanoKVM wird nach dem Wechsel in den neuen Modus automatisch neu gestartet.',
        enable: 'HID-Only Modus aktivieren',
        disable: 'HID-Only Modus deaktivieren'
      }
    },
    image: {
      title: 'Bilder',
      loading: 'Lädt...',
      empty: 'Nichts gefunden',
      mountMode: 'Mount-Modus',
      mountFailed: 'Einbinden fehlgeschlagen',
      mountDesc:
        'In einigen Systemen ist es notwendig, die virtuelle Festplatte auf dem entfernten Host auszuwerfen, bevor das Image eingebunden werden kann.',
      unmountFailed: 'Das Aufheben der Bereitstellung ist fehlgeschlagen',
      unmountDesc:
        'Auf einigen Systemen müssen Sie das Image manuell vom Remote-Host auswerfen, bevor Sie die Bereitstellung aufheben.',
      refresh: 'Bilder aktualisieren',
      attention: 'Achtung',
      deleteConfirm: 'Sind Sie sicher, dass Sie dieses Bild löschen möchten?',
      okBtn: 'Ja',
      cancelBtn: 'Nein',
      tips: {
        title: 'So laden Sie Dateien hoch',
        usb1: 'Verbinden Sie den NanoKVM über USB mit Ihrem Computer.',
        usb2: 'Stellen Sie sicher, dass die virtuelle Festplatte eingebunden ist (Einstellungen – Virtuelle Festplatte).',
        usb3: 'Öffnen Sie die virtuelle Festplatte auf Ihrem Computer und kopieren Sie die Image-Datei in das Stammverzeichnis der virtuellen Festplatte.',
        scp1: 'Stellen Sie sicher, dass sich der NanoKVM und Ihr Computer im selben lokalen Netzwerk befinden.',
        scp2: 'Öffnen Sie ein Terminal auf Ihrem Computer und verwenden Sie den SCP-Befehl, um die Image-Datei in das Verzeichnis /data auf dem NanoKVM hochzuladen.',
        scp3: 'Beispiel: scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'TF-Karte',
        tf1: 'Diese Methode wird unter Linux-Systemen unterstützt.',
        tf2: 'Entnehmen Sie die TF-Karte aus dem NanoKVM (bei der FULL-Version muss zuvor das Gehäuse geöffnet werden).',
        tf3: 'Stecken Sie die TF-Karte in einen Kartenleser und verbinden Sie diesen mit Ihrem Computer.',
        tf4: 'Kopieren Sie die Image-Datei in das Verzeichnis /data auf der TF-Karte.',
        tf5: 'Setzen Sie die TF-Karte wieder in den NanoKVM ein.'
      }
    },
    script: {
      title: 'Skripte',
      upload: 'Hochladen',
      run: 'Ausführen',
      runBackground: 'Im Hintergrund ausführen',
      runFailed: '',
      attention: 'Achtung',
      delDesc: 'Möchten Sie diese Datei wirklich löschen?',
      confirm: 'Ja',
      cancel: 'Nein',
      delete: 'Löschen',
      close: 'Schliessen'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'NanoKVM Terminal',
      serial: 'Serieller Anschluss Terminal',
      serialPort: 'Serieller Anschluss',
      serialPortPlaceholder: 'Bitte seriellen Anschluss angeben',
      baudrate: 'Baudrate',
      parity: 'Parität',
      parityNone: 'Keine',
      parityEven: 'Gerade',
      parityOdd: 'Ungerade',
      flowControl: 'Fluss-Kontrolle',
      flowControlNone: 'Keine',
      flowControlSoft: 'Software',
      flowControlHard: 'Hardware',
      dataBits: 'Daten bits',
      stopBits: 'Stopp bits',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Sende Befehl...',
      sent: 'Befehl gesendet',
      input: 'Bitte MAC Adresse eingeben',
      ok: 'Ok'
    },
    download: {
      title: 'Systemabbild Downloader',
      input: 'Bitte geben Sie die URL für das Remote-Systemabbild ein',
      ok: 'Ok',
      disabled:
        '/data Partition ist nur-lesbar, daher kann das Systemabbild nicht heruntergeladen werden',
      uploadbox: 'Datei hier ablegen oder klicken zum Auswählen',
      inputfile: 'Bitte geben Sie die Datei für das Systemabbild an',
      NoISO: 'Keine ISO'
    },
    power: {
      title: 'Power',
      showConfirm: 'Bestätigung',
      showConfirmTip: 'Diese Aktionen benötigen eine zusätzliche Bestätigung',
      reset: 'Zurücksetzen',
      power: 'Power',
      powerShort: 'Power (Kurzer Klick)',
      powerLong: 'Power (Langer Klick)',
      resetConfirm: 'Reset-Aktion durchführen?',
      powerConfirm: 'Power-Aktion durchführen?',
      okBtn: 'Ja',
      cancelBtn: 'Nein'
    },
    settings: {
      title: 'Einstellungen',
      about: {
        title: 'Über NanoKVM',
        information: 'Informationen',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Applikations-Version',
        applicationTip: 'NanoKVM Web Applikations-Version',
        image: 'Systemabbild-Version',
        imageTip: 'NanoKVM Systemabbild-Version',
        deviceKey: 'Geräteschlüssel',
        community: 'Community',
        hostname: 'Hostname',
        hostnameUpdated: 'Hostname aktualisiert. Neustarten um zu übernehmen.',
        ipType: {
          Wired: 'Kabel',
          Wireless: 'Drahtlos',
          Other: 'Andere'
        }
      },
      appearance: {
        title: 'Erscheinungsbild',
        display: 'Bildschirm',
        language: 'Sprache',
        languageDesc: 'Wählen Sie die Sprache für die Benutzeroberfläche aus',
        webTitle: 'Web Titel',
        webTitleDesc: 'Passen Sie den Web-Seite Titel an',
        menuBar: {
          title: 'Menüleiste',
          mode: 'Anzeigemodus',
          modeDesc: 'Menüleiste auf dem Bildschirm anzeigen',
          modeOff: 'Aus',
          modeAuto: 'Automatisch ausblenden',
          modeAlways: 'Immer sichtbar',
          icons: 'Untermenüsymbole',
          iconsDesc: 'Untermenüsymbole in der Menüleiste anzeigen'
        }
      },
      device: {
        title: 'Gerät',
        oled: {
          title: 'OLED',
          description: 'Schalte OLED Bildschirm aus nach',
          0: 'Nie',
          15: '15 Sek',
          30: '30 Sek',
          60: '1 Min',
          180: '3 Min',
          300: '5 Min',
          600: '10 Min',
          1800: '30 Min',
          3600: '1 Stunde'
        },
        ssh: {
          description: 'Aktiviere entfernten SSH-Zugang',
          tip: 'Setzten Sie ein starkes Passwort vor dem aktivieren (Konto - Passwort ändern)'
        },
        advanced: 'Erweiterte Einstellungen',
        swap: {
          title: 'Swap',
          disable: 'Deaktivieren',
          description: 'Grösse der Swap-Datei festlegen',
          tip: 'Das Aktivieren dieser Funktion kann die Lebensdauer Ihrer SD-Karte verkürzen!'
        },
        mouseJiggler: {
          title: 'Mausaktivitäts-Simulator',
          description: 'Verhindert, dass der remote Host in den Energiesparmodus wechselt',
          disable: 'Deaktivieren',
          absolute: 'Absoluter Modus',
          relative: 'Relativer Modus'
        },
        mdns: {
          description: 'mDNS-Erkennungsdienst aktivieren',
          tip: 'Deaktivieren Sie den Dienst, wenn Sie ihn nicht benötigen'
        },
        hdmi: {
          description: 'HDMI/Monitor-Ausgabe aktivieren'
        },
        autostart: {
          title: 'Autostart-Skripteinstellungen',
          description: 'Skripte verwalten, die beim Systemstart automatisch ausgeführt werden',
          new: 'Neu',
          deleteConfirm: 'Möchten Sie diese Datei wirklich löschen?',
          yes: 'Ja',
          no: 'Nein',
          scriptName: 'Name des Autostart-Skripts',
          scriptContent: 'Inhalt des Autostart-Skripts',
          settings: 'Einstellungen'
        },
        hidOnly: 'HID-Only Mode',
        hidOnlyDesc:
          'Hören Sie auf, virtuelle Geräte zu emulieren, und behalten Sie nur die grundlegende HID-Steuerung bei',
        disk: 'Virtuelle Festplatte',
        diskDesc: 'Binde das virtuelle U-Laufwerk an den entfernten Host',
        network: 'Virtuelles Netzwerk',
        networkDesc: 'Binde die virtuelle Netzwerkkarte an den entfernten Host',
        reboot: 'Neustarten',
        rebootDesc: 'Sind Sie sicher dass Sie NanoKVM neustarten möchten?',
        okBtn: 'Ja',
        cancelBtn: 'Nein'
      },
      network: {
        title: 'Netzwerk',
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi konfigurieren',
          apMode: 'AP-Modus ist aktiviert, verbinden Sie sich per QR-Code mit dem Wi-Fi',
          connect: 'Wi-Fi verbinden',
          connectDesc1: 'Bitte geben Sie die Netzwerk-SSID und das Passwort ein',
          connectDesc2: 'Bitte geben Sie das Passwort ein, um diesem Netzwerk beizutreten',
          disconnect: 'Möchten Sie die Netzwerkverbindung wirklich trennen?',
          failed: 'Verbindung fehlgeschlagen, bitte erneut versuchen.',
          ssid: 'Name',
          password: 'Passwort',
          joinBtn: 'Verbinden',
          confirmBtn: 'OK',
          cancelBtn: 'Abbrechen'
        },
        tls: {
          description: 'HTTPS-Protokoll aktivieren',
          tip: 'Hinweis: Die Verwendung von HTTPS kann die Latenz erhöhen, besonders im MJPEG-Videomodus.'
        },
        dns: {
          title: 'DNS',
          description: 'DNS-Server für NanoKVM konfigurieren',
          mode: 'Modus',
          dhcp: 'DHCP',
          manual: 'Manuell',
          add: 'DNS hinzufügen',
          save: 'Speichern',
          invalid: 'Bitte geben Sie eine gültige IP-Adresse ein',
          noDhcp: 'Derzeit ist kein DHCP-DNS verfügbar',
          saved: 'DNS-Einstellungen gespeichert',
          saveFailed: 'DNS-Einstellungen konnten nicht gespeichert werden',
          unsaved: 'Ungespeicherte Änderungen',
          maxServers: 'Maximal {{count}} DNS-Server erlaubt',
          dnsServers: 'DNS-Server',
          dhcpServersDescription: 'DNS-Server werden automatisch per DHCP bezogen',
          manualServersDescription: 'DNS-Server können manuell bearbeitet werden',
          networkDetails: 'Netzwerkdetails',
          interface: 'Schnittstelle',
          ipAddress: 'IP-Adresse',
          subnetMask: 'Subnetzmaske',
          router: 'Router',
          none: 'Keine'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Speicher Optimierung',
          tip: 'Wenn die Speichernutzung das Limit überschreitet, wird die Speicherbereinigung aggressiver durchgeführt, um Speicher freizugeben. Es wird empfohlen, den Wert auf 75 MB zu setzen, wenn Tailscale verwendet wird. Ein Neustart von Tailscale ist erforderlich, damit die Änderung wirksam wird.'
        },
        swap: {
          title: 'Speicher austauschen',
          tip: 'Wenn die Probleme nach der Aktivierung der Speicheroptimierung weiterhin bestehen, versuchen Sie, den Swap-Speicher zu aktivieren. Dadurch wird die Größe der Auslagerungsdatei standardmäßig auf 256MB festgelegt, was unter „Einstellungen > Gerät“ angepasst werden kann.'
        },
        restart: 'Tailscale neu starten?',
        stop: 'Tailscale stoppen?',
        stopDesc: 'Von Tailscale abmelden und automatischen Start beim Booten deaktivieren.',
        loading: 'Lädt...',
        notInstall: 'Tailscale nicht gefunden! Bitte installieren.',
        install: 'Installieren',
        installing: 'Installiere',
        failed: 'Installation fehlgeschlagen',
        retry: 'Bitte Seite neu laden und erneut versuchen oder manuelle Installation versuchen.',
        download: 'Laden Sie das',
        package: 'Installations-Paket herunter',
        unzip: 'und entpacken Sie es',
        upTailscale: 'Tailscale nach /usr/bin/ auf NanoKVM hochladen',
        upTailscaled: 'Tailscaled nach /usr/bin/ auf NanoKVM hochladen',
        refresh: 'Aktuelle Seite neu laden',
        notRunning: 'Tailscale läuft nicht. Bitte starten Sie es, um fortzufahren.',
        run: 'Start',
        notLogin:
          'Das Gerät konnte noch nicht gefunden werden. Bitte melden Sie sich an und verknüpfen Sie dieses Gerät mit Ihrem Konto.',
        urlPeriod: 'Diese URL ist für 10 Minuten gültig',
        login: 'Anmelden',
        loginSuccess: 'Anmeldung erfolgreich',
        enable: 'Tailscale einschalten',
        deviceName: 'Geräte Name',
        deviceIP: 'Geräte IP',
        account: 'Konto',
        logout: 'Abmelden',
        logoutDesc: 'Möchten Sie sich wirklich abmelden?',
        uninstall: 'Tailscale deinstallieren',
        uninstallDesc: 'Sind Sie sicher, dass Sie Tailscale deinstallieren möchten?',
        okBtn: 'Ja',
        cancelBtn: 'Nein'
      },
      update: {
        title: 'Nach Aktualisierungen suchen',
        queryFailed: 'Version konnte nicht abgefragt werden',
        updateFailed: 'Aktualisierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        isLatest: 'Sie haben bereits die aktuellste Version.',
        available: 'Eine Aktualisierung ist verfügbar. Möchten sie diese jetzt durchführen?',
        updating: 'Aktualisierung gestartet. Bitte warten...',
        confirm: 'Bestätigen',
        cancel: 'Abbrechen',
        preview: 'Vorab-Versionen',
        previewDesc: 'Erhalten Sie vorab Zugriff auf neue Funktionen und Verbesserungen',
        previewTip:
          'Bitte beachten Sie, dass Vorab-Versionen womöglich noch Fehler oder unvollständige Funktionen enthalten!',
        offline: {
          title: 'Offline Aktualisierung',
          desc: 'Über lokales Installationspaket aktualisieren',
          upload: 'Hochladen',
          invalidName:
            'Ungültiges Dateinamenformat. Bitte laden Sie von den GitHub-Releases herunter.',
          updateFailed: 'Aktualisierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
        }
      },
      account: {
        title: 'Konto',
        webAccount: 'Web Konto Name',
        password: 'Passwort',
        updateBtn: 'Ändern',
        logoutBtn: 'Abmelden',
        logoutDesc: 'Möchten Sie sich wirklich abmelden?',
        okBtn: 'Ja',
        cancelBtn: 'Nein'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistent',
      empty: 'Öffnen Sie das Bedienfeld und starten Sie eine Aufgabe.',
      inputPlaceholder: 'Beschreiben Sie, was der PicoClaw tun soll',
      newConversation: 'Neues Gespräch',
      processing: 'Wird verarbeitet...',
      agent: {
        defaultTitle: 'Allgemeiner Assistent',
        defaultDescription: 'Allgemeine Chat-, Such- und Arbeitsbereichshilfe.',
        kvmTitle: 'Fernsteuerung',
        kvmDescription: 'Betreiben Sie den Remote-Host über NanoKVM.',
        switched: 'Agentenrolle gewechselt',
        switchFailed: 'Agentenrolle konnte nicht gewechselt werden'
      },
      send: 'Senden',
      cancel: 'Abbrechen',
      status: {
        connecting: 'Verbindung zum Gateway wird hergestellt...',
        connected: 'PicoClaw Sitzung verbunden',
        disconnected: 'PicoClaw Sitzung geschlossen',
        stopped: 'Stoppanforderung gesendet',
        runtimeStarted: 'PicoClaw Runtime gestartet',
        runtimeStartFailed: 'PicoClaw Runtime konnte nicht gestartet werden',
        runtimeStopped: 'PicoClaw Runtime gestoppt',
        runtimeStopFailed: 'PicoClaw Runtime konnte nicht gestoppt werden'
      },
      connection: {
        runtime: {
          checking: 'Überprüfung',
          ready: 'Runtime bereit',
          stopped: 'Runtime gestoppt',
          unavailable: 'Runtime nicht verfügbar',
          configError: 'Konfigurationsfehler'
        },
        transport: {
          connecting: 'Verbinden',
          connected: 'Verbunden'
        },
        run: {
          idle: 'Leerlauf',
          busy: 'Beschäftigt'
        }
      },
      message: {
        toolAction: 'Aktion',
        observation: 'Beobachtung',
        screenshot: 'Screenshot'
      },
      overlay: {
        locked: 'PicoClaw steuert das Gerät. Die manuelle Eingabe wird angehalten.'
      },
      install: {
        install: 'Installieren Sie PicoClaw',
        installing: 'Installation von PicoClaw',
        success: 'PicoClaw erfolgreich installiert',
        failed: 'Installation von PicoClaw fehlgeschlagen',
        uninstalling: 'Runtime wird deinstalliert...',
        uninstalled: 'Runtime erfolgreich deinstalliert.',
        uninstallFailed: 'Deinstallation fehlgeschlagen.',
        requiredTitle: 'PicoClaw ist nicht installiert',
        requiredDescription: 'Installieren Sie PicoClaw, bevor Sie die PicoClaw Runtime starten.',
        progressDescription: 'PicoClaw wird heruntergeladen und installiert.',
        stages: {
          preparing: 'Vorbereiten',
          downloading: 'Wird heruntergeladen',
          extracting: 'Extrahieren',
          installing: 'Installiere',
          installed: 'Installiert',
          install_timeout: 'Zeitüberschreitung',
          install_failed: 'Fehlgeschlagen'
        }
      },
      model: {
        requiredTitle: 'Modellkonfiguration ist erforderlich',
        requiredDescription:
          'Konfigurieren Sie das PicoClaw-Modell, bevor Sie den PicoClaw-Chat verwenden.',
        docsTitle: 'Konfigurationshandbuch',
        docsDesc: 'Unterstützte Modelle und Protokolle',
        menuLabel: 'Modell konfigurieren',
        modelIdentifier: 'Modell-ID',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API-Schlüssel',
        apiKeyPlaceholder: 'API-Schlüssel des Modells eingeben',
        save: 'Speichern',
        saving: 'Speichern',
        saved: 'Modellkonfiguration gespeichert',
        saveFailed: 'Modellkonfiguration konnte nicht gespeichert werden',
        invalid: 'Modellkennung, API Base URL und API-Schlüssel sind erforderlich'
      },
      uninstall: {
        menuLabel: 'Deinstallieren',
        confirmTitle: 'Deinstallieren PicoClaw',
        confirmContent:
          'Sind Sie sicher, dass Sie PicoClaw deinstallieren möchten? Dadurch werden die ausführbare Datei und alle Konfigurationsdateien gelöscht.',
        confirmOk: 'Deinstallieren',
        confirmCancel: 'Abbrechen'
      },
      history: {
        title: 'Verlauf',
        loading: 'Sitzungen werden geladen...',
        emptyTitle: 'Noch keine Historie',
        emptyDescription: 'Frühere PicoClaw-Sitzungen werden hier angezeigt.',
        loadFailed: 'Der Sitzungsverlauf konnte nicht geladen werden',
        deleteFailed: 'Sitzung konnte nicht gelöscht werden',
        deleteConfirmTitle: 'Sitzung löschen',
        deleteConfirmContent: 'Sind Sie sicher, dass Sie „{{title}}“ löschen möchten?',
        deleteConfirmOk: 'Löschen',
        deleteConfirmCancel: 'Abbrechen',
        messageCount_one: '{{count}} Nachricht',
        messageCount_other: '{{count}} Nachrichten'
      },
      config: {
        startRuntime: 'PicoClaw starten',
        stopRuntime: 'PicoClaw stoppen'
      },
      start: {
        title: 'PicoClaw starten',
        description:
          'Starten Sie die Runtime, um mit der Verwendung des PicoClaw-Assistenten zu beginnen.'
      }
    },
    error: {
      title: 'Wir sind auf ein Problem gestossen',
      refresh: 'Neuladen'
    },
    fullscreen: {
      toggle: 'Vollbild ein/aus'
    },
    menu: {
      collapse: 'Menu einblenden',
      expand: 'Menu verbergen'
    }
  }
};

export default de;
