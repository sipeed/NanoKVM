const ru = {
  translation: {
    head: {
      desktop: 'Удаленный рабочий стол',
      login: 'Войти',
      changePassword: 'Изменить пароль',
      terminal: 'Терминал',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Войти',
      placeholderUsername: 'Введите имя пользователя',
      placeholderPassword: 'Введите пароль',
      placeholderPassword2: 'Введите пароль снова',
      noEmptyUsername: 'Имя пользователя не может быть пустым',
      noEmptyPassword: 'Пароль не может быть пустым',
      noAccount:
        'Не удалось получить информацию о пользователе, пожалуйста, обновите веб-страницу или сбросьте пароль',
      invalidUser: 'Неверное имя пользователя или пароль',
      error: 'Непредвиденная ошибка',
      changePassword: 'Изменить пароль',
      changePasswordDesc:
        'Для безопасности вашего устройства измените, пожалуйста, пароль веб-входа.',
      differentPassword: 'Пароли не совпадают',
      illegalUsername: 'Имя пользователя содержит недопустимые символы',
      illegalPassword: 'Пароль содержит недопустимые символы',
      forgetPassword: 'Забыли пароль?',
      ok: 'ОК',
      cancel: 'Отмена',
      loginButtonText: 'Войти',
      tips: {
        reset1:
          'To reset the passwords, pressing and holding the BOOT button on the NanoKVM for 10 seconds.',
        reset2: 'For detailed steps, please consult this document:',
        reset3: 'Web default account:',
        reset4: 'SSH default account:',
        change1: 'Please note that this action will change the following passwords:',
        change2: 'Web login password',
        change3: 'System root password (SSH login password)',
        change4: 'To reset the passwords, press and hold the BOOT button on the NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configure Wi-Fi for NanoKVM',
      success: 'Please check the network status of NanoKVM and visit the new IP address.',
      failed: 'Operation failed, please try again.',
      confirmBtn: 'Ok',
      finishBtn: 'Finished'
    },
    screen: {
      video: 'Видеорежим',
      resolution: 'Разрешение',
      auto: 'Автоматическое',
      autoTips:
        'При некоторых разрешениях экрана могут возникать артефакты изображения или смещение курсора. Пожалуйста, настройте разрешение удаленного компьютера или отключите автоматический режим для передачи видеопотока.',
      fps: 'Частота кадров',
      customizeFps: 'Настроить',
      quality: 'Качество',
      qualityLossless: 'Без потерь',
      qualityHigh: 'Высокий',
      qualityMedium: 'Средний',
      qualityLow: 'Низкий',
      frameDetect: 'Экономия трафика',
      frameDetectTip:
        'Вычисляет разницу между кадрами и прекращает передачу видеопотока, если на экране удаленного узла не обнаружено никаких изменений.'
    },
    keyboard: {
      paste: 'вставить',
      tips: 'Только стандартные буквы и символы клавиатуры поддерживаются',
      placeholder: 'Пожалуйста, введите',
      submit: 'подтверждать',
      virtual: 'Клавиатура'
    },
    mouse: {
      default: 'Курсор по умолчанию',
      pointer: 'Курсор: указатель',
      cell: 'Курсор: крест',
      text: 'Курсор: выбор текста',
      grab: 'Курсор: захват',
      hide: 'Скрыть курсор',
      mode: 'Режим мыши',
      absolute: 'Абсолютный режим',
      relative: 'Относительный режим',
      requestPointer: 'Используется относительный режим. Нажмите на рабочий стол для захвата мыши.',
      resetHid: 'Перезагрузить HID-подсистему'
    },
    image: {
      title: 'Образы',
      loading: 'Загрузка...',
      empty: 'Пусто',
      mountFailed: 'Монтирование образа не удалось',
      mountDesc:
        'В некоторых системах необходимо отсоединить виртуальный диск на удаленном хосте перед монтированием образа.',
      tips: {
        title: 'Как загрузить',
        usb1: 'Подключите NanoKVM к вашему компьютеру через USB.',
        usb2: 'Убедитесь, что виртуальный диск подключен (Настройки - Виртуальный диск).',
        usb3: 'Откройте виртуальный диск на вашем компьютере и скопируйте файл образа в корневой каталог диска.',
        scp1: 'Убедитесь что NanoKVM и ваш компьютер находятся в одной и той же сети.',
        scp2: 'Откройте терминал на вашем компьютере и используйте команду scp, чтобы загрузить файл образа в директорию /data, находящуюся на NanoKVM.',
        scp3: 'Например: scp путь-к-образу root@ip-вашего-nanokvm:/data',
        tfCard: 'Карта памяти',
        tf1: 'Этот метод поддерживается на Linux-системах',
        tf2: 'Извлеките карту памяти из NanoKVM (если у вас "полная" (Full) версия, сначала нужно разобрать корпус).',
        tf3: 'Вставьте карту памяти в картридер и подключите его в свой компьютер.',
        tf4: 'Скопируйте файл образа в директорию /data на карте памяти.',
        tf5: 'Вставьте карту памяти в NanoKVM.'
      }
    },
    script: {
      title: 'Скрипты',
      upload: 'Загрузить',
      run: 'Выполнить',
      runBackground: 'Выполнить в фоне',
      runFailed: 'Не удалось выполнить',
      attention: 'Внимание',
      delDesc: 'Вы уверены, что хотите удалить этот файл?',
      confirm: 'Да',
      cancel: 'Нет',
      delete: 'Удалить',
      close: 'Закрыть'
    },
    terminal: {
      title: 'Терминал',
      nanokvm: 'Терминал NanoKVM',
      serial: 'Терминал COM-порта',
      serialPort: 'COM-порт',
      serialPortPlaceholder: 'Введите COM-порт',
      baudrate: 'Скорость передачи',
      confirm: 'ОК'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Отправка команды...',
      sent: 'Команда отправлена',
      input: 'Введите MAC-адрес',
      ok: 'ОК'
    },
    power: {
      title: 'Питание',
      reset: 'Экстренная перезагрузка',
      power: 'Питание',
      powerShort: 'Питание (короткое нажатие)',
      powerLong: 'Питание (длинное нажатие)'
    },
    settings: {
      title: 'Settings',
      about: {
        title: 'О системе NanoKVM',
        information: 'Информация',
        ip: 'IP-адрес',
        mdns: 'Доменное имя mDNS',
        application: 'Версия ПО',
        applicationTip: 'NanoKVM web application version',
        image: 'Версия прошивки',
        imageTip: 'NanoKVM system image version',
        deviceKey: 'Ключ устройства',
        community: 'Сообщество'
      },
      appearance: {
        title: 'Appearance',
        display: 'Display',
        language: 'Language',
        menuBar: 'Menu Bar',
        menuBarDesc: 'Display icons in the menu bar'
      },
      device: {
        title: 'Device',
        oled: {
          title: 'OLED',
          description: 'OLED screen automatically sleep',
          0: 'Never',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 hour'
        },
        wifi: {
          title: 'Wi-Fi',
          description: 'Configure Wi-Fi',
          setBtn: 'Config'
        },
        disk: 'Virtual Disk',
        diskDesc: 'Mount virtual U-disk on the remote host',
        network: 'Virtual Network',
        networkDesc: 'Mount virtual network card on the remote host',
        memory: {
          title: 'Memory optimization',
          tip: 'When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory.',
          disable: 'Disable'
        }
      },
      tailscale: {
        title: 'Tailscale',
        loading: 'Загрузка...',
        notInstall: 'Tailscale не найден! Пожалуйста, установите.',
        install: 'Установить',
        installing: 'Установка',
        failed: 'Не удалось установить',
        retry: 'Пожалуйста, обновите и попробуйте снова, или попробуйте установить вручную',
        download: 'Скачайте',
        package: 'установочный пакет',
        unzip: 'и разархивируйте его',
        upTailscale: 'Переместите tailscale в каталог /usr/bin/ на NanoKVM',
        upTailscaled: 'Переместите tailscaled в каталог /usr/sbin/ на NanoKVM',
        refresh: 'Обновите текущую страницу',
        notLogin: 'Устройство не привязано. Войдите, чтобы привязать его к аккаунту.',
        urlPeriod: 'Этот адрес действителен в течение 10 минут',
        login: 'Войти',
        loginSuccess: 'Вход выполнен',
        enable: 'Включить Tailscale',
        deviceName: 'Имя устройства',
        deviceIP: 'IP адрес устройства',
        account: 'аккаунт',
        logout: 'Выход',
        logout2: 'Вы действительно хотите выйти?'
      },
      update: {
        title: 'Проверить обновления',
        queryFailed: 'Получить версию не удалось',
        updateFailed: 'Обновление не удалось. Пожалуйста, попробуйте еще раз.',
        isLatest: 'У вас уже есть последняя версия.',
        available: 'Доступно обновление. Вы уверены, что хотите обновить?',
        updating: 'Начато обновление. Пожалуйста, подождите...',
        confirm: 'Подтвердить',
        cancel: 'Отмена'
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Name',
        password: 'Password',
        updateBtn: 'Update',
        logoutBtn: 'Logout'
      }
    }
  }
};

export default ru;
