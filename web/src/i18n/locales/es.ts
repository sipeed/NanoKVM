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
      noAccount: 'No se ha encontrado la cuenta. Por favor, recarga la página o recupera tu contraseña.',
      invalidUser: 'Nombre de usuario o contraseña incorrectos',
      error: 'Error inesperado',
      changePassword: 'Cambiar contraseña',
      changePasswordDesc: 'Para la seguridad de su dispositivo, por favor, modifique la contraseña de inicio de sesión en la web.',
      differentPassword: 'Las contraseñas no coinciden',
      illegalUsername: 'El  nombre de usuario contiene caracteres no permitidos',
      illegalPassword: 'La contraseña contiene caracteres no permitidos',
      forgetPassword: 'Contraseña olvidada',
      ok: 'Aceptar',
      cancel: 'Cancelar',
      loginButtonText: 'Iniciar sesión',
      tips: {
        reset1: 'Para restablecer las contraseñas, mantén pulsado el botón BOOT del NanoKVM durante 10 segundos.',
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
      confirmBtn: 'Aceptar',
      finishBtn: 'Finalizado'
    },
    screen: {
      title: 'Pantalla',
      video: 'Modo de vídeo',
      videoDirectTips: 'Habilita HTTPS en "Ajustes > Dispositivo" para usar este modo',
      resolution: 'Resolución',
      auto: 'Automático',
      autoTips: 'En determinadas resoluciones pueden producirse rasgado de imagen (tearing) o desplazamiento del ratón. Prueba a ajustar la resolución del host remoto o desactiva el modo automático.',
      fps: 'FPS',
      customizeFps: 'Personalizar',
      quality: 'Calidad',
      qualityLossless: 'Sin pérdida',
      qualityHigh: 'Alto',
      qualityMedium: 'Medio',
      qualityLow: 'Bajo',
      frameDetect: 'Detectar fotogramas',
      frameDetectTip: 'Calcula la diferencia entre fotogramas. Para de transmitir vídeo cuando no se detectan cambios en la pantalla del host remoto.',
      resetHdmi: 'Reiniciar HDMI'
    },
    keyboard: {
      title: 'Teclado',      
      paste: 'Pegar',
      tips: 'Sólo están soportadas las letras y símbolos estándar del teclado',
      placeholder: 'Por favor, introduce el texto',
      submit: 'Enviar',
      virtual: 'Teclado virtual',
      ctrlaltdel: 'Ctrl+Alt+Del',
      readClipboard: 'Leer del portapapeles',
      clipboardPermissionDenied: 'Permiso de portapapeles denegado. Por favor, permite el acceso al portapapeles en tu navegador.',
      clipboardReadError: 'Error al leer del portapapeles',
      dropdownEnglish: 'Inglés',
      dropdownGerman: 'Alemán',
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
      speed: 'Velocidad de la rueda',
      fast: 'Rápida',
      slow: 'Lenta',
      requestPointer: 'Usando modo relativo. Por favor, haz clic en el escritorio para obtener el cursor del ratón.',
      resetHid: 'Restablecer HID',
      hidOnly: {
        title: 'Modo sólo HID',
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
      mountDesc: 'En algunos sistemas, es necesario expulsar el disco virtual del host remoto antes de montar una imagen.',
      unmountFailed: 'Fallo al desmontar',
      unmountDesc: 'En algunos sistemas, es necesario expulsar manualmente el disco virtual desde el host remoto antes de desmontar la imagen.',
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
      disabled: 'La partición /data es de sólo lectura, no se puede descargar la imagen'
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
        applicationTip: 'NanoKVM web application version',
        image: 'Versión de la imagen',
        imageTip: 'NanoKVM system image version',
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
        menuBar: 'Barra de menú',
        menuBarDesc: 'Mostrar iconos en la barra de menú',
        webTitle: 'Título web',
        webTitleDesc: 'Personaliza el título de la página web'
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
        wifi: {
          title: 'Wi-Fi',
          description: 'Configura el Wi-Fi',
          setBtn: 'Configurar'
        },
        ssh: {
          description: 'Habilitar acceso remoto SSH',
          tip: 'Establece una contraseña segura antes de habilitar (Cuenta - Cambiar contraseña)'
        },
        tls: {
          description: 'Habilitar protocolo HTTPS',
          tip: 'Aviso: Usar HTTPS puede aumentar la latencia, especialmente en modo de vídeo MJPEG.'
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
        hidOnly: 'Modo sólo HID',
        disk: 'Disco Virtual',
        diskDesc: 'Montar disco virtual en el host remoto',
        media: 'Imagen virtual',
        mediaDesc: 'Adjuntar dispositivo de imagen virtual al host remoto',
        network: 'Red Virtual',
        networkDesc: 'Montar tarjeta de red virtual en el host remoto',
        usbDescriptor: {
          title: 'USB Descriptor',
          description: 'Customize how the USB device appears to the target host',
          preset: 'Preset',
          vendorName: 'Manufacturer',
          productName: 'Product Name',
          serialNumber: 'Serial Number',
          chars: 'chars',
          randomize: 'Random',
          readDevice: 'Read Device',
          restoreDefaults: 'Restore Defaults',
          apply: 'Apply Changes',
          applySuccess: 'USB descriptor updated. The target will see a brief USB reconnection.',
          restoreSuccess: 'USB descriptor restored to factory defaults.',
          vidPidWarning:
            'Changing VID/PID may cause the target OS to reinstall USB drivers. Use known values to avoid compatibility issues.',
          confirmTitle: 'Confirm VID/PID Change',
          confirmMessage:
            'Changing the VID or PID may cause the target operating system to reinstall USB drivers. Are you sure you want to continue?',
          confirm: 'Yes, Apply',
          cancel: 'Cancel',
          presetGroups: {
            generic: 'Generic',
            brand: 'Brand',
            custom: 'Custom'
          },
          presets: {
            genericKeyboard: 'Generic Keyboard',
            genericMouse: 'Generic Mouse',
            genericComposite: 'Generic Composite',
            genericHid: 'Generic HID Device',
            logitechKeyboard: 'Logitech Keyboard K120',
            logitechMouse: 'Logitech USB Optical Mouse',
            microsoftKeyboard: 'Microsoft Wired Keyboard',
            dellKeyboard: 'Dell KB216 Keyboard'
          },
          errors: {
            readFailed: 'Failed to read USB descriptor',
            writeFailed: 'Failed to write USB descriptor',
            restoreFailed: 'Failed to restore USB defaults',
            invalidHex: 'VID and PID must be valid hex values (e.g. 0x1234)'
          }
        },
        reboot: 'Reiniciar',
        rebootDesc: '¿Estás seguro de que deseas reiniciar el NanoKVM?',
        usb: 'Interfaz USB',
        usbDesc: 'Habilitar interfaz USB hacia el host',
        okBtn: 'Sí',
        cancelBtn: 'No'
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
        retry: 'Por favor, actualiza la página e inténtalo de nuevo. O intenta instalarlo manualmente',
        download: 'Descargar el',
        package: 'paquete de instalación',
        unzip: 'y descomprimirlo',
        upTailscale: 'Sube tailscale al directorio /usr/bin/ del NanoKVM',
        upTailscaled: 'Sube tailscaled al directorio /usr/sbin/ del NanoKVM',
        refresh: 'Actualizar la página actual',
        notRunning: 'Tailscale no se está ejecutando. Por favor, inícialo para continuar.',
        run: 'Iniciar',
        notLogin: 'El dispositivo aún no ha sido vinculado. Por favor, inicia sesión y vincula este dispositivo a tu cuenta.',
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
        previewTip: 'Ten en cuenta que las versiones de vista previa pueden contener errores o funcionalidades incompletas'
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
