const se = {
  translation: {
    head: {
      desktop: 'Fjärrskrivbord',
      login: 'Logga in',
      changePassword: 'Byt lösenord',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Logga in',
      placeholderUsername: 'Användarnamn',
      placeholderPassword: 'Lösenord',
      placeholderPassword2: 'Vänligen ange lösenordet igen',
      noEmptyUsername: 'Användarnamn krävs',
      noEmptyPassword: 'Lösenord krävs',
      noAccount: 'Kunde inte hämta användarinformation, uppdatera sidan eller återställ lösenordet',
      invalidUser: 'Ogiltigt användarnamn eller lösenord',
      locked: 'För många inloggningar, försök igen senare',
      globalLocked: 'System under skydd, försök igen senare',
      error: 'Oväntat fel',
      changePassword: 'Byt lösenord',
      changePasswordDesc: 'För din enhets säkerhet, byt lösenord!',
      differentPassword: 'Lösenorden matchar inte',
      illegalUsername: 'Användarnamnet innehåller ogiltiga tecken',
      illegalPassword: 'Lösenordet innehåller ogiltiga tecken',
      forgetPassword: 'Glömt lösenord',
      ok: 'Ok',
      cancel: 'Avbryt',
      loginButtonText: 'Logga in',
      tips: {
        reset1: 'För att återställa lösenordet, håll in BOOT-knappen på NanoKVM i 10 sekunder.',
        reset2: 'För detaljerade steg, se detta dokument:',
        reset3: 'Standardkonto för webben:',
        reset4: 'Standardkonto för SSH:',
        change1: 'Observera att denna åtgärd ändrar följande lösenord:',
        change2: 'Webbinloggningslösenord',
        change3: 'Systemets root-lösenord (SSH-lösenord)',
        change4: 'För att återställa lösenordet, håll in BOOT-knappen på NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Konfigurera Wi-Fi för NanoKVM',
      success: 'Kontrollera nätverksstatusen för NanoKVM och besök den nya IP-adressen.',
      failed: 'Åtgärden misslyckades, försök igen.',
      invalidMode:
        'Det aktuella läget stöder inte nätverksinstallation. Gå till din enhet och aktivera Wi-Fi konfigurationsläge.',
      confirmBtn: 'Ok',
      finishBtn: 'Färdig',
      ap: {
        authTitle: 'Autentisering krävs',
        authDescription: 'Ange lösenordet AP för att fortsätta',
        authFailed: 'Ogiltigt AP lösenord',
        passPlaceholder: 'AP lösenord',
        verifyBtn: 'Verifiera'
      }
    },
    screen: {
      scale: 'Skala',
      title: 'Skärm',
      video: 'Videoläge',
      videoDirectTips: 'Aktivera HTTPS i "Inställningar > Enhet" för att använda detta läge',
      resolution: 'Upplösning',
      auto: 'Automatisk',
      autoTips:
        'Skärmtear eller musförskjutning kan förekomma vid vissa upplösningar. Överväg att justera fjärrvärdens upplösning eller inaktivera automatiskt läge.',
      fps: 'FPS',
      customizeFps: 'Anpassa',
      quality: 'Kvalitet',
      qualityLossless: 'Förlustfri',
      qualityHigh: 'Hög',
      qualityMedium: 'Medel',
      qualityLow: 'Låg',
      frameDetect: 'Ramdetection',
      frameDetectTip:
        'Beräkna skillnaden mellan ramar. Sluta skicka videoström när inga förändringar upptäcks på fjärrvärdens skärm.',
      resetHdmi: 'Återställ HDMI'
    },
    keyboard: {
      title: 'Tangentbord',
      paste: 'Klistra in',
      tips: 'Endast standardbokstäver och symboler på tangentbordet stöds',
      placeholder: 'Ange text',
      submit: 'Skicka',
      virtual: 'Tangentbord',
      readClipboard: 'Läs från Urklipp',
      clipboardPermissionDenied:
        'Behörighet till Urklipp nekad. Vänligen tillåt åtkomst till Urklipp i din webbläsare.',
      clipboardReadError: 'Misslyckades med att läsa Urklipp',
      dropdownEnglish: 'Engelska',
      dropdownGerman: 'Tyska',
      dropdownFrench: 'Franska',
      dropdownRussian: 'ryska',
      shortcut: {
        title: 'Genvägar',
        custom: 'Anpassad',
        capture: 'Klicka här för att fånga genväg',
        clear: 'Rensa',
        save: 'Spara',
        captureTips:
          'Att fånga systemtangenter (som Windows-tangenten) kräver helskärmsbehörighet.',
        enterFullScreen: 'Växla helskärmsläge.'
      },
      leaderKey: {
        title: 'Leader-tangent',
        desc: 'Gå förbi webbläsarbegränsningar och skicka systemgenvägar direkt till fjärrvärden.',
        howToUse: 'Hur man använder',
        simultaneous: {
          title: 'Samtidigt läge',
          desc1: 'Håll ned Leader-tangenten och tryck sedan på genvägen.',
          desc2: 'Intuitivt, men kan komma i konflikt med systemgenvägar.'
        },
        sequential: {
          title: 'Sekventiellt läge',
          desc1:
            'Tryck på Leader-tangenten → tryck på genvägen i följd → tryck på Leader-tangenten igen.',
          desc2: 'Kräver fler steg, men undviker helt systemkonflikter.'
        },
        enable: 'Aktivera Leader-tangent',
        tip: 'När den tilldelas som Leader-tangent fungerar denna tangent endast som genvägsutlösare och förlorar sitt standardbeteende.',
        placeholder: 'Tryck på Leader-tangenten',
        shiftRight: 'Höger Shift',
        ctrlRight: 'Höger Ctrl',
        metaRight: 'Höger Win',
        submit: 'Skicka',
        recorder: {
          rec: 'REC',
          activate: 'Aktivera tangenter',
          input: 'Vänligen tryck på genvägen...'
        }
      }
    },
    mouse: {
      title: 'Mus',
      cursor: 'Markörstil',
      default: 'Standardmarkör',
      pointer: 'Pekmarkör',
      cell: 'Cellmarkör',
      text: 'Textmarkör',
      grab: 'Greppmarkör',
      hide: 'Dölj markör',
      mode: 'Musläge',
      absolute: 'Absolut läge',
      relative: 'Relativt läge',
      direction: 'Rullhjulsriktning',
      scrollUp: 'Scrolla uppåt',
      scrollDown: 'Scrolla ner',
      speed: 'Rullhjulshastighet',
      fast: 'Snabb',
      slow: 'Långsam',
      requestPointer: 'Använder relativt läge. Klicka på skrivbordet för att få muspekaren.',
      resetHid: 'Återställ HID',
      hidOnly: {
        title: 'Endast HID-läge',
        desc: 'Om din mus och ditt tangentbord slutar svara och återställning av HID inte hjälper, kan det bero på kompatibilitetsproblem mellan NanoKVM och enheten. Prova att aktivera Endast-HID-läge för bättre kompatibilitet.',
        tip1: 'Aktivering av Endast-HID-läge avmonterar den virtuella U-disken och nätverket',
        tip2: 'I Endast-HID-läge är avbildningsmontering inaktiverat',
        tip3: 'NanoKVM kommer automatiskt att starta om efter lägesbyte',
        enable: 'Aktivera Endast-HID-läge',
        disable: 'Inaktivera Endast-HID-läge'
      }
    },
    image: {
      title: 'Avbildningar',
      loading: 'Laddar...',
      empty: 'Inget hittades',
      mountMode: 'Monteringsläge',
      mountFailed: 'Montering misslyckades',
      mountDesc:
        'I vissa system måste den virtuella disken avmonteras på fjärrvärden innan avbildningen monteras.',
      unmountFailed: 'Avmontering misslyckades',
      unmountDesc:
        'I vissa system måste du manuellt mata ut från fjärrvärden innan du avmonterar avbildningen.',
      refresh: 'Uppdatera avbildningslistan',
      attention: 'Observera',
      deleteConfirm: 'Är du säker på att du vill ta bort denna avbildning?',
      okBtn: 'Ja',
      cancelBtn: 'Nej',
      tips: {
        title: 'Hur man laddar upp',
        usb1: 'Anslut NanoKVM till din dator via USB.',
        usb2: 'Säkerställ att den virtuella disken är monterad (Inställningar - Virtuell Disk).',
        usb3: 'Öppna den virtuella disken på din dator och kopiera avbildningsfilen till rotkatalogen.',
        scp1: 'Säkerställ att NanoKVM och din dator är på samma lokala nätverk.',
        scp2: 'Öppna en terminal på din dator och använd SCP-kommandot för att ladda upp avbildningen till /data på NanoKVM.',
        scp3: 'Exempel: scp din-avbildningssökväg root@din-nanokvm-ip:/data',
        tfCard: 'TF-kort',
        tf1: 'Denna metod stöds på Linux-system',
        tf2: 'Ta ut TF-kortet från NanoKVM (för FULL-versionen, öppna chassit först).',
        tf3: 'Sätt in TF-kortet i en kortläsare och anslut till din dator.',
        tf4: 'Kopiera avbildningsfilen till /data på TF-kortet.',
        tf5: 'Sätt in TF-kortet i NanoKVM.'
      }
    },
    script: {
      title: 'Skript',
      upload: 'Ladda upp',
      run: 'Kör',
      runBackground: 'Kör i bakgrunden',
      runFailed: 'Körning misslyckades',
      attention: 'Observera',
      delDesc: 'Är du säker på att du vill ta bort denna fil?',
      confirm: 'Ja',
      cancel: 'Nej',
      delete: 'Ta bort',
      close: 'Stäng'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'NanoKVM Terminal',
      serial: 'Serieport-terminal',
      serialPort: 'Serieport',
      serialPortPlaceholder: 'Ange serieport',
      baudrate: 'Baudhastighet',
      parity: 'Paritet',
      parityNone: 'Ingen',
      parityEven: 'Jämn',
      parityOdd: 'Udda',
      flowControl: 'Flödeskontroll',
      flowControlNone: 'Ingen',
      flowControlSoft: 'Programvara',
      flowControlHard: 'Hårdvara',
      dataBits: 'Databitar',
      stopBits: 'Stoppbitar',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Skickar kommando...',
      sent: 'Kommando skickat',
      input: 'Ange MAC-adress',
      ok: 'Ok'
    },
    download: {
      title: 'Avbildningshämtare',
      input: 'Ange en fjärravbildnings-URL',
      ok: 'Ok',
      disabled: '/data partitionen är skrivskyddad, kan inte hämta avbildning',
      uploadbox: 'Släpp filen här eller klicka för att välja',
      inputfile: 'Vänligen ange bildfilen',
      NoISO: 'Ingen ISO'
    },
    power: {
      title: 'Ström',
      showConfirm: 'Bekräftelse',
      showConfirmTip: 'Strömätgärder kräver extra bekräftelse',
      reset: 'Starta om',
      power: 'Ström',
      powerShort: 'Ström (kort tryck)',
      powerLong: 'Ström (långt tryck)',
      resetConfirm: 'Utföra omstart?',
      powerConfirm: 'Utföra strömåtgärd?',
      okBtn: 'Ja',
      cancelBtn: 'Nej'
    },
    settings: {
      title: 'Inställningar',
      about: {
        title: 'Om NanoKVM',
        information: 'Information',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Applikationsversion',
        applicationTip: 'NanoKVM webbapplikationsversion',
        image: 'Systemversion',
        imageTip: 'NanoKVM systemavbildningsversion',
        deviceKey: 'Enhetsnyckel',
        community: 'Community',
        hostname: 'Värdnamn',
        hostnameUpdated: 'Värdnamn uppdaterat. Starta om för att tillämpa.',
        ipType: {
          Wired: 'Trådbundet',
          Wireless: 'Trådlöst',
          Other: 'Annat'
        }
      },
      appearance: {
        title: 'Utseende',
        display: 'Visning',
        language: 'Språk',
        languageDesc: 'Välj språk för gränssnittet',
        webTitle: 'Webbtitel',
        webTitleDesc: 'Anpassa webbsidans titel',
        menuBar: {
          title: 'Menyrad',
          mode: 'Visningsläge',
          modeDesc: 'Visa menyraden på skärmen',
          modeOff: 'Av',
          modeAuto: 'Dölj automatiskt',
          modeAlways: 'Alltid synlig',
          icons: 'Undermenyikoner',
          iconsDesc: 'Visa undermenyikoner i menyraden'
        }
      },
      device: {
        title: 'Enhet',
        oled: {
          title: 'OLED',
          description: 'Stäng av OLED-skärmen efter',
          0: 'Aldrig',
          15: '15 sek',
          30: '30 sek',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 timme'
        },
        ssh: {
          description: 'Aktivera SSH-fjärråtkomst',
          tip: 'Ställ in ett starkt lösenord innan du aktiverar (Konto - Byt lösenord)'
        },
        advanced: 'Avancerade inställningar',
        swap: {
          title: 'Swap',
          disable: 'Inaktivera',
          description: 'Ange swap-filens storlek',
          tip: 'Aktivering av denna funktion kan förkorta livslängden på ditt SD-kort!'
        },
        mouseJiggler: {
          title: 'Musvickare',
          description: 'Förhindra att fjärrvärden går i viloläge',
          disable: 'Inaktivera',
          absolute: 'Absolut läge',
          relative: 'Relativt läge'
        },
        mdns: {
          description: 'Aktivera mDNS-upptäckningstjänst',
          tip: 'Stäng av om det inte behövs'
        },
        hdmi: {
          description: 'Aktivera HDMI/monitorutgång'
        },
        autostart: {
          title: 'Autostart skriptinställningar',
          description: 'Hantera skript som körs automatiskt vid systemstart',
          new: 'Nytt',
          deleteConfirm: 'Är du säker på att du vill ta bort denna fil?',
          yes: 'Ja',
          no: 'Nej',
          scriptName: 'Autostart skriptnamn',
          scriptContent: 'Autostart skriptinnehåll',
          settings: 'Inställningar'
        },
        hidOnly: 'Endast-HID-läge',
        hidOnlyDesc: 'Sluta emulera virtuella enheter, behåll bara grundläggande HID kontroll',
        disk: 'Virtuell disk',
        diskDesc: 'Montera virtuell U-disk på fjärrvärden',
        network: 'Virtuellt nätverk',
        networkDesc: 'Montera virtuell nätverkskort på fjärrvärden',
        reboot: 'Starta om',
        rebootDesc: 'Är du säker på att du vill starta om NanoKVM?',
        okBtn: 'Ja',
        cancelBtn: 'Nej'
      },
      network: {
        title: 'Nätverk',
        wifi: {
          title: 'Wi-Fi',
          description: 'Konfigurera Wi-Fi',
          apMode: 'AP-läge är aktiverat, anslut till Wi-Fi genom att skanna QR-koden',
          connect: 'Anslut Wi-Fi',
          connectDesc1: 'Ange nätverkets SSID och lösenord',
          connectDesc2: 'Ange lösenordet för att ansluta till detta nätverk',
          disconnect: 'Är du säker på att du vill koppla från nätverket?',
          failed: 'Anslutningen misslyckades, försök igen.',
          ssid: 'Namn',
          password: 'Lösenord',
          joinBtn: 'Anslut',
          confirmBtn: 'OK',
          cancelBtn: 'Avbryt'
        },
        tls: {
          description: 'Aktivera HTTPS-protokoll',
          tip: 'Observera: Användning av HTTPS kan öka fördröjningen, särskilt med MJPEG-läge.'
        },
        dns: {
          title: 'DNS',
          description: 'Konfigurera DNS-servrar för NanoKVM',
          mode: 'Läge',
          dhcp: 'DHCP',
          manual: 'Manuell',
          add: 'Lägg till DNS',
          save: 'Spara',
          invalid: 'Ange en giltig IP-adress',
          noDhcp: 'Ingen DHCP-DNS är tillgänglig just nu',
          saved: 'DNS-inställningar sparade',
          saveFailed: 'Det gick inte att spara DNS-inställningar',
          unsaved: 'Osparade ändringar',
          maxServers: 'Maximalt {{count}} DNS-servrar tillåtna',
          dnsServers: 'DNS-servrar',
          dhcpServersDescription: 'DNS-servrar hämtas automatiskt från DHCP',
          manualServersDescription: 'DNS-servrar kan redigeras manuellt',
          networkDetails: 'Nätverksdetaljer',
          interface: 'Gränssnitt',
          ipAddress: 'IP-adress',
          subnetMask: 'Subnätmask',
          router: 'Router',
          none: 'Ingen'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Minnesoptimering',
          tip: 'När minnesanvändningen överskrider gränsen utförs aggressivare skräpsamling för att frigöra minne. Rekommenderas att sättas till 75 MB om du använder Tailscale. Omstart krävs för att det ska gälla.'
        },
        swap: {
          title: 'Byt minne',
          tip: 'Om problemen kvarstår efter att du har aktiverat minnesoptimering, försök att aktivera utbyte av minne. Detta ställer in växlingsfilens storlek till 256MB som standard, vilket kan justeras i "Inställningar > Enhet".'
        },
        restart: 'Starta om Tailscale?',
        stop: 'Stoppa Tailscale?',
        stopDesc: 'Logga ut från Tailscale och inaktivera autostart vid uppstart.',
        loading: 'Laddar...',
        notInstall: 'Tailscale hittades inte! Installera först.',
        install: 'Installera',
        installing: 'Installerar',
        failed: 'Installationen misslyckades',
        retry: 'Uppdatera sidan och försök igen. Eller installera manuellt',
        download: 'Ladda ner',
        package: 'installationspaketet',
        unzip: 'och packa upp det',
        upTailscale: 'Ladda upp tailscale till NanoKVM-katalogen /usr/bin/',
        upTailscaled: 'Ladda upp tailscaled till NanoKVM-katalogen /usr/sbin/',
        refresh: 'Uppdatera sidan',
        notRunning: 'Tailscale körs inte. Starta den för att fortsätta.',
        run: 'Start',
        notLogin: 'Enheten är ännu inte bunden. Logga in och bind enheten till ditt konto.',
        urlPeriod: 'Denna URL är giltig i 10 minuter',
        login: 'Logga in',
        loginSuccess: 'Inloggning lyckades',
        enable: 'Aktivera Tailscale',
        deviceName: 'Enhetsnamn',
        deviceIP: 'Enhets-IP',
        account: 'Konto',
        logout: 'Logga ut',
        logoutDesc: 'Är du säker på att du vill logga ut?',
        uninstall: 'Avinstallera Tailscale',
        uninstallDesc: 'Är du säker på att du vill avinstallera Tailscale?',
        okBtn: 'Ja',
        cancelBtn: 'Nej'
      },
      update: {
        title: 'Sök efter uppdateringar',
        queryFailed: 'Kunde inte hämta version',
        updateFailed: 'Uppdatering misslyckades. Försök igen.',
        isLatest: 'Du har redan den senaste versionen.',
        available: 'En uppdatering finns tillgänglig. Vill du uppdatera nu?',
        updating: 'Uppdatering påbörjad. Vänta...',
        confirm: 'Bekräfta',
        cancel: 'Avbryt',
        preview: 'Förhandsvisning av uppdateringar',
        previewDesc: 'Få tidig tillgång till nya funktioner och förbättringar',
        previewTip:
          'Observera att förhandsversioner kan innehålla buggar eller ofullständig funktionalitet!',
        offline: {
          title: 'Offlineuppdateringar',
          desc: 'Uppdatera genom lokalt installationspaket',
          upload: 'Ladda upp',
          invalidName: 'Ogiltigt filnamnsformat. Ladda ner från GitHub-versioner.',
          updateFailed: 'Uppdatering misslyckades. Försök igen.'
        }
      },
      users: {
        title: 'Användarhantering',
        addUser: 'Lägg till användare',
        colUsername: 'Användarnamn',
        colRole: 'Roll',
        colEnabled: 'Aktiv',
        colActions: 'Åtgärder',
        rolesTitle: 'Rollöversikt',
        roleAdmin: 'Full åtkomst + användarhantering',
        roleOperator: 'KVM-användning: ström, tangentbord, mus, strömbrytare',
        roleViewer: 'Endast strömvisning',
        changePassword: 'Ändra lösenord',
        newPassword: 'Nytt lösenord',
        confirmPassword: 'Bekräfta lösenord',
        pwdMismatch: 'Lösenorden matchar inte',
        pwdSuccess: 'Lösenord ändrat',
        pwdFailed: 'Det gick inte att ändra lösenordet',
        password: 'Lösenord',
        delete: 'Ta bort',
        deleteConfirm: 'Är du säker på att du vill ta bort denna användare?',
        createSuccess: 'Användare skapad',
        createFailed: 'Kunde inte skapa användare',
        deleteSuccess: 'Användare borttagen',
        deleteFailed: 'Borttagning misslyckades',
        updateSuccess: 'Uppdaterad',
        updateFailed: 'Uppdatering misslyckades',
        loadFailed: 'Det gick inte att läsa in användare',
        usernameRequired: 'Ange användarnamn',
        passwordRequired: 'Ange lösenord',
        okBtn: 'OK',
        cancelBtn: 'Avbryt'
      },
      account: {
        title: 'Konto',
        webAccount: 'Webbkonto-namn',
        password: 'Lösenord',
        updateBtn: 'Byt',
        logoutBtn: 'Logga ut',
        logoutDesc: 'Är du säker på att du vill logga ut?',
        okBtn: 'Ja',
        cancelBtn: 'Nej'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistent',
      empty: 'Öppna panelen och starta en uppgift för att börja.',
      inputPlaceholder: 'Beskriv vad du vill att PicoClaw ska göra',
      newConversation: 'Ny konversation',
      processing: 'Bearbetar...',
      agent: {
        defaultTitle: 'Allmän assistent',
        defaultDescription: 'Allmän hjälp för chatt, sökning och arbetsyta.',
        kvmTitle: 'Fjärrstyrning',
        kvmDescription: 'Manövrera fjärrvärden genom NanoKVM.',
        switched: 'Agentroll bytte',
        switchFailed: 'Det gick inte att byta agentroll'
      },
      send: 'Skicka',
      cancel: 'Avbryt',
      status: {
        connecting: 'Ansluter till gateway...',
        connected: 'PicoClaw-session ansluten',
        disconnected: 'PicoClaw-session frånkopplad',
        stopped: 'Stoppbegäran har skickats',
        runtimeStarted: 'PicoClaw runtime startad',
        runtimeStartFailed: 'Det gick inte att starta PicoClaw runtime',
        runtimeStopped: 'PicoClaw runtime stoppad',
        runtimeStopFailed: 'Det gick inte att stoppa PicoClaw runtime'
      },
      connection: {
        runtime: {
          checking: 'Kontrollerar',
          ready: 'Runtime klar',
          stopped: 'Runtime stoppad',
          unavailable: 'Runtime inte tillgänglig',
          configError: 'Konfigurationsfel'
        },
        transport: {
          connecting: 'Ansluter',
          connected: 'Ansluten'
        },
        run: {
          idle: 'Inaktiv',
          busy: 'Upptagen'
        }
      },
      message: {
        toolAction: 'Åtgärd',
        observation: 'Observation',
        screenshot: 'Skärmdump'
      },
      overlay: {
        locked: 'PicoClaw styr enheten. Manuell inmatning är pausad.'
      },
      install: {
        install: 'Installera PicoClaw',
        installing: 'Installerar PicoClaw',
        success: 'PicoClaw har installerats framgångsrikt',
        failed: 'Det gick inte att installera PicoClaw',
        uninstalling: 'Avinstallerar runtime...',
        uninstalled: 'Runtime avinstallerades framgångsrikt.',
        uninstallFailed: 'Avinstallationen misslyckades.',
        requiredTitle: 'PicoClaw är inte installerad',
        requiredDescription: 'Installera PicoClaw innan du startar PicoClaw runtime.',
        progressDescription: 'PicoClaw laddas ner och installeras.',
        stages: {
          preparing: 'Förbereder',
          downloading: 'Laddar ner',
          extracting: 'Packar upp',
          installing: 'Installerar',
          installed: 'Installerad',
          install_timeout: 'Timeout',
          install_failed: 'Misslyckades'
        }
      },
      model: {
        requiredTitle: 'Modellkonfiguration krävs',
        requiredDescription: 'Konfigurera PicoClaw-modellen innan du använder PicoClaw-chatten.',
        docsTitle: 'Konfigurationsguide',
        docsDesc: 'Modeller och protokoll som stöds',
        menuLabel: 'Konfigurera modell',
        modelIdentifier: 'Modellidentifierare',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API-nyckel',
        apiKeyPlaceholder: 'Ange modellens API-nyckel',
        save: 'Spara',
        saving: 'Sparar',
        saved: 'Modellkonfiguration sparad',
        saveFailed: 'Det gick inte att spara modellkonfigurationen',
        invalid: 'Modellidentifierare, API Base URL och API-nyckel krävs'
      },
      uninstall: {
        menuLabel: 'Avinstallera',
        confirmTitle: 'Avinstallera PicoClaw',
        confirmContent:
          'Är du säker på att du vill avinstallera PicoClaw? Detta kommer att radera den körbara filen och alla konfigurationsfiler.',
        confirmOk: 'Avinstallera',
        confirmCancel: 'Avbryt'
      },
      history: {
        title: 'Historik',
        loading: 'Laddar sessioner...',
        emptyTitle: 'Ingen historik än',
        emptyDescription: 'Tidigare PicoClaw-sessioner kommer att visas här.',
        loadFailed: 'Det gick inte att ladda sessionshistoriken',
        deleteFailed: 'Det gick inte att ta bort sessionen',
        deleteConfirmTitle: 'Ta bort session',
        deleteConfirmContent: 'Är du säker på att du vill ta bort "{{title}}"?',
        deleteConfirmOk: 'Ta bort',
        deleteConfirmCancel: 'Avbryt',
        messageCount_one: '{{count}} meddelande',
        messageCount_other: '{{count}} meddelanden'
      },
      config: {
        startRuntime: 'Starta PicoClaw',
        stopRuntime: 'Stoppa PicoClaw'
      },
      start: {
        title: 'Starta PicoClaw',
        description: 'Starta runtime för att börja använda PicoClaw-assistenten.'
      }
    },
    error: {
      title: 'Vi stötte på ett problem',
      refresh: 'Uppdatera'
    },
    fullscreen: {
      toggle: 'Växla fullskärm'
    },
    menu: {
      collapse: 'Fäll ihop menyn',
      expand: 'Expandera menyn'
    }
  }
};

export default se;
