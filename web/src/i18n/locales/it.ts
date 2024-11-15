const it = {
  translation: {
    language: 'Lingua',
    changePassword: 'Cambia Password',
    logout: 'Disconnetti',
    settings: 'Impostazioni',
    showMouse: 'Mostra mouse',
    hideMouse: 'Nascondi mouse',
    power: 'Accensione',
    reset: 'Reimposta',
    powerShort: 'Accensione (clic breve)',
    powerLong: 'Accensione (clic lungo)',
    hddLed: 'LED HDD',
    checkLibFailed: 'Impossibile verificare la libreria runtime, riprova',
    updateLibFailed: 'Impossibile aggiornare la libreria runtime, riprova',
    updatingLib: "Aggiornamento libreria runtime. Aggiorna la pagina dopo l'aggiornamento.",
    checkForUpdate: 'Controlla Aggiornamenti',
    head: {
      desktop: 'Desktop Remoto',
      login: 'Accesso',
      changePassword: 'Cambia Password',
      terminal: 'Terminale'
    },
    auth: {
      login: 'Accesso',
      placeholderUsername: 'Inserisci il nome utente',
      placeholderPassword: 'Inserisci la password',
      placeholderPassword2: 'Inserisci nuovamente la password',
      noEmptyUsername: 'Il nome utente non può essere vuoto',
      noEmptyPassword: 'La password non può essere vuota',
      noAccount:
        'Impossibile ottenere informazioni utente, aggiorna la pagina o reimposta la password',
      invalidUser: 'Nome utente o password non validi',
      error: 'Errore imprevisto',
      changePassword: 'Cambia Password',
      changePasswordDesc:
        'Per la sicurezza del tuo dispositivo, modifica la password di accesso web.',
      differentPassword: 'Le password non corrispondono',
      illegalUsername: 'Il nome utente contiene caratteri non validi',
      illegalPassword: 'La password contiene caratteri non validi',
      forgetPassword: 'Hai dimenticato la password',
      resetPassword: 'Reimposta Password',
      reset1: 'Se hai dimenticato la password, segui questi passaggi per reimpostarla:',
      reset2: '1. Accedi al dispositivo NanoKVM tramite SSH;',
      reset3: '2. Elimina il file nel dispositivo: ',
      reset4: "3. Usa l'account predefinito per accedere: ",
      ok: 'Ok',
      cancel: 'Annulla',
      loginButtonText: 'Accedi'
    },
    screen: {
      video: 'Modalità video',
      resolution: 'Risoluzione',
      auto: 'Automatico',
      autoTips:
        'Potrebbero verificarsi tearing dello schermo o spostamento del mouse a risoluzioni specifiche. Considera di regolare la risoluzione del dispositivo remoto o disabilitare la modalità automatica.',
      fps: 'FPS',
      customizeFps: 'Personalizza',
      quality: 'Qualità',
      qualityLossless: 'Senza perdita',
      qualityHigh: 'Alto',
      qualityMedium: 'Medio',
      qualityLow: 'Basso',
      frameDetect: 'Rilevamento Frame',
      frameDetectTip:
        'Calcola la differenza tra i frame. Interrompe la trasmissione del flusso video quando non vengono rilevate modifiche sullo schermo del dispositivo remoto.'
    },
    keyboard: {
      paste: 'Incolla',
      tips: 'Sono supportati solo lettere e simboli standard della tastiera',
      placeholder: 'Inserisci testo',
      submit: 'Invia',
      virtual: 'Tastiera'
    },
    mouse: {
      default: 'Cursore predefinito',
      pointer: 'Cursore a puntatore',
      cell: 'Cursore a cella',
      text: 'Cursore testo',
      grab: 'Cursore di presa',
      hide: 'Nascondi cursore',
      mode: 'Modalità mouse',
      absolute: 'Modalità assoluta',
      relative: 'Modalità relativa',
      requestPointer:
        'Usando la modalità relativa. Clicca sul desktop per ottenere il puntatore del mouse.',
      resetHid: 'Reimposta HID'
    },
    image: {
      title: 'Immagini',
      loading: 'Caricamento...',
      empty: 'Nessun risultato',
      mountFailed: 'Montaggio immagine fallito',
      mountDesc:
        "In alcuni sistemi, è necessario espellere il disco virtuale sull'host remoto prima di montare l'immagine.",
      tips: {
        title: 'Come caricare',
        usb1: 'Collega il NanoKVM al tuo computer tramite USB.',
        usb2: 'Assicurati che la Virtual Disk sia montata (Impostazioni - Virtual Disk).',
        usb3: 'Apri il disk virtuale sul tuo computer e copia il file immagine nella directory principale del disk.',
        scp1: 'Assicurati che il NanoKVM e il tuo computer siano sulla stessa rete locale.',
        scp2: 'Apri un terminale sul tuo computer e usa il comando SCP per caricare il file immagine nella directory /data del NanoKVM.',
        scp3: 'Esempio: scp il-tuo-percorso-immagine root@il-tuo-ip-nanokvm:/data',
        tfCard: 'Scheda TF',
        tf1: 'Questo metodo è supportato su sistemi Linux',
        tf2: 'Recupera la scheda TF dal NanoKVM (per la versione FULL, smonta prima il case).',
        tf3: 'Inserisci la scheda TF in un lettore di schede e collegala al tuo computer.',
        tf4: 'Copia il file immagine nella directory /data sulla scheda TF.',
        tf5: 'Inserisci la scheda TF nel NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Carica',
      run: 'Esegui',
      runBackground: 'Esegui in Background',
      runFailed: 'Esecuzione fallita',
      attention: 'Attenzione',
      delDesc: 'Sei sicuro di voler eliminare questo file?',
      confirm: 'Sì',
      cancel: 'No',
      delete: 'Elimina',
      close: 'Chiudi'
    },
    terminal: {
      title: 'Terminale',
      nanokvm: 'Terminale NanoKVM',
      serial: 'Terminale Porta Seriale',
      serialPort: 'Porta Seriale',
      serialPortPlaceholder: 'Inserisci la porta seriale',
      baudrate: 'Baud rate',
      confirm: 'Ok'
    },
    wol: {
      sending: 'Invio comando...',
      sent: 'Comando inviato',
      input: 'Inserisci il MAC',
      ok: 'Ok'
    },
    about: {
      title: 'Informazioni su NanoKVM',
      information: 'Informazioni',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'Versione Applicazione',
      image: 'Versione Immagine',
      deviceKey: 'Chiave Dispositivo',
      queryFailed: 'Query fallita',
      community: 'Comunità'
    },
    update: {
      title: 'Controlla Aggiornamenti',
      queryFailed: 'Impossibile ottenere la versione',
      updateFailed: 'Aggiornamento fallito. Riprova.',
      isLatest: 'Hai già la versione più recente.',
      available: 'Un aggiornamento è disponibile. Sei sicuro di voler aggiornare?',
      updating: 'Aggiornamento avviato. Attendere prego...',
      confirm: 'Conferma',
      cancel: 'Annulla'
    },
    virtualDevice: {
      network: 'Rete Virtuale',
      usb: 'Disk Virtuale'
    },
    tailscale: {
      loading: 'Caricamento...',
      notInstall: 'Tailscale non trovato! Per favore, installa.',
      install: 'Installa',
      installing: 'Installazione in corso',
      failed: 'Installazione fallita',
      retry: 'Riprova aggiornando la pagina o installa manualmente',
      download: 'Scarica il',
      package: 'pacchetto di installazione',
      unzip: 'e decomprimilo',
      upTailscale: 'Carica tailscale nella directory /usr/bin/ del NanoKVM',
      upTailscaled: 'Carica tailscaled nella directory /usr/sbin/ del NanoKVM',
      refresh: 'Aggiorna la pagina corrente',
      notLogin:
        'Il dispositivo non è ancora stato associato. Effettua il login e associa questo dispositivo al tuo account.',
      urlPeriod: 'Questo URL è valido per 10 minuti',
      login: 'Accedi',
      loginSuccess: 'Accesso riuscito',
      enable: 'Abilita Tailscale',
      deviceName: 'Nome Dispositivo',
      deviceIP: 'IP Dispositivo',
      account: 'Account',
      logout: 'Disconnetti',
      logout2: 'Sei sicuro di voler uscire?'
    }
  }
};

export default it;
