const uk = {
  translation: {
    head: {
      desktop: 'Віддалений робочий стіл',
      login: 'Вхід',
      changePassword: 'Змінити пароль',
      terminal: 'Термінал',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Вхід',
      placeholderUsername: "Введіть ім'я користувача",
      placeholderPassword: 'введіть пароль',
      placeholderPassword2: 'введіть пароль ще раз',
      noEmptyUsername: "ім'я користувача не може бути порожнім",
      noEmptyPassword: 'пароль не може бути порожнім',
      noAccount:
        'Не вдалося отримати інформацію про користувача, оновіть веб-сторінку або скиньте пароль',
      invalidUser: "недійсне ім'я користувача або пароль",
      error: 'якась халепа! непередбачена помилка :(',
      changePassword: 'Змінити пароль',
      changePasswordDesc:
        'Для безпеки вашого пристрою, будь ласка, змініть пароль для входу в веб-інтерфейс.',
      differentPassword: 'паролі не збігаються',
      illegalUsername: "ім'я користувача містить недопустимі символи",
      illegalPassword: 'пароль містить недопустимі символи',
      forgetPassword: 'Забули пароль',
      ok: 'Ок',
      cancel: 'Скасувати',
      loginButtonText: 'Увійти',
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
      video: 'Відеорежим',
      resolution: 'Роздільна здатність',
      auto: 'Автоматично',
      autoTips:
        'Може виникнути розрив зображення або зміщення миші при певних роздільних здатностях. Розгляньте можливість налаштування роздільної здатності віддаленого хоста або вимкнення автоматичного режиму для передачі відеопотоку.',
      fps: 'Кадри в секунду',
      customizeFps: 'Налаштувати',
      quality: 'Якість',
      qualityLossless: 'Без втрат',
      qualityHigh: 'Високий',
      qualityMedium: 'Середній',
      qualityLow: 'Низький',
      frameDetect: 'Виявлення кадрів',
      frameDetectTip:
        'Обчислює різницю між кадрами. Зупиняє передачу відеопотоку, коли на екрані віддаленого хоста не виявлено змін.'
    },
    keyboard: {
      paste: 'Вставити',
      tips: 'Підтримуються лише стандартні літери та символи клавіатури',
      placeholder: 'Будь ласка, введіть',
      submit: 'Надіслати',
      virtual: 'Клавіатура'
    },
    mouse: {
      default: 'Курсор за замовчуванням',
      pointer: 'Курсор-стрілка',
      cell: 'Курсор-таблиця',
      text: 'Курсор-текст',
      grab: 'Курсор-захоплення',
      hide: 'Сховати курсор',
      mode: 'Режим миші',
      absolute: 'Абсолютний режим',
      relative: 'Відносний режим',
      requestPointer:
        'Використовується відносний режим. Будь ласка, натисніть на робочий стіл, щоб отримати курсор миші.',
      resetHid: 'Скинути HID'
    },
    image: {
      title: 'Зображення',
      loading: 'Завантаження...',
      empty: 'Нічого не знайдено',
      mountFailed: 'Не вдалося змонтувати',
      mountDesc:
        'У деяких системах необхідно витягнути віртуальний диск на віддаленому хості перед монтуванням файлу образа.',
      tips: {
        title: 'Як завантажити',
        usb1: "Під'єднайте NanoKVM до вашого комп'ютера через USB.",
        usb2: 'Переконайтеся, що віртуальний диск змонтовано (Налаштування - Віртуальний диск).',
        usb3: "Відкрийте віртуальний диск на вашому комп'ютері та скопіюйте файл зображення до кореневого каталогу віртуального диска.",
        scp1: "Переконайтеся, що NanoKVM і ваш комп'ютер знаходяться в одній локальній мережі.",
        scp2: "Відкрийте термінал на вашому комп'ютері та використовуйте команду SCP для завантаження файлу зображення до каталогу /data на NanoKVM.",
        scp3: 'Приклад: scp ваш-шлях-до-зображення root@ваш-ip-nanokvm:/data',
        tfCard: 'TF карта',
        tf1: 'Цей метод підтримується на системах Linux',
        tf2: 'Отримайте TF карту з NanoKVM (для повної версії, спочатку розберіть корпус).',
        tf3: "Вставте TF карту в кардрідер і під'єднайте її до вашого комп'ютера.",
        tf4: 'Скопіюйте файл зображення до каталогу /data на TF карті.',
        tf5: 'Вставте TF карту в NanoKVM.'
      }
    },
    script: {
      title: 'Скрипт',
      upload: 'Завантажити',
      run: 'Запустити',
      runBackground: 'Запустити у фоновому режимі',
      runFailed: 'Не вдалося запустити',
      attention: 'Увага',
      delDesc: 'Ви впевнені, що хочете видалити цей файл?',
      confirm: 'Так',
      cancel: 'Ні',
      delete: 'Видалити',
      close: 'Закрити'
    },
    terminal: {
      title: 'Термінал',
      nanokvm: 'Термінал NanoKVM',
      serial: 'Термінал послідовного порту',
      serialPort: 'Послідовний порт',
      serialPortPlaceholder: 'Будь ласка, введіть послідовний порт',
      baudrate: 'Швидкість передачі',
      confirm: 'Ок'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Посилання команди...',
      sent: 'Команду відправлено',
      input: 'Будь ласка, введіть MAC',
      ok: 'Ок'
    },
    power: {
      title: 'Живлення',
      reset: 'Скидання',
      power: 'Живлення',
      powerShort: 'Живлення (коротке натискання)',
      powerLong: 'Живлення (довге натискання)'
    },
    settings: {
      title: 'Settings',
      about: {
        title: 'Про NanoKVM',
        information: 'Інформація',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Версія додатку',
        applicationTip: 'NanoKVM web application version',
        image: 'Версія образу',
        imageTip: 'NanoKVM system image version',
        deviceKey: 'Ключ пристрою',
        community: 'Спільнота'
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
        loading: 'Завантаження...',
        notInstall: 'Tailscale не знайдено! Будь ласка, встановіть клієнт Tailscale.',
        install: 'Встановити',
        installing: 'Встановлення',
        failed: 'Не вдалося встановити',
        retry: 'Будь ласка, оновіть сторінку та спробуйте ще раз. Або спробуйте встановити вручну',
        download: 'Завантажте',
        package: 'пакет встановлення',
        unzip: 'та розпакуйте його',
        upTailscale: 'Завантажте tailscale до каталогу /usr/bin/ на NanoKVM',
        upTailscaled: 'Завантажте tailscaled до каталогу /usr/sbin/ на NanoKVM',
        refresh: 'Оновіть поточну сторінку',
        notLogin:
          "Пристрій ще не прив'язаний. Будь ласка, увійдіть і прив'яжіть цей пристрій до вашого облікового запису.",
        urlPeriod: 'Ця URL-адреса дійсна протягом 10 хвилин',
        login: 'Увійти',
        loginSuccess: 'Успішний вхід',
        enable: 'Увімкнути Tailscale',
        deviceName: 'Назва пристрою',
        deviceIP: 'IP пристрою',
        account: 'Обліковий запис',
        logout: 'Вийти',
        logout2: 'Ви впевнені, що хочете вийти?'
      },
      update: {
        title: 'Перевірити оновлення',
        queryFailed: 'Не вдалося отримати версію',
        updateFailed: 'Оновлення не вдалося. Будь ласка, спробуйте ще раз.',
        isLatest: 'У вас вже остання версія.',
        available: 'Доступне оновлення. Ви впевнені, що хочете оновити?',
        updating: 'Оновлення розпочато. Будь ласка, зачекайте...',
        confirm: 'Підтвердити',
        cancel: 'Скасувати'
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

export default uk;
