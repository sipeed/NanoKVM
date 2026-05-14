const ca = {
  translation: {
    head: {
      desktop: 'Escriptori remot',
      login: 'Inici de sessió',
      changePassword: 'Canviar contrasenya',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Inici de sessió',
      placeholderUsername: "Nom d'usuari",
      placeholderPassword: 'Contrasenya',
      placeholderPassword2: 'Torna a introduir la contrasenya',
      noEmptyUsername: "Cal introduir el nom d'usuari",
      noEmptyPassword: 'Cal introduir la contrasenya',
      noAccount:
        "No s'ha pogut obtenir la informació de l'usuari, actualitza la pàgina web o restableix la contrasenya",
      invalidUser: "Nom d'usuari o contrasenya invàlids",
      locked: 'Massa inicis de sessió, si us plau, torna-ho a provar més tard',
      globalLocked: 'Sistema sota protecció, torneu-ho a provar més tard',
      error: 'Error inesperat',
      changePassword: 'Canviar la contrasenya',
      changePasswordDesc: 'Per a la seguretat del dispositiu, canvia la contrasenya!',
      differentPassword: 'Les contrasenyes no coincideixen',
      illegalUsername: "El nom d'usuari conté caràcters no permesos",
      illegalPassword: 'La contrasenya conté caràcters no permesos',
      forgetPassword: 'Has oblidat la contrasenya',
      ok: "D'acord",
      cancel: 'Cancel·la',
      loginButtonText: 'Inicia sessió',
      tips: {
        reset1:
          'Per restablir les contrasenyes, mantingues premut el botó BOOT del NanoKVM durant 10 segons.',
        reset2: 'Per veure els passos detallats, consulta aquest document:',
        reset3: 'Compte web per defecte:',
        reset4: 'Compte SSH per defecte:',
        change1: 'Aquesta acció canviarà les següents contrasenyes:',
        change2: "Contrasenya d'inici de sessió web",
        change3: 'Contrasenya root del sistema (inici de sessió SSH)',
        change4: 'Per restablir les contrasenyes, mantingues premut el botó BOOT del NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configura Wi-Fi per al NanoKVM',
      success: "Comprova l'estat de la xarxa del NanoKVM i visita la nova adreça IP.",
      failed: "L'operació ha fallat, torna-ho a intentar.",
      invalidMode:
        'El mode actual no admet la configuració de xarxa. Aneu al vostre dispositiu i activeu el mode de configuració Wi-Fi.',
      confirmBtn: "D'acord",
      finishBtn: 'Fet',
      ap: {
        authTitle: 'Es requereix autenticació',
        authDescription: 'Introduïu la contrasenya AP per continuar',
        authFailed: 'Contrasenya AP no vàlida',
        passPlaceholder: 'AP contrasenya',
        verifyBtn: 'Verificar'
      }
    },
    screen: {
      scale: 'Escala',
      title: 'Pantalla',
      video: 'Mode de vídeo',
      videoDirectTips: "Activa HTTPS a 'Configuració > Dispositiu' per utilitzar aquest mode",
      resolution: 'Resolució',
      auto: 'Automàtic',
      autoTips:
        "Poden aparèixer talls o desajustos del ratolí en certes resolucions. Prova a canviar la resolució de l'amfitrió remot o desactiva el mode automàtic.",
      fps: 'FPS',
      customizeFps: 'Personalitzat',
      quality: 'Qualitat',
      qualityLossless: 'Sense pèrdua',
      qualityHigh: 'Alta',
      qualityMedium: 'Mitjana',
      qualityLow: 'Baixa',
      frameDetect: 'Detecció de fotogrames',
      frameDetectTip:
        "Calcula la diferència entre fotogrames. S'atura la transmissió si no hi ha canvis a la pantalla de l'amfitrió remot.",
      resetHdmi: 'Restablir HDMI'
    },
    keyboard: {
      title: 'Teclat',
      paste: 'Enganxa',
      tips: 'Només es permeten lletres i símbols estàndard',
      placeholder: 'Escriu aquí',
      submit: 'Envia',
      virtual: 'Teclat',
      readClipboard: 'Llegir des del porta-retalls',
      clipboardPermissionDenied:
        "S'ha denegat el permís del porta-retalls. Permet l'accés al porta-retalls al teu navegador.",
      clipboardReadError: "No s'ha pogut llegir el porta-retalls",
      dropdownEnglish: 'Anglès',
      dropdownGerman: 'alemany',
      dropdownFrench: 'francès',
      dropdownRussian: 'rus',
      shortcut: {
        title: 'Dreceres',
        custom: 'Personalitzat',
        capture: 'Feu clic aquí per capturar la drecera',
        clear: 'Clar',
        save: 'Desa',
        captureTips:
          'Capturar tecles del sistema (com la tecla Windows) requereix permís de pantalla completa.',
        enterFullScreen: 'Canvia el mode de pantalla completa.'
      },
      leaderKey: {
        title: 'Tecla líder',
        desc: "Evita les restriccions del navegador i envia dreceres del sistema directament a l'amfitrió remot.",
        howToUse: "Com s'utilitza",
        simultaneous: {
          title: 'Mode simultània',
          desc1: 'Manteniu premuda la tecla líder i premeu la drecera.',
          desc2: 'Intuïtiu, però pot entrar en conflicte amb les dreceres del sistema.'
        },
        sequential: {
          title: 'Mode seqüencial',
          desc1:
            'Premeu la tecla líder → premeu la drecera en seqüència → torneu a prémer la tecla líder.',
          desc2: 'Requereix més passos, però evita completament els conflictes del sistema.'
        },
        enable: 'Activa la tecla líder',
        tip: "Quan s'assigna com a tecla líder, aquesta tecla només funciona com a activador de dreceres i perd el seu comportament predeterminat.",
        placeholder: 'Premeu la tecla líder',
        shiftRight: 'Maj dreta',
        ctrlRight: 'Ctrl dret',
        metaRight: 'Win dret',
        submit: 'Envia',
        recorder: {
          rec: 'REC',
          activate: 'Activa les tecles',
          input: 'Premeu la drecera...'
        }
      }
    },
    mouse: {
      title: 'Ratolí',
      cursor: 'Estil del cursor',
      default: 'Cursor per defecte',
      pointer: 'Cursor punter',
      cell: 'Cursor de cel·la',
      text: 'Cursor de text',
      grab: 'Cursor de mà',
      hide: 'Amaga el cursor',
      mode: 'Mode de ratolí',
      absolute: 'Mode absolut',
      relative: 'Mode relatiu',
      direction: 'Direcció de la roda de desplaçament',
      scrollUp: "Desplaça't cap amunt",
      scrollDown: "Desplaça't cap avall",
      speed: 'Velocitat de desplaçament',
      fast: 'Ràpida',
      slow: 'Lenta',
      requestPointer: "Estàs usant el mode relatiu. Fes clic a l'escriptori per obtenir el punter.",
      resetHid: 'Restablir HID',
      hidOnly: {
        title: 'Mode només HID',
        desc: 'Si el ratolí i el teclat deixen de respondre i restablir HID no ajuda, pot ser un problema de compatibilitat entre el NanoKVM i el dispositiu. Proveu d’activar el mode només HID per millorar la compatibilitat.',
        tip1: 'Activar el mode només HID desmuntarà el disc virtual i la xarxa virtual',
        tip2: 'En mode només HID, no es pot muntar imatges',
        tip3: 'El NanoKVM es reiniciarà automàticament en canviar de mode',
        enable: 'Activa mode només HID',
        disable: 'Desactiva mode només HID'
      }
    },
    image: {
      title: 'Imatges',
      loading: 'Carregant...',
      empty: "No s'ha trobat res",
      mountMode: 'Mode de muntatge',
      mountFailed: 'Error en muntar',
      mountDesc: 'En alguns sistemes cal expulsar el disc virtual abans de muntar la imatge.',
      unmountFailed: "No s'ha pogut desmuntar",
      unmountDesc:
        "En alguns sistemes, cal expulsar manualment de l'amfitrió remot abans de desmuntar la imatge.",
      refresh: 'Actualitza la llista',
      attention: 'Atenció',
      deleteConfirm: 'Esteu segur que voleu suprimir aquesta imatge?',
      okBtn: 'Sí',
      cancelBtn: 'No',
      tips: {
        title: 'Com pujar imatges',
        usb1: 'Connecta el NanoKVM al teu ordinador via USB.',
        usb2: "Assegura't que el disc virtual està muntat (Configuració - Disc Virtual).",
        usb3: "Obre el disc virtual i copia la imatge a l'arrel.",
        scp1: 'Comprova que el NanoKVM i el teu ordinador estan a la mateixa xarxa.',
        scp2: 'Obre un terminal i usa SCP per pujar la imatge al directori /data del NanoKVM.',
        scp3: 'Exemple: scp ruta-de-la-imatge root@ip-del-nanokvm:/data',
        tfCard: 'Targeta TF',
        tf1: 'Mètode disponible a sistemes GNU/Linux',
        tf2: 'Extreu la targeta TF del NanoKVM (versió FULL, cal obrir la carcassa).',
        tf3: "Introdueix la targeta en un lector i connecta'l a l'ordinador.",
        tf4: 'Copia la imatge al directori /data de la targeta.',
        tf5: 'Reintrodueix la targeta al NanoKVM.'
      }
    },
    script: {
      title: 'Scripts',
      upload: 'Puja',
      run: 'Executa',
      runBackground: 'Executa en segon pla',
      runFailed: "Error en l'execució",
      attention: 'Atenció',
      delDesc: 'Estàs segur que vols eliminar aquest fitxer?',
      confirm: 'Sí',
      cancel: 'No',
      delete: 'Esborra',
      close: 'Tanca'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal NanoKVM',
      serial: 'Terminal de port sèrie',
      serialPort: 'Port sèrie',
      serialPortPlaceholder: 'Introdueix el port sèrie',
      baudrate: 'Velocitat (baudrate)',
      parity: 'Paritat',
      parityNone: 'Cap',
      parityEven: 'Parell',
      parityOdd: 'Senar',
      flowControl: 'Control de flux',
      flowControlNone: 'Cap',
      flowControlSoft: 'Programari',
      flowControlHard: 'Maquinari',
      dataBits: 'Bits de dades',
      stopBits: 'Bits de parada',
      confirm: "D'acord"
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Enviant comanda...',
      sent: 'Comanda enviada',
      input: 'Introdueix la MAC',
      ok: "D'acord"
    },
    download: {
      title: "Descarregador d'imatges",
      input: 'Introdueix la URL de la imatge',
      ok: "D'acord",
      disabled: 'La partició /data és només lectura. No es pot descarregar la imatge.',
      uploadbox: 'Deixeu anar el fitxer aquí o feu clic per seleccionar-lo',
      inputfile: "Introduïu el fitxer d'imatge",
      NoISO: 'Cap ISO'
    },
    power: {
      title: 'Alimentació',
      showConfirm: 'Confirmació',
      showConfirmTip: "Les operacions d'alimentació requereixen confirmació",
      reset: 'Reinicia',
      power: 'Encén',
      powerShort: 'Clic curt',
      powerLong: 'Clic llarg',
      resetConfirm: 'Vols realment reiniciar?',
      powerConfirm: 'Vols realment encendre/apagar?',
      okBtn: 'Sí',
      cancelBtn: 'No'
    },
    settings: {
      title: 'Configuració',
      about: {
        title: 'Sobre NanoKVM',
        information: 'Informació',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Versió aplicació',
        applicationTip: 'Versió de la interfície web de NanoKVM',
        image: 'Versió de la imatge',
        imageTip: 'Versió del sistema NanoKVM',
        deviceKey: 'Clau del dispositiu',
        community: 'Comunitat',
        hostname: 'Nom del dispositiu',
        hostnameUpdated: 'Nom actualitzat. Reinicia per aplicar.',
        ipType: {
          Wired: 'Cablejada',
          Wireless: 'Sense fil',
          Other: 'Altra'
        }
      },
      appearance: {
        title: 'Aparença',
        display: 'Pantalla',
        language: 'Idioma',
        languageDesc: "Seleccioneu l'idioma per a la interfície",
        webTitle: 'Títol web',
        webTitleDesc: 'Personalitza el títol de la pàgina',
        menuBar: {
          title: 'Barra de menús',
          mode: 'Mode de visualització',
          modeDesc: 'Mostra la barra de menús a la pantalla',
          modeOff: 'Apagat',
          modeAuto: 'Ocultació automàtica',
          modeAlways: 'Sempre visible',
          icons: 'Icones del submenú',
          iconsDesc: 'Mostra les icones del submenú a la barra de menús'
        }
      },
      device: {
        title: 'Dispositiu',
        oled: {
          title: 'OLED',
          description: 'Apagar pantalla OLED després de',
          0: 'Mai',
          15: '15 s',
          30: '30 s',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 h'
        },
        ssh: {
          description: 'Activa accés remot per SSH',
          tip: 'Configura una contrasenya segura abans (Compte - Canvia contrasenya)'
        },
        advanced: 'Configuració avançada',
        swap: {
          title: 'Swap',
          disable: 'Desactiva',
          description: 'Defineix la mida del fitxer swap',
          tip: 'Pot reduir la vida útil de la targeta SD!'
        },
        mouseJiggler: {
          title: 'Mou-ratolí automàtic',
          description: 'Evita que el dispositiu remot entri en repòs',
          disable: 'Desactiva',
          absolute: 'Mode absolut',
          relative: 'Mode relatiu'
        },
        mdns: {
          description: 'Activa descobriment mDNS',
          tip: 'Desactiva-ho si no és necessari'
        },
        hdmi: {
          description: 'Activa la sortida HDMI'
        },
        autostart: {
          title: "Configuració dels scripts d'inici automàtic",
          description: "Gestioneu els scripts que s'executen automàticament a l'inici del sistema",
          new: 'Nou',
          deleteConfirm: 'Estàs segur que vols eliminar aquest fitxer?',
          yes: 'Sí',
          no: 'No',
          scriptName: "Nom de l'script d'inici automàtic",
          scriptContent: "Contingut de l'script d'inici automàtic",
          settings: 'Configuració'
        },
        hidOnly: 'Mode només HID',
        hidOnlyDesc: "Deixeu d'emular dispositius virtuals, conservant només el control bàsic HID",
        disk: 'Disc virtual',
        diskDesc: 'Munta un disc U virtual al dispositiu remot',
        network: 'Xarxa virtual',
        networkDesc: 'Munta una targeta de xarxa virtual al dispositiu remot',
        reboot: 'Reinicia',
        rebootDesc: 'Segur que vols reiniciar el NanoKVM?',
        okBtn: 'Sí',
        cancelBtn: 'No'
      },
      network: {
        title: 'Xarxa',
        wifi: {
          title: 'Wi-Fi',
          description: 'Configura la xarxa Wi-Fi',
          apMode: "El mode AP està activat; connecta't al Wi-Fi escanejant el codi QR",
          connect: "Connecta't a Wi-Fi",
          connectDesc1: 'Introdueix el SSID i la contrasenya de la xarxa',
          connectDesc2: 'Introdueix la contrasenya per connectar-te a aquesta xarxa',
          disconnect: 'Segur que vols desconnectar la xarxa?',
          failed: 'La connexió ha fallat, torna-ho a provar.',
          ssid: 'Nom',
          password: 'Contrasenya',
          joinBtn: 'Connecta',
          confirmBtn: "D'acord",
          cancelBtn: 'Cancel·la'
        },
        tls: {
          description: 'Activa el protocol HTTPS',
          tip: 'Atenció: Usar HTTPS pot augmentar la latència, sobretot amb vídeo MJPEG.'
        },
        dns: {
          title: 'DNS',
          description: 'Configura els servidors DNS per a NanoKVM',
          mode: 'Mode',
          dhcp: 'DHCP',
          manual: 'Manual',
          add: 'Afegeix DNS',
          save: 'Desa',
          invalid: 'Introdueix una adreça IP vàlida',
          noDhcp: 'No hi ha cap DNS DHCP disponible actualment',
          saved: 'Configuració DNS desada',
          saveFailed: "No s'ha pogut desar la configuració DNS",
          unsaved: 'Canvis no desats',
          maxServers: 'Es permeten com a màxim {{count}} servidors DNS',
          dnsServers: 'Servidors DNS',
          dhcpServersDescription: "Els servidors DNS s'obtenen automàticament via DHCP",
          manualServersDescription: 'Els servidors DNS es poden editar manualment',
          networkDetails: 'Detalls de xarxa',
          interface: 'Interfície',
          ipAddress: 'Adreça IP',
          subnetMask: 'Màscara de subxarxa',
          router: 'Encaminador',
          none: 'Cap'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Optimització de memòria',
          tip: 'Quan es supera el límit de memòria, es fa una neteja més agressiva. Recomanat: 75MB si uses Tailscale. Requereix reiniciar Tailscale.'
        },
        swap: {
          title: 'Intercanvi de memòria',
          tip: "Si els problemes persisteixen després d'activar l'optimització de memòria, proveu d'habilitar la memòria d'intercanvi. Això estableix la mida del fitxer d'intercanvi a 256MB per defecte, que es pot ajustar a \"Configuració > Dispositiu\"."
        },
        restart: 'Reiniciar Tailscale?',
        stop: 'Aturar Tailscale?',
        stopDesc: 'Tanca la sessió de Tailscale i desactiva l’inici automàtic en arrencar.',
        loading: 'Carregant...',
        notInstall: 'Tailscale no instal·lat! Instal·la-ho.',
        install: 'Instal·la',
        installing: 'Instal·lant',
        failed: 'Error en la instal·lació',
        retry: 'Actualitza i torna-ho a provar. O instal·la manualment',
        download: 'Descarrega el',
        package: "paquet d'instal·lació",
        unzip: 'i descomprimeix-lo',
        upTailscale: 'Puja tailscale al directori /usr/bin/ del NanoKVM',
        upTailscaled: 'Puja tailscaled al directori /usr/sbin/ del NanoKVM',
        refresh: 'Actualitza la pàgina',
        notRunning: "Tailscale no s'està executant. Si us plau, inicieu-lo per continuar.",
        run: 'Comença',
        notLogin: 'El dispositiu no està vinculat. Inicia sessió per vincular-lo.',
        urlPeriod: 'Aquesta URL és vàlida durant 10 minuts',
        login: 'Inicia sessió',
        loginSuccess: 'Sessió iniciada correctament',
        enable: 'Activa Tailscale',
        deviceName: 'Nom del dispositiu',
        deviceIP: 'IP del dispositiu',
        account: 'Compte',
        logout: 'Tanca sessió',
        logoutDesc: 'Segur que vols tancar sessió?',
        uninstall: 'Desinstal·la Tailscale',
        uninstallDesc: 'Esteu segur que voleu desinstal·lar Tailscale?',
        okBtn: 'Sí',
        cancelBtn: 'No'
      },
      update: {
        title: 'Comprova actualitzacions',
        queryFailed: 'Error en obtenir la versió',
        updateFailed: 'Error en actualitzar. Torna-ho a intentar.',
        isLatest: 'Ja tens la darrera versió.',
        available: 'Hi ha una actualització disponible. Vols actualitzar ara?',
        updating: 'Actualitzant... espera',
        confirm: 'Confirma',
        cancel: 'Cancel·la',
        preview: 'Versió de prova',
        previewDesc: 'Prova noves funcions abans que ningú',
        previewTip: 'Compte: aquestes versions poden tenir errors o funcions inacabades!',
        offline: {
          title: 'Actualitzacions fora de línia',
          desc: "Actualització mitjançant el paquet d'instal·lació local",
          upload: 'Puja',
          invalidName: 'Format de nom de fitxer no vàlid. Baixeu-lo des de les versions de GitHub.',
          updateFailed: 'Error en actualitzar. Torna-ho a intentar.'
        }
      },
      users: {
        title: 'Gestió d\'usuaris',
        addUser: 'Afegir usuari',
        colUsername: 'Nom d\'usuari',
        colRole: 'Rol',
        colEnabled: 'Actiu',
        colActions: 'Accions',
        rolesTitle: 'Visió general dels rols',
        roleAdmin: 'Accés complet + gestió d\'usuaris',
        roleOperator: 'Ús del KVM: stream, teclat, ratolí, botons d\'engegada',
        roleViewer: 'Només visualització de l\'stream',
        changePassword: 'Canviar contrasenya',
        newPassword: 'Nova contrasenya',
        confirmPassword: 'Confirmar contrasenya',
        pwdMismatch: 'Les contrasenyes no coincideixen',
        pwdSuccess: 'Contrasenya canviada correctament',
        pwdFailed: 'No s\'ha pogut canviar la contrasenya',
        password: 'Contrasenya',
        delete: 'Eliminar',
        deleteConfirm: 'Segur que voleu eliminar aquest usuari?',
        createSuccess: 'Usuari creat',
        createFailed: 'No s\'ha pogut crear l\'usuari',
        deleteSuccess: 'Usuari eliminat',
        deleteFailed: 'No s\'ha pogut eliminar l\'usuari',
        updateSuccess: 'Actualitzat',
        updateFailed: 'Actualització fallida',
        loadFailed: 'No s\'han pogut carregar els usuaris',
        usernameRequired: 'Introduïu el nom d\'usuari',
        passwordRequired: 'Introduïu la contrasenya',
        okBtn: 'D\'acord',
        cancelBtn: 'Cancel·lar'
      },
      account: {
        title: 'Compte',
        webAccount: 'Nom del compte web',
        password: 'Contrasenya',
        updateBtn: 'Canvia',
        logoutBtn: 'Tanca sessió',
        logoutDesc: 'Segur que vols tancar sessió?',
        okBtn: 'Sí',
        cancelBtn: 'No'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistent',
      empty: 'Obriu el tauler i inicieu una tasca per començar.',
      inputPlaceholder: 'Descriu què vols que faci el PicoClaw',
      newConversation: 'Nova conversa',
      processing: "S'està processant...",
      agent: {
        defaultTitle: 'Assistent general',
        defaultDescription: 'Ajuda general de xat, cerca i espai de treball.',
        kvmTitle: 'Control remot',
        kvmDescription: "Opera l'amfitrió remot mitjançant NanoKVM.",
        switched: "Rol d'agent canviat",
        switchFailed: "No s'ha pogut canviar la funció d'agent"
      },
      send: 'Envia',
      cancel: 'Cancel·la',
      status: {
        connecting: "S'està connectant a la passarel·la...",
        connected: 'Sessió de PicoClaw connectada',
        disconnected: 'Sessió de PicoClaw tancada',
        stopped: "S'ha enviat la sol·licitud d'aturada",
        runtimeStarted: "Temps d'execució de PicoClaw iniciat",
        runtimeStartFailed: "No s'ha pogut iniciar el temps d'execució de PicoClaw",
        runtimeStopped: "Temps d'execució de PicoClaw aturat",
        runtimeStopFailed: "No s'ha pogut aturar el temps d'execució de PicoClaw"
      },
      connection: {
        runtime: {
          checking: 'Comprovació',
          ready: "Temps d'execució a punt",
          stopped: "El temps d'execució s'ha aturat",
          unavailable: "Temps d'execució no disponible",
          configError: 'Error de configuració'
        },
        transport: {
          connecting: 'En connexió',
          connected: 'Connectat'
        },
        run: {
          idle: 'Inactiu',
          busy: 'Ocupat'
        }
      },
      message: {
        toolAction: 'Acció',
        observation: 'Observació',
        screenshot: 'Captura de pantalla'
      },
      overlay: {
        locked: "PicoClaw està controlant el dispositiu. L'entrada manual està en pausa."
      },
      install: {
        install: 'Instal·la PicoClaw',
        installing: 'Instal·lant PicoClaw',
        success: 'PicoClaw instal·lat correctament',
        failed: "No s'ha pogut instal·lar PicoClaw",
        uninstalling: "S'està desinstal·lant el temps d'execució...",
        uninstalled: "El temps d'execució s'ha desinstal·lat correctament.",
        uninstallFailed: 'La desinstal·lació ha fallat.',
        requiredTitle: 'PicoClaw no està instal·lat',
        requiredDescription: "Instal·leu PicoClaw abans d'iniciar el temps d'execució de PicoClaw.",
        progressDescription: "PicoClaw s'està baixant i instal·lant.",
        stages: {
          preparing: 'Preparant',
          downloading: "S'està baixant",
          extracting: 'Extracció',
          installing: 'Instal·lant',
          installed: 'Instal·lat',
          install_timeout: 'Temps esgotat',
          install_failed: 'Ha fallat'
        }
      },
      model: {
        requiredTitle: 'La configuració del model és necessària',
        requiredDescription: "Configura el model PicoClaw abans d'utilitzar el xat PicoClaw.",
        docsTitle: 'Guia de configuració',
        docsDesc: 'Models i protocols compatibles',
        menuLabel: 'Configura el model',
        modelIdentifier: 'Identificador del model',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Clau API',
        apiKeyPlaceholder: 'Introduïu la clau API del model',
        save: 'Desa',
        saving: 'Desa',
        saved: "S'ha desat la configuració del model",
        saveFailed: "No s'ha pogut desar la configuració del model",
        invalid: "Cal indicar l'identificador del model, l'API Base URL i la clau API"
      },
      uninstall: {
        menuLabel: 'Desinstal·la',
        confirmTitle: 'Desinstal·la PicoClaw',
        confirmContent:
          "Esteu segur que voleu desinstal·lar PicoClaw? Això suprimirà l'executable i tots els fitxers de configuració.",
        confirmOk: 'Desinstal·la',
        confirmCancel: 'Cancel·la'
      },
      history: {
        title: 'Historial',
        loading: 'Carregant sessions...',
        emptyTitle: 'Encara no hi ha historial',
        emptyDescription: 'Les sessions anteriors de PicoClaw apareixeran aquí.',
        loadFailed: "No s'ha pogut carregar l'historial de sessions",
        deleteFailed: "No s'ha pogut suprimir la sessió",
        deleteConfirmTitle: 'Suprimeix la sessió',
        deleteConfirmContent: 'Esteu segur que voleu suprimir "{{title}}"?',
        deleteConfirmOk: 'Esborra',
        deleteConfirmCancel: 'Cancel·la',
        messageCount_one: '{{count}} missatge',
        messageCount_other: '{{count}} missatges'
      },
      config: {
        startRuntime: 'Inici PicoClaw',
        stopRuntime: 'Atura PicoClaw'
      },
      start: {
        title: 'Inici PicoClaw',
        description: "Inicieu el temps d'execució per començar a utilitzar l'assistent PicoClaw."
      }
    },
    error: {
      title: 'Hi ha hagut un error',
      refresh: 'Actualitza'
    },
    fullscreen: {
      toggle: 'Pantalla completa'
    },
    menu: {
      collapse: 'Amaga menú',
      expand: 'Mostra menú'
    }
  }
};

export default ca;
