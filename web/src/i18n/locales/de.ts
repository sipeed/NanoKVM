const de = {
  translation: {
    head: {
      desktop: 'Entfernter Desktop',
      login: 'Anmelden',
      changePassword: 'Passwort ändern',
      terminal: 'Terminal',
      wifi: 'Wi-Fi',
      storage: 'Abbilder & Dateifreigabe'
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
      },
      placeholderCurrentPassword: 'Aktuelles Passwort',
      passwordLength: 'Das Passwort muss zwischen 8 und 72 Zeichen lang sein',
      invalidCurrentPassword: 'Das aktuelle Passwort ist falsch'
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
    desktop: {
      readOnly: 'Nur Ansehen',
      readOnlyTip:
        'Dieses Konto kann keine Tastatur- oder Mauseingaben an den Zielrechner senden, daher zeigt die Konsole nur das Bild.'
    },
    screen: {
      scale: 'Skala',
      title: 'Bildschirm',
      video: 'Video Modus',
      videoDirectTips:
        'Aktivieren Sie HTTPS unter „Einstellungen > Gerät“, um diesen Modus zu verwenden',
      resolution: 'Auflösung',
      controlRegion: {
        title: 'Mauskalibrierung',
        description:
          'Verwenden Sie diese Einstellung, wenn das gesteuerte Gerät eine andere Auflösung als 16:9 verwendet und der Mauszeiger horizontal oder vertikal versetzt ist.',
        off: 'Aus',
        auto: 'Automatisch',
        autoWarning:
          'Die Kalibrierung kann fehlschlagen, wenn die Benutzeranwendung einen vollständig schwarzen Hintergrund hat.',
        manual: 'Manuell',
        selectedResolution: 'Auflösung des ausgewählten Bereichs',
        unused: 'Nicht verwendet',
        originalResolution: 'Originalauflösung',
        selectResolution: 'Originalauflösung auswählen',
        addResolution: 'Benutzerdefinierte Auflösung hinzufügen',
        add: 'Hinzufügen',
        duplicateResolution: 'Diese Auflösung ist bereits vorhanden.',
        width: 'Breite',
        height: 'Höhe',
        apply: 'Berechnen und anwenden',
        invalidResolution:
          'Geben Sie eine gültige Originalauflösung ein, sobald das Video bereit ist.',
        select: 'Bereich auswählen',
        clear: 'Automatische Erkennung wiederherstellen',
        saveFailed: 'Der Eingabebereich konnte nicht gespeichert werden.',
        tooSmall: 'Der ausgewählte Bereich ist zu klein.',
        previewUnavailable: 'Vorschau nicht verfügbar',
        clearConfirm: 'Automatische Erkennung schwarzer Ränder wiederherstellen?',
        dragHint: 'Ziehen Sie, um den Remote-Desktop-Bereich auszuwählen',
        finish: 'Fertig',
        confirm: 'Bestätigen',
        cancel: 'Abbrechen'
      },
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
      resetHdmi: 'HDMI zurücksetzen',
      mixedH264: {
        title: 'H.264-Streamkonflikt',
        description:
          'H.264 Direct und H.264 WebRTC werden gleichzeitig verwendet. Dies kann zu Bildschirm-Tearing oder beschädigtem Video führen. Bitte verwenden Sie nur einen H.264-Modus.'
      },
      webrtcConnectionFailed: {
        title: 'WebRTC-Verbindung fehlgeschlagen',
        description: 'Überprüfen Sie die Netzwerkverbindung oder wechseln Sie den Videomodus.'
      },
      captureStatus: {
        hdmiError: 'HDMI-Bildschirmfehler',
        unsupportedResolution: 'Die aktuelle Auflösung wird nicht unterstützt',
        retrieving: 'Bildschirm wird abgerufen...',
        changingResolution: 'Auflösung wird gewechselt...',
        updateFailed: 'Der Bildschirm kann derzeit nicht aktualisiert werden',
        videoError: 'Fehler bei der Videoanzeige',
        noHdmi: 'Kein HDMI-Signal erkannt',
        unavailable: 'Der Bildschirm kann derzeit nicht angezeigt werden'
      }
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
    storage: {
      title: 'Abbilder & Dateifreigabe',
      empty:
        'Noch keine Abbilder. Laden Sie eine ISO oder IMG hoch oder kopieren Sie eine vom Zielrechner auf die Festplatte.',
      notAttached: 'Nichts eingebunden',
      attached: 'Eingebunden: {{name}}',
      eject: 'Auswerfen',
      mount: 'Einbinden',
      mountMode: 'Mount-Modus',
      mountModeDisk: 'Massenspeicher',
      mountModeCdrom: 'CD-ROM',
      openManager: 'Dateimanager öffnen',
      refresh: 'Aktualisieren',
      delete: 'Löschen',
      deleteTitle: 'Medium löschen',
      deleteConfirm: '{{name}} löschen? Die darin enthaltenen Dateien gehen verloren.',
      downloadImage: 'Abbild herunterladen',
      typePartition: 'Freigegebene Dateien',
      volumeLabel: 'Wechseldatenträger',
      groups: {
        share: 'Dateifreigabe',
        images: 'Abbilder'
      },
      failed: 'Vorgang fehlgeschlagen',
      hidOnly: 'HID-Modus: Das virtuelle Laufwerk ist nicht verfügbar',
      disabled: 'Das virtuelle Laufwerk ist deaktiviert (Einstellungen - Gerät)',
      force: {
        title: 'Medium mit Gewalt zurückholen?',
        desc: 'Der Zielrechner verwendet dieses Medium noch. Beim Zurückholen wird das USB-Gerät neu aufgelistet, und alles, was noch nicht auf den Datenträger geschrieben wurde, kann verloren gehen.',
        menuHint:
          'Der Zielrechner verwendet dieses Medium. Öffnen Sie den Dateimanager, um es mit Gewalt zurückzuholen.'
      },
      tips: {
        title: 'So laden Sie Dateien hoch',
        usb1: 'Verbinden Sie den NanoKVM über USB mit Ihrem Computer.',
        usb2: 'Binden Sie auf dieser Seite die freigegebenen Dateien im Massenspeicher-Modus ein.',
        usb3: 'Öffnen Sie die virtuelle Festplatte auf Ihrem Computer und kopieren Sie die Image-Datei in das Stammverzeichnis der virtuellen Festplatte.',
        usb4: 'Werfen Sie das Laufwerk nach dem Kopieren aus: Danach erscheint das Image in der Liste.',
        scp1: 'Stellen Sie sicher, dass sich der NanoKVM und Ihr Computer im selben lokalen Netzwerk befinden.',
        scp2: 'Öffnen Sie ein Terminal auf Ihrem Computer und verwenden Sie den SCP-Befehl, um die Image-Datei in das Verzeichnis /data auf dem NanoKVM hochzuladen.',
        scp3: 'Beispiel: scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'TF-Karte',
        tf1: 'Diese Methode wird unter Linux-Systemen unterstützt.',
        tf2: 'Entnehmen Sie die TF-Karte aus dem NanoKVM (bei der FULL-Version muss zuvor das Gehäuse geöffnet werden).',
        tf3: 'Stecken Sie die TF-Karte in einen Kartenleser und verbinden Sie diesen mit Ihrem Computer.',
        tf4: 'Kopieren Sie die Image-Datei in das Verzeichnis /data auf der TF-Karte.',
        tf5: 'Setzen Sie die TF-Karte wieder in den NanoKVM ein.'
      },
      job: {
        running: '{{name}} wird bearbeitet'
      },
      enableDisk: {
        title: 'Virtuelles Laufwerk aktivieren?',
        desc: 'Zum Einbinden eines Mediums wird das virtuelle Laufwerk benötigt, das derzeit ausgeschaltet ist. Jetzt aktivieren? Tastatur und Maus des Zielrechners werden kurz getrennt.',
        menuHint:
          'Das virtuelle Laufwerk ist deaktiviert. Aktivieren Sie es unter Einstellungen - Gerät.',
        askDevice:
          'Das virtuelle Laufwerk ist ausgeschaltet. Ein Konto mit der Geräte-Berechtigung muss es zuerst einschalten.'
      },
      add: {
        title: 'Medium hinzufügen',
        upload: 'ISO oder IMG hochladen',
        fromUrl: 'Von einer URL herunterladen',
        url: 'Abbild-URL',
        urlRequired: 'Bitte geben Sie eine URL ein',
        onlyImages: 'Nur .iso- und .img-Dateien können eingebunden werden',
        dropHint: 'Ziehen Sie eine ISO oder IMG hierher oder klicken Sie, um eine Datei zu wählen',
        cdromOnlyIso: 'Ein CD-ROM kann nur ein ISO-9660-Abbild enthalten',
        uploadFailed: 'Hochladen fehlgeschlagen',
        downloadFailed: 'Herunterladen fehlgeschlagen',
        uploading: '{{name}} wird hochgeladen',
        downloading: '{{name}} wird heruntergeladen',
        done: '{{name}} ist bereit',
        checksumFailed: 'Das Image stimmt nicht mit der SHA-256-Prüfsumme überein.',
        blocked: 'Der Zielrechner verwendet die Festplatte',
        copyHint:
          'Sie können ein Abbild auch per SCP auf die Datenpartition kopieren oder vom Zielrechner aus.'
      },
      files: {
        selectMedium: 'Wählen Sie ein Medium, um die darin enthaltenen Dateien zu durchsuchen.',
        reasonAttached: 'Dieses Medium ist mit dem Zielrechner verbunden.',
        reasonAttachedHint:
          'Werfen Sie es zuerst aus: Der Zielrechner muss die Festplatte freigeben, bevor ihre Dateien gelesen werden können.',
        reasonNotBrowsable:
          'Dieses Medium enthält ein Dateisystem, das der Dateimanager nicht öffnen kann.',
        reasonNoLoop:
          'Dieses Gerät kann keine Datenträgerabbilder einbinden (keine Loop-Unterstützung).',
        reasonISOImage:
          'Ein ISO-9660-Abbild lässt sich hier nicht durchsuchen. Es kann weiterhin am Zielrechner eingebunden werden.',
        empty: 'Dieser Ordner ist leer',
        noMatch: 'Keine Datei entspricht der Suche.',
        free: '{{size}} frei',
        search: 'Diesen Ordner durchsuchen',
        sort: {
          name: 'Name',
          size: 'Größe',
          type: 'Typ',
          asc: 'Aufsteigend',
          desc: 'Absteigend'
        },
        upload: 'Eine Datei auf das Medium hochladen',
        deleteFolderTitle: 'Ordner löschen',
        deleteFolderConfirm:
          'Den Ordner {{name}} mit seinem gesamten Inhalt löschen? Dies kann nicht rückgängig gemacht werden.',
        uploading: 'Wird hochgeladen…',
        uploadFailed: 'Hochladen fehlgeschlagen',
        download: 'Herunterladen',
        delete: 'Löschen',
        deleteTitle: 'Datei löschen',
        deleteConfirm: '{{name}} vom Medium löschen?'
      },
      yes: 'Ja',
      no: 'Nein'
    },
    script: {
      title: 'Skripte',
      upload: 'Hochladen',
      run: 'Ausführen',
      runBackground: 'Im Hintergrund ausführen',
      runFailed: 'Ausführung fehlgeschlagen',
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
      disabled:
        'Die Datenpartition ist schreibgeschützt, solange der Zielrechner sie verwendet: Neue Abbilder lassen sich nicht ablegen, vorhandene Dateien aber weiterhin herunterladen.',
      sha256: 'SHA-256 (optional)',
      sha256Placeholder: 'Geben Sie eine 64-stellige SHA-256-Prüfsumme ein',
      invalidSHA256: 'SHA-256 muss eine 64-stellige Hexadezimalzeichenfolge sein',
      cancel: 'Abbrechen',
      cancelFailed: 'Download konnte nicht abgebrochen werden'
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
      mcp: {
        title: 'MCP-Dienst',
        service: 'MCP-Fernsteuerung',
        serviceDesc:
          'Vertrauenswürdigen MCP-Clients erlauben, Tastatur und Maus zu steuern und Bildschirmfotos aufzunehmen',
        securityWarning:
          'Jeder mit diesem API-Schlüssel kann den entfernten Host steuern und dessen Bildschirm sehen. Verwenden Sie HTTPS und aktivieren Sie den Dienst nur in vertrauenswürdigen Netzwerken.',
        endpoint: 'Endpunkt',
        apiKey: 'API-Schlüssel',
        regenerateConfirmTitle: 'MCP-API-Schlüssel neu generieren?',
        regenerateConfirmDesc: 'Der aktuelle Schlüssel funktioniert dann sofort nicht mehr.',
        enableConfirmTitle: 'Externe MCP-Steuerung aktivieren?',
        enableConfirmDesc:
          'Durch Aktivieren von MCP wird PicoClaw gestoppt und jede aktive PicoClaw-Sitzung geschlossen.',
        failed: 'MCP-Aktion fehlgeschlagen',
        copyFailed: 'Kopieren fehlgeschlagen. Bitte manuell kopieren.',
        okBtn: 'Bestätigen',
        cancelBtn: 'Abbrechen'
      },
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
          keyboardLedStatus: 'Tastensperren-Anzeigen',
          keyboardLedStatusDesc:
            'Num-Lock-, Feststell- und Rollen-Status des Remote-Computers anzeigen',
          icons: 'Untermenüsymbole',
          iconsDesc: 'Untermenüsymbole in der Menüleiste anzeigen'
        }
      },
      keyboardLedStatus: {
        groupLabel: 'Tastensperren-Status der Remote-Tastatur',
        indicatorLabel: '{{label}}: {{state}}',
        numLock: 'Num-Taste',
        numLockShort: 'Num',
        capsLock: 'Feststelltaste',
        capsLockShort: 'Fest',
        scrollLock: 'Rollen-Taste',
        scrollLockShort: 'Roll',
        on: 'Ein',
        off: 'Aus',
        unknown: 'Unbekannt'
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
          description: 'HDMI/Monitor-Ausgabe aktivieren',
          idleTimeoutTitle: 'Zeitlimit für inaktive Aufnahme',
          idleTimeoutDescription:
            'HDMI-Aufnahme stoppen, wenn keine aktiven Zuschauer vorhanden sind für',
          minutes: 'Min.'
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
        cancelBtn: 'Nein',
        diskLocked: 'Aus, solange ein Image eingebunden ist (Einschalten bricht die Einbindung ab)',
        diskCancelMount:
          'Das Aktivieren des virtuellen Laufwerks bricht das eingebundene Image ab und unterbricht einen laufenden Image-Download oder -Upload. Fortfahren?',
        diskBreakDownload:
          'Das Aktivieren des virtuellen Laufwerks unterbricht den Image-Download. Fortfahren?',
        attention: 'Achtung'
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
        customServer: {
          title: 'Benutzerdefinierter Update-Server',
          desc: 'Online-Updates von einem angegebenen Server suchen und herunterladen',
          invalidUrl:
            'Geben Sie ein gültiges HTTP- oder HTTPS-Serververzeichnis ohne Abfrageparameter, Fragment oder latest.json ein.',
          loadFailed: 'Die Konfiguration des Update-Servers konnte nicht geladen werden.',
          saveFailed: 'Die Konfiguration des Update-Servers konnte nicht gespeichert werden.',
          saved: 'Die Konfiguration des Update-Servers wurde gespeichert.',
          save: 'Speichern',
          confirmTitle: 'Benutzerdefinierten Update-Server verwenden?',
          confirmDesc:
            'SHA-512 bestätigt lediglich, dass das Paket mit dem von diesem Server bereitgestellten Manifest übereinstimmt. Es beweist nicht, dass das Paket eine offizielle NanoKVM-Version ist. Ein fehlerhafter oder bösartiger Server kann das Gerät unbrauchbar machen, Datenverlust verursachen oder das System kompromittieren.',
          confirm: 'Trotzdem verwenden',
          previewDisabled:
            'Vorschau-Updates sind nicht verfügbar, solange ein benutzerdefinierter Update-Server aktiviert ist.'
        },
        offline: {
          title: 'Offline Aktualisierung',
          desc: 'Über lokales Installationspaket aktualisieren',
          upload: 'Hochladen',
          checksumPlaceholder: 'SHA-256-Prüfsumme (optional)',
          invalidChecksum: 'Die SHA-256-Prüfsumme muss 64 hexadezimale Zeichen enthalten.',
          checksumMismatch:
            'Die SHA-256-Überprüfung ist fehlgeschlagen. Das Paket ist möglicherweise beschädigt.',
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
        cancelBtn: 'Nein',
        role: 'Rolle',
        roles: {
          admin: 'Administrator',
          user: 'Benutzer'
        },
        users: {
          title: 'Benutzer',
          create: 'Benutzer erstellen',
          enabled: 'Aktiviert',
          disabled: 'Deaktiviert',
          deviceOwner: 'Geräteeigentümer',
          resetPassword: 'Passwort zurücksetzen',
          delete: 'Löschen',
          deleteConfirm: 'Diesen Benutzer löschen und alle seine Sitzungen widerrufen?',
          created: 'Benutzer erstellt',
          deleted: 'Benutzer gelöscht',
          passwordUpdated: 'Passwort aktualisiert',
          loadFailed: 'Benutzer konnten nicht geladen werden',
          saveFailed: 'Benutzer konnte nicht gespeichert werden',
          deleteFailed: 'Benutzer konnte nicht gelöscht werden',
          editPermissions: 'Berechtigungen'
        },
        permissions: {
          title: 'Berechtigungen',
          consoleGroup: 'Konsole',
          manageGroup: 'Verwaltung',
          consoleView: 'Konsole anzeigen',
          consoleControl: 'Tastatur und Maus',
          power: 'Energiesteuerung',
          mediaMount: 'Abbilder einbinden und lesen',
          mediaManage: 'Abbild-Bibliothek verwalten',
          terminal: 'Terminal und Skripte',
          device: 'Geräteeinstellungen',
          network: 'Netzwerkeinstellungen',
          update: 'Systemaktualisierung',
          mcp: 'MCP-Dienst',
          mcpNote:
            'Der MCP-Dienst stellt einen geräteweiten API-Schlüssel aus, der Tastatur, Maus und Screenshots außerhalb der Websitzung steuert; er funktioniert auch nach dem Entzug dieser Berechtigung weiter, bis der Schlüssel neu erzeugt wird.',
          tailscale: 'Tailscale',
          ai: 'KI-Assistent',
          aiNote:
            'Der KI-Assistent erreicht das Gerät über eine lokale interne Schnittstelle, die nicht durch die übrigen Berechtigungen eingeschränkt wird; diese Berechtigung entspricht daher praktisch der vollständigen Gerätekontrolle.'
        }
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
        runtimeStopFailed: 'PicoClaw Runtime konnte nicht gestoppt werden',
        controlSwitchedToMCP: 'Steuerung zum externen MCP-Dienst gewechselt'
      },
      connection: {
        runtime: {
          checking: 'Überprüfung',
          restoring: 'Restoring PicoClaw',
          ready: 'Runtime bereit',
          stopped: 'Runtime gestoppt',
          blockedByMCP: 'Externe MCP-Steuerung ist aktiv',
          readyBlockedByMCP:
            'The runtime is running, but external MCP currently controls device input.',
          readyWithoutControl:
            'The runtime is running. Grant PicoClaw device control before reconnecting.',
          unavailable: 'Runtime nicht verfügbar',
          configError: 'Konfigurationsfehler'
        },
        transport: {
          connecting: 'Verbinden',
          connected: 'Verbunden',
          disconnected: 'Disconnected',
          reconnect: 'Reconnect',
          reconnectDescription: 'Reconnect to the running PicoClaw session.',
          reconnectBlocked: 'PicoClaw needs device control before reconnecting.'
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
      control: {
        picoclaw: 'Gerätesteuerung: PicoClaw',
        picoclawDescription: 'PicoClaw can write keyboard and mouse input. Manual input may pause.',
        mcp: 'Gerätesteuerung: externes MCP',
        mcpDescription: 'External MCP can write to the device. PicoClaw will not take over input.',
        off: 'Gerätesteuerung: aus',
        offDescription:
          'AI will not write keyboard or mouse input. Manual control remains available.',
        transitioning: 'Device control: switching',
        transitioningDescription: 'Device control is syncing. Please wait.',
        grant: 'Steuerung erteilen',
        release: 'Freigeben',
        releasing: 'Releasing...',
        switching: 'Switching...',
        releasingLabel: 'Device control: releasing',
        releasingDescription:
          'Device control is being returned. PicoClaw has stopped current writes.',
        granted: 'PicoClaw-Steuerung erteilt',
        released: 'PicoClaw-Steuerung freigegeben',
        grantFailed: 'PicoClaw-Steuerung konnte nicht erteilt werden',
        releaseFailed: 'PicoClaw-Steuerung konnte nicht freigegeben werden',
        grantConfirmTitle: 'Gerätesteuerung zu PicoClaw wechseln?',
        grantConfirmDesc: 'Externe MCP-Geräteschreibvorgänge werden unterbrochen.'
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
          verifying: 'Überprüfen',
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
        messageCount_other: '{{count}} Nachrichten',
        messageCount: '{{count}} Nachrichten'
      },
      config: {
        startRuntime: 'PicoClaw starten',
        stopRuntime: 'PicoClaw stoppen'
      },
      start: {
        enableConfirmTitle: 'Steuerung zu PicoClaw wechseln?',
        enableConfirmDesc: 'Beim Starten von PicoClaw wird der externe MCP-Dienst deaktiviert.',
        enableConfirmOk: 'PicoClaw starten',
        enableConfirmCancel: 'Abbrechen',
        title: 'PicoClaw starten',
        description:
          'Starten Sie die Runtime, um mit der Verwendung des PicoClaw-Assistenten zu beginnen.',
        switchFromMCP: 'Switch to PicoClaw and start',
        takeoverAndStart: 'Take over and start'
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
