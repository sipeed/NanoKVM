const ca = {
  translation: {
    head: {
      desktop: "Escriptori remot",
      login: "Inici de sessió",
      changePassword: "Canviar contrasenya",
      terminal: "Terminal",
      wifi: "Xarxa Sense fils"
    },
    auth: {
      login: "Inici de sessió",
      placeholderUsername: "Nom d'usuari",
      placeholderPassword: "Contrasenya",
      placeholderPassword2: "Torna a introduir la contrasenya",
      noEmptyUsername: "Cal introduir el nom d'usuari",
      noEmptyPassword: "Cal introduir la contrasenya",
      noAccount: "No s'ha pogut obtenir la informació de l'usuari, actualitza la pàgina web o restableix la contrasenya",
      invalidUser: "Nom d'usuari o contrasenya invàlids",
      error: "Error inesperat",
      changePassword: "Canviar la contrasenya",
      changePasswordDesc: "Per a la seguretat del dispositiu, canvia la contrasenya!",
      differentPassword: "Les contrasenyes no coincideixen",
      illegalUsername: "El nom d'usuari conté caràcters no permesos",
      illegalPassword: "La contrasenya conté caràcters no permesos",
      forgetPassword: "Has oblidat la contrasenya",
      ok: "D'acord",
      cancel: "Cancel·la",
      loginButtonText: "Inicia sessió",
      tips: {
        reset1: "Per restablir les contrasenyes, mantingues premut el botó BOOT del NanoKVM durant 10 segons.",
        reset2: "Per veure els passos detallats, consulta aquest document:",
        reset3: "Compte web per defecte:",
        reset4: "Compte SSH per defecte:",
        change1: "Aquesta acció canviarà les següents contrasenyes:",
        change2: "Contrasenya d'inici de sessió web",
        change3: "Contrasenya root del sistema (inici de sessió SSH)",
        change4: "Per restablir les contrasenyes, mantingues premut el botó BOOT del NanoKVM."
      }
    },
    wifi: {
      title: "Xarxa Sense fils",
      description: "Configura la xarxa sense fils per al NanoKVM",
      success: "Comprova l'estat de la xarxa del NanoKVM i visita la nova adreça IP.",
      failed: "L'operació ha fallat, torna-ho a intentar.",
      confirmBtn: "D'acord",
      finishBtn: "Fet"
    },
    screen: {
      title: "Pantalla",
      video: "Mode de vídeo",
      videoDirectTips: "Activa HTTPS a 'Configuració > Dispositiu' per utilitzar aquest mode",
      resolution: "Resolució",
      auto: "Automàtic",
      autoTips: "Poden aparèixer talls o desajustos del ratolí en certes resolucions. Prova a canviar la resolució de l'amfitrió remot o desactiva el mode automàtic.",
      fps: "FPS",
      customizeFps: "Personalitzat",
      quality: "Qualitat",
      qualityLossless: "Sense pèrdua",
      qualityHigh: "Alta",
      qualityMedium: "Mitjana",
      qualityLow: "Baixa",
      frameDetect: "Detecció de fotogrames",
      frameDetectTip: "Calcula la diferència entre fotogrames. S'atura la transmissió si no hi ha canvis a la pantalla de l'amfitrió remot.",
      resetHdmi: "Restablir HDMI"
    },
    keyboard: {
      title: "Teclat",
      paste: "Enganxa",
      tips: "Només es permeten lletres i símbols estàndard",
      placeholder: "Escriu aquí",
      submit: "Envia",
      virtual: "Teclat",
      ctrlaltdel: "Ctrl+Alt+Del"
    },
    mouse: {
      title: "Ratolí",
      cursor: "Estil del cursor",
      default: "Cursor per defecte",
      pointer: "Cursor punter",
      cell: "Cursor de cel·la",
      text: "Cursor de text",
      grab: "Cursor de mà",
      hide: "Amaga el cursor",
      mode: "Mode de ratolí",
      absolute: "Mode absolut",
      relative: "Mode relatiu",
      speed: "Velocitat de la roda",
      fast: "Ràpida",
      slow: "Lenta",
      requestPointer: "Estàs usant el mode relatiu. Fes clic a l'escriptori per obtenir el punter.",
      resetHid: "Restablir HID",
      hidOnly: {
        title: "Mode només HID",
        desc: "Si el teclat o ratolí deixen de funcionar i restablir HID no ajuda, pot ser un problema de compatibilitat. Prova d'activar el mode només HID.",
        tip1: "Activar aquest mode desmuntarà el disc virtual i la xarxa virtual",
        tip2: "En mode només HID, no es pot muntar imatges",
        tip3: "El NanoKVM es reiniciarà automàticament en canviar de mode",
        enable: "Activa mode només HID",
        disable: "Desactiva mode només HID"
      }
    },
    image: {
      title: "Imatges",
      loading: "Carregant...",
      empty: "No s'ha trobat res",
      cdrom: "Munta la imatge en mode CD-ROM",
      mountFailed: "Error en muntar",
      mountDesc: "En alguns sistemes cal expulsar el disc virtual abans de muntar la imatge.",
      refresh: "Actualitza la llista",
      tips: {
        title: "Com pujar imatges",
        usb1: "Connecta el NanoKVM al teu ordinador via USB.",
        usb2: "Assegura't que el disc virtual està muntat (Configuració - Disc Virtual).",
        usb3: "Obre el disc virtual i copia la imatge a l'arrel.",
        scp1: "Comprova que el NanoKVM i el teu ordinador estan a la mateixa xarxa.",
        scp2: "Obre un terminal i usa SCP per pujar la imatge al directori /data del NanoKVM.",
        scp3: "Exemple: scp ruta-de-la-imatge root@ip-del-nanokvm:/data",
        tfCard: "Targeta TF",
        tf1: "Mètode disponible a sistemes GNU/Linux",
        tf2: "Extreu la targeta TF del NanoKVM (versió FULL, cal obrir la carcassa).",
        tf3: "Introdueix la targeta en un lector i connecta'l a l'ordinador.",
        tf4: "Copia la imatge al directori /data de la targeta.",
        tf5: "Reintrodueix la targeta al NanoKVM."
      }
    },
    script: {
      title: "Scripts",
      upload: "Puja",
      run: "Executa",
      runBackground: "Executa en segon pla",
      runFailed: "Error en l'execució",
      attention: "Atenció",
      delDesc: "Estàs segur que vols eliminar aquest fitxer?",
      confirm: "Sí",
      cancel: "No",
      delete: "Esborra",
      close: "Tanca"
    },
    terminal: {
      title: "Terminal",
      nanokvm: "Terminal NanoKVM",
      serial: "Terminal de port sèrie",
      serialPort: "Port sèrie",
      serialPortPlaceholder: "Introdueix el port sèrie",
      baudrate: "Velocitat (baudrate)",
      parity: "Paritat",
      parityNone: "Cap",
      parityEven: "Parell",
      parityOdd: "Senar",
      flowControl: "Control de flux",
      flowControlNone: "Cap",
      flowControlSoft: "Suau",
      flowControlHard: "Dur",
      dataBits: "Bits de dades",
      stopBits: "Bits de parada",
      confirm: "D'acord"
    },
    wol: {
      title: "Wake-on-LAN",
      sending: "Enviant comanda...",
      sent: "Comanda enviada",
      input: "Introdueix la MAC",
      ok: "D'acord"
    },
    download: {
      title: "Descarregador d'imatges",
      input: "Introdueix la URL de la imatge",
      ok: "D'acord",
      disabled: "La partició /data és només lectura. No es pot descarregar la imatge."
    },
    power: {
      title: "Alimentació",
      showConfirm: "Confirmació",
      showConfirmTip: "Les operacions d'alimentació requereixen confirmació",
      reset: "Reinicia",
      power: "Encén",
      powerShort: "Clic curt",
      powerLong: "Clic llarg",
      resetConfirm: "Vols realment reiniciar?",
      powerConfirm: "Vols realment encendre/apagar?",
      okBtn: "Sí",
      cancelBtn: "No"
    },
    settings: {
      title: "Configuració",
      about: {
        title: "Sobre NanoKVM",
        information: "Informació",
        ip: "IP",
        mdns: "mDNS",
        application: "Versió aplicació",
        applicationTip: "Versió de la interfície web de NanoKVM",
        image: "Versió de la imatge",
        imageTip: "Versió del sistema NanoKVM",
        deviceKey: "Clau del dispositiu",
        community: "Comunitat",
        hostname: "Nom del dispositiu",
        hostnameUpdated: "Nom actualitzat. Reinicia per aplicar.",
        ipType: {
          Wired: "Cablejada",
          Wireless: "Sense fil",
          Other: "Altra"
        }
      },
      appearance: {
        title: "Aparença",
        display: "Pantalla",
        language: "Idioma",
        menuBar: "Barra de menú",
        menuBarDesc: "Mostra icones a la barra de menú",
        webTitle: "Títol web",
        webTitleDesc: "Personalitza el títol de la pàgina"
      },
      device: {
        title: "Dispositiu",
        oled: {
          title: "OLED",
          description: "Apagar pantalla OLED després de",
          0: "Mai",
          15: "15 s",
          30: "30 s",
          60: "1 min",
          180: "3 min",
          300: "5 min",
          600: "10 min",
          1800: "30 min",
          3600: "1 h"
        },
        wifi: {
          title: "Xarxa sense fils",
          description: "Configura la xarxa sense fils",
          setBtn: "Configura"
        },
        ssh: {
          description: "Activa accés remot per SSH",
          tip: "Configura una contrasenya segura abans (Compte - Canvia contrasenya)"
        },
        tls: {
          description: "Activa el protocol HTTPS",
          tip: "Atenció: Usar HTTPS pot augmentar la latència, sobretot amb vídeo MJPEG."
        },
        advanced: "Configuració avançada",
        swap: {
          title: "Swap",
          disable: "Desactiva",
          description: "Defineix la mida del fitxer swap",
          tip: "Pot reduir la vida útil de la targeta SD!"
        },
        mouseJiggler: {
          title: "Mou-ratolí automàtic",
          description: "Evita que el dispositiu remot entri en repòs",
          disable: "Desactiva",
          absolute: "Mode absolut",
          relative: "Mode relatiu"
        },
        mdns: {
          description: "Activa descobriment mDNS",
          tip: "Desactiva-ho si no és necessari"
        },
        hdmi: {
          description: "Activa la sortida HDMI"
        },
        hidOnly: "Mode només HID",
        disk: "Disc virtual",
        diskDesc: "Munta un disc U virtual al dispositiu remot",
        network: "Xarxa virtual",
        networkDesc: "Munta una targeta de xarxa virtual al dispositiu remot",
        reboot: "Reinicia",
        rebootDesc: "Segur que vols reiniciar el NanoKVM?",
        okBtn: "Sí",
        cancelBtn: "No"
      },
      tailscale: {
        title: "Tailscale",
        memory: {
          title: "Optimització de memòria",
          tip: "Quan es supera el límit de memòria, es fa una neteja més agressiva. Recomanat: 75MB si uses Tailscale. Requereix reiniciar Tailscale.",
          disable: "Desactiva"
        },
        restart: "Reiniciar Tailscale?",
        stop: "Aturar Tailscale?",
        stopDesc: "Tanca la sessió i desactiva l'inici automàtic",
        loading: "Carregant...",
        notInstall: "Tailscale no instal·lat! Instal·la-ho.",
        install: "Instal·la",
        installing: "Instal·lant",
        failed: "Error en la instal·lació",
        retry: "Actualitza i torna-ho a provar. O instal·la manualment",
        download: "Descarrega el",
        package: "paquet d'instal·lació",
        unzip: "i descomprimeix-lo",
        upTailscale: "Puja tailscale a /usr/bin/",
        upTailscaled: "Puja tailscaled a /usr/sbin/",
        refresh: "Actualitza la pàgina",
        notLogin: "El dispositiu no està vinculat. Inicia sessió per vincular-lo.",
        urlPeriod: "Aquesta URL és vàlida durant 10 minuts",
        login: "Inicia sessió",
        loginSuccess: "Sessió iniciada correctament",
        enable: "Activa Tailscale",
        deviceName: "Nom del dispositiu",
        deviceIP: "IP del dispositiu",
        account: "Compte",
        logout: "Tanca sessió",
        logoutDesc: "Segur que vols tancar sessió?",
        uninstall: "Desinstal·la Tailscale",
        okBtn: "Sí",
        cancelBtn: "No"
      },
      update: {
        title: "Comprova actualitzacions",
        queryFailed: "Error en obtenir la versió",
        updateFailed: "Error en actualitzar. Torna-ho a intentar.",
        isLatest: "Ja tens la darrera versió.",
        available: "Hi ha una actualització disponible. Vols actualitzar ara?",
        updating: "Actualitzant... espera",
        confirm: "Confirma",
        cancel: "Cancel·la",
        preview: "Versió de prova",
        previewDesc: "Prova noves funcions abans que ningú",
        previewTip: "Compte: aquestes versions poden tenir errors o funcions inacabades!"
      },
      account: {
        title: "Compte",
        webAccount: "Nom del compte web",
        password: "Contrasenya",
        updateBtn: "Canvia",
        logoutBtn: "Tanca sessió",
        logoutDesc: "Segur que vols tancar sessió?",
        okBtn: "Sí",
        cancelBtn: "No"
      }
    },
    error: {
      title: "Hi ha hagut un error",
      refresh: "Actualitza"
    },
    fullscreen: {
      toggle: "Pantalla completa"
    },
    menu: {
      collapse: "Amaga menú",
      expand: "Mostra menú"
    }
  }
};

export default ca;