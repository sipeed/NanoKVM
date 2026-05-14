const es = {
  translation: {
    head: {
      desktop: 'Escritorio remoto',
      login: 'Inicio de sesión',
      changePassword: 'Cambiar contraseña',
      terminal: 'Consola',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Iniciar sesión',
      placeholderUsername: 'Introduce tu nombre de usuario',
      placeholderPassword: 'Introduce tu contraseña',
      placeholderPassword2: 'Introduce tu contraseña de nuevo',
      noEmptyUsername: 'El nombre de usuario no puede estar vacío',
      noEmptyPassword: 'La contraseña no puede estar vacía',
      noAccount:
        'No se ha encontrado la cuenta. Por favor, recarga la página o recupera tu contraseña.',
      invalidUser: 'Nombre de usuario o contraseña incorrectos',
      locked: 'Demasiados inicios de sesión, inténtalo de nuevo más tarde',
      globalLocked: 'Sistema bajo protección, inténtelo nuevamente más tarde',
      error: 'Error inesperado',
      changePassword: 'Cambiar contraseña',
      changePasswordDesc:
        'Para la seguridad de su dispositivo, por favor, modifique la contraseña de inicio de sesión en la web.',
      differentPassword: 'Las contraseñas no coinciden',
      illegalUsername: 'El  nombre de usuario contiene caracteres no permitidos',
      illegalPassword: 'La contraseña contiene caracteres no permitidos',
      forgetPassword: 'Contraseña olvidada',
      ok: 'Aceptar',
      cancel: 'Cancelar',
      loginButtonText: 'Iniciar sesión',
      tips: {
        reset1:
          'Para restablecer las contraseñas, mantén pulsado el botón BOOT del NanoKVM durante 10 segundos.',
        reset2: 'Para ver los pasos detallados, consulta este documento:',
        reset3: 'Cuenta predeterminada de la interfaz web:',
        reset4: 'Cuenta predeterminada de SSH:',
        change1: 'Ten en cuenta que esta acción cambiará las siguientes contraseñas:',
        change2: 'Contraseña de acceso web',
        change3: 'Contraseña root del sistema (contraseña de acceso por SSH)',
        change4: 'Para restablecer las contraseñas, mantén pulsado el botón BOOT del NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configura el Wi-Fi para el NanoKVM',
      success: 'Comprueba el estado de red del NanoKVM y accede a la nueva dirección IP.',
      failed: 'La operación ha fallado, vuelve a intentarlo.',
      invalidMode:
        'El modo actual no admite la configuración de red. Vaya a su dispositivo y habilite el modo de configuración Wi-Fi.',
      confirmBtn: 'Aceptar',
      finishBtn: 'Finalizado',
      ap: {
        authTitle: 'Autenticación requerida',
        authDescription: 'Por favor ingrese la contraseña AP para continuar',
        authFailed: 'Contraseña AP no válida',
        passPlaceholder: 'AP contraseña',
        verifyBtn: 'Verificar'
      }
    },
    screen: {
      scale: 'Escala',
      title: 'Pantalla',
      video: 'Modo de vídeo',
      videoDirectTips: 'Habilita HTTPS en "Ajustes > Dispositivo" para usar este modo',
      resolution: 'Resolución',
      auto: 'Automático',
      autoTips:
        'En determinadas resoluciones pueden producirse rasgado de imagen (tearing) o desplazamiento del ratón. Prueba a ajustar la resolución del host remoto o desactiva el modo automático.',
      fps: 'FPS',
      customizeFps: 'Personalizar',
      quality: 'Calidad',
      qualityLossless: 'Sin pérdida',
      qualityHigh: 'Alto',
      qualityMedium: 'Medio',
      qualityLow: 'Bajo',
      frameDetect: 'Detectar fotogramas',
      frameDetectTip:
        'Calcula la diferencia entre fotogramas. Para de transmitir vídeo cuando no se detectan cambios en la pantalla del host remoto.',
      resetHdmi: 'Reiniciar HDMI'
    },
    keyboard: {
      title: 'Teclado',
      paste: 'Pegar',
      tips: 'Sólo están soportadas las letras y símbolos estándar del teclado',
      placeholder: 'Por favor, introduce el texto',
      submit: 'Enviar',
      virtual: 'Teclado virtual',
      readClipboard: 'Leer del portapapeles',
      clipboardPermissionDenied:
        'Permiso de portapapeles denegado. Por favor, permite el acceso al portapapeles en tu navegador.',
      clipboardReadError: 'Error al leer del portapapeles',
      dropdownEnglish: 'Inglés',
      dropdownGerman: 'Alemán',
      dropdownFrench: 'Francés',
      dropdownRussian: 'ruso',
      shortcut: {
        title: 'Atajos',
        custom: 'Personalizado',
        capture: 'Haga clic aquí para capturar el acceso directo',
        clear: 'Borrar',
        save: 'Guardar',
        captureTips:
          'Capturar teclas del sistema (como la tecla Windows) requiere permiso de pantalla completa.',
        enterFullScreen: 'Alternar el modo de pantalla completa.'
      },
      leaderKey: {
        title: 'Tecla líder',
        desc: 'Omite las restricciones del navegador y envía accesos directos al sistema directamente al host remoto.',
        howToUse: 'Cómo utilizar',
        simultaneous: {
          title: 'Modo Simultáneo',
          desc1: 'Mantenga pulsada la tecla líder y luego pulse el atajo.',
          desc2: 'Intuitivo, pero puede entrar en conflicto con los atajos del sistema.'
        },
        sequential: {
          title: 'Modo Secuencial',
          desc1:
            'Pulse la tecla líder → pulse el atajo en secuencia → vuelva a pulsar la tecla líder.',
          desc2: 'Requiere más pasos, pero evita por completo conflictos del sistema.'
        },
        enable: 'Habilitar tecla líder',
        tip: 'Al asignarse como tecla líder, esta tecla funciona únicamente como activador de atajos y pierde su comportamiento predeterminado.',
        placeholder: 'Pulse la tecla líder',
        shiftRight: 'Shift derecho',
        ctrlRight: 'Ctrl derecho',
        metaRight: 'Win derecho',
        submit: 'Enviar',
        recorder: {
          rec: 'REC',
          activate: 'Activar teclas',
          input: 'Por favor presione el atajo...'
        }
      }
    },
    mouse: {
      title: 'Ratón',
      cursor: 'Estilo de cursor',
      default: 'Cursor por defecto',
      pointer: 'Cursor de puntero',
      cell: 'Cursor de celda',
      text: 'Cursor de texto',
      grab: 'Cursor de agarre',
      hide: 'Ocultar cursor',
      mode: 'Modo de ratón',
      absolute: 'Modo absoluto',
      relative: 'Modo relativo',
      direction: 'Dirección de la rueda de desplazamiento',
      scrollUp: 'Desplazarse hacia arriba',
      scrollDown: 'Desplácese hacia abajo',
      speed: 'Velocidad de la rueda de desplazamiento',
      fast: 'Rápida',
      slow: 'Lenta',
      requestPointer:
        'Usando modo relativo. Por favor, haz clic en el escritorio para obtener el cursor del ratón.',
      resetHid: 'Restablecer HID',
      hidOnly: {
        title: 'Modo solo HID',
        desc: 'Si tu ratón y teclado dejan de responder y restablecer el HID no ayuda, podría ser un problema de compatibilidad entre el NanoKVM y el dispositivo. Prueba a habilitar el modo sólo HID para mejorar la compatibilidad.',
        tip1: 'Habilitar el modo sólo HID desmontará el disco virtual y la red virtual',
        tip2: 'En modo sólo HID, el montaje de imágenes está deshabilitado',
        tip3: 'El NanoKVM se reiniciará automáticamente después de cambiar de modo',
        enable: 'Habilitar modo sólo HID',
        disable: 'Desactivar modo sólo HID'
      }
    },
    image: {
      title: 'Imágenes',
      loading: 'Cargando...',
      empty: 'No se ha encontrado nada',
      mountMode: 'Modo de montaje',
      mountFailed: 'Fallo al montar',
      mountDesc:
        'En algunos sistemas, es necesario expulsar el disco virtual del host remoto antes de montar una imagen.',
      unmountFailed: 'Fallo al desmontar',
      unmountDesc:
        'En algunos sistemas, es necesario expulsar manualmente el disco virtual desde el host remoto antes de desmontar la imagen.',
      refresh: 'Actualizar la lista de imágenes',
      attention: 'Atención',
      deleteConfirm: '¿Estás seguro de que deseas eliminar esta imagen?',
      okBtn: 'Sí',
      cancelBtn: 'No',
      tips: {
        title: 'Cómo subir imágenes',
        usb1: 'Conecta el NanoKVM a tu computadora mediante USB.',
        usb2: 'Asegúrate de que el disco virtual esté montado (Ajustes - Disco Virtual).',
        usb3: 'Abre el disco virtual en tu computadora y copia el archivo de imagen en el directorio raíz del disco virtual.',
        scp1: 'Asegúrate de que el NanoKVM y tu computadora estén en la misma red local.',
        scp2: 'Abre una terminal en tu computadora y usa el comando SCP para subir el archivo de imagen al directorio /data en el NanoKVM.',
        scp3: 'Ejemplo: scp tu-ruta-de-imagen root@tu-ip-del-nanokvm:/data',
        tfCard: 'Tarjeta SD',
        tf1: 'Este método es compatible con el sistema Linux',
        tf2: 'Obtén la tarjeta SD del NanoKVM (para la versión FULL, desmonta la carcasa primero).',
        tf3: 'Inserta la tarjeta SD en un lector de tarjetas y conéctalo a tu computadora.',
        tf4: 'Copia el archivo de imagen en el directorio /data de la tarjeta SD.',
        tf5: 'Inserta la tarjeta SD en el NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Subir',
      run: 'Ejecutar',
      runBackground: 'Ejecutar en segundo plano',
      runFailed: 'Ejecución fallida',
      attention: 'Atención',
      delDesc: '¿Estás seguro de que deseas eliminar este archivo?',
      confirm: 'Sí',
      cancel: 'No',
      delete: 'Eliminar',
      close: 'Cerrar'
    },
    terminal: {
      title: 'Consola',
      nanokvm: 'Consola del NanoKVM',
      serial: 'Consola del Puerto Serie',
      serialPort: 'Puerto Serie',
      serialPortPlaceholder: 'Por favor, introduce el puerto serie',
      baudrate: 'Tasa de baudios',
      parity: 'Paridad',
      parityNone: 'Ninguna',
      parityEven: 'Par',
      parityOdd: 'Impar',
      flowControl: 'Control de flujo',
      flowControlNone: 'Ninguno',
      flowControlSoft: 'Software',
      flowControlHard: 'Hardware',
      dataBits: 'Bits de datos',
      stopBits: 'Bits de parada',
      confirm: 'Confirmar'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Enviando comando...',
      sent: 'Comando enviado',
      input: 'Por favor, introduce la dirección MAC',
      ok: 'Aceptar'
    },
    download: {
      title: 'Descargador de imágenes',
      input: 'Por favor, introduce la URL de una imagen remota',
      ok: 'Aceptar',
      disabled: 'La partición /data es de sólo lectura, no se puede descargar la imagen',
      uploadbox: 'Suelte el archivo aquí o haga clic para seleccionar',
      inputfile: 'Por favor ingrese el archivo de imagen',
      NoISO: 'Sin ISO'
    },
    power: {
      title: 'Encender / Apagar',
      showConfirm: 'Confirmación',
      showConfirmTip: 'Las operaciones de encendido requieren confirmación adicional',
      reset: 'Reiniciar',
      power: 'Encender / Apagar',
      powerShort: 'Encender / Apagar (pulsación corta)',
      powerLong: 'Encendido/Apagado (pulsación larga)',
      resetConfirm: '¿Desea proceder con la operación de reinicio?',
      powerConfirm: '¿Desea proceder con la operación de encendido?',
      okBtn: 'Sí',
      cancelBtn: 'No'
    },
    settings: {
      title: 'Ajustes',
      about: {
        title: 'Sobre NanoKVM',
        information: 'Información',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Versión de la aplicación',
        applicationTip: 'Versión de la aplicación web NanoKVM',
        image: 'Versión de la imagen',
        imageTip: 'Versión de la imagen del sistema NanoKVM',
        deviceKey: 'Clave del dispositivo',
        community: 'Comunidad',
        hostname: 'Nombre del host',
        hostnameUpdated: 'Nombre del host actualizado. Reinicia para aplicar.',
        ipType: {
          Wired: 'Cableada',
          Wireless: 'Inalámbrica',
          Other: 'Otra'
        }
      },
      appearance: {
        title: 'Apariencia',
        display: 'Pantalla',
        language: 'Idioma',
        languageDesc: 'Seleccionar el idioma de la interfaz',
        webTitle: 'Título web',
        webTitleDesc: 'Personaliza el título de la página web',
        menuBar: {
          title: 'Barra de menú',
          mode: 'Modo de visualización',
          modeDesc: 'Mostrar barra de menú en la pantalla',
          modeOff: 'Apagado',
          modeAuto: 'Ocultar automáticamente',
          modeAlways: 'Siempre visible',
          icons: 'Iconos del submenú',
          iconsDesc: 'Mostrar iconos de submenú en la barra de menú'
        }
      },
      device: {
        title: 'Dispositivo',
        oled: {
          title: 'OLED',
          description: 'La pantalla OLED entra en reposo automáticamente',
          0: 'Nunca',
          15: '15 s',
          30: '30 s',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 hora'
        },
        ssh: {
          description: 'Habilitar acceso remoto SSH',
          tip: 'Establece una contraseña segura antes de habilitar (Cuenta - Cambiar contraseña)'
        },
        advanced: 'Ajustes avanzados',
        swap: {
          title: 'Memoria Swap',
          disable: 'Desactivar',
          description: 'Establece el tamaño del archivo swap',
          tip: 'Habilitar esta función podría acortar la vida útil de tu tarjeta SD.'
        },
        mouseJiggler: {
          title: 'Mouse Jiggler',
          description: 'Evitar que el host remoto entre en reposo',
          disable: 'Desactivar',
          absolute: 'Modo absoluto',
          relative: 'Modo relativo'
        },
        mdns: {
          description: 'Habilitar servicio de descubrimiento mDNS',
          tip: 'Desactívalo si no es necesario'
        },
        hdmi: {
          description: 'Habilitar salida HDMI/monitor'
        },
        autostart: {
          title: 'Configuración de scripts de inicio automático',
          description: 'Administrar scripts que se ejecutan automáticamente al iniciar el sistema',
          new: 'Nuevo',
          deleteConfirm: '¿Estás seguro de que deseas eliminar este archivo?',
          yes: 'Sí',
          no: 'No',
          scriptName: 'Nombre del script de inicio automático',
          scriptContent: 'Contenido del script de inicio automático',
          settings: 'Ajustes'
        },
        hidOnly: 'Modo sólo HID',
        hidOnlyDesc:
          'Dejar de emular dispositivos virtuales y conservar solo el control básico HID',
        disk: 'Disco Virtual',
        diskDesc: 'Montar disco virtual en el host remoto',
        network: 'Red Virtual',
        networkDesc: 'Montar tarjeta de red virtual en el host remoto',
        reboot: 'Reiniciar',
        rebootDesc: '¿Estás seguro de que deseas reiniciar el NanoKVM?',
        okBtn: 'Sí',
        cancelBtn: 'No'
      },
      network: {
        title: 'Red',
        wifi: {
          title: 'Wi-Fi',
          description: 'Configura el Wi-Fi',
          apMode: 'El modo AP está activado; conéctate al Wi-Fi escaneando el código QR',
          connect: 'Conectar Wi-Fi',
          connectDesc1: 'Introduce el SSID de la red y la contraseña',
          connectDesc2: 'Introduce la contraseña para unirte a esta red',
          disconnect: '¿Seguro que quieres desconectar la red?',
          failed: 'Error de conexión, inténtalo de nuevo.',
          ssid: 'Nombre',
          password: 'Contraseña',
          joinBtn: 'Unirse',
          confirmBtn: 'Aceptar',
          cancelBtn: 'Cancelar'
        },
        tls: {
          description: 'Habilitar protocolo HTTPS',
          tip: 'Aviso: Usar HTTPS puede aumentar la latencia, especialmente en modo de vídeo MJPEG.'
        },
        dns: {
          title: 'DNS',
          description: 'Configura los servidores DNS para NanoKVM',
          mode: 'Modo',
          dhcp: 'DHCP',
          manual: 'Manual',
          add: 'Añadir DNS',
          save: 'Guardar',
          invalid: 'Introduce una dirección IP válida',
          noDhcp: 'No hay DNS DHCP disponible actualmente',
          saved: 'Configuración DNS guardada',
          saveFailed: 'No se pudo guardar la configuración DNS',
          unsaved: 'Cambios sin guardar',
          maxServers: 'Se permiten como máximo {{count}} servidores DNS',
          dnsServers: 'Servidores DNS',
          dhcpServersDescription: 'Los servidores DNS se obtienen automáticamente por DHCP',
          manualServersDescription: 'Los servidores DNS se pueden editar manualmente',
          networkDetails: 'Detalles de red',
          interface: 'Interfaz',
          ipAddress: 'Dirección IP',
          subnetMask: 'Máscara de subred',
          router: 'Router',
          none: 'Ninguno'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Optimización de memoria',
          tip: 'Cuando el uso de memoria supera el límite, la recolección de basura se ejecuta de forma más agresiva para intentar liberar memoria. Es necesario reiniciar Tailscale para que el cambio surta efecto.'
        },
        swap: {
          title: 'Memoria Swap',
          tip: 'Si los problemas persisten después de habilitar la optimización de memoria, prueba a activar la memoria swap. Esto establece el tamaño del archivo swap en 256 MB por defecto, que se puede ajustar en "Ajustes > Dispositivo".'
        },
        restart: '¿Seguro que deseas reiniciar Tailscale?',
        stop: '¿Seguro que deseas detener Tailscale?',
        stopDesc: 'Cerrar sesión en Tailscale y desactivar su inicio automático al arrancar.',
        loading: 'Cargando...',
        notInstall: '¡Tailscale no encontrado! Por favor, instálalo.',
        install: 'Instalar',
        installing: 'Instalando',
        failed: 'La instalación falló',
        retry:
          'Por favor, actualiza la página e inténtalo de nuevo. O intenta instalarlo manualmente',
        download: 'Descargar el',
        package: 'paquete de instalación',
        unzip: 'y descomprimirlo',
        upTailscale: 'Sube tailscale al directorio /usr/bin/ del NanoKVM',
        upTailscaled: 'Sube tailscaled al directorio /usr/sbin/ del NanoKVM',
        refresh: 'Actualizar la página actual',
        notRunning: 'Tailscale no se está ejecutando. Por favor, inícialo para continuar.',
        run: 'Iniciar',
        notLogin:
          'El dispositivo aún no ha sido vinculado. Por favor, inicia sesión y vincula este dispositivo a tu cuenta.',
        urlPeriod: 'Esta URL es válida por 10 minutos',
        login: 'Iniciar sesión',
        loginSuccess: 'Inicio de sesión exitoso',
        enable: 'Habilitar Tailscale',
        deviceName: 'Nombre del dispositivo',
        deviceIP: 'IP del dispositivo',
        account: 'Cuenta',
        logout: 'Cerrar sesión',
        logoutDesc: '¿Estás seguro de que deseas cerrar sesión?',
        uninstall: 'Desinstalar Tailscale',
        uninstallDesc: '¿Estás seguro de que deseas desinstalar Tailscale?',
        okBtn: 'Sí',
        cancelBtn: 'No'
      },
      update: {
        title: 'Buscar actualizaciones',
        queryFailed: 'Error al obtener la versión',
        updateFailed: 'La actualización falló. Por favor, inténtalo de nuevo.',
        isLatest: 'Ya tienes la última versión.',
        available: 'Hay una actualización disponible. ¿Estás seguro de que quieres actualizar?',
        updating: 'Actualización iniciada. Por favor, espera...',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        preview: 'Vista previa de actualizaciones',
        previewDesc: 'Accede anticipadamente a nuevas funciones y mejoras',
        previewTip:
          'Ten en cuenta que las versiones de vista previa pueden contener errores o funcionalidades incompletas',
        offline: {
          title: 'Actualizaciones sin conexión',
          desc: 'Actualización a través del paquete de instalación local',
          upload: 'Subir',
          invalidName:
            'Formato de nombre de archivo no válido. Descargue desde las versiones de GitHub.',
          updateFailed: 'La actualización falló. Por favor, inténtalo de nuevo.'
        }
      },
      users: {
        title: 'Gestión de usuarios',
        addUser: 'Agregar usuario',
        colUsername: 'Nombre de usuario',
        colRole: 'Rol',
        colEnabled: 'Activo',
        colActions: 'Acciones',
        rolesTitle: 'Resumen de roles',
        roleAdmin: 'Acceso completo + gestión de usuarios',
        roleOperator: 'Uso del KVM: stream, teclado, ratón, botones de encendido',
        roleViewer: 'Solo visualización del stream',
        changePassword: 'Cambiar contraseña',
        newPassword: 'Nueva contraseña',
        confirmPassword: 'Confirmar contraseña',
        pwdMismatch: 'Las contraseñas no coinciden',
        pwdSuccess: 'Contraseña cambiada con éxito',
        pwdFailed: 'Error al cambiar la contraseña',
        password: 'Contraseña',
        delete: 'Eliminar',
        deleteConfirm: '¿Está seguro de que desea eliminar este usuario?',
        createSuccess: 'Usuario creado',
        createFailed: 'Error al crear el usuario',
        deleteSuccess: 'Usuario eliminado',
        deleteFailed: 'Error al eliminar',
        updateSuccess: 'Actualizado',
        updateFailed: 'Error de actualización',
        loadFailed: 'Error al cargar usuarios',
        usernameRequired: 'Ingrese el nombre de usuario',
        passwordRequired: 'Ingrese la contraseña',
        okBtn: 'Aceptar',
        cancelBtn: 'Cancelar'
      },
      account: {
        title: 'Cuenta',
        webAccount: 'Nombre de la cuenta web',
        password: 'Contraseña',
        updateBtn: 'Actualizar',
        logoutBtn: 'Cerrar sesión',
        logoutDesc: '¿Estás seguro de que deseas cerrar sesión?',
        okBtn: 'Sí',
        cancelBtn: 'No'
      }
    },
    picoclaw: {
      title: 'PicoClaw Asistente',
      empty: 'Abre el panel e inicia una tarea para comenzar.',
      inputPlaceholder: 'Describe lo que quieres que haga el PicoClaw',
      newConversation: 'Nueva conversación',
      processing: 'Procesando...',
      agent: {
        defaultTitle: 'Asistente general',
        defaultDescription: 'Ayuda general para chat, búsqueda y espacio de trabajo.',
        kvmTitle: 'Control remoto',
        kvmDescription: 'Opere el host remoto a través de NanoKVM.',
        switched: 'Rol de agente cambiado',
        switchFailed: 'No se pudo cambiar la función del agente'
      },
      send: 'Enviar',
      cancel: 'Cancelar',
      status: {
        connecting: 'Conectándose a la puerta de enlace...',
        connected: 'Sesión de PicoClaw conectada',
        disconnected: 'Sesión de PicoClaw cerrada',
        stopped: 'Solicitud de detención enviada',
        runtimeStarted: 'Tiempo de ejecución de PicoClaw iniciado',
        runtimeStartFailed: 'Error al iniciar el tiempo de ejecución de PicoClaw',
        runtimeStopped: 'Tiempo de ejecución de PicoClaw detenido',
        runtimeStopFailed: 'No se pudo detener el tiempo de ejecución de PicoClaw'
      },
      connection: {
        runtime: {
          checking: 'Comprobando',
          ready: 'Tiempo de ejecución listo',
          stopped: 'Tiempo de ejecución detenido',
          unavailable: 'Tiempo de ejecución no disponible',
          configError: 'Error de configuración'
        },
        transport: {
          connecting: 'Conectando',
          connected: 'Conectado'
        },
        run: {
          idle: 'Inactivo',
          busy: 'Ocupado'
        }
      },
      message: {
        toolAction: 'Acción',
        observation: 'Observación',
        screenshot: 'Captura de pantalla'
      },
      overlay: {
        locked: 'PicoClaw está controlando el dispositivo. La entrada manual está en pausa.'
      },
      install: {
        install: 'Instalar PicoClaw',
        installing: 'Instalando PicoClaw',
        success: 'PicoClaw instalado correctamente',
        failed: 'Error al instalar PicoClaw',
        uninstalling: 'Desinstalando el tiempo de ejecución...',
        uninstalled: 'El tiempo de ejecución se desinstaló exitosamente.',
        uninstallFailed: 'Falló la desinstalación.',
        requiredTitle: 'PicoClaw no está instalado',
        requiredDescription:
          'Instala PicoClaw antes de iniciar el tiempo de ejecución de PicoClaw.',
        progressDescription: 'PicoClaw se está descargando e instalando.',
        stages: {
          preparing: 'Preparando',
          downloading: 'Descargando',
          extracting: 'Extrayendo',
          installing: 'Instalando',
          installed: 'Instalado',
          install_timeout: 'Tiempo de espera agotado',
          install_failed: 'Falló'
        }
      },
      model: {
        requiredTitle: 'Se requiere configuración del modelo',
        requiredDescription: 'Configure el modelo PicoClaw antes de usar el chat PicoClaw.',
        docsTitle: 'Guía de configuración',
        docsDesc: 'Modelos y protocolos compatibles',
        menuLabel: 'Configurar modelo',
        modelIdentifier: 'Identificador de modelo',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Clave API',
        apiKeyPlaceholder: 'Introduzca la clave API del modelo',
        save: 'Guardar',
        saving: 'Guardando',
        saved: 'Configuración del modelo guardada',
        saveFailed: 'No se pudo guardar la configuración del modelo',
        invalid: 'Se requieren el identificador del modelo, API Base URL y la clave API'
      },
      uninstall: {
        menuLabel: 'Desinstalar',
        confirmTitle: 'Desinstalar PicoClaw',
        confirmContent:
          '¿Está seguro de que desea desinstalar PicoClaw? Esto eliminará el ejecutable y todos los archivos de configuración.',
        confirmOk: 'Desinstalar',
        confirmCancel: 'Cancelar'
      },
      history: {
        title: 'Historial',
        loading: 'Cargando sesiones...',
        emptyTitle: 'Aún no hay historial',
        emptyDescription: 'Las sesiones PicoClaw anteriores aparecerán aquí.',
        loadFailed: 'Error al cargar el historial de sesiones',
        deleteFailed: 'No se pudo eliminar la sesión',
        deleteConfirmTitle: 'Eliminar sesión',
        deleteConfirmContent: '¿Está seguro de que desea eliminar "{{title}}"?',
        deleteConfirmOk: 'Eliminar',
        deleteConfirmCancel: 'Cancelar',
        messageCount_one: '{{count}} mensaje',
        messageCount_other: '{{count}} mensajes'
      },
      config: {
        startRuntime: 'Iniciar PicoClaw',
        stopRuntime: 'Detener PicoClaw'
      },
      start: {
        title: 'Iniciar PicoClaw',
        description: 'Inicia el tiempo de ejecución para comenzar a utilizar el asistente PicoClaw.'
      }
    },
    error: {
      title: 'Hemos encontrado un problema',
      refresh: 'Actualizar'
    },
    fullscreen: {
      toggle: 'Activar/Desactivar pantalla completa'
    },
    menu: {
      collapse: 'Colapsar menú',
      expand: 'Expandir menú'
    }
  }
};

export default es;
