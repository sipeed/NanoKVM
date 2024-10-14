const nl = {
  translation: {
    language: 'Taal',
    changePassword: 'Wachtwoord wijzigen',
    logout: 'Uitloggen',
    settings: 'Instellingen',
    showMouse: 'Muis tonen',
    hideMouse: 'Muis verbergen',
    power: 'Aan/uit',
    reset: 'Resetten',
    powerShort: 'Aan/uit (kort indrukken)',
    powerLong: 'Aan/uit (lang indrukken)',
    hddLed: 'HDD LED',
    checkLibFailed: 'Controleren van runtime bibliotheek mislukt, probeer het opnieuw',
    updateLibFailed: 'Bijwerken van runtime bibliotheek mislukt, probeer het opnieuw',
    updatingLib: 'Runtime bibliotheek wordt bijgewerkt. Vernieuw de pagina na het bijwerken.',
    checkForUpdate: 'Controleren op updates',
    head: {
      desktop: 'Extern bureaublad',
      login: 'Inloggen',
      changePassword: 'Wachtwoord wijzigen',
      terminal: 'Terminal'
    },
    auth: {
      login: 'Inloggen',
      placeholderUsername: 'Voer gebruikersnaam in',
      placeholderPassword: 'Voer wachtwoord in',
      placeholderPassword2: 'Voer wachtwoord nogmaals in',
      noEmptyUsername: 'Gebruikersnaam mag niet leeg zijn',
      noEmptyPassword: 'Wachtwoord mag niet leeg zijn',
      noAccount: 'Ophalen van gebruikersinformatie mislukt, vernieuw de webpagina of reset het wachtwoord',
      invalidUser: 'Ongeldige gebruikersnaam of wachtwoord',
      error: 'Onverwachte fout',
      changePassword: 'Wachtwoord wijzigen',
      differentPassword: 'Wachtwoorden komen niet overeen',
      illegalUsername: 'Gebruikersnaam bevat ongeldige tekens',
      illegalPassword: 'Wachtwoord bevat ongeldige tekens',
      forgetPassword: 'Wachtwoord vergeten',
      resetPassword: 'Wachtwoord resetten',
      reset1: 'Als u uw wachtwoord bent vergeten, volg dan deze stappen om het te resetten:',
      reset2: '1. Log in op het NanoKVM-apparaat via SSH;',
      reset3: '2. Verwijder het bestand in het apparaat: ',
      reset4: '3. Gebruik het standaardaccount om in te loggen: ',
      ok: 'Ok',
      cancel: 'Annuleren'
    },
    screen: {
      resolution: 'Resolutie',
      auto: 'Automatisch',
      autoTips:
        'Bij bepaalde resoluties kunnen schermverscheuringen of muisverplaatsingen optreden. Overweeg de resolutie van de externe host aan te passen of schakel de automatische modus uit.',
      fps: 'FPS',
      customizeFps: 'Aanpassen',
      quality: 'Kwaliteit',
      frameDetect: 'Frame detectie',
      frameDetectTip:
        'Berekent het verschil tussen frames. Stopt met het verzenden van de videostream wanneer er geen veranderingen worden gedetecteerd op het scherm van de externe host.'
    },
    keyboard: {
      paste: 'Plakken',
      tips: 'Alleen standaard toetsenbordletters en symbolen worden ondersteund',
      placeholder: 'Voer tekst in',
      submit: 'Verzenden',
      virtual: 'Toetsenbord'
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
      requestPointer: 'Relatieve modus wordt gebruikt. Klik op het bureaublad om de muisaanwijzer te krijgen.',
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
      sending: 'Commando wordt verzonden...',
      sent: 'Commando verzonden',
      input: 'Voer het MAC-adres in',
      ok: 'Ok'
    },
    about: {
      title: 'Over NanoKVM',
      information: 'Informatie',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'Applicatie versie',
      image: 'Image versie',
      deviceKey: 'Apparaat sleutel',
      queryFailed: 'Opvragen mislukt',
      community: 'Community'
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
    virtualDevice: {
      network: 'Virtueel netwerk',
      disk: 'Virtuele schijf'
    },
    tailscale: {
      loading: 'Laden...',
      notInstall: 'Tailscale niet gevonden! Installeer a.u.b.',
      install: 'Installeren',
      installing: 'Installeren',
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
      logout2: 'Weet u zeker dat u wilt uitloggen?'
    }
  }
};

export default nl;
