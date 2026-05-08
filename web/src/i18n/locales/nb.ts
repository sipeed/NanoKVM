const nb = {
  translation: {
    head: {
      desktop: 'Eksternt skrivebord',
      login: 'Logg inn',
      changePassword: 'Endre passord',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Logg inn',
      placeholderUsername: 'Brukernavn',
      placeholderPassword: 'Passord',
      placeholderPassword2: 'Oppgi passord igjen',
      noEmptyUsername: 'Brukernavn påkrevd',
      noEmptyPassword: 'Passord påkrevd',
      noAccount:
        'Kunne ikke hente brukerinformasjon. Vennligst last inn siden på nytt eller gjenopprett passord',
      invalidUser: 'Ugyldig brukernavn eller passord',
      locked: 'For mange pålogginger, vennligst prøv igjen senere',
      globalLocked: 'System under beskyttelse, prøv igjen senere',
      error: 'Uventet feil',
      changePassword: 'Endre passord',
      changePasswordDesc:
        'For sikkerheten til enheten, vennligst endre passordet ditt for web-innlogging.',
      differentPassword: 'Passordene er ikke like',
      illegalUsername: 'Brukernavn inneholder tegn som ikke er tillat',
      illegalPassword: 'Passord inneholder tegn som ikke er tillat',
      forgetPassword: 'Glemt passord',
      ok: 'Ok',
      cancel: 'Avbryt',
      loginButtonText: 'Logg inn',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'Se dette dokumentet for detaljerte trinn:',
        reset3: 'Standard webkonto:',
        reset4: 'Standard SSH-konto:',
        change1: 'Merk at denne handlingen endrer følgende passord:',
        change2: 'Passord for webinnlogging',
        change3: 'Systemets root-passord (SSH-innloggingspassord)',
        change4: 'For å tilbakestille passordene holder du BOOT-knappen på NanoKVM inne.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Konfigurer Wi-Fi for NanoKVM',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'Operasjonen mislyktes, prøv igjen.',
      invalidMode:
        'Gjeldende modus støtter ikke nettverksoppsett. Gå til enheten din og aktiver Wi-Fi konfigurasjonsmodus.',
      confirmBtn: 'Ok',
      finishBtn: 'Ferdig',
      ap: {
        authTitle: 'Autentisering kreves',
        authDescription: 'Vennligst skriv inn AP passordet for å fortsette',
        authFailed: 'Ugyldig AP passord',
        passPlaceholder: 'AP passord',
        verifyBtn: 'Bekreft'
      }
    },
    screen: {
      scale: 'Skala',
      title: 'Skjerm',
      video: 'Video-kodek',
      videoDirectTips: 'Aktiver HTTPS i "Innstillinger > Enhet" for å bruke denne modusen',
      resolution: 'Oppløsning',
      auto: 'Automatisk',
      autoTips:
        'Skjermriving eller peker-forskyvning kan oppstå ved enkelte oppløsninger. Prøv å justere den eksterne vertens oppløsning eller skru av automatisk modus.',
      fps: 'FPS',
      customizeFps: 'Tilpass',
      quality: 'Kvalitet',
      qualityLossless: 'Tapsfri',
      qualityHigh: 'Høy',
      qualityMedium: 'Middels',
      qualityLow: 'Lav',
      frameDetect: 'Bildefrekvensoppdagelse',
      frameDetectTip:
        'Kalkuler forskjellen mellom bilder. Stopper overføring av video når det ikke oppdages forskjell på den eksterne vertens skjerm.',
      resetHdmi: 'Tilbakestill HDMI'
    },
    keyboard: {
      title: 'Åpne tastatur',
      paste: 'Lim inn',
      tips: 'Kun vanlige tegn på tastatur er støttet',
      placeholder: 'Vennligst angi teksten du vil lime inn',
      submit: 'Lim inn',
      virtual: 'Åpne tastatur',
      readClipboard: 'Les fra utklippstavlen',
      clipboardPermissionDenied:
        'Utklippstavle tillatelse nektet. Tillat utklippstavletilgang i nettleseren din.',
      clipboardReadError: 'Kunne ikke lese utklippstavlen',
      dropdownEnglish: 'Engelsk',
      dropdownGerman: 'tysk',
      dropdownFrench: 'Fransk',
      dropdownRussian: 'russisk',
      shortcut: {
        title: 'Snarveier',
        custom: 'Egendefinert',
        capture: 'Klikk her for å ta en snarvei',
        clear: 'Tøm',
        save: 'Lagre',
        captureTips:
          'Registrering av systemtaster (som Windows-tasten) krever fullskjermtillatelse.',
        enterFullScreen: 'Veksle fullskjermmodus.'
      },
      leaderKey: {
        title: 'Leader-tast',
        desc: 'Omgå nettleserrestriksjoner og send systemsnarveier direkte til den eksterne verten.',
        howToUse: 'Hvordan bruke',
        simultaneous: {
          title: 'Samtidig modus',
          desc1: 'Hold Leader-tasten inne, og trykk deretter på snarveien.',
          desc2: 'Intuitivt, men kan komme i konflikt med systemsnarveier.'
        },
        sequential: {
          title: 'Sekvensiell modus',
          desc1:
            'Trykk på Leader-tasten → trykk på snarveien i rekkefølge → trykk på Leader-tasten igjen.',
          desc2: 'Krever flere trinn, men unngår fullstendig systemkonflikter.'
        },
        enable: 'Aktiver Leader-tast',
        tip: 'Når denne tasten er tilordnet som Leader-tast, fungerer den bare som snarveisutløser og mister standardoppførselen.',
        placeholder: 'Trykk på Leader-tasten',
        shiftRight: 'Høyre Shift',
        ctrlRight: 'Høyre Ctrl',
        metaRight: 'Høyre Win',
        submit: 'Lim inn',
        recorder: {
          rec: 'REC',
          activate: 'Aktiver taster',
          input: 'Trykk snarveien...'
        }
      }
    },
    mouse: {
      title: 'Mus',
      cursor: 'Markørstil',
      default: 'Vanlig',
      pointer: 'Hånd',
      cell: 'Celle',
      text: 'Tekst',
      grab: 'Grip',
      hide: 'Skjul',
      mode: 'Modus',
      absolute: 'Absolutt',
      relative: 'Relativ',
      direction: 'Rullehjulretning',
      scrollUp: 'Rull opp',
      scrollDown: 'Rull ned',
      speed: 'Rullehjulhastighet',
      fast: 'Rask',
      slow: 'Sakte',
      requestPointer: 'Bruker relativ modus. Vennligsk klikk på skrivebordet for vise musepeker.',
      resetHid: 'Gjenopprett HID',
      hidOnly: {
        title: 'Kun HID-modus',
        desc: 'Hvis musen og tastaturet slutter å svare og tilbakestilling av HID ikke hjelper, kan det være et kompatibilitetsproblem mellom NanoKVM og enheten. Prøv å aktivere HID-Only-modus for bedre kompatibilitet.',
        tip1: 'Aktivering av HID-Only-modus vil demontere den virtuelle U-disken og det virtuelle nettverket',
        tip2: 'I HID-Only-modus er bildemontering deaktivert',
        tip3: 'NanoKVM vil automatisk starte på nytt etter bytte av modus',
        enable: 'Aktiver HID-Only-modus',
        disable: 'Deaktiver HID-bare-modus'
      }
    },
    image: {
      title: 'Bilder',
      loading: 'Laster...',
      empty: 'Ingen funnet',
      mountMode: 'Monteringsmodus',
      mountFailed: 'Montering feilet',
      mountDesc:
        'På noen systemer er det nødvendig å koble fra den virtuelle disken på den eksterne verten før man kan montere arkivfilen.',
      unmountFailed: 'Avmontering mislyktes',
      unmountDesc:
        'På noen systemer må du manuelt løse ut fra den eksterne verten før du demonterer bildet.',
      refresh: 'Oppdater bildelisten',
      attention: 'Merknad',
      deleteConfirm: 'Er du sikker på at du vil slette dette bildet?',
      okBtn: 'Ja',
      cancelBtn: 'Nei',
      tips: {
        title: 'Hvordan laste opp',
        usb1: 'Koble til NanoKVM-enheten til din datamaskin med USB.',
        usb2: 'Sikre at den virtuelle disken er montert (Innstillinger - Virtuell disk).',
        usb3: 'Åpne den virtuelle disken på datamaskinen din og kopier arkivfilen til rot-mappen på den virtuelle disken.',
        scp1: 'Sikre at NanoKVM-enheten og datamaskinen din er tilkoblet det samme lokale nettverket.',
        scp2: 'Åpne en terminal på datamaskinen din og bruk SCP-kommandoen til å laste opp arkivfilen til mappen /data på NanoKVM-enheten.',
        scp3: 'Eksempel: scp sti-til-din-arkivfil root@din-nanokvm-ip:/data',
        tfCard: 'TF-kort',
        tf1: 'Denne metoden er støttet på datamskiner med Linux',
        tf2: 'Ta TF-kortet ut av NanoKVM-enheten (hvis du har FULL-versjonen, demonter kabinettet først).',
        tf3: 'Sett inn TF-kortet i en kortleser og koble den til datamaskinen din.',
        tf4: 'Kopiér arkivfilen til mappen /data på TF-kortet.',
        tf5: 'Sett inn TF-kortet i NanoKVM-enheten.'
      }
    },
    script: {
      title: 'Skript',
      upload: 'Last opp',
      run: 'Kjør',
      runBackground: 'Kjør i bakgrunnen',
      runFailed: 'Kjøring feilet',
      attention: 'Merknad',
      delDesc: 'Er du sikker på at du vil slette denne filen?',
      confirm: 'Ja',
      cancel: 'Nei',
      delete: 'Slett',
      close: 'Lukk'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'NanoKVM',
      serial: 'Seriell port',
      serialPort: 'Seriell port',
      serialPortPlaceholder: 'Vennligst angi den serielle porten',
      baudrate: 'Baud-rate',
      parity: 'Paritet',
      parityNone: 'Ingen',
      parityEven: 'Lik',
      parityOdd: 'Ulik',
      flowControl: 'Strømningskontroll',
      flowControlNone: 'Ingen',
      flowControlSoft: 'Programvare',
      flowControlHard: 'Maskinvare',
      dataBits: 'Databiter',
      stopBits: 'Stoppbiter',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Sender kommando...',
      sent: 'Kommando sendt',
      input: 'Vennligst angi MAC-adressen',
      ok: 'Ok'
    },
    download: {
      title: 'Bildedaster',
      input: 'Vennligst skriv inn et eksternt bilde URL',
      ok: 'Ok',
      disabled: '/data partisjonen er RO, så vi kan ikke laste ned bildet',
      uploadbox: 'Slipp filen her eller klikk for å velge',
      inputfile: 'Vennligst skriv inn bildefilen',
      NoISO: 'Ingen ISO'
    },
    power: {
      title: 'På-knapp',
      showConfirm: 'Bekreftelse',
      showConfirmTip: 'Strømdrift krever en ekstra bekreftelse',
      reset: 'Reset-knapp',
      power: 'På-knapp',
      powerShort: 'På-knapp (kort trykk)',
      powerLong: 'På-knapp (langt trykk)',
      resetConfirm: 'Fortsette tilbakestilling?',
      powerConfirm: 'Fortsette strømdrift?',
      okBtn: 'Ja',
      cancelBtn: 'Nei'
    },
    settings: {
      title: 'Innstillinger',
      about: {
        title: 'Om NanoKVM',
        information: 'Informasjon',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Applikasjonsversjon',
        applicationTip: 'Versjon av NanoKVM-webapplikasjonen',
        image: 'Arkivfil-versjon',
        imageTip: 'Versjon av NanoKVM-systemavbildningen',
        deviceKey: 'Enhetsnøkkel',
        community: 'Fellesskap',
        hostname: 'Vertsnavn',
        hostnameUpdated: 'Vertsnavn oppdatert. Start på nytt for å søke.',
        ipType: {
          Wired: 'Kablet',
          Wireless: 'Trådløs',
          Other: 'Annet'
        }
      },
      appearance: {
        title: 'Utseende',
        display: 'Skjerm',
        language: 'Språk',
        languageDesc: 'Velg språket for grensesnittet',
        webTitle: 'Netttittel',
        webTitleDesc: 'Tilpass nettsidetittelen',
        menuBar: {
          title: 'Menylinje',
          mode: 'Visningsmodus',
          modeDesc: 'Vis menylinje på skjermen',
          modeOff: 'Av',
          modeAuto: 'Skjul automatisk',
          modeAlways: 'Alltid synlig',
          icons: 'Undermenyikoner',
          iconsDesc: 'Vis undermenyikoner i menylinjen'
        }
      },
      device: {
        title: 'Enhet',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Aldri',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 time'
        },
        ssh: {
          description: 'Aktiver SSH ekstern tilgang',
          tip: 'Angi et sterkt passord før du aktiverer (Konto - Endre passord)'
        },
        advanced: 'Avanserte innstillinger',
        swap: {
          title: 'Bytt',
          disable: 'Deaktiver',
          description: 'Angi størrelsen på byttefilen',
          tip: 'Aktivering av denne funksjonen kan forkorte SD-kortets brukbare levetid!'
        },
        mouseJiggler: {
          title: 'Mus Jiggler',
          description: 'Hindre den eksterne verten fra å sove',
          disable: 'Deaktiver',
          absolute: 'Absolutt modus',
          relative: 'Relativ modus'
        },
        mdns: {
          description: 'Aktiver mDNS oppdagelsestjeneste',
          tip: 'Slå den av hvis den ikke er nødvendig'
        },
        hdmi: {
          description: 'Aktiver HDMI/skjermutgang'
        },
        autostart: {
          title: 'Autostart skriptinnstillinger',
          description: 'Administrer skript som kjører automatisk ved systemstart',
          new: 'Ny',
          deleteConfirm: 'Er du sikker på at du vil slette denne filen?',
          yes: 'Ja',
          no: 'Nei',
          scriptName: 'Autostart skriptnavn',
          scriptContent: 'Autostart skriptinnhold',
          settings: 'Innstillinger'
        },
        hidOnly: 'HID-Bare modus',
        hidOnlyDesc: 'Slutt å emulere virtuelle enheter, behold bare grunnleggende HID-kontroll',
        disk: 'Virtuell disk',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtuelt nettverk',
        networkDesc: 'Monter virtuelt nettverkskort på den eksterne verten',
        reboot: 'Start på nytt',
        rebootDesc: 'Er du sikker på at du vil starte NanoKVM på nytt?',
        okBtn: 'Ja',
        cancelBtn: 'Nei'
      },
      network: {
        title: 'Nettverk',
        wifi: {
          title: 'Wi-Fi',
          description: 'Konfigurer Wi-Fi',
          apMode: 'AP-modus er aktivert, koble til Wi-Fi ved å skanne QR-koden',
          connect: 'Koble til Wi-Fi',
          connectDesc1: 'Skriv inn nettverkets SSID og passord',
          connectDesc2: 'Skriv inn passordet for å koble til dette nettverket',
          disconnect: 'Er du sikker på at du vil koble fra nettverket?',
          failed: 'Tilkobling mislyktes, prøv igjen.',
          ssid: 'Navn',
          password: 'Passord',
          joinBtn: 'Koble til',
          confirmBtn: 'OK',
          cancelBtn: 'Avbryt'
        },
        tls: {
          description: 'Aktiver HTTPS-protokoll',
          tip: 'Merk: Bruk av HTTPS kan øke forsinkelsen, spesielt i MJPEG-videomodus.'
        },
        dns: {
          title: 'DNS',
          description: 'Konfigurer DNS-servere for NanoKVM',
          mode: 'Modus',
          dhcp: 'DHCP',
          manual: 'Manuell',
          add: 'Legg til DNS',
          save: 'Lagre',
          invalid: 'Skriv inn en gyldig IP-adresse',
          noDhcp: 'Ingen DHCP-DNS er tilgjengelig nå',
          saved: 'DNS-innstillinger lagret',
          saveFailed: 'Kunne ikke lagre DNS-innstillinger',
          unsaved: 'Ulagrede endringer',
          maxServers: 'Maksimalt {{count}} DNS-servere er tillatt',
          dnsServers: 'DNS-servere',
          dhcpServersDescription: 'DNS-servere hentes automatisk fra DHCP',
          manualServersDescription: 'DNS-servere kan redigeres manuelt',
          networkDetails: 'Nettverksdetaljer',
          interface: 'Grensesnitt',
          ipAddress: 'IP-adresse',
          subnetMask: 'Subnettmaske',
          router: 'Ruter',
          none: 'Ingen'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Minneoptimalisering',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect."
        },
        swap: {
          title: 'Bytt minne',
          tip: 'Hvis problemene vedvarer etter at du har aktivert minneoptimalisering, prøv å aktivere swap-minne. Dette setter swap-filstørrelsen til 256MB som standard, som kan justeres i "Innstillinger > Enhet".'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
        loading: 'Laster...',
        notInstall: 'Tailscale er ikke funnet! Vennligst installer.',
        install: 'Installér',
        installing: 'Installerer',
        failed: 'Installering feilet',
        retry: 'Vennligst last inn siden på nytt og forsøk igjen eller installer manuelt',
        download: 'Last ned',
        package: 'installasjonspakken',
        unzip: 'og pakk den ut',
        upTailscale: 'Last opp Tailscale til NanoKVM-enhetens mappe /usr/bin/',
        upTailscaled: 'Last opp tailscaled til NanoKVM-enhetens mappe /usr/sbin/',
        refresh: 'Last inn denne siden på nytt',
        notRunning: 'Tailscale kjører ikke. Start den for å fortsette.',
        run: 'Start',
        notLogin:
          'Denne enheten er ikke knyttet til din konto enda. Vennligst logg inn og knytt den til kontoen din..',
        urlPeriod: 'Denne lenken er gyldig i 10 minutter',
        login: 'Logg inn',
        loginSuccess: 'Logget inn',
        enable: 'Skru på Tailscale',
        deviceName: 'Enhetens navn',
        deviceIP: 'Enhetens IP',
        account: 'Konto',
        logout: 'Logg ut',
        logoutDesc: 'Er du sikker på at du vil logge ut?',
        uninstall: 'Avinstaller Tailscale',
        uninstallDesc: 'Er du sikker på at du vil avinstallere Tailscale?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Se etter oppdatering',
        queryFailed: 'Kunne ikke hente versjon',
        updateFailed: 'En feil oppstod under oppdatering. Vennligst forsøk igjen.',
        isLatest: 'Du har siste versjon allerede.',
        available: 'En oppdatering er tilgjengelig. Er du sikker på at du ønsker å oppdatere?',
        updating: 'Oppdatering har startet. Vennligst vent...',
        confirm: 'Oppdater',
        cancel: 'Avbryt',
        preview: 'Forhåndsvisningsoppdateringer',
        previewDesc: 'Få tidlig tilgang til nye funksjoner og forbedringer',
        previewTip:
          'Vær oppmerksom på at forhåndsvisningsutgivelser kan inneholde feil eller ufullstendig funksjonalitet!',
        offline: {
          title: 'Offline oppdateringer',
          desc: 'Oppdater gjennom lokal installasjonspakke',
          upload: 'Last opp',
          invalidName: 'Ugyldig filnavnformat. Last ned fra GitHub-utgivelser.',
          updateFailed: 'En feil oppstod under oppdatering. Vennligst forsøk igjen.'
        }
      },
      account: {
        title: 'Konto',
        webAccount: 'Navn på webkonto',
        password: 'Passord',
        updateBtn: 'Update',
        logoutBtn: 'Logg ut',
        logoutDesc: 'Er du sikker på at du vil logge ut?',
        okBtn: 'Ja',
        cancelBtn: 'Nei'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistent',
      empty: 'Åpne panelet og start en oppgave for å begynne.',
      inputPlaceholder: 'Beskriv hva du vil at PicoClaw skal gjøre',
      newConversation: 'Ny samtale',
      processing: 'Behandler...',
      agent: {
        defaultTitle: 'Generell assistent',
        defaultDescription: 'Generell chat-, søk- og arbeidsområdehjelp.',
        kvmTitle: 'Fjernstyring',
        kvmDescription: 'Betjen den eksterne verten gjennom NanoKVM.',
        switched: 'Agentrolle byttet',
        switchFailed: 'Kunne ikke bytte agentrolle'
      },
      send: 'Send',
      cancel: 'Avbryt',
      status: {
        connecting: 'Kobler til gateway...',
        connected: 'PicoClaw-økt tilkoblet',
        disconnected: 'PicoClaw-økt frakoblet',
        stopped: 'Stoppforespørsel sendt',
        runtimeStarted: 'PicoClaw runtime startet',
        runtimeStartFailed: 'Kunne ikke starte PicoClaw runtime',
        runtimeStopped: 'PicoClaw runtime stoppet',
        runtimeStopFailed: 'Kunne ikke stoppe PicoClaw runtime'
      },
      connection: {
        runtime: {
          checking: 'Kontrollerer',
          ready: 'Runtime klar',
          stopped: 'Runtime stoppet',
          unavailable: 'Runtime utilgjengelig',
          configError: 'Konfigurasjonsfeil'
        },
        transport: {
          connecting: 'Kobler til',
          connected: 'Tilkoblet'
        },
        run: {
          idle: 'Inaktiv',
          busy: 'Opptatt'
        }
      },
      message: {
        toolAction: 'Handling',
        observation: 'Observasjon',
        screenshot: 'Skjermbilde'
      },
      overlay: {
        locked: 'PicoClaw kontrollerer enheten. Manuell inntasting er satt på pause.'
      },
      install: {
        install: 'Installer PicoClaw',
        installing: 'Installerer PicoClaw',
        success: 'PicoClaw installert vellykket',
        failed: 'Kunne ikke installere PicoClaw',
        uninstalling: 'Avinstallerer runtime...',
        uninstalled: 'Runtime ble avinstallert.',
        uninstallFailed: 'Avinstallering mislyktes.',
        requiredTitle: 'PicoClaw er ikke installert',
        requiredDescription: 'Installer PicoClaw før du starter PicoClaw runtime.',
        progressDescription: 'PicoClaw blir lastet ned og installert.',
        stages: {
          preparing: 'Forbereder',
          downloading: 'Laster ned',
          extracting: 'Pakker ut',
          installing: 'Installerer',
          installed: 'Installert',
          install_timeout: 'Tidsavbrudd',
          install_failed: 'Mislyktes'
        }
      },
      model: {
        requiredTitle: 'Modellkonfigurasjon er nødvendig',
        requiredDescription: 'Konfigurer PicoClaw-modellen før du bruker PicoClaw chat.',
        docsTitle: 'Konfigurasjonsveiledning',
        docsDesc: 'Støttede modeller og protokoller',
        menuLabel: 'Konfigurer modell',
        modelIdentifier: 'Modellidentifikator',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API-nøkkel',
        apiKeyPlaceholder: 'Skriv inn modellens API-nøkkel',
        save: 'Lagre',
        saving: 'Lagrer',
        saved: 'Modellkonfigurasjon lagret',
        saveFailed: 'Kunne ikke lagre modellkonfigurasjonen',
        invalid: 'Modellidentifikator, API Base URL og API-nøkkel kreves'
      },
      uninstall: {
        menuLabel: 'Avinstaller',
        confirmTitle: 'Avinstaller PicoClaw',
        confirmContent:
          'Er du sikker på at du vil avinstallere PicoClaw? Dette vil slette den kjørbare filen og alle konfigurasjonsfilene.',
        confirmOk: 'Avinstaller',
        confirmCancel: 'Avbryt'
      },
      history: {
        title: 'Historikk',
        loading: 'Laster inn økter...',
        emptyTitle: 'Ingen historikk ennå',
        emptyDescription: 'Tidligere PicoClaw økter vil vises her.',
        loadFailed: 'Kunne ikke laste inn økthistorikk',
        deleteFailed: 'Kunne ikke slette økten',
        deleteConfirmTitle: 'Slett økt',
        deleteConfirmContent: 'Er du sikker på at du vil slette "{{title}}"?',
        deleteConfirmOk: 'Slett',
        deleteConfirmCancel: 'Avbryt',
        messageCount_one: '{{count}} melding',
        messageCount_other: '{{count}} meldinger'
      },
      config: {
        startRuntime: 'Start PicoClaw',
        stopRuntime: 'Stopp PicoClaw'
      },
      start: {
        title: 'Start PicoClaw',
        description: 'Start runtime for å begynne å bruke PicoClaw-assistenten.'
      }
    },
    error: {
      title: 'Vi har hatt et problem',
      refresh: 'Oppdater'
    },
    fullscreen: {
      toggle: 'Veksle fullskjerm'
    },
    menu: {
      collapse: 'Skjul meny',
      expand: 'Utvid menyen'
    }
  }
};

export default nb;
