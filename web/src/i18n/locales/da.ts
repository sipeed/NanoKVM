const da = {
  translation: {
    language: 'Sprog',
    changePassword: 'Skift adgangskode',
    logout: 'Log ud',
    settings: 'Indstillinger',
    showMouse: 'Vis mus',
    hideMouse: 'Skjul mus',
    power: 'Tænd/sluk-knap',
    reset: 'Nulstillingsknap',
    powerShort: 'Tænd/sluk-knap (kort tryk)',
    powerLong: 'Tænd/sluk-knap (langt tryk)',
    hddLed: 'HDD lysdiode',
    checkLibFailed: 'Kunne ikke kontrollere runtime-biblioteket. Prøv igen',
    updateLibFailed: 'Kunne ikke opdatere runtime-biblioteket. Prøv igen',
    updatingLib: 'Opdaterer runtime-biblioteket. Opdater siden efter opdateringen.',
    checkForUpdate: 'Kontroller for opdatering',
    head: {
      desktop: 'Fjernskrivebord',
      login: 'Log ind',
      changePassword: 'Skift adgangskode',
      terminal: 'Terminal'
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
      error: 'uventet fejl',
      changePassword: 'Skift adgangskode',
      changePasswordDesc: 'For sikkerheden af din enhed, bedes du ændre web-login adgangskoden.',
      differentPassword: 'Adgangskoder er ikke ens',
      illegalUsername: 'brugernavn indeholder ugyldige tegn',
      illegalPassword: 'adgangskode indeholder ugyldige tegn',
      forgetPassword: 'Glem adgangskode',
      resetPassword: 'Nulstil adgangskode',
      reset1: 'Hvis du har glemt adgangskoden, kan du følge disse trin for at nulstille den:',
      reset2: '1. Log ind på din NanoKVM via SSH.',
      reset3: '2. Slet filen på enheden: ',
      reset4: '3. Brug standardkontoen til at logge ind: ',
      ok: 'OK',
      cancel: 'Annuller',
      loginButtonText: 'Log ind'
    },
    screen: {
      video: 'Videotilstand',
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
        'Beregner forskellen mellem hver frame. Stopper med at sende et video stream hvis der ikke registreres ændringer på fjerncomputerens skærm.'
    },
    keyboard: {
      paste: 'Indsæt',
      tips: 'Kun standard bogstaver og symboler er understøttet',
      placeholder: 'Indtast tekst',
      submit: 'Send',
      virtual: 'Tastatur'
    },
    mouse: {
      default: 'Standard-markør',
      pointer: 'Peger-markør',
      cell: 'Celle-markør',
      text: 'Tekst-markør',
      grab: 'Grib-markør',
      hide: 'Skjul mus',
      mode: 'Tilstand for mus',
      absolute: 'Absolut tilstand',
      relative: 'Relativ tilstand',
      requestPointer: 'Bruger relativ-tilstand. Klik på skrivebordet for at få musemarkør.',
      resetHid: 'Nulstil HID'
    },
    image: {
      title: 'Diskbilleder',
      loading: 'Kontrollerer...',
      empty: 'Ingen fundet',
      mountFailed: 'Montering af diskbillede mislykkedes',
      mountDesc:
        'På nogle systemer kan det være nødvendigt at skubbe den virtuelle disk ud på fjerncomputeren før du kan montere diskbilledet.',
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
      confirm: 'OK'
    },
    wol: {
      sending: 'Sender Wake-on-LAN magic packet',
      sent: 'Wake-on-LAN magic packet sendt',
      input: 'Angiv MAC-adresse',
      ok: 'OK'
    },
    about: {
      title: 'Om NanoKVM',
      information: 'Information',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'Program version',
      image: 'Firmware version',
      deviceKey: 'Enhedsnøgle',
      queryFailed: 'Forespørgsel mislykkedes',
      community: 'Fællesskab'
    },
    update: {
      title: 'Kontroller for opdatering',
      queryFailed: 'Opdateringskontrol mislykkedes',
      updateFailed: 'Opdatering fejlede. Prøv igen.',
      isLatest: 'Du har allerede den nyeste version.',
      available: 'En opdatering er tilgængelig. Vil du installere den?',
      updating: 'Opdatering i gang. Vent venligst...',
      confirm: 'Bekræft',
      cancel: 'Annuller'
    },
    virtualDevice: {
      network: 'Virtuelt netværk',
      disk: 'Virtuel disk'
    },
    tailscale: {
      loading: 'Indlæser...',
      notInstall: 'Tailscale ikke fundet! Installer det for at fuldføre opsætningen.',
      install: 'Installer',
      installing: 'Installerer',
      failed: 'Installation mislykkedes',
      retry: 'Opdater siden og prøv igen. Ellers prøv at installere manuelt.',
      download: 'Download',
      package: 'installationspakken',
      unzip: 'og udpak den',
      upTailscale: 'Upload tailscale til følgende mappe på enheden: /usr/bin/',
      upTailscaled: 'Upload tailscaled til følgende mappe på enheden: /usr/sbin/',
      refresh: 'Opdater sides',
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
      logout2: 'Er du sikker på at du vil logge ud?'
    }
  }
};

export default da;
