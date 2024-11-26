const nb = {
    translation: {
      language: 'Språk',
      changePassword: 'Endre passord',
      logout: 'Logg ut',
      settings: 'Innstillinger',
      showMouse: 'Vis peker',
      hideMouse: 'Skjul peker',
      power: 'På-knapp',
      reset: 'Reset-knapp',
      powerShort: 'På-knapp (kort trykk)',
      powerLong: 'På-knapp (langt trykk)',
      hddLed: 'Disk-aktivitet',
      checkLibFailed: 'Kunne ikke sjekke runtime-bibliotek. Prøv igjen.',
      updateLibFailed: 'Kunne ikke oppdatere runtime-bibliotek. Prøv igjen.',
      updatingLib: 'Oppdaterer runtime-bibliotek. Vennligst last inn siden på nytt etter oppdatering.',
      checkForUpdate: 'Se etter oppdatering',
      head: {
        desktop: 'Eksternt skrivebord',
        login: 'Logg inn',
        changePassword: 'Endre passord',
        terminal: 'Terminal'
      },
      auth: {
        login: 'Logg inn',
        placeholderUsername: 'Brukernavn',
        placeholderPassword: 'Passord',
        placeholderPassword2: 'Oppgi passord igjen',
        noEmptyUsername: 'Brukernavn påkrevd',
        noEmptyPassword: 'Passord påkrevd',
        noAccount: 'Kunne ikke hente brukerinformasjon. Vennligst last inn siden på nytt eller gjenopprett passord',
        invalidUser: 'Ugyldig brukernavn eller passord',
        error: 'Uventet feil',
        changePassword: 'Endre passord',
        changePasswordDesc: 'For sikkerheten til enheten, vennligst endre passordet ditt for web-innlogging.',
        differentPassword: 'Passordene er ikke like',
        illegalUsername: 'Brukernavn inneholder tegn som ikke er tillat',
        illegalPassword: 'Passord inneholder tegn som ikke er tillat',
        forgetPassword: 'Glemt passord',
        resetPassword: 'Gjenopprett passord',
        reset1: 'Hvis du har glemt passordet ditt, vennligst følg disse trinnene for å gjenopprette det:',
        reset2: '1. Logg inn på NanoKVM-enheten med SSH',
        reset3: '2. Slett filen på enheten: ',
        reset4: '3. Bruk standardkontoen til å logge inn: ',
        ok: 'Ok',
        cancel: 'Avbryt',
        loginButtonText: 'Logg inn',
      },
      screen: {
        video: 'Video-kodek',
        resolution: 'Oppløsning',
        auto: 'Automatisk',
        autoTips:
          "Skjermriving eller peker-forskyvning kan oppstå ved enkelte oppløsninger. Prøv å justere den eksterne vertens oppløsning eller skru av automatisk modus.",
        fps: 'FPS',
        customizeFps: 'Tilpass',
        quality: 'Kvalitet',
        qualityLossless: 'Tapsfri',
        qualityHigh: 'Høy',
        qualityMedium: 'Medium',
        qualityLow: 'Lav',
        frameDetect: 'Bildefrekvensoppdagelse',
        frameDetectTip:
          "Kalkuler forskjellen mellom bilder. Stopper overføring av video når det ikke oppdages forskjell på den eksterne vertens skjerm."
      },
      keyboard: {
        paste: 'Lim inn',
        tips: 'Kun vanlige tegn på tastatur er støttet',
        placeholder: 'Vennligst angi teksten du vil lime inn',
        submit: 'Lim inn',
        virtual: 'Åpne tastatur'
      },
      mouse: {
        default: 'Vanlig',
        pointer: 'Hånd',
        cell: 'Celle',
        text: 'Tekst',
        grab: 'Grip',
        hide: 'Skjul',
        mode: 'Modus',
        absolute: 'Absolutt',
        relative: 'Relativ',
        requestPointer: 'Bruker relativ modus. Vennligsk klikk på skrivebordet for vise musepeker.',
        resetHid: 'Gjenopprett HID'
      },
      image: {
        title: 'Bilder',
        loading: 'Laster...',
        empty: 'Ingen funnet',
        mountFailed: 'Montering feilet',
        mountDesc:
          "På noen systemer er det nødvendig å koble fra den virtuelle disken på den eksterne verten før man kan montere arkivfilen.",
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
        confirm: 'Ok'
      },
      wol: {
        sending: 'Sender kommando...',
        sent: 'Kommando sendt',
        input: 'Vennligst angi MAC-adressen',
        ok: 'Ok'
      },
      about: {
        title: 'Om NanoKVM',
        information: 'Informasjon',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Applikasjonsversjon',
        image: 'Arkivfil-versjon',
        deviceKey: 'Enhetsnøkkel',
        queryFailed: 'Spørring feilet',
        community: 'Fellesskap'
      },
      update: {
        title: 'Se etter oppdatering',
        queryFailed: 'Kunne ikke hente versjon',
        updateFailed: 'En feil oppstod under oppdatering. Vennligst forsøk igjen.',
        isLatest: 'Du har siste versjon allerede.',
        available: 'En oppdatering er tilgjengelig. Er du sikker på at du ønsker å oppdatere?',
        updating: 'Oppdatering har startet. Vennligst vent...',
        confirm: 'Oppdater',
        cancel: 'Avbryt'
      },
      virtualDevice: {
        network: 'Virtuelt nettverk',
        disk: 'Virtuell disk'
      },
      tailscale: {
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
        logout2: 'Er du sikker på at du ønsker å logge ut?'
      }
    }
  };

  export default nb;
