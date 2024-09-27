const de = {
  translation: {
    language: 'Sprache',
    changePassword: 'Passwort ändern',
    logout: 'Ausloggen',
    settings: 'Einstellungen',
    showMouse: 'Mauszeiger anzeigen',
    hideMouse: 'Mauszeiger verstecken',
    power: 'Einschalten',
    reset: 'Neustart',
    powerShort: 'Einschalten (Kurzes Drücken)',
    powerLong: 'Einschalten (Langes Drücken)',
    hddLed: 'Festplatten-LED',
    checkLibFailed: 'Überprüfung der Laufzeitbibliothek fehlgeschlagen, bitte erneut versuchen.',
    updateLibFailed:
      'Aktualisierung der Laufzeitbibliothek fehlgeschlagen, bitte erneut versuchen.',
    updatingLib: 'Aktualiserung der Laufzeitbibliothek. Bitte nach dem Update die Seite neu laden.',
    checkForUpdate: 'Nach Update suchen',
    head: {
      desktop: 'Entfernter Desktop',
      login: 'Einloggen',
      changePassword: 'Passwort ändern',
      terminal: 'Terminal'
    },
    auth: {
      login: 'Einloggen',
      placeholderUsername: 'Bitte den Benutzernamen eingeben',
      placeholderPassword: 'Bitte das Passwort eingeben',
      placeholderPassword2: 'Passwort wiederholen',
      noEmptyUsername: 'Der Benutzername darf nicht leer sein',
      noEmptyPassword: 'Das Passwort darf nicht leer sein',
      noAccount:
        'Fehler beim Auslsen der Benutzerinformation, bitte die Seite neu laden oder das Passwort zurücksetzen',
      invalidUser: 'Falscher Benutzername oder falsches Passwort',
      error: 'Unerwarteter Fehler',
      changePassword: 'Passwort ändern',
      differentPassword: 'Passwörter stimmt nicht überein',
      illegalUsername: 'Benutzername beinhaltet ungültige Zeichen',
      illegalPassword: 'Passwort beinhaltet ungültige Zeichen',
      forgetPassword: 'Passwort vergessen',
      resetPassword: 'Password zurücksetzen',
      reset1:
        'Falls sie das Passwort vergessen haben, führen sie folgende Schritte durch um dieses zurückzusetzen:',
      reset2: '1. In das NanoKVM via SSH einloggen;',
      reset3: '2. Die Datei auf dem Gerät löschen: ',
      reset4: '3. Den Standardaccount zum Einloggen benutzen: ',
      ok: 'Ok',
      cancel: 'Abbrechen'
    },
    screen: {
      resolution: 'Auflösung',
      auto: 'Automatisch',
      autoTips:
        'Falls es bei bestimmten Auflösungen zu Screen-Tearing oder einem Offset des Mauszeigers kommen sollte, bitte die Auflösung des Remote Hosts anpassen oder den automatischen Modus ausschalten.',
      fps: 'FPS',
      customizeFps: 'Anpassen',
      quality: 'Qualität',
      frameDetect: 'Frame Detect',
      frameDetectTip:
        'Berechnet den Unterschied zwischen den Einzelbildern. Beendet die Liveübertragung des Videostreams wenn keine Änderungen auf dem Bildschirm des Hosts festgestellt werden kann.'
    },
    keyboard: {
      paste: 'Einfügen',
      tips: 'Nur Standard-Tastaturbuchstaben und Symbole werden unterstützt.',
      placeholder: 'Bitte eingeben',
      submit: 'Senden',
      virtual: 'Virtuelle Tastatur'
    },
    mouse: {
      default: 'Standard Cursor',
      pointer: 'Zeiger Cursor',
      cell: 'Zellen Cursor',
      text: 'Text Cursor',
      grab: 'Greif Cursor',
      hide: 'Cursor ausblenden',
      mode: 'Maus Modus',
      absolute: 'Absoluter Modus',
      relative: 'Relativer Modus',
      requestPointer:
        'Der Relative Modus wird benutzt. Bitte auf den Desktop klicken um einen Mauszeiger anzuzeigen.',
      resetHid: 'Eingeabegeräte zurücksetzen'
    },
    image: {
      title: 'ISO oder Festplatten Abbilder',
      loading: 'Laden...',
      empty: 'Nichts gefunden',
      mountFailed: 'Mounten fehlgeschlagen',
      mountDesc:
        'Bei einigen Systemen muss die virtuelle Festplatte auf dem Remote-Host ausgeworfen werden, bevor das Image gemountet werden kann.',
      tips: {
        title: 'Wie man Abbilder hochlädt',
        usb1: 'Den NanoKVM via USB mit dem Computer verbinden.',
        usb2: 'Stellen sie sicher, das das Virtuelle Festplatte eingebunden ist. (Einstellungen - Virtuelle Festplatte).',
        usb3: 'Öffnen sie die Virtuelle Festplatte auf ihrem Computer und kopieren sie die Abbilddatei in das root-Verzeichnis des USB-Geräts.',
        scp1: 'Stellen sie sicher, das sich der NanoKVM und ihr Computer im gleichen lokalen Netzwerk befinden.',
        scp2: 'Öffnen sie ein Terminal auf ihrem Computer und benutzen sie den SCP-Befehl um die Abbilddatei in das /data Verzeichnis des NanoKVM zu kopieren.',
        scp3: 'Beispiel: scp ihr-abbild-verzeichnis root@ihre-nanokvm-ip:/data',
        tfCard: 'TF-Karte',
        tf1: 'Diese Mehthode wird auf Linuxsystemen unterstützt',
        tf2: 'Entfernen sie die TF-Karte aus dem NanoKVM (gilt nur für die fertig zusammengebaute Version, bitte das Gehäuse vorher auseinanderbauen).',
        tf3: 'Legen sie die TF-Karte in den Kartenleser ein und verbinden sie diesen mit dem Computer.',
        tf4: 'Kopieren sie die Abbild-Datei in das /data Verzeichnis der TF-Karte.',
        tf5: 'Legen sie die TF-Karte in das NanoKVM ein.'
      }
    },
    script: {
      title: 'Skript',
      upload: 'Hochladen',
      run: 'Ausführen',
      runBackground: 'Im Hintergrund ausführen',
      runFailed: 'Ausführung abgebrochen',
      attention: 'Achtung',
      delDesc: 'Sind sie sicher, dass sie diese Datei löschen möchten?',
      confirm: 'Ja',
      cancel: 'Nein',
      delete: 'Löschen',
      close: 'Schließen'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'NanoKVM Terminal',
      serial: 'Terminal über den Seriellen Port',
      serialPort: 'Serieller Port',
      serialPortPlaceholder: 'Serielle Portnummer eingeben',
      baudrate: 'Baudrate',
      confirm: 'Ok'
    },
    wol: {
      sending: 'Befehl senden...',
      sent: 'Befehl gesendet',
      input: 'Bitte die MAC eingeben',
      ok: 'Ok'
    },
    about: {
      title: 'Über NanoKVM',
      information: 'Information',
      ip: 'IP',
      mdns: 'mDNS',
      firmware: 'Versionsnummer',
      image: 'Image Version',
      deviceKey: 'Geräte-Key',
      queryFailed: 'Anfrage gescheitert',
      community: 'Community'
    },
    update: {
      title: 'Nach neuem Update suchen',
      queryFailed: 'Versionsnummer konnte nicht erkannt werden',
      updateFailed: 'Update gescheitert. Bitte versuchen sie es erneut.',
      isLatest: 'Die aktuelle Version ist bereits installiert.',
      available:
        'Ein Update ist verfügbar. Sind sie sicher, dass sie diese Version aktualisieren möchten?',
      updating: 'Update wird gestartet. Bitte warten...',
      confirm: 'Bestätigen',
      cancel: 'Abbrechen'
    },
    virtualDevice: {
      network: 'Virtuelles Netzwerk',
      disk: 'Virtuelle Festplatte'
    },
    tailscale: {
      loading: 'Lade...',
      notInstall: 'Tailscale wurde nicht gefunden! Bitte installieren.',
      install: 'Installieren',
      installing: 'Installation wird durchgeführt',
      failed: 'Installation gescheitert',
      retry:
        'Bitte neu laden und noch einmal versuchen. Oder versuchen sie Tailscale manuell zu installieren',
      download: 'Laden sie das',
      package: 'Installationspaket',
      unzip: 'und entpacken sie es manuell',
      upTailscale: 'Hochladen von tailscale in das NanoKVM Verzeichnis /usr/bin/',
      upTailscaled: 'Hochladen von tailscaled in das NanoKVM Verzeichnis /usr/sbin/',
      refresh: 'Die aktuelle Seite neu laden',
      notLogin:
        'Diese Geräte ist bisher noch nicht verknüpft. Bitte loggen sie sich in ihr Konto ein und verknüpfen sie dieses Gerät mit diesem.',
      urlPeriod: 'Diese URL ist für 10 Minuten gültig',
      login: 'Einloggen',
      loginSuccess: 'Das Einloggen war erfolgreich',
      enable: 'Tailscale aktivieren',
      deviceName: 'Name des Geräts',
      deviceIP: 'Geräte-IP',
      account: 'Benutzerkonto',
      logout: 'Ausloggen',
      logout2: 'Wollen Sie sich wirklich ausloggen?'
    }
  }
};

export default de;
