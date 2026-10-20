const ca = {
  translation: {
    head: {
      desktop: 'Escriptori remot',
      login: 'Inici de sessió',
      changePassword: 'Canviar contrasenya',
      terminal: 'Terminal',
      wifi: 'Wi-Fi',
      storage: 'Imatges i compartició de fitxers'
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
      },
      placeholderCurrentPassword: 'Contrasenya actual',
      passwordLength: 'La contrasenya ha de tenir entre 8 i 72 caràcters',
      invalidCurrentPassword: 'La contrasenya actual no és correcta'
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
      controlRegion: {
        title: 'Calibratge del ratolí',
        description:
          'Utilitzeu aquesta opció quan el dispositiu controlat tingui una resolució que no sigui 16:9 i el cursor estigui desalineat horitzontalment o verticalment.',
        off: 'Desactivat',
        auto: 'Automàtic',
        autoWarning:
          "El calibratge pot fallar quan l'aplicació de l'usuari tingui un fons completament negre.",
        manual: 'Manual',
        selectedResolution: "Resolució de l'àrea seleccionada",
        unused: 'No utilitzada',
        originalResolution: 'Resolució original',
        selectResolution: 'Selecciona la resolució original',
        addResolution: 'Afegeix una resolució personalitzada',
        add: 'Afegeix',
        duplicateResolution: 'Aquesta resolució ja existeix.',
        width: 'Amplada',
        height: 'Alçada',
        apply: 'Calcula i aplica',
        invalidResolution: 'Introduïu una resolució original vàlida quan el vídeo estigui llest.',
        select: "Selecciona l'àrea",
        clear: 'Restaura la detecció automàtica',
        saveFailed: "No s'ha pogut desar l'àrea d'entrada.",
        tooSmall: "L'àrea seleccionada és massa petita.",
        previewUnavailable: 'Vista prèvia no disponible',
        clearConfirm: 'Voleu restaurar la detecció automàtica de vores negres?',
        dragHint: "Arrossegueu per seleccionar l'àrea de l'escriptori remot",
        finish: 'Fet',
        confirm: 'Confirma',
        cancel: 'Cancel·la'
      },
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
      resetHdmi: 'Restablir HDMI',
      mixedH264: {
        title: 'Conflicte de flux H.264',
        description:
          "S'estan utilitzant H.264 Direct i H.264 WebRTC alhora. Això pot provocar esquinçament de pantalla o vídeo corrupte. Utilitzeu només un mode H.264."
      },
      webrtcConnectionFailed: {
        title: 'Error de connexió WebRTC',
        description: 'Comproveu la connexió de xarxa o canvieu el mode de vídeo.'
      },
      captureStatus: {
        hdmiError: 'Error a la pantalla HDMI',
        unsupportedResolution: 'La resolució actual no és compatible',
        retrieving: "S'està obtenint la pantalla...",
        changingResolution: "S'està canviant la resolució...",
        updateFailed: 'La pantalla no es pot actualitzar ara',
        videoError: 'Error de visualització de vídeo',
        noHdmi: "No s'ha detectat cap senyal HDMI",
        unavailable: 'La pantalla no es pot mostrar ara'
      }
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
    storage: {
      title: 'Imatges i compartició de fitxers',
      empty:
        "Encara no hi ha imatges. Puja una ISO o una IMG, o copia'n una al disc des de l'ordinador remot.",
      notAttached: 'Cap dispositiu muntat',
      attached: 'Muntat: {{name}}',
      eject: 'Expulsa',
      mount: 'Munta',
      mountMode: 'Mode de muntatge',
      mountModeDisk: 'Emmagatzematge massiu',
      mountModeCdrom: 'CD-ROM',
      openManager: 'Obre el gestor de fitxers',
      refresh: 'Actualitza',
      delete: 'Elimina',
      deleteTitle: 'Elimina el suport',
      deleteConfirm: 'Voleu eliminar {{name}}? Els fitxers que conté es perdran.',
      downloadImage: 'Baixa la imatge',
      typePartition: 'Fitxers compartits',
      volumeLabel: 'Disc extraïble',
      groups: {
        share: 'Compartició de fitxers',
        images: 'Imatges'
      },
      failed: "L'operació ha fallat",
      hidOnly: 'Mode només HID: el disc virtual no està disponible',
      disabled: 'El disc virtual està desactivat (Configuració - Dispositiu)',
      force: {
        title: 'Voleu recuperar el suport per la força?',
        desc: "L'ordinador remot encara fa servir aquest suport. Recuperar-lo torna a enumerar el dispositiu USB i pot perdre tot el que encara no ha escrit al disc.",
        menuHint:
          "L'ordinador remot fa servir aquest suport. Obriu el gestor de fitxers per recuperar-lo per la força."
      },
      tips: {
        title: 'Com pujar imatges',
        usb1: 'Connecta el NanoKVM al teu ordinador via USB.',
        usb2: "En aquesta pàgina, munta els fitxers compartits en mode d'emmagatzematge massiu.",
        usb3: "Obre el disc virtual i copia la imatge a l'arrel.",
        usb4: 'Expulsa el disc quan acabi la còpia: la imatge apareixerà llavors a la llista.',
        scp1: 'Comprova que el NanoKVM i el teu ordinador estan a la mateixa xarxa.',
        scp2: 'Obre un terminal i usa SCP per pujar la imatge al directori /data del NanoKVM.',
        scp3: 'Exemple: scp ruta-de-la-imatge root@ip-del-nanokvm:/data',
        tfCard: 'Targeta TF',
        tf1: 'Mètode disponible a sistemes GNU/Linux',
        tf2: 'Extreu la targeta TF del NanoKVM (versió FULL, cal obrir la carcassa).',
        tf3: "Introdueix la targeta en un lector i connecta'l a l'ordinador.",
        tf4: 'Copia la imatge al directori /data de la targeta.',
        tf5: 'Reintrodueix la targeta al NanoKVM.'
      },
      job: {
        running: "S'està processant {{name}}"
      },
      enableDisk: {
        title: 'Voleu activar el disc virtual?',
        desc: "Per muntar un suport cal el disc virtual, que ara està desactivat. Voleu activar-lo? El teclat i el ratolí de l'ordinador remot es desconnectaran un moment.",
        menuHint: 'El disc virtual està desactivat. Activeu-lo a Configuració - Dispositiu.'
      },
      add: {
        title: 'Afegeix un suport',
        upload: 'Puja una ISO o IMG',
        fromUrl: "Baixa des d'una URL",
        url: 'URL de la imatge',
        urlRequired: 'Introduïu una URL',
        onlyImages: 'Només es poden muntar fitxers .iso i .img',
        dropHint: 'Arrossegueu una ISO o IMG aquí, o feu clic per triar un fitxer',
        cdromOnlyIso: 'Un CD-ROM només pot contenir una imatge ISO 9660',
        uploadFailed: 'La pujada ha fallat',
        downloadFailed: 'La baixada ha fallat',
        uploading: "S'està pujant {{name}}",
        downloading: "S'està baixant {{name}}",
        done: '{{name}} està llest',
        checksumFailed: 'La imatge no coincideix amb la suma de verificació SHA-256.',
        blocked: "L'ordinador remot fa servir el disc",
        copyHint:
          "També podeu copiar una imatge a la partició de dades per SCP, o des de l'ordinador remot."
      },
      files: {
        selectMedium: 'Seleccioneu un suport per veure els fitxers que conté.',
        reasonAttached: "Aquest suport està connectat a l'ordinador remot.",
        reasonAttachedHint:
          "Expulseu-lo primer: l'ordinador remot ha d'alliberar el disc abans que se'n puguin llegir els fitxers.",
        reasonNotBrowsable: 'Aquest suport conté un sistema de fitxers que el gestor no pot obrir.',
        reasonNoLoop: 'Aquest dispositiu no pot muntar imatges de disc (sense suport de loop).',
        reasonISOImage:
          "Una imatge ISO 9660 no es pot navegar aquí. Es pot muntar igualment a l'ordinador remot.",
        empty: 'Aquesta carpeta és buida',
        noMatch: 'Cap fitxer coincideix amb la cerca.',
        free: '{{size}} lliures',
        search: 'Cerca en aquesta carpeta',
        sort: {
          name: 'Nom',
          size: 'Mida',
          type: 'Tipus',
          asc: 'Ascendent',
          desc: 'Descendent'
        },
        upload: 'Puja un fitxer al suport',
        deleteFolderTitle: 'Suprimeix la carpeta',
        deleteFolderConfirm:
          'Voleu suprimir la carpeta {{name}} i tot el que conté? Aquesta acció no es pot desfer.',
        uploading: "S'està pujant…",
        uploadFailed: 'La pujada ha fallat',
        download: 'Baixa',
        delete: 'Elimina',
        deleteTitle: 'Elimina el fitxer',
        deleteConfirm: 'Voleu eliminar {{name}} del suport?'
      },
      yes: 'Sí',
      no: 'No'
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
      disabled:
        "La partició de dades és només de lectura mentre l'ordinador remot la fa servir: no s'hi poden escriure imatges noves, però els fitxers existents es poden baixar.",
      sha256: 'SHA-256 (opcional)',
      sha256Placeholder: 'Introduïu una suma de verificació SHA-256 de 64 caràcters',
      invalidSHA256: 'SHA-256 ha de ser una cadena hexadecimal de 64 caràcters',
      cancel: 'Cancel·la',
      cancelFailed: 'No sha pogut cancel·lar la descàrrega'
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
      mcp: {
        title: 'Servei MCP',
        service: 'Control remot MCP',
        serviceDesc:
          'Permet que clients MCP de confiança controlin el teclat i el ratolí i capturin pantalles',
        securityWarning:
          'Qualsevol persona amb aquesta clau API pot controlar l’amfitrió remot i veure’n la pantalla. Utilitzeu HTTPS i activeu-lo només en xarxes de confiança.',
        endpoint: 'Punt de connexió',
        apiKey: 'Clau API',
        regenerateConfirmTitle: 'Voleu tornar a generar la clau API MCP?',
        regenerateConfirmDesc: 'La clau actual deixarà de funcionar immediatament.',
        enableConfirmTitle: 'Voleu activar el control MCP extern?',
        enableConfirmDesc:
          'En activar MCP, PicoClaw s’aturarà i es tancarà qualsevol sessió activa de PicoClaw.',
        failed: 'L’operació MCP ha fallat',
        copyFailed: 'La còpia ha fallat. Copieu-ho manualment.',
        okBtn: 'Confirma',
        cancelBtn: 'Cancel·la'
      },
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
          keyboardLedStatus: 'Indicadors de bloqueig del teclat',
          keyboardLedStatusDesc:
            'Mostra l’estat de Bloq Num, Bloq Maj i Bloq Despl de l’ordinador remot',
          icons: 'Icones del submenú',
          iconsDesc: 'Mostra les icones del submenú a la barra de menús'
        }
      },
      keyboardLedStatus: {
        groupLabel: 'Estat de bloqueig del teclat remot',
        indicatorLabel: '{{label}}: {{state}}',
        numLock: 'Bloq Num',
        numLockShort: 'Num',
        capsLock: 'Bloq Maj',
        capsLockShort: 'Maj',
        scrollLock: 'Bloq Despl',
        scrollLockShort: 'Despl',
        on: 'Activat',
        off: 'Desactivat',
        unknown: 'Desconegut'
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
          description: 'Activa la sortida HDMI',
          idleTimeoutTitle: "Temps d'espera d'inactivitat de captura",
          idleTimeoutDescription:
            'Atura la captura HDMI després de no detectar espectadors actius durant',
          minutes: 'min'
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
        cancelBtn: 'No',
        diskLocked: 'Desactivat mentre hi ha una imatge muntada (activar-lo cancel·la el muntatge)',
        diskCancelMount:
          "Activar el disc virtual cancel·la la imatge muntada i interromp una descàrrega o pujada d'imatge en curs. Voleu continuar?",
        diskBreakDownload:
          "Activar el disc virtual interromp la descàrrega d'imatges. Voleu continuar?",
        attention: 'Atenció'
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
        ethernet: {
          title: "IPv4 Ethernet",
          description: "Configureu la connexió IPv4 d'Ethernet.",
          dhcp: "DHCP",
          static: "Estàtica",
          ipv4: "IPv4",
          dhcpDescription: "Obteniu automàticament una adreça IP mitjançant DHCP.",
          staticDescription: "Configureu manualment l'adreça IP.",
          ipAddress: "Adreça IP",
          addressPlaceholder: "192.168.10.32",
          subnetMask: "Màscara de subxarxa",
          subnetMaskPlaceholder: "255.255.255.0",
          gateway: "Passarel·la",
          gatewayPlaceholder: "192.168.10.1",
          invalid: "Adreça IP no vàlida",
          save: "Desa",
          unsaved: "Canvis no desats",
          savedStatic: "S'ha desat l'adreça IP estàtica {{address}}.",
          savedDhcp: "S'ha desat la configuració DHCP.",
          saveFailed: "No s'ha pogut desar la configuració.",
          loadFailed: "No s'ha pogut carregar la configuració."
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
        customServer: {
          title: 'Servidor d’actualitzacions personalitzat',
          desc: 'Cerca i baixa actualitzacions en línia des d’un servidor especificat',
          invalidUrl:
            'Introduïu un directori de servidor HTTP o HTTPS vàlid, sense paràmetres de consulta, fragments ni latest.json.',
          loadFailed: 'No s’ha pogut carregar la configuració del servidor d’actualitzacions.',
          saveFailed: 'No s’ha pogut desar la configuració del servidor d’actualitzacions.',
          saved: 'S’ha desat la configuració del servidor d’actualitzacions.',
          save: 'Desa',
          confirmTitle: 'Voleu utilitzar un servidor d’actualitzacions personalitzat?',
          confirmDesc:
            'SHA-512 només comprova que el paquet coincideixi amb el manifest proporcionat per aquest servidor. Això no demostra que el paquet sigui una versió oficial de NanoKVM. Un servidor defectuós o maliciós pot deixar el dispositiu inutilitzable, provocar la pèrdua de dades o comprometre el sistema.',
          confirm: 'Utilitza’l igualment',
          previewDisabled:
            'Les actualitzacions de previsualització no estan disponibles mentre hi hagi activat un servidor d’actualitzacions personalitzat.'
        },
        offline: {
          title: 'Actualitzacions fora de línia',
          desc: "Actualització mitjançant el paquet d'instal·lació local",
          upload: 'Puja',
          checksumPlaceholder: 'Suma de verificació SHA-256 (opcional)',
          invalidChecksum:
            'La suma de verificació SHA-256 ha de contenir 64 caràcters hexadecimals.',
          checksumMismatch:
            'La verificació SHA-256 ha fallat. És possible que el paquet estigui malmès.',
          invalidName: 'Format de nom de fitxer no vàlid. Baixeu-lo des de les versions de GitHub.',
          updateFailed: 'Error en actualitzar. Torna-ho a intentar.'
        }
      },
      account: {
        title: 'Compte',
        webAccount: 'Nom del compte web',
        password: 'Contrasenya',
        updateBtn: 'Canvia',
        logoutBtn: 'Tanca sessió',
        logoutDesc: 'Segur que vols tancar sessió?',
        okBtn: 'Sí',
        cancelBtn: 'No',
        role: 'Rol',
        roles: {
          admin: 'Administrador',
          user: 'Usuari'
        },
        users: {
          title: 'Usuaris',
          create: 'Crea un usuari',
          enabled: 'Activat',
          disabled: 'Desactivat',
          deviceOwner: 'Propietari del dispositiu',
          resetPassword: 'Restableix la contrasenya',
          delete: 'Elimina',
          deleteConfirm: 'Voleu eliminar aquest usuari i revocar totes les seves sessions?',
          created: 'Usuari creat',
          deleted: 'Usuari eliminat',
          passwordUpdated: 'Contrasenya actualitzada',
          loadFailed: "No s'han pogut carregar els usuaris",
          saveFailed: "No s'ha pogut desar l'usuari",
          deleteFailed: "No s'ha pogut eliminar l'usuari"
        }
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
        runtimeStopFailed: "No s'ha pogut aturar el temps d'execució de PicoClaw",
        controlSwitchedToMCP: 'El control ha canviat al servei MCP extern'
      },
      connection: {
        runtime: {
          checking: 'Comprovació',
          restoring: 'Restoring PicoClaw',
          ready: "Temps d'execució a punt",
          stopped: "El temps d'execució s'ha aturat",
          blockedByMCP: 'El control MCP extern està actiu',
          readyBlockedByMCP:
            'The runtime is running, but external MCP currently controls device input.',
          readyWithoutControl:
            'The runtime is running. Grant PicoClaw device control before reconnecting.',
          unavailable: "Temps d'execució no disponible",
          configError: 'Error de configuració'
        },
        transport: {
          connecting: 'En connexió',
          connected: 'Connectat',
          disconnected: 'Disconnected',
          reconnect: 'Reconnect',
          reconnectDescription: 'Reconnect to the running PicoClaw session.',
          reconnectBlocked: 'PicoClaw needs device control before reconnecting.'
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
      control: {
        picoclaw: 'Control del dispositiu: PicoClaw',
        picoclawDescription: 'PicoClaw can write keyboard and mouse input. Manual input may pause.',
        mcp: 'Control del dispositiu: MCP extern',
        mcpDescription: 'External MCP can write to the device. PicoClaw will not take over input.',
        off: 'Control del dispositiu: desactivat',
        offDescription:
          'AI will not write keyboard or mouse input. Manual control remains available.',
        transitioning: 'Device control: switching',
        transitioningDescription: 'Device control is syncing. Please wait.',
        grant: 'Concedeix control',
        release: 'Allibera',
        releasing: 'Releasing...',
        switching: 'Switching...',
        releasingLabel: 'Device control: releasing',
        releasingDescription:
          'Device control is being returned. PicoClaw has stopped current writes.',
        granted: 'Control de PicoClaw concedit',
        released: 'Control de PicoClaw alliberat',
        grantFailed: "No s'ha pogut concedir el control a PicoClaw",
        releaseFailed: "No s'ha pogut alliberar el control de PicoClaw",
        grantConfirmTitle: 'Vols canviar el control del dispositiu a PicoClaw?',
        grantConfirmDesc: "Les escriptures del dispositiu MCP extern s'interrompran."
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
          verifying: 'Verificant',
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
        messageCount_other: '{{count}} missatges',
        messageCount: '{{count}} missatges'
      },
      config: {
        startRuntime: 'Inici PicoClaw',
        stopRuntime: 'Atura PicoClaw'
      },
      start: {
        enableConfirmTitle: 'Voleu canviar el control a PicoClaw?',
        enableConfirmDesc: 'En iniciar PicoClaw es desactivarà el servei MCP extern.',
        enableConfirmOk: 'Inicia PicoClaw',
        enableConfirmCancel: 'Cancel·la',
        title: 'Inici PicoClaw',
        description: "Inicieu el temps d'execució per començar a utilitzar l'assistent PicoClaw.",
        switchFromMCP: 'Switch to PicoClaw and start',
        takeoverAndStart: 'Take over and start'
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
