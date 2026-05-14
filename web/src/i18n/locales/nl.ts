const nl = {
  translation: {
    head: {
      desktop: 'Extern bureaublad',
      login: 'Inloggen',
      changePassword: 'Wachtwoord wijzigen',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
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
      locked: 'Te veel aanmeldingen, probeer het later opnieuw',
      globalLocked: 'Systeem wordt beveiligd. Probeer het later opnieuw',
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
        reset1:
          'Om de wachtwoorden opnieuw in te stellen, houdt u de BOOT-knop op de NanoKVM 10 seconden lang ingedrukt.',
        reset2: 'Voor gedetailleerde stappen kunt u dit document raadplegen:',
        reset3: 'Standaard webaccount:',
        reset4: 'Standaard SSH-account:',
        change1: 'Houd er rekening mee dat deze actie de volgende wachtwoorden zal wijzigen:',
        change2: 'Web login wachtwoord',
        change3: 'Systeem root-wachtwoord (SSH-inlogwachtwoord)',
        change4:
          'Om de wachtwoorden opnieuw in te stellen, houdt u de BOOT-knop op de NanoKVM ingedrukt.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Wi-Fi configureren voor NanoKVM',
      success: 'Controleer de netwerkstatus van NanoKVM en bezoek het nieuwe IP-adres.',
      failed: 'De bewerking is mislukt. Probeer het opnieuw.',
      invalidMode:
        'De huidige modus ondersteunt geen netwerkconfiguratie. Ga naar uw apparaat en schakel de configuratiemodus Wi-Fi in.',
      confirmBtn: 'Ok',
      finishBtn: 'Gereed',
      ap: {
        authTitle: 'Authenticatie vereist',
        authDescription: 'Voer het wachtwoord AP in om door te gaan',
        authFailed: 'Ongeldig AP wachtwoord',
        passPlaceholder: 'AP wachtwoord',
        verifyBtn: 'Verifieer'
      }
    },
    screen: {
      scale: 'Schaal',
      title: 'Scherm',
      video: 'Videomodus',
      videoDirectTips: 'Schakel HTTPS in "Instellingen > Apparaat" in om deze modus te gebruiken',
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
      title: 'Toetsenbord',
      paste: 'Plakken',
      tips: 'Alleen standaard toetsenbordletters en symbolen worden ondersteund',
      placeholder: 'Voer tekst in',
      submit: 'Verzenden',
      virtual: 'Toetsenbord',
      readClipboard: 'Lezen vanaf het Klembord',
      clipboardPermissionDenied:
        'Klembordtoestemming geweigerd. Sta klembordtoegang toe in uw browser.',
      clipboardReadError: 'Kan het klembord niet lezen',
      dropdownEnglish: 'Engels',
      dropdownGerman: 'Duits',
      dropdownFrench: 'Frans',
      dropdownRussian: 'Russisch',
      shortcut: {
        title: 'Snelkoppelingen',
        custom: 'Aangepast',
        capture: 'Klik hier om de snelkoppeling vast te leggen',
        clear: 'Duidelijk',
        save: 'Opslaan',
        captureTips:
          'Voor het vastleggen van systeemtoetsen (zoals de Windows-toets) is toestemming voor volledig scherm vereist.',
        enterFullScreen: 'Schakelen naar volledig scherm.'
      },
      leaderKey: {
        title: 'Leader-toets',
        desc: 'Omzeil browserbeperkingen en stuur systeemsnelkoppelingen rechtstreeks naar de externe host.',
        howToUse: 'Hoe te gebruiken',
        simultaneous: {
          title: 'Gelijktijdige modus',
          desc1: 'Houd de Leader-toets ingedrukt en druk daarna op de sneltoets.',
          desc2: 'Intuïtief, maar kan conflicteren met systeemsnelkoppelingen.'
        },
        sequential: {
          title: 'Sequentiële modus',
          desc1:
            'Druk op de Leader-toets → druk de sneltoets in volgorde in → druk opnieuw op de Leader-toets.',
          desc2: 'Vereist meer stappen, maar vermijdt systeemconflicten volledig.'
        },
        enable: 'Leader-toets inschakelen',
        tip: 'Wanneer deze toets als Leader-toets is toegewezen, werkt hij uitsluitend als sneltoetstrigger en verliest hij zijn standaardgedrag.',
        placeholder: 'Druk op de Leader-toets',
        shiftRight: 'Rechter Shift',
        ctrlRight: 'Rechter Ctrl',
        metaRight: 'Rechter Win',
        submit: 'Verzenden',
        recorder: {
          rec: 'OPN',
          activate: 'Toetsen activeren',
          input: 'Druk op de snelkoppeling...'
        }
      }
    },
    mouse: {
      title: 'Muis',
      cursor: 'Cursorstijl',
      default: 'Standaard cursor',
      pointer: 'Aanwijzer cursor',
      cell: 'Cel cursor',
      text: 'Tekst cursor',
      grab: 'Grijp cursor',
      hide: 'Cursor verbergen',
      mode: 'Muismodus',
      absolute: 'Absolute modus',
      relative: 'Relatieve modus',
      direction: 'Scrollwielrichting',
      scrollUp: 'Scroll naar boven',
      scrollDown: 'Scroll naar beneden',
      speed: 'Scrollwielsnelheid',
      fast: 'Snel',
      slow: 'Langzaam',
      requestPointer:
        'Relatieve modus wordt gebruikt. Klik op het bureaublad om de muisaanwijzer te krijgen.',
      resetHid: 'HID resetten',
      hidOnly: {
        title: 'Alleen HID-modus',
        desc: 'Als uw muis en toetsenbord niet meer reageren en het opnieuw instellen van HID niet helpt, kan er sprake zijn van een compatibiliteitsprobleem tussen de NanoKVM en het apparaat. Probeer de modus HID-Only in te schakelen voor betere compatibiliteit.',
        tip1: 'Als u de modus HID-Only inschakelt, worden de virtuele U-schijf en het virtuele netwerk ontkoppeld',
        tip2: 'In de modus HID-Alleen is beeldmontage uitgeschakeld',
        tip3: 'NanoKVM wordt automatisch opnieuw opgestart na het wisselen van modus',
        enable: 'Schakel de modus HID-Alleen in',
        disable: 'Schakel de modus HID-Alleen uit'
      }
    },
    image: {
      title: 'Afbeeldingen',
      loading: 'Laden...',
      empty: 'Niets gevonden',
      mountMode: 'Montagemodus',
      mountFailed: 'Koppelen mislukt',
      mountDesc:
        'In sommige systemen is het noodzakelijk om de virtuele schijf op de externe host uit te werpen voordat het image wordt gekoppeld.',
      unmountFailed: 'Ontkoppelen mislukt',
      unmountDesc:
        'Op sommige systemen moet u de image handmatig uitwerpen van de externe host voordat u de image ontkoppelt.',
      refresh: 'Vernieuw de afbeeldingenlijst',
      attention: 'Let op',
      deleteConfirm: 'Weet u zeker dat u deze afbeelding wilt verwijderen?',
      okBtn: 'Ja',
      cancelBtn: 'Nee',
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
      parity: 'Pariteit',
      parityNone: 'Geen',
      parityEven: 'Even',
      parityOdd: 'Oneven',
      flowControl: 'Debietregeling',
      flowControlNone: 'Geen',
      flowControlSoft: 'Software',
      flowControlHard: 'Hardware',
      dataBits: 'Databits',
      stopBits: 'Stopbits',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Commando wordt verzonden...',
      sent: 'Commando verzonden',
      input: 'Voer het MAC-adres in',
      ok: 'Ok'
    },
    download: {
      title: 'Afbeeldingdownloader',
      input: 'Voer een externe afbeelding in URL',
      ok: 'Ok',
      disabled: '/data partitie is RO, dus we kunnen de afbeelding niet downloaden',
      uploadbox: 'Zet het bestand hier neer of klik om te selecteren',
      inputfile: 'Voer het afbeeldingsbestand in',
      NoISO: 'Geen ISO'
    },
    power: {
      title: 'Aan/uit',
      showConfirm: 'Bevestiging',
      showConfirmTip: 'Stroombedieningen vereisen een extra bevestiging',
      reset: 'Resetten',
      power: 'Aan/uit',
      powerShort: 'Aan/uit (kort indrukken)',
      powerLong: 'Aan/uit (lang indrukken)',
      resetConfirm: 'Doorgaan met resetten?',
      powerConfirm: 'Doorgaan met stroomvoorziening?',
      okBtn: 'Ja',
      cancelBtn: 'Nee'
    },
    settings: {
      title: 'Instellingen',
      about: {
        title: 'Over NanoKVM',
        information: 'Informatie',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Applicatie versie',
        applicationTip: 'Versie van de NanoKVM-webapplicatie',
        image: 'Image versie',
        imageTip: 'Versie van de NanoKVM-systeemimage',
        deviceKey: 'Apparaat sleutel',
        community: 'Community',
        hostname: 'Hostnaam',
        hostnameUpdated: 'Hostnaam bijgewerkt. Start opnieuw op om toe te passen.',
        ipType: {
          Wired: 'Bedraad',
          Wireless: 'Draadloos',
          Other: 'Anders'
        }
      },
      appearance: {
        title: 'Uiterlijk',
        display: 'Beeldscherm',
        language: 'Taal',
        languageDesc: 'Selecteer de taal voor de interface',
        webTitle: 'Webtitel',
        webTitleDesc: 'Pas de titel van de webpagina aan',
        menuBar: {
          title: 'Menubalk',
          mode: 'Weergavemodus',
          modeDesc: 'Geef de menubalk weer op het scherm',
          modeOff: 'Uit',
          modeAuto: 'Automatisch verbergen',
          modeAlways: 'Altijd zichtbaar',
          icons: 'Submenupictogrammen',
          iconsDesc: 'Submenupictogrammen weergeven in de menubalk'
        }
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
        ssh: {
          description: 'Schakel SSH externe toegang in',
          tip: 'Stel een sterk wachtwoord in voordat u (Account - Wachtwoord wijzigen) inschakelt'
        },
        advanced: 'Geavanceerde instellingen',
        swap: {
          title: 'Wisselen',
          disable: 'Uitschakelen',
          description: 'Stel de grootte van het wisselbestand in',
          tip: 'Het inschakelen van deze functie kan de bruikbare levensduur van uw SD-kaart verkorten!'
        },
        mouseJiggler: {
          title: 'Muisschommel',
          description: 'Voorkom dat de externe host in slaap valt',
          disable: 'Uitschakelen',
          absolute: 'Absolute modus',
          relative: 'Relatieve modus'
        },
        mdns: {
          description: 'Schakel de mDNS detectieservice in',
          tip: 'Schakel het uit als het niet nodig is'
        },
        hdmi: {
          description: 'Schakel HDMI/monitoruitgang in'
        },
        autostart: {
          title: 'Instellingen voor automatisch starten van scripts',
          description:
            'Beheer scripts die automatisch worden uitgevoerd bij het opstarten van het systeem',
          new: 'Nieuw',
          deleteConfirm: 'Weet u zeker dat u dit bestand wilt verwijderen?',
          yes: 'Ja',
          no: 'Nee',
          scriptName: 'Scriptnaam automatisch starten',
          scriptContent: 'Scriptinhoud automatisch starten',
          settings: 'Instellingen'
        },
        hidOnly: 'HID-Alleen modus',
        hidOnlyDesc:
          'Stop met het emuleren van virtuele apparaten en behoud alleen de basisbesturing van HID',
        disk: 'Virtuele schijf',
        diskDesc: 'Koppel virtuele U-schijf aan de externe host',
        network: 'Virtueel Netwerk',
        networkDesc: 'Koppel virtueel netwerk kaart aan de externe host',
        reboot: 'Opnieuw opstarten',
        rebootDesc: 'Weet u zeker dat u NanoKVM opnieuw wilt opstarten?',
        okBtn: 'Ja',
        cancelBtn: 'Nee'
      },
      network: {
        title: 'Netwerk',
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi configureren',
          apMode: 'AP-modus is ingeschakeld, maak verbinding met Wi-Fi door de QR-code te scannen',
          connect: 'Wi-Fi verbinden',
          connectDesc1: 'Voer de netwerk-SSID en het wachtwoord in',
          connectDesc2: 'Voer het wachtwoord in om met dit netwerk te verbinden',
          disconnect: 'Weet je zeker dat je de netwerkverbinding wilt verbreken?',
          failed: 'Verbinding mislukt, probeer het opnieuw.',
          ssid: 'Naam',
          password: 'Wachtwoord',
          joinBtn: 'Verbinden',
          confirmBtn: 'OK',
          cancelBtn: 'Annuleren'
        },
        tls: {
          description: 'HTTPS-protocol inschakelen',
          tip: 'Let op: HTTPS gebruiken kan de latentie verhogen, vooral in MJPEG-videomodus.'
        },
        dns: {
          title: 'DNS',
          description: 'Configureer DNS-servers voor NanoKVM',
          mode: 'Modus',
          dhcp: 'DHCP',
          manual: 'Handmatig',
          add: 'DNS toevoegen',
          save: 'Opslaan',
          invalid: 'Voer een geldig IP-adres in',
          noDhcp: 'Er is momenteel geen DHCP-DNS beschikbaar',
          saved: 'DNS-instellingen opgeslagen',
          saveFailed: 'DNS-instellingen opslaan mislukt',
          unsaved: 'Niet-opgeslagen wijzigingen',
          maxServers: 'Maximaal {{count}} DNS-servers toegestaan',
          dnsServers: 'DNS-servers',
          dhcpServersDescription: 'DNS-servers worden automatisch via DHCP verkregen',
          manualServersDescription: 'DNS-servers kunnen handmatig worden bewerkt',
          networkDetails: 'Netwerkdetails',
          interface: 'Interface',
          ipAddress: 'IP-adres',
          subnetMask: 'Subnetmasker',
          router: 'Router',
          none: 'Geen'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Geheugen optimalisatie',
          tip: 'Wanneer geheugen gebruik de limiet overschreid, garbage collection wordt agressiever uitgevoerd om geheugen vrij te maken. geadviseerd om 50MB te kiezen als Tailscale wordt gebruikt. Tailscale moet worden herstart om de wijziging door te voeren.'
        },
        swap: {
          title: 'Geheugen wisselen',
          tip: 'Als de problemen aanhouden nadat u geheugenoptimalisatie hebt ingeschakeld, probeer dan het wisselgeheugen in te schakelen. Hierdoor wordt de grootte van het wisselbestand standaard ingesteld op 256MB, wat kan worden aangepast in "Instellingen > Apparaat".'
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
        notRunning: 'Tailscale is niet actief. Start het programma om door te gaan.',
        run: 'Begin',
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
        logoutDesc: 'Weet u zeker dat u wilt uitloggen?',
        uninstall: 'Verwijderen Tailscale',
        uninstallDesc: 'Weet u zeker dat u Tailscale wilt verwijderen?',
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
        cancel: 'Annuleren',
        preview: 'Preview-updates',
        previewDesc: 'Krijg vroegtijdig toegang tot nieuwe functies en verbeteringen',
        previewTip:
          'Houd er rekening mee dat preview-releases bugs of onvolledige functionaliteit kunnen bevatten!',
        offline: {
          title: 'Offline-updates',
          desc: 'Update via lokaal installatiepakket',
          upload: 'Uploaden',
          invalidName: 'Ongeldig bestandsnaamformaat. Download de versie van GitHub-releases.',
          updateFailed: 'Update mislukt. Probeer het opnieuw.'
        }
      },
      users: {
        title: 'Gebruikersbeheer',
        addUser: 'Gebruiker toevoegen',
        colUsername: 'Gebruikersnaam',
        colRole: 'Rol',
        colEnabled: 'Actief',
        colActions: 'Acties',
        rolesTitle: 'Rollenoverzicht',
        roleAdmin: 'Volledige toegang + gebruikersbeheer',
        roleOperator: 'KVM-gebruik: stream, toetsenbord, muis, aan/uit-knoppen',
        roleViewer: 'Alleen stream bekijken',
        changePassword: 'Wachtwoord wijzigen',
        newPassword: 'Nieuw wachtwoord',
        confirmPassword: 'Wachtwoord bevestigen',
        pwdMismatch: 'Wachtwoorden komen niet overeen',
        pwdSuccess: 'Wachtwoord gewijzigd',
        pwdFailed: 'Wachtwoord wijzigen mislukt',
        password: 'Wachtwoord',
        delete: 'Verwijderen',
        deleteConfirm: 'Weet u zeker dat u deze gebruiker wilt verwijderen?',
        createSuccess: 'Gebruiker aangemaakt',
        createFailed: 'Aanmaken mislukt',
        deleteSuccess: 'Gebruiker verwijderd',
        deleteFailed: 'Verwijderen mislukt',
        updateSuccess: 'Bijgewerkt',
        updateFailed: 'Bijwerken mislukt',
        loadFailed: 'Gebruikers laden mislukt',
        usernameRequired: 'Gebruikersnaam invoeren',
        passwordRequired: 'Wachtwoord invoeren',
        okBtn: 'OK',
        cancelBtn: 'Annuleren'
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Naam',
        password: 'Wachtwoord',
        updateBtn: 'Update',
        logoutBtn: 'Afmelden',
        logoutDesc: 'Weet u zeker dat u wilt uitloggen?',
        okBtn: 'Ja',
        cancelBtn: 'Nee'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistent',
      empty: 'Open het paneel en start een taak om te beginnen.',
      inputPlaceholder: 'Beschrijf wat u wilt dat de PicoClaw doet',
      newConversation: 'Nieuw gesprek',
      processing: 'Verwerken...',
      agent: {
        defaultTitle: 'Algemene assistent',
        defaultDescription: 'Algemene hulp bij chatten, zoeken en werkruimte.',
        kvmTitle: 'Bediening op afstand',
        kvmDescription: 'Bedien de externe host via NanoKVM.',
        switched: 'Agentrol gewijzigd',
        switchFailed: 'Kan agentrol niet wisselen'
      },
      send: 'Verzenden',
      cancel: 'Annuleren',
      status: {
        connecting: 'Verbinden met gateway...',
        connected: 'PicoClaw-sessie verbonden',
        disconnected: 'PicoClaw-sessie gesloten',
        stopped: 'Stopverzoek verzonden',
        runtimeStarted: 'PicoClaw runtime gestart',
        runtimeStartFailed: 'Kan PicoClaw runtime niet starten',
        runtimeStopped: 'PicoClaw runtime gestopt',
        runtimeStopFailed: 'Kan PicoClaw runtime niet stoppen'
      },
      connection: {
        runtime: {
          checking: 'Controleren',
          ready: 'Runtime gereed',
          stopped: 'Runtime gestopt',
          unavailable: 'Runtime niet beschikbaar',
          configError: 'Configuratiefout'
        },
        transport: {
          connecting: 'Verbinden',
          connected: 'Verbonden'
        },
        run: {
          idle: 'Inactief',
          busy: 'Bezet'
        }
      },
      message: {
        toolAction: 'Actie',
        observation: 'Observatie',
        screenshot: 'Schermafbeelding'
      },
      overlay: {
        locked: 'PicoClaw bestuurt het apparaat. Handmatige invoer is gepauzeerd.'
      },
      install: {
        install: 'PicoClaw installeren',
        installing: 'PicoClaw installeren',
        success: 'PicoClaw is succesvol geïnstalleerd',
        failed: 'Kan PicoClaw niet installeren',
        uninstalling: 'Runtime verwijderen...',
        uninstalled: 'Runtime is succesvol verwijderd.',
        uninstallFailed: 'Verwijderen mislukt.',
        requiredTitle: 'PicoClaw is niet geïnstalleerd',
        requiredDescription: 'Installeer PicoClaw voordat u de runtime van PicoClaw start.',
        progressDescription: 'PicoClaw wordt gedownload en geïnstalleerd.',
        stages: {
          preparing: 'Voorbereiden',
          downloading: 'Downloaden',
          extracting: 'Uitpakken',
          installing: 'Installeren',
          installed: 'Geïnstalleerd',
          install_timeout: 'Time-out',
          install_failed: 'Mislukt'
        }
      },
      model: {
        requiredTitle: 'Modelconfiguratie is vereist',
        requiredDescription: 'Configureer het PicoClaw-model voordat u PicoClaw chat gebruikt.',
        docsTitle: 'Configuratiehandleiding',
        docsDesc: 'Ondersteunde modellen en protocollen',
        menuLabel: 'Model configureren',
        modelIdentifier: 'Modelidentificatie',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API-sleutel',
        apiKeyPlaceholder: 'Voer de API-sleutel van het model in',
        save: 'Opslaan',
        saving: 'Opslaan',
        saved: 'Modelconfiguratie opgeslagen',
        saveFailed: 'Kan de modelconfiguratie niet opslaan',
        invalid: 'Model-ID, API Base URL en API-sleutel zijn vereist'
      },
      uninstall: {
        menuLabel: 'Verwijderen',
        confirmTitle: 'PicoClaw verwijderen',
        confirmContent:
          'Weet u zeker dat u PicoClaw wilt verwijderen? Hiermee worden het uitvoerbare bestand en alle configuratiebestanden verwijderd.',
        confirmOk: 'Verwijderen',
        confirmCancel: 'Annuleren'
      },
      history: {
        title: 'Geschiedenis',
        loading: 'Sessies laden...',
        emptyTitle: 'Nog geen geschiedenis',
        emptyDescription: 'Eerdere PicoClaw sessies verschijnen hier.',
        loadFailed: 'Kan de sessiegeschiedenis niet laden',
        deleteFailed: 'Kan sessie niet verwijderen',
        deleteConfirmTitle: 'Sessie verwijderen',
        deleteConfirmContent: 'Weet u zeker dat u "{{title}}" wilt verwijderen?',
        deleteConfirmOk: 'Verwijderen',
        deleteConfirmCancel: 'Annuleren',
        messageCount_one: '{{count}} bericht',
        messageCount_other: '{{count}} berichten'
      },
      config: {
        startRuntime: 'Start PicoClaw',
        stopRuntime: 'Stop PicoClaw'
      },
      start: {
        title: 'Start PicoClaw',
        description: 'Start de runtime om de PicoClaw assistent te gaan gebruiken.'
      }
    },
    error: {
      title: 'Er is een probleem opgetreden',
      refresh: 'Vernieuwen'
    },
    fullscreen: {
      toggle: 'Volledig scherm schakelen'
    },
    menu: {
      collapse: 'Menu samenvouwen',
      expand: 'Menu uitvouwen'
    }
  }
};

export default nl;
