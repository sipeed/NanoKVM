const nl = {
  translation: {
    head: {
      desktop: 'Extern bureaublad',
      login: 'Inloggen',
      changePassword: 'Wachtwoord wijzigen',
      terminal: 'Terminal',
      wifi: 'Wifi'
    },
    auth: {
      login: 'Inloggen',
      placeholderUsername: 'Voer gebruikersnaam in',
      placeholderPassword: 'Voer wachtwoord in',
      placeholderPassword2: 'Voer wachtwoord nogmaals in',
      noEmptyUsername: 'Gebruikersnaam mag niet leeg zijn',
      noEmptyPassword: 'Wachtwoord mag niet leeg zijn',
      noAccount:
        'Ophalen van gebruikersinformatie mislukt, vernieuw de webpagina of reset het wachtwoord',
      invalidUser: 'Ongeldige gebruikersnaam of wachtwoord',
      error: 'Onverwachte fout',
      changePassword: 'Wachtwoord wijzigen',
      changePasswordDesc:
        'Voor de veiligheid van uw apparaat, wijzig alstublieft het webaanmeldingswachtwoord.',
      differentPassword: 'Wachtwoorden komen niet overeen',
      illegalUsername: 'Gebruikersnaam bevat ongeldige tekens',
      illegalPassword: 'Wachtwoord bevat ongeldige tekens',
      forgetPassword: 'Wachtwoord vergeten',
      ok: 'Ok',
      cancel: 'Annuleren',
      loginButtonText: 'Inloggen',
      tips: {
        reset1: 'Om de wachtwoorden opnieuw in te stellen, houdt u de BOOT-knop op de NanoKVM 10 seconden lang ingedrukt.',
        reset2: 'Voor gedetailleerde stappen kunt u dit document raadplegen:',
        reset3: 'Standaard webaccount:',
        reset4: 'Standaard SSH-account:',
        change1: 'Houd er rekening mee dat deze actie de volgende wachtwoorden zal wijzigen:',
        change2: 'Web login wachtwoord',
        change3: 'Systeem root-wachtwoord (SSH-inlogwachtwoord)',
        change4: 'Om de wachtwoorden opnieuw in te stellen, houdt u de BOOT-knop op de NanoKVM ingedrukt.'
      }
    },
    wifi: {
      title: 'Wifi',
      description: 'Wifi configureren voor NanoKVM',
      success: 'Controleer de netwerkstatus van NanoKVM en bezoek het nieuwe IP-adres.',
      failed: 'De bewerking is mislukt. Probeer het opnieuw.',
      confirmBtn: 'Ok',
      finishBtn: 'Gereed'
    },
    screen: {
      video: 'Videomodus',
      resolution: 'Resolutie',
      auto: 'Automatisch',
      autoTips:
        'Bij bepaalde resoluties kunnen schermverscheuringen of muisverplaatsingen optreden. Overweeg de resolutie van de externe host aan te passen of schakel de automatische modus uit.',
      fps: 'FPS',
      customizeFps: 'Aanpassen',
      quality: 'Kwaliteit',
      qualityLossless: 'Verliesvrij',
      qualityHigh: 'Hoog',
      qualityMedium: 'Gemiddeld',
      qualityLow: 'Laag',
      frameDetect: 'Frame detectie',
      frameDetectTip:
        'Berekent het verschil tussen frames. Stopt met het verzenden van de videostream wanneer er geen veranderingen worden gedetecteerd op het scherm van de externe host.',
      resetHdmi: 'Reset HDMI'
    },
    keyboard: {
      paste: 'Plakken',
      tips: 'Alleen standaard toetsenbordletters en symbolen worden ondersteund',
      placeholder: 'Voer tekst in',
      submit: 'Verzenden',
      virtual: 'Toetsenbord',
      ctrlaltdel: 'Ctrl+Alt+Del'
    },
    mouse: {
      default: 'Standaard cursor',
      pointer: 'Aanwijzer cursor',
      cell: 'Cel cursor',
      text: 'Tekst cursor',
      grab: 'Grijp cursor',
      hide: 'Cursor verbergen',
      mode: 'Muismodus',
      absolute: 'Absolute modus',
      relative: 'Relatieve modus',
      requestPointer:
        'Relatieve modus wordt gebruikt. Klik op het bureaublad om de muisaanwijzer te krijgen.',
      resetHid: 'HID resetten'
    },
    image: {
      title: 'Afbeeldingen',
      loading: 'Laden...',
      empty: 'Niets gevonden',
      mountFailed: 'Koppelen mislukt',
      mountDesc:
        'In sommige systemen is het noodzakelijk om de virtuele schijf op de externe host uit te werpen voordat het image wordt gekoppeld.',
      tips: {
        title: 'Hoe te uploaden',
        usb1: 'Verbind de NanoKVM met uw computer via USB.',
        usb2: 'Zorg ervoor dat de virtuele schijf is gekoppeld (Instellingen - Virtuele schijf).',
        usb3: 'Open de virtuele schijf op uw computer en kopieer het imagebestand naar de hoofdmap van de virtuele schijf.',
        scp1: 'Zorg ervoor dat de NanoKVM en uw computer zich in hetzelfde lokale netwerk bevinden.',
        scp2: 'Open een terminal op uw computer en gebruik het SCP-commando om het imagebestand te uploaden naar de /data directory op de NanoKVM.',
        scp3: 'Voorbeeld: scp uw-image-pad root@uw-nanokvm-ip:/data',
        tfCard: 'TF-kaart',
        tf1: 'Deze methode wordt ondersteund op Linux-systemen',
        tf2: 'Haal de TF-kaart uit de NanoKVM (voor de VOLLEDIGE versie, demonteer eerst de behuizing).',
        tf3: 'Plaats de TF-kaart in een kaartlezer en verbind deze met uw computer.',
        tf4: 'Kopieer het imagebestand naar de /data directory op de TF-kaart.',
        tf5: 'Plaats de TF-kaart terug in de NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Uploaden',
      run: 'Uitvoeren',
      runBackground: 'Op achtergrond uitvoeren',
      runFailed: 'Uitvoeren mislukt',
      attention: 'Let op',
      delDesc: 'Weet u zeker dat u dit bestand wilt verwijderen?',
      confirm: 'Ja',
      cancel: 'Nee',
      delete: 'Verwijderen',
      close: 'Sluiten'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'NanoKVM Terminal',
      serial: 'Seriële poort terminal',
      serialPort: 'Seriële poort',
      serialPortPlaceholder: 'Voer de seriële poort in',
      baudrate: 'Baudrate',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Commando wordt verzonden...',
      sent: 'Commando verzonden',
      input: 'Voer het MAC-adres in',
      ok: 'Ok'
    },
    power: {
      title: 'Aan/uit',
      reset: 'Resetten',
      power: 'Aan/uit',
      powerShort: 'Aan/uit (kort indrukken)',
      powerLong: 'Aan/uit (lang indrukken)'
    },
    settings: {
      title: 'Settings',
      about: {
        title: 'Over NanoKVM',
        information: 'Informatie',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Applicatie versie',
        applicationTip: 'NanoKVM web application version',
        image: 'Image versie',
        imageTip: 'NanoKVM system image version',
        deviceKey: 'Apparaat sleutel',
        community: 'Community'
      },
      appearance: {
        title: 'Uiterlijk',
        display: 'Beeldscherm',
        language: 'Taal',
        menuBar: 'Menubalk',
        menuBarDesc: 'Toon iconen in de menubalk'
      },
      device: {
        title: 'Apparaat',
        oled: {
          title: 'OLED',
          description: 'OLED scherm automatisch slapen',
          0: 'Nooit',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 uur'
        },
        wifi: {
          title: 'Wifi',
          description: 'Configureer wifi',
          setBtn: 'Config'
        },
        disk: 'Virtuele schijf',
        diskDesc: 'Koppel virtuele U-schijf aan de externe host',
        network: 'Virtueel Netwerk',
        networkDesc: 'Koppel virtueel netwerk kaart aan de externe host'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Geheugen optimalisatie',
          tip: "Wanneer geheugen gebruik de limiet overschreid, garbage collection wordt agressiever uitgevoerd om geheugen vrij te maken. geadviseerd om 50MB te kiezen als Tailscale wordt gebruikt. Tailscale moet worden herstart om de wijziging door te voeren.",
          disable: 'Uitschakelen'
        },
        restart: 'Weet u zeker dat u Tailscale opnieuw wilt opstarten?',
        stop: 'Weet u zeker dat u Tailscale wilt stoppen?',
        stopDesc: 'Meld Tailscale af en schakel het automatisch opstarten bij het opstarten uit.',
        loading: 'Laden...',
        notInstall: 'Tailscale niet gevonden! Installeer a.u.b.',
        install: 'Installeren',
        installing: 'Installeren bezig',
        failed: 'Installatie mislukt',
        retry: 'Vernieuw en probeer opnieuw. Of probeer handmatig te installeren',
        download: 'Download het',
        package: 'installatiepakket',
        unzip: 'en pak het uit',
        upTailscale: 'Upload tailscale naar NanoKVM directory /usr/bin/',
        upTailscaled: 'Upload tailscaled naar NanoKVM directory /usr/sbin/',
        refresh: 'Vernieuw huidige pagina',
        notLogin:
          'Het apparaat is nog niet gekoppeld. Log in en koppel dit apparaat aan uw account.',
        urlPeriod: 'Deze url is 10 minuten geldig',
        login: 'Inloggen',
        loginSuccess: 'Inloggen gelukt',
        enable: 'Tailscale inschakelen',
        deviceName: 'Apparaatnaam',
        deviceIP: 'Apparaat IP',
        account: 'Account',
        logout: 'Uitloggen',
        logout2: 'Weet u zeker dat u wilt uitloggen?',
        okBtn: 'Ja',
        cancelBtn: 'Nee'
      },
      update: {
        title: 'Controleren op updates',
        queryFailed: 'Ophalen versie mislukt',
        updateFailed: 'Update mislukt. Probeer het opnieuw.',
        isLatest: 'U heeft al de nieuwste versie.',
        available: 'Er is een update beschikbaar. Weet u zeker dat u wilt updaten?',
        updating: 'Update gestart. Even geduld a.u.b...',
        confirm: 'Bevestigen',
        cancel: 'Annuleren'
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Naam',
        password: 'Wachtwoord',
        updateBtn: 'Update',
        logoutBtn: 'Afmelden'
      }
    }
  }
};

export default nl;
