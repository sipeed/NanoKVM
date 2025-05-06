const en = {
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
      noAccount: 'Abfragen der Benutzerdaten fehlgeschalgen, bitte die Seite neu laden oder Passwort zurücksetzen',
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
        "Bildverzerrungen oder ein versetzter Mauszeiger kann bei bestimmten Auflösungen auftreten. Versuchen Sie, die Auflösung des entfernten Hosts anzupassen oder den automatischen Modus zu deaktivieren.",
      fps: 'FPS',
      customizeFps: 'Anpassen',
      quality: 'Qualität',
      qualityLossless: 'Verlustfrei',
      qualityHigh: 'Hoch',
      qualityMedium: 'Mittel',
      qualityLow: 'Niedrig',
      frameDetect: 'Bilderkennung',
      frameDetectTip:
        "Berechnet den Unterschied zwischen den Einzelbildern. Beendet die Liveübertragung des Videostreams wenn keine Änderungen auf dem Bildschirm des Hosts festgestellt werden kann.",
      resetHdmi: 'Reset HDMI'
    },
    keyboard: {
      title: 'Tastatur',
      paste: 'Einfügen',
      tips: 'Nur Standard-Tastaturbuchstaben und Symbole werden unterstützt',
      placeholder: 'Bitte eingeben',
      submit: 'Senden',
      virtual: 'Tastatur',
      ctrlaltdel: 'Ctrl+Alt+Del'
    },
    mouse: {
      title: 'Maus',
      cursor: 'Cursor',
      default: 'Standard Cursor',
      pointer: 'Zeiger Cursor',
      cell: 'Zellen Cursor',
      text: 'Text Cursor',
      grab: 'Greif Cursor',
      hide: 'Versteck Cursor',
      mode: 'Maus Modus',
      absolute: 'Absolut Modus',
      relative: 'Relativ Modus',
      requestPointer: 'Nutze relativer Modus. Um Mauszeiger zu sehen, klicken Sie auf den Desktop.',
      resetHid: 'Reset HID',
      hidOnly: {
        title: 'HID-Only Modus',
        desc: 'Wenn Ihre Maus und Tastatur nicht mehr reagieren und das Zurücksetzen der HID-Verbindung nicht hilft, könnte es sich um ein Kompatibilitätsproblem zwischen dem NanoKVM und dem Gerät handeln. Versuchen Sie, den HID-Only-Modus zu aktivieren, um die Kompatibilität zu verbessern.',
        tip1: 'Die Aktivierung des HID-Only-Modus entfernt das virtuelle U-Laufwerk und das virtuelle Netzwerk.',
        tip2: 'Im HID-Only Modus ist das Einbinden von Images deaktiviert.',
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
      baudrate: 'Baud rate',
      parity: 'Parity',
      parityNone: 'None',
      parityEven: 'Even',
      parityOdd: 'Odd',
      flowControl: 'Flow control',
      flowControlNone: 'None',
      flowControlSoft: 'Soft',
      flowControlHard: 'Hard',
      dataBits: 'Data bits',
      stopBits: 'Stop bits',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Sending command...',
      sent: 'Command sent',
      input: 'Please enter the MAC',
      ok: 'Ok'
    },
    download: {
      title: 'Image Downloader',
      input: 'Please enter a remote image URL',
      ok: 'Ok',
      disabled: '/data partition is RO, so we cannot download the image'
    },
    power: {
      title: 'Power',
      showConfirm: 'Confirmation',
      showConfirmTip: 'Power operations require an extra confirmation',
      reset: 'Reset',
      power: 'Power',
      powerShort: 'Power (short click)',
      powerLong: 'Power (long click)',
      resetConfirm: 'Proceed reset operation?',
      powerConfirm: 'Proceed power operation?',
      okBtn: 'Yes',
      cancelBtn: 'No'
    },
    settings: {
      title: 'Settings',
      about: {
        title: 'About NanoKVM',
        information: 'Information',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Application Version',
        applicationTip: 'NanoKVM web application version',
        image: 'Image Version',
        imageTip: 'NanoKVM system image version',
        deviceKey: 'Device Key',
        community: 'Community',
        hostname: 'Hostname',
        hostnameUpdated: 'Hostname updated. Reboot to apply.',
        ipType: {
          'Wired': 'Wired',
          'Wireless': 'Wireless',
          'Other': 'Other'
        }
      },
      appearance: {
        title: 'Appearance',
        display: 'Display',
        language: 'Language',
        menuBar: 'Menu Bar',
        menuBarDesc: 'Display icons in the menu bar',
        webTitle: 'Web Title',
        webTitleDesc: 'Customize the web page title'
      },
      device: {
        title: 'Device',
        oled: {
          title: 'OLED',
          description: 'Turn off OLED screen after',
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
        ssh: {
          description: 'Enable SSH remote access',
          tip: 'Set a strong password before enabling (Account - Change Password)'
        },
        advanced: 'Advanced Settings',
        swap: {
          title: 'Swap',
          disable: 'Disable',
          description: 'Set the swap file size',
          tip: "Enabling this feature could shorten your SD card's usable life!"
        },
        mouseJiggler: {
          title: 'Mouse Jiggler',
          description: 'Prevent the remote host from sleeping',
          disable: 'Disable',
          absolute: 'Absolute Mode',
          relative: 'Relative Mode'
        },
        mdns: {
          description: 'Enable mDNS discovery service',
          tip: "Turning it off if it's not needed"
        },
        hidOnly: 'HID-Only Mode',
        disk: 'Virtual Disk',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtual Network',
        networkDesc: 'Mount virtual network card on the remote host',
        reboot: 'Reboot',
        rebootDesc: 'Are you sure you want to reboot NanoKVM?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Memory optimization',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. It's recommended to set to 75MB if using Tailscale. A Tailscale restart is required for the change to take effect.",
          disable: 'Disable'
        },
        restart: 'Restart Tailscale?',
        stop: 'Stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable automatic startup on boot.',
        loading: 'Loading...',
        notInstall: 'Tailscale not found! Please install.',
        install: 'Install',
        installing: 'Installing',
        failed: 'Install failed',
        retry: 'Please refresh and try again. Or try to install manually',
        download: 'Download the',
        package: 'installation package',
        unzip: 'and unzip it',
        upTailscale: 'Upload tailscale to NanoKVM directory /usr/bin/',
        upTailscaled: 'Upload tailscaled to NanoKVM directory /usr/sbin/',
        refresh: 'Refresh current page',
        notLogin:
          'The device has not been bound yet. Please login and bind this device to your account.',
        urlPeriod: 'This url is valid for 10 minutes',
        login: 'Login',
        loginSuccess: 'Login Success',
        enable: 'Enable Tailscale',
        deviceName: 'Device Name',
        deviceIP: 'Device IP',
        account: 'Account',
        logout: 'Logout',
        logoutDesc: 'Are you sure you want to logout?',
        uninstall: 'Uninstall Tailscale',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Check for Updates',
        queryFailed: 'Get version failed',
        updateFailed: 'Update failed. Please retry.',
        isLatest: 'You already have the latest version.',
        available: 'An update is available. Are you sure you want to update now?',
        updating: 'Update started. Please wait...',
        confirm: 'Confirm',
        cancel: 'Cancel',
        preview: 'Preview Updates',
        previewDesc: 'Get early access to new features and improvements',
        previewTip:
          'Please be aware that preview releases may contain bugs or incomplete functionality!'
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Name',
        password: 'Password',
        updateBtn: 'Change',
        logoutBtn: 'Logout',
        logoutDesc: 'Are you sure you want to logout?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      }
    },
    error: {
      title: "We've ran into an issue",
      refresh: 'Refresh'
    },
    fullscreen: {
      toggle: 'Toggle Fullscreen'
    },
    menu: {
      collapse: 'Collapse Menu',
      expand: 'Expand Menu'
    }
  }
};

export default en;
