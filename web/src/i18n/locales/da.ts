const da = {
  translation: {
    head: {
      desktop: 'Fjernskrivebord',
      login: 'Log ind',
      changePassword: 'Skift adgangskode',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Log ind',
      placeholderUsername: 'Indtast brugernavn',
      placeholderPassword: 'indtast adgangskode',
      placeholderPassword2: 'indtast adgangskode igen',
      noEmptyUsername: 'brugernavn kan ikke være tom',
      noEmptyPassword: 'adgangskode kan ikke være tom',
      noAccount:
        'Kunne ikke hente brugeroplysninger. Prøv at opdater siden eller nulstil adgangskoden',
      invalidUser: 'ugyldigt brugernavn eller adgangskode',
      locked: 'For mange logins, prøv venligst igen senere',
      globalLocked: 'System under beskyttelse, prøv venligst igen senere',
      error: 'uventet fejl',
      changePassword: 'Skift adgangskode',
      changePasswordDesc: 'For sikkerheden af din enhed, bedes du ændre web-login adgangskoden.',
      differentPassword: 'Adgangskoder er ikke ens',
      illegalUsername: 'brugernavn indeholder ugyldige tegn',
      illegalPassword: 'adgangskode indeholder ugyldige tegn',
      forgetPassword: 'Glem adgangskode',
      ok: 'OK',
      cancel: 'Annuller',
      loginButtonText: 'Log ind',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'Se detaljerede trin i dette dokument:',
        reset3: 'Standard webkonto:',
        reset4: 'Standard SSH-konto:',
        change1: 'Bemærk, at denne handling ændrer følgende adgangskoder:',
        change2: 'Adgangskode til weblogin',
        change3: 'Systemets root-adgangskode (SSH-loginadgangskode)',
        change4: 'For at nulstille adgangskoderne skal du holde BOOT-knappen på NanoKVM nede.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Konfigurer Wi-Fi for NanoKVM',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'Handlingen mislykkedes, prøv igen.',
      invalidMode:
        'Den aktuelle tilstand understøtter ikke netværksopsætning. Gå til din enhed og aktiver Wi-Fi konfigurationstilstand.',
      confirmBtn: 'Ok',
      finishBtn: 'Færdig',
      ap: {
        authTitle: 'Godkendelse påkrævet',
        authDescription: 'Indtast venligst AP adgangskoden for at fortsætte',
        authFailed: 'Ugyldig AP adgangskode',
        passPlaceholder: 'AP adgangskode',
        verifyBtn: 'Bekræft'
      }
    },
    screen: {
      scale: 'Skala',
      title: 'Skærm',
      video: 'Videotilstand',
      videoDirectTips: 'Aktiver HTTPS i "Indstillinger > Enhed" for at bruge denne tilstand',
      resolution: 'Opløsning',
      auto: 'Automatisk',
      autoTips:
        'Screen-tearing eller mouse-offset kan opstå ved enkelte opløsninger. Hvis du oplever dette, kan du prøve at justere fjerncomputerens skærmopløsning eller deaktivere automatisk tilstand.',
      fps: 'FPS',
      customizeFps: 'Tilpas',
      quality: 'Kvalitet',
      qualityLossless: 'Tabsfri',
      qualityHigh: 'Høj',
      qualityMedium: 'Mellem',
      qualityLow: 'Lav',
      frameDetect: 'Beregn frames',
      frameDetectTip:
        'Beregner forskellen mellem hver frame. Stopper med at sende et video stream hvis der ikke registreres ændringer på fjerncomputerens skærm.',
      resetHdmi: 'Nulstil HDMI'
    },
    keyboard: {
      title: 'Tastatur',
      paste: 'Indsæt',
      tips: 'Kun standard bogstaver og symboler er understøttet',
      placeholder: 'Indtast tekst',
      submit: 'Send',
      virtual: 'Tastatur',
      readClipboard: 'Læs fra udklipsholder',
      clipboardPermissionDenied:
        'Udklipsholdertilladelse nægtet. Tillad venligst udklipsholderadgang i din browser.',
      clipboardReadError: 'Kunne ikke læse udklipsholderen',
      dropdownEnglish: 'Engelsk',
      dropdownGerman: 'tysk',
      dropdownFrench: 'Fransk',
      dropdownRussian: 'russisk',
      shortcut: {
        title: 'Genveje',
        custom: 'Brugerdefineret',
        capture: 'Klik her for at fange genvej',
        clear: 'Ryd',
        save: 'Gem',
        captureTips:
          'Optagelse af systemtaster (såsom Windows-tasten) kræver fuldskærmstilladelse.',
        enterFullScreen: 'Skift fuldskærmstilstand.'
      },
      leaderKey: {
        title: 'Leader-tast',
        desc: 'Omgå browserbegrænsninger og send systemgenveje direkte til fjernværten.',
        howToUse: 'Sådan bruges',
        simultaneous: {
          title: 'Samtidig tilstand',
          desc1: 'Hold Leader-tasten nede, og tryk derefter på genvejen.',
          desc2: 'Intuitivt, men kan være i konflikt med systemgenveje.'
        },
        sequential: {
          title: 'Sekventiel tilstand',
          desc1:
            'Tryk på Leader-tasten → tryk på genvejen i rækkefølge → tryk på Leader-tasten igen.',
          desc2: 'Kræver flere trin, men undgår fuldstændig systemkonflikter.'
        },
        enable: 'Aktiver Leader-tast',
        tip: 'Når denne tast tildeles som Leader-tast, fungerer den kun som genvejsudløser og mister sin standardfunktion.',
        placeholder: 'Tryk på Leader-tasten',
        shiftRight: 'Højre Shift',
        ctrlRight: 'Højre Ctrl',
        metaRight: 'Højre Win',
        submit: 'Send',
        recorder: {
          rec: 'REC',
          activate: 'Aktiver taster',
          input: 'Tryk på genvejen...'
        }
      }
    },
    mouse: {
      title: 'Mus',
      cursor: 'Markørstil',
      default: 'Standard-markør',
      pointer: 'Peger-markør',
      cell: 'Celle-markør',
      text: 'Tekst-markør',
      grab: 'Grib-markør',
      hide: 'Skjul mus',
      mode: 'Tilstand for mus',
      absolute: 'Absolut tilstand',
      relative: 'Relativ tilstand',
      direction: 'Rullehjulsretning',
      scrollUp: 'Rul op',
      scrollDown: 'Rul ned',
      speed: 'Rullehjulshastighed',
      fast: 'Hurtigt',
      slow: 'Langsomt',
      requestPointer: 'Bruger relativ-tilstand. Klik på skrivebordet for at få musemarkør.',
      resetHid: 'Nulstil HID',
      hidOnly: {
        title: 'Kun HID-tilstand',
        desc: 'Hvis din mus og tastatur holder op med at reagere, og nulstilling af HID ikke hjælper, kan det være et kompatibilitetsproblem mellem NanoKVM og enheden. Prøv at aktivere HID-Only-tilstand for bedre kompatibilitet.',
        tip1: 'Aktivering af HID-Only-tilstand vil afmontere den virtuelle U-disk og det virtuelle netværk',
        tip2: 'I HID-Only-tilstand er billedmontering deaktiveret',
        tip3: 'NanoKVM genstarter automatisk efter at have skiftet tilstand',
        enable: 'Aktiver HID-kun tilstand',
        disable: 'Deaktiver HID-kun tilstand'
      }
    },
    image: {
      title: 'Diskbilleder',
      loading: 'Kontrollerer...',
      empty: 'Ingen fundet',
      mountMode: 'Monteringstilstand',
      mountFailed: 'Montering af diskbillede mislykkedes',
      mountDesc:
        'På nogle systemer kan det være nødvendigt at skubbe den virtuelle disk ud på fjerncomputeren før du kan montere diskbilledet.',
      unmountFailed: 'Afmontering mislykkedes',
      unmountDesc:
        'På nogle systemer skal du manuelt skubbe ud fra fjernværten, før du afmonterer billedet.',
      refresh: 'Opdater billedlisten',
      attention: 'Opmærksomhed påkrævet',
      deleteConfirm: 'Er du sikker på, at du vil slette dette billede?',
      okBtn: 'Ja',
      cancelBtn: 'Annuller',
      tips: {
        title: 'Sådan uploader du',
        usb1: 'Forbind din NanoKVM til din computer via USB.',
        usb2: 'Sørg for, at den virtuelle disk er monteret (Indstillinger -> Virtuel disk).',
        usb3: 'Åben den virtuelle disk på din computer og kopier diskbilledet til roden af den virtuelle disk.',
        scp1: 'Kontroller at din NanoKVM og din computer er på samme lokale netværk.',
        scp2: 'Åben en terminal på din computer og brug SCP-kommandoen for at uploade diskbilledet til /data mappen på din NanoKVM.',
        scp3: 'Eksempel: scp sti-til-dit-diskbillede root@din-nanokvm-ip:/data',
        tfCard: 'microSD-kort',
        tf1: 'Denne metode er understøttet af Linux systemer',
        tf2: 'Tag microSD-kortet ud af din NanoKVM (for den fulde version af NanoKVM skal du åbne enheden for at kunne tage microSD-kortet ud).',
        tf3: 'Indsæt microSD-kortet i en kortlæser og tilslut den til en computer.',
        tf4: 'Kopier diskbilledet til /data mappen på microSD-kortet.',
        tf5: 'Skub microSD-kortet ud og indsæt microSD-kortet i din NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Upload',
      run: 'Kør',
      runBackground: 'Kør i baggrunden',
      runFailed: 'Kørsel mislykkedes',
      attention: 'Opmærksomhed påkrævet',
      delDesc: 'Er du sikker på at du vil slette denne fil?',
      confirm: 'Ja',
      cancel: 'Annuller',
      delete: 'Slet',
      close: 'Luk'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal til NanoKVM',
      serial: 'Terminal til seriel port',
      serialPort: 'Serial port',
      serialPortPlaceholder: 'Angiv seriel port',
      baudrate: 'Baud-hastighed',
      parity: 'Paritet',
      parityNone: 'Ingen',
      parityEven: 'Lige',
      parityOdd: 'Ulige',
      flowControl: 'Flowkontrol',
      flowControlNone: 'Ingen',
      flowControlSoft: 'Software',
      flowControlHard: 'Hardware',
      dataBits: 'Databits',
      stopBits: 'Stopbit',
      confirm: 'OK'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Sender Wake-on-LAN magic packet',
      sent: 'Wake-on-LAN magic packet sendt',
      input: 'Angiv MAC-adresse',
      ok: 'OK'
    },
    download: {
      title: 'Billedhenter',
      input: 'Indtast venligst et fjernbillede URL',
      ok: 'OK',
      disabled: '/data partitionen er RO, så vi kan ikke downloade billedet',
      uploadbox: 'Slip filen her, eller klik for at vælge',
      inputfile: 'Indtast venligst billedfilen',
      NoISO: 'Ingen ISO'
    },
    power: {
      title: 'Tænd/sluk-knap',
      showConfirm: 'Bekræftelse',
      showConfirmTip: 'Strømdrift kræver en ekstra bekræftelse',
      reset: 'Nulstillingsknap',
      power: 'Tænd/sluk-knap',
      powerShort: 'Tænd/sluk-knap (kort tryk)',
      powerLong: 'Tænd/sluk-knap (langt tryk)',
      resetConfirm: 'Fortsæt med nulstilling?',
      powerConfirm: 'Fortsæt strømdrift?',
      okBtn: 'Ja',
      cancelBtn: 'Annuller'
    },
    settings: {
      title: 'Indstillinger',
      about: {
        title: 'Om NanoKVM',
        information: 'Information',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Program version',
        applicationTip: 'Version af NanoKVM-webapplikationen',
        image: 'Firmware version',
        imageTip: 'Version af NanoKVM-systemimaget',
        deviceKey: 'Enhedsnøgle',
        community: 'Fællesskab',
        hostname: 'Værtsnavn',
        hostnameUpdated: 'Værtsnavn opdateret. Genstart for at anvende.',
        ipType: {
          Wired: 'Kablet',
          Wireless: 'Trådløs',
          Other: 'Andet'
        }
      },
      appearance: {
        title: 'Udseende',
        display: 'Visning',
        language: 'Sprog',
        languageDesc: 'Vælg sproget til grænsefladen',
        webTitle: 'Webtitel',
        webTitleDesc: 'Tilpas websidens titel',
        menuBar: {
          title: 'Menulinje',
          mode: 'Visningstilstand',
          modeDesc: 'Vis menulinje på skærmen',
          modeOff: 'Fra',
          modeAuto: 'Skjul automatisk',
          modeAlways: 'Altid synlig',
          icons: 'Undermenuikoner',
          iconsDesc: 'Vis undermenuikoner i menulinjen'
        }
      },
      device: {
        title: 'Enhed',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Aldrig',
          15: '15 sek.',
          30: '30 sek.',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 time'
        },
        ssh: {
          description: 'Aktiver SSH fjernadgang',
          tip: 'Indstil en stærk adgangskode før aktivering (Konto - Skift adgangskode)'
        },
        advanced: 'Avancerede indstillinger',
        swap: {
          title: 'Byt',
          disable: 'Deaktiver',
          description: 'Indstil swap-filstørrelsen',
          tip: 'Aktivering af denne funktion kan forkorte dit SD-korts brugbare levetid!'
        },
        mouseJiggler: {
          title: 'Mus Jiggler',
          description: 'Forhindrer fjernværten i at sove',
          disable: 'Deaktiver',
          absolute: 'Absolut tilstand',
          relative: 'Relativ tilstand'
        },
        mdns: {
          description: 'Aktiver mDNS opdagelsestjeneste',
          tip: 'Slukker den, hvis den ikke er nødvendig'
        },
        hdmi: {
          description: 'Aktiver HDMI/monitor output'
        },
        autostart: {
          title: 'Indstillinger for autostart scripts',
          description: 'Administrer scripts, der kører automatisk ved systemstart',
          new: 'Ny',
          deleteConfirm: 'Er du sikker på at du vil slette denne fil?',
          yes: 'Ja',
          no: 'Annuller',
          scriptName: 'Autostart scriptnavn',
          scriptContent: 'Autostart scriptindhold',
          settings: 'Indstillinger'
        },
        hidOnly: 'HID-Kun tilstand',
        hidOnlyDesc:
          'Stop med at emulere virtuelle enheder, og behold kun grundlæggende HID kontrol',
        disk: 'Virtuel disk',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtuelt netværk',
        networkDesc: 'Monter det virtuelle netværkskort på den eksterne vært',
        reboot: 'Genstart',
        rebootDesc: 'Er du sikker på, at du vil genstarte NanoKVM?',
        okBtn: 'Ja',
        cancelBtn: 'Annuller'
      },
      network: {
        title: 'Netværk',
        wifi: {
          title: 'Wi-Fi',
          description: 'Konfigurer Wi-Fi',
          apMode: 'AP-tilstand er aktiveret, opret forbindelse til Wi-Fi ved at scanne QR-koden',
          connect: 'Tilslut Wi-Fi',
          connectDesc1: 'Indtast netværkets SSID og adgangskode',
          connectDesc2: 'Indtast adgangskoden for at tilslutte dette netværk',
          disconnect: 'Er du sikker på, at du vil afbryde netværket?',
          failed: 'Forbindelsen mislykkedes, prøv igen.',
          ssid: 'Navn',
          password: 'Adgangskode',
          joinBtn: 'Tilslut',
          confirmBtn: 'OK',
          cancelBtn: 'Annuller'
        },
        tls: {
          description: 'Aktiver HTTPS-protokol',
          tip: 'Bemærk: Brug af HTTPS kan øge forsinkelsen, især med MJPEG-videotilstand.'
        },
        dns: {
          title: 'DNS',
          description: 'Konfigurer DNS-servere til NanoKVM',
          mode: 'Tilstand',
          dhcp: 'DHCP',
          manual: 'Manuel',
          add: 'Tilføj DNS',
          save: 'Gem',
          invalid: 'Indtast en gyldig IP-adresse',
          noDhcp: 'Ingen DHCP-DNS er tilgængelig i øjeblikket',
          saved: 'DNS-indstillinger gemt',
          saveFailed: 'DNS-indstillinger kunne ikke gemmes',
          unsaved: 'Ikke-gemte ændringer',
          maxServers: 'Maksimalt {{count}} DNS-servere er tilladt',
          dnsServers: 'DNS-servere',
          dhcpServersDescription: 'DNS-servere hentes automatisk fra DHCP',
          manualServersDescription: 'DNS-servere kan redigeres manuelt',
          networkDetails: 'Netværksdetaljer',
          interface: 'Grænseflade',
          ipAddress: 'IP-adresse',
          subnetMask: 'Undernetmaske',
          router: 'Router',
          none: 'Ingen'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Hukommelsesoptimering',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect."
        },
        swap: {
          title: 'Skift hukommelse',
          tip: 'Hvis problemerne fortsætter efter aktivering af hukommelsesoptimering, prøv at aktivere swap-hukommelse. Dette indstiller swap-filstørrelsen til 256MB som standard, som kan justeres i "Indstillinger > Enhed".'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
        loading: 'Indlæser...',
        notInstall: 'Tailscale ikke fundet! Installer det for at fuldføre opsætningen.',
        install: 'Installer',
        installing: 'Installerer',
        failed: 'Installation mislykkedes',
        retry: 'Opdater siden og prøv igen. Ellers prøv at installere manuelt.',
        download: 'Download',
        package: 'installationspakken',
        unzip: 'og udpak den',
        upTailscale: 'Upload tailscale til NanoKVM-mappen /usr/bin/',
        upTailscaled: 'Upload tailscaled til NanoKVM-mappen /usr/sbin/',
        refresh: 'Opdater sides',
        notRunning: 'Tailscale kører ikke. Start det for at fortsætte.',
        run: 'Start',
        notLogin:
          'Enheden er ikke tilknyttet en Tailscale-konto endnu. Log ind for at fuldføre tilknytningen til din konto.',
        urlPeriod: 'Denne URL er gyldig i 10 minutter',
        login: 'Log ind',
        loginSuccess: 'Log ind lykkedes',
        enable: 'Aktiver Tailscale',
        deviceName: 'Enhedens navn',
        deviceIP: 'Enhedens IP',
        account: 'Konto',
        logout: 'Log ud',
        logoutDesc: 'Er du sikker på, at du vil logge ud?',
        uninstall: 'Afinstaller Tailscale',
        uninstallDesc: 'Er du sikker på, at du vil afinstallere Tailscale?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Kontroller for opdatering',
        queryFailed: 'Opdateringskontrol mislykkedes',
        updateFailed: 'Opdatering fejlede. Prøv igen.',
        isLatest: 'Du har allerede den nyeste version.',
        available: 'En opdatering er tilgængelig. Vil du installere den?',
        updating: 'Opdatering i gang. Vent venligst...',
        confirm: 'Bekræft',
        cancel: 'Annuller',
        preview: 'Forhåndsvisning af opdateringer',
        previewDesc: 'Få tidlig adgang til nye funktioner og forbedringer',
        previewTip:
          'Vær opmærksom på, at forhåndsvisningsudgivelser kan indeholde fejl eller ufuldstændig funktionalitet!',
        offline: {
          title: 'Offline opdateringer',
          desc: 'Opdatering via lokal installationspakke',
          upload: 'Upload',
          invalidName: 'Ugyldigt filnavnsformat. Download venligst fra GitHub-udgivelser.',
          updateFailed: 'Opdatering fejlede. Prøv igen.'
        }
      },
      account: {
        title: 'Konto',
        webAccount: 'Navn på webkonto',
        password: 'Adgangskode',
        updateBtn: 'Update',
        logoutBtn: 'Log ud',
        logoutDesc: 'Er du sikker på, at du vil logge ud?',
        okBtn: 'Ja',
        cancelBtn: 'Annuller'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistent',
      empty: 'Åbn panelet og start en opgave for at begynde.',
      inputPlaceholder: 'Beskriv, hvad du vil have PicoClaw til at gøre',
      newConversation: 'Ny samtale',
      processing: 'Behandler...',
      agent: {
        defaultTitle: 'Generel assistent',
        defaultDescription: 'Generel hjælp til chat, søgning og arbejdsområde.',
        kvmTitle: 'Fjernstyring',
        kvmDescription: 'Betjen fjernværten gennem NanoKVM.',
        switched: 'Agentrolle skiftet',
        switchFailed: 'Kunne ikke skifte agentrolle'
      },
      send: 'Send',
      cancel: 'Annuller',
      status: {
        connecting: 'Opretter forbindelse til gateway...',
        connected: 'PicoClaw-session tilsluttet',
        disconnected: 'PicoClaw-session lukket',
        stopped: 'Stopanmodning sendt',
        runtimeStarted: 'PicoClaw runtime startet',
        runtimeStartFailed: 'Kunne ikke starte PicoClaw runtime',
        runtimeStopped: 'PicoClaw runtime stoppet',
        runtimeStopFailed: 'Kunne ikke stoppe PicoClaw runtime'
      },
      connection: {
        runtime: {
          checking: 'Kontrol',
          ready: 'Runtime klar',
          stopped: 'Runtime stoppet',
          unavailable: 'Runtime utilgængelig',
          configError: 'Konfigurationsfejl'
        },
        transport: {
          connecting: 'Tilslutning',
          connected: 'Tilsluttet'
        },
        run: {
          idle: 'Tomgang',
          busy: 'Optaget'
        }
      },
      message: {
        toolAction: 'Handling',
        observation: 'Observation',
        screenshot: 'Skærmbillede'
      },
      overlay: {
        locked: 'PicoClaw styrer enheden. Manuel indtastning er sat på pause.'
      },
      install: {
        install: 'Installer PicoClaw',
        installing: 'Installation af PicoClaw',
        success: 'PicoClaw installeret korrekt',
        failed: 'Kunne ikke installere PicoClaw',
        uninstalling: 'Afinstallerer runtime...',
        uninstalled: 'Runtime blev afinstalleret.',
        uninstallFailed: 'Afinstallation mislykkedes.',
        requiredTitle: 'PicoClaw er ikke installeret',
        requiredDescription: 'Installer PicoClaw før start af PicoClaw runtime.',
        progressDescription: 'PicoClaw bliver downloadet og installeret.',
        stages: {
          preparing: 'Forberedelse',
          downloading: 'Downloader',
          extracting: 'Udpakning',
          installing: 'Installerer',
          installed: 'Installeret',
          install_timeout: 'Timeout',
          install_failed: 'Mislykkedes'
        }
      },
      model: {
        requiredTitle: 'Modelkonfiguration er påkrævet',
        requiredDescription: 'Konfigurer PicoClaw-modellen, før du bruger PicoClaw chat.',
        docsTitle: 'Konfigurationsvejledning',
        docsDesc: 'Understøttede modeller og protokoller',
        menuLabel: 'Konfigurer model',
        modelIdentifier: 'Modelidentifikator',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API-nøgle',
        apiKeyPlaceholder: 'Indtast modellens API-nøgle',
        save: 'Gem',
        saving: 'Gemmer',
        saved: 'Modelkonfiguration gemt',
        saveFailed: 'Kunne ikke gemme modelkonfigurationen',
        invalid: 'Model-id, API Base URL og API-nøgle er påkrævet'
      },
      uninstall: {
        menuLabel: 'Afinstaller',
        confirmTitle: 'Afinstaller PicoClaw',
        confirmContent:
          'Er du sikker på, at du vil afinstallere PicoClaw? Dette vil slette den eksekverbare fil og alle konfigurationsfiler.',
        confirmOk: 'Afinstaller',
        confirmCancel: 'Annuller'
      },
      history: {
        title: 'Historik',
        loading: 'Indlæser sessioner...',
        emptyTitle: 'Ingen historik endnu',
        emptyDescription: 'Tidligere PicoClaw sessioner vil blive vist her.',
        loadFailed: 'Kunne ikke indlæse sessionshistorikken',
        deleteFailed: 'Kunne ikke slette session',
        deleteConfirmTitle: 'Slet session',
        deleteConfirmContent: 'Er du sikker på, at du vil slette "{{title}}"?',
        deleteConfirmOk: 'Slet',
        deleteConfirmCancel: 'Annuller',
        messageCount_one: '{{count}} besked',
        messageCount_other: '{{count}} beskeder'
      },
      config: {
        startRuntime: 'Start PicoClaw',
        stopRuntime: 'Stop PicoClaw'
      },
      start: {
        title: 'Start PicoClaw',
        description: 'Start runtime for at begynde at bruge PicoClaw-assistenten.'
      }
    },
    error: {
      title: 'Vi er stødt på et problem',
      refresh: 'Opdater'
    },
    fullscreen: {
      toggle: 'Skift fuldskærm'
    },
    menu: {
      collapse: 'Skjul menu',
      expand: 'Udvid menu'
    }
  }
};

export default da;
