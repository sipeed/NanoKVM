const en = {
  translation: {
    language: 'Idioma',
    changePassword: 'Cambiar contraseña',
    logout: 'Cerrar sesión',
    settings: 'Ajustes',
    showMouse: 'Mostrar ratón',
    hideMouse: 'Ocultar ratón',
    power: 'Encender / Apagar',
    reset: 'Reiniciar',
    powerShort: 'Encender / Apagar (pulsación corta)',
    powerLong: 'Encender / Apagar (pulsación larga)',
    hddLed: 'LED HDD',
    checkLibFailed: 'Error al comprobar la aplicación. Por favor, vuelve a intentarlo.',
    updateLibFailed: 'Error al comprobar la aplicación. Por favor, vuelve a intentarlo.',
    updatingLib: 'Actualizando aplicación. Por favor, recarga la página después de actualizar.',
    checkForUpdate: 'Comprobar actualizaciones',
    head: {
      desktop: 'Escritorio remoto',
      login: 'Inicio de sesión',
      changePassword: 'Cambiar contraseña',
      terminal: 'Consola'
    },
    auth: {
      login: 'Iniciar sesión',
      placeholderUsername: 'Introduce tu usuario',
      placeholderPassword: 'Introduce tu contraseña',
      placeholderPassword2: 'Introduce tu contraseña de nuevo',
      noEmptyUsername: 'El usuario no puede estar vacío',
      noEmptyPassword: 'La contraseña no puede estar vacía',
      noAccount: 'No se ha encontrado la cuenta. Por favor, recarga la página o recupera tu contraseña.',
      invalidUser: 'Usuario o contraseña incorrectos',
      error: 'Error inesperado',
      changePassword: 'Cambiar contraseña',
      differentPassword: 'Las contraseñas no coinciden',
      illegalUsername: 'El usuario contiene caracteres no permitidos',
      illegalPassword: 'La contraseña contiene caracteres no permitidos',
      forgetPassword: 'Contraseña olvidada',
      resetPassword: 'Reiniciar contraseña',
      reset1: 'Si has olvidado tu contraseña, por favor, sigue los siguientes pasos para recuperarla:',
      reset2: '1. Inicia sesión en el dispositivo NanoKVM a través de SSH',
      reset3: '2. Elimina este archivo en el dispositivo: ',
      reset4: '3. Utiliza la cuenta por defecto para iniciar sesión: ',
      ok: 'Aceptar',
      cancel: 'Cancelar'
    },
    screen: {
      resolution: 'Resolución',
      auto: 'Automático',
      autoTips: "En determinadas resoluciones pueden producirse rasgado de imagen o desplazamiento del ratón. Prueba a ajustar la resolución del host remoto o desactiva el modo automático.",
      fps: 'FPS',
      customizeFps: 'Personalizar',
      quality: 'Calidad',
      frameDetect: 'Detectar fotogramas',
      frameDetectTip: "Calcula la diferencia entre fotogramas. Para de transmitir vídeo cuando no se detectan cambios en la pantalla del host remoto."
    },
    keyboard: {
      paste: 'Pegar',
      tips: 'Solo están soportadas las letras y símbolos estándar del teclado',
      placeholder: 'Por favor, introduce el texto',
      submit: 'Enviar',
      virtual: 'Teclado virtual'
    },
    mouse: {
      default: 'Cursor por defecto',
      pointer: 'Cursor de puntero',
      cell: 'Cursor de celda',
      text: 'Cursor de texto',
      grab: 'Cursor de agarre',
      hide: 'Ocultar cursor',
      mode: 'Modo de ratón',
      absolute: 'Modo absoluto',
      relative: 'Modo relativo',
      requestPointer: 'Usando modo relativo. Por favor, haz clic en el escritorio para obtener el cursor del ratón.',
      resetHid: 'Restablecer HID'
    },
    image: {
      title: 'Imágenes',
      loading: 'Cargando...',
      empty: 'No se ha encontrado nada',
      mountFailed: 'Fallo al montar',
      mountDesc: "En algunos sistemas, es necesario expulsar el disco virtual en el host remoto antes de montar una imagen.",
      tips: {
        title: 'Cómo subir imágenes',
        usb1: 'Conecta el NanoKVM a tu computadora mediante USB.',
        usb2: 'Asegúrate de que el disco virtual esté montado (Ajustes - Disco Virtual).',
        usb3: 'Abre el disco virtual en tu computadora y copia el archivo de imagen en el directorio raíz del disco virtual.',
        scp1: 'Asegúrate de que el NanoKVM y tu computadora estén en la misma red local.',
        scp2: 'Abre una terminal en tu computadora y usa el comando SCP para subir el archivo de imagen al directorio /data en el NanoKVM.',
        scp3: 'Ejemplo: scp tu-ruta-de-imagen root@tu-ip-del-nanokvm:/data',
        tfCard: 'Tarjeta TF',
        tf1: 'Este método es compatible con el sistema Linux',
        tf2: 'Obtén la tarjeta TF del NanoKVM (para la versión FULL, desmonta la carcasa primero).',
        tf3: 'Inserta la tarjeta TF en un lector de tarjetas y conéctalo a tu computadora.',
        tf4: 'Copia el archivo de imagen en el directorio /data de la tarjeta TF.',
        tf5: 'Inserta la tarjeta TF en el NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Subir',
      run: 'Ejecutar',
      runBackground: 'Ejecutar en segundo plano',
      runFailed: 'Ejecución fallida',
      attention: 'Atención',
      delDesc: '¿Estás seguro que deseas eliminar este archivo?',
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
      confirm: 'Confirmar'
    },
    wol: {
      sending: 'Enviando comando...',
      sent: 'Comando enviado',
      input: 'Por favor, introduce la dirección MAC',
      ok: 'Vale'
    },
    about: {
      title: 'Sobre NanoKVM',
      information: 'Información',
      ip: 'IP',
      mdns: 'mDNS',
      firmware: 'Versión de la aplicación',
      image: 'Versión de la imagen',
      deviceKey: 'Clave del dispositivo',
      queryFailed: 'Consulta fallida',
      community: 'Comunidad'
    },
    update: {
      title: 'Buscar actualizaciones',
      queryFailed: 'Error al obtener la versión',
      updateFailed: 'La actualización falló. Por favor, inténtalo de nuevo.',
      isLatest: 'Ya tienes la última versión.',
      available: 'Hay una actualización disponible. ¿Estás seguro de que quieres actualizar?',
      updating: 'Actualización iniciada. Por favor, espera...',
      confirm: 'Confirmar',
      cancel: 'Cancelar'
      },
    virtualDevice: {
      network: 'Red Virtual',
      disk: 'Disco Virtual'
    },
    tailscale: {
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
      notLogin: 'El dispositivo aún no ha sido vinculado. Por favor, inicia sesión y vincula este dispositivo a tu cuenta.',
      urlPeriod: 'Esta URL es válida por 10 minutos',
      login: 'Iniciar sesión',
      loginSuccess: 'Inicio de sesión exitoso',
      enable: 'Habilitar Tailscale',
      deviceName: 'Nombre del dispositivo',
      deviceIP: 'IP del dispositivo',
      account: 'Cuenta',
      logout: 'Cerrar sesión',
      logout2: '¿Seguro que quieres cerrar sesión?'
    }
  }
};

export default en;
