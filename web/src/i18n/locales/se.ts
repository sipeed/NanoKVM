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
        reset1:
          'För att återställa lösenordet, håll in BOOT-knappen på NanoKVM i 10 sekunder.',
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
      confirmBtn: 'Ok',
      finishBtn: 'Färdig'
    },
    screen: {
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
        "Beräkna skillnaden mellan ramar. Sluta skicka videoström när inga förändringar upptäcks på fjärrvärdens skärm.",
      resetHdmi: 'Återställ HDMI'
    },
    keyboard: {
      title: 'Tangentbord',
      paste: 'Klistra in',
      tips: 'Endast standardbokstäver och symboler på tangentbordet stöds',
      placeholder: 'Ange text',
      submit: 'Skicka',
      virtual: 'Tangentbord',
      ctrlaltdel: 'Ctrl+Alt+Del',
      readClipboard: 'Läs från Urklipp',
      clipboardPermissionDenied: 'Behörighet till Urklipp nekad. Vänligen tillåt åtkomst till Urklipp i din webbläsare.',
      clipboardReadError: 'Misslyckades med att läsa Urklipp',
      dropdownEnglish: 'Engelska',
      dropdownGerman: 'Tyska'
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
      speed: 'Scrollhastighet',
      fast: 'Snabb',
      slow: 'Långsam',
      requestPointer: 'Använder relativt läge. Klicka på skrivbordet för att få muspekaren.',
      resetHid: 'Återställ HID',
      hidOnly: {
        title: 'Endast-HID-läge',
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
      cdrom: 'Montera avbildning i CD-ROM-läge',
      mountFailed: 'Montering misslyckades',
      mountDesc:
        "I vissa system måste den virtuella disken avmonteras på fjärrvärden innan avbildningen monteras.",
      refresh: 'Uppdatera avbildningslistan',
      unmountFailed: 'Avmontering misslyckades',
      unmountDesc: 'I vissa system måste du manuellt mata ut från fjärrvärden innan du avmonterar avbildningen.',
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
      flowControlSoft: 'Mjuk',
      flowControlHard: 'Hård',
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
      disabled: '/data partitionen är skrivskyddad, kan inte hämta avbildning'
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
        display: 'Display',
        language: 'Språk',
        menuBar: 'Menyfält',
        menuBarDesc: 'Visa ikoner i menyfältet',
        webTitle: 'Webbtitel',
        webTitleDesc: 'Anpassa webbsidans titel'
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
        wifi: {
          title: 'Wi-Fi',
          description: 'Konfigurera Wi-Fi',
          setBtn: 'Konfigurera'
        },
        ssh: {
          description: 'Aktivera SSH-fjärråtkomst',
          tip: 'Ställ in ett starkt lösenord innan du aktiverar (Konto - Byt lösenord)'
        },
        tls: {
          description: 'Aktivera HTTPS-protokoll',
          tip: 'Observera: Användning av HTTPS kan öka fördröjningen, särskilt med MJPEG-läge.'
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
        hidOnly: 'Endast-HID-läge',
        disk: 'Virtuell disk',
        diskDesc: 'Montera virtuell U-disk på fjärrvärden',
        network: 'Virtuellt nätverk',
        networkDesc: 'Montera virtuell nätverkskort på fjärrvärden',
        reboot: 'Starta om',
        rebootDesc: 'Är du säker på att du vill starta om NanoKVM?',
        okBtn: 'Ja',
        cancelBtn: 'Nej'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Minnesoptimering',
          tip: 'När minnesanvändningen överskrider gränsen utförs aggressivare skräpsamling för att frigöra minne. Rekommenderas att sättas till 75 MB om du använder Tailscale. Omstart krävs för att det ska gälla.',
          disable: 'Inaktivera'
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
        upTailscaled: 'Ladda upp tailscaled till katalogen /usr/sbin/',
        refresh: 'Uppdatera sidan',
        notLogin:
          'Enheten är ännu inte bunden. Logga in och bind enheten till ditt konto.',
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
          'Observera att förhandsversioner kan innehålla buggar eller ofullständig funktionalitet!'
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
