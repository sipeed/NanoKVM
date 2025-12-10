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
      noAccount: 'Abfragen der Benutzerdaten fehlgeschlagen, bitte die Seite neu laden oder Passwort zurücksetzen',
      invalidUser: 'Falscher Benutzername oder falsches Passwort',
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
        change4: 'Um die Passwörter zurückzusetzen, drücken und halten Sie den BOOT Knopf auf dem NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Wi-Fi Konfiguration für NanoKVM',
      success: 'Bitte überprüfen Sie den Netzwerk-Status des NanoKVM und greifen Sie über die neue IP Adresse darauf zu.',
      failed: 'Aktion fehlgeschlagen, bitte erneut versuchen.',
      confirmBtn: 'Ok',
      finishBtn: 'Fertig'
    },
    screen: {
      title: 'Bildschirm',
      video: 'Video Modus',
      resolution: 'Auflösung',
      auto: 'Automatisch',
      autoTips:
        "Bildverzerrungen oder ein versetzter Mauszeiger können bei bestimmten Auflösungen auftreten. Versuchen Sie, die Auflösung des entfernten Hosts anzupassen oder den automatischen Modus zu deaktivieren.",
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
      ctrlaltdel: 'Ctrl+Alt+Del',
      dropdownEnglish: 'Englisch',
      dropdownGerman: 'Deutsch'
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
      requestPointer: 'Relativer Modus aktiv. Klicken Sie auf den Desktop um den Mauszeiger zu sehen.',
      resetHid: 'HID zurücksetzen',
      hidOnly: {
        title: 'HID-Only Modus',
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
      cdrom: 'Binden Sie das Abbild im CD-ROM Modus ein',
      mountFailed: 'Einbinden fehlgeschlagen',
      mountDesc: 
        "In einigen Systemen ist es notwendig, die virtuelle Festplatte auf dem entfernten Host auszuwerfen, bevor das Image eingebunden werden kann.",
      refresh: 'Bilder aktualisieren',
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
      flowControlSoft: 'Wenig',
      flowControlHard: 'Viel',
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
      disabled: '/data Partition ist nur-lesbar, daher kann das Systemabbild nicht heruntergeladen werden',
      uploadbox: "Datei hier ablegen oder klicken zum Auswählen",
      inputfile: "Bitte geben Sie die Datei für das Systemabbild an"
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
        deviceKey: 'Geräte Schlüssel',
        community: 'Community',
        hostname: 'Hostname',
        hostnameUpdated: 'Hostname aktualisiert. Neustarten um zu übernehmen.',
        ipType: {
          'Wired': 'Kabel',
          'Wireless': 'Drahtlos',
          'Other': 'Andere'
        }
      },
      appearance: {
        title: 'Erscheinungsbild',
        display: 'Bildschirm',
        language: 'Sprache',
        menuBar: 'Menu-Leiste',
        menuBarDesc: 'Symbole in der Menu-Leiste anzeigen',
        webTitle: 'Web Titel',
        webTitleDesc: 'Passen Sie den Web-Seite Titel an'
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
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi konfigurieren',
          setBtn: 'Konfigurieren'
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
          tip: "Das Aktivieren dieser Funktion kann die Lebensdauer Ihrer SD-Karte verkürzen!"
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
          tip: "Deaktivieren Sie den Dienst, wenn Sie ihn nicht benötigen"
        },
        hidOnly: 'HID-Only Mode',
        disk: 'Virtuelle Festplatte',
        diskDesc: 'Binde das virtuelle U-Laufwerk an den entfernten Host',
        network: 'Virtuelles Netzwerk',
        networkDesc: 'Binde die virtuelle Netzwerkkarte an den entfernten Host',
        reboot: 'Neustarten',
        rebootDesc: 'Sind Sie sicher dass Sie NanoKVM neustarten möchten?',
        okBtn: 'Ja',
        cancelBtn: 'Nein'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Speicher Optimierung',
          tip: "Wenn die Speichernutzung das Limit überschreitet, wird die Speicherbereinigung aggressiver durchgeführt, um Speicher freizugeben. Es wird empfohlen, den Wert auf 75 MB zu setzen, wenn Tailscale verwendet wird. Ein Neustart von Tailscale ist erforderlich, damit die Änderung wirksam wird.",
          disable: 'Deaktivieren'
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
          'Bitte beachten Sie, dass Vorab-Versionen womöglich noch Fehler oder unvollständige Funktionen enthalten!'
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
    error: {
      title: "Wir sind auf ein Problem gestossen",
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
