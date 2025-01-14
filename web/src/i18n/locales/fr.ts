const fr = {
  translation: {
    head: {
      desktop: 'Bureau à distance',
      login: 'Connexion',
      changePassword: 'Changer le mot de passe',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Connexion',
      placeholderUsername: "Veuillez entrer votre nom d'utilisateur",
      placeholderPassword: 'Veuillez entrer votre mot de passe',
      placeholderPassword2: 'Veuillez entrer votre mot de passe à nouveau',
      noEmptyUsername: "Le nom d'utilisateur ne peut pas être vide",
      noEmptyPassword: 'Le mot de passe ne peut pas être vide',
      noAccount:
        "Impossible de récupérer les informations de l'utilisateur, veuillez rafraîchir la page ou réinitialiser le mot de passe",
      invalidUser: "Nom d'utilisateur ou mot de passe invalide",
      error: 'Erreur inattendue',
      changePassword: 'Changer le mot de passe',
      changePasswordDesc:
        'Pour la sécurité de votre appareil, veuillez modifier le mot de passe de connexion Web.',
      differentPassword: 'Les mots de passe ne correspondent pas',
      illegalUsername: "Le nom d'utilisateur contient des caractères illégaux",
      illegalPassword: 'Le mot de passe contient des caractères illégaux',
      forgetPassword: 'Mot de passe oublié',
      ok: 'Se connecter',
      cancel: 'Annuler',
      loginButtonText: 'Connexion',
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
      video: 'Mode vidéo',
      resolution: 'Résolution',
      auto: 'Automatique',
      autoTips:
        "Sous certaines résolutions, il peut y avoir des artefacts visuels ou un décalage de la souris. Veuillez ajuster la résolution de l'hôte distant ou désactiver le mode automatique.",
      fps: 'FPS',
      customizeFps: 'Personnaliser',
      quality: 'Qualité',
      qualityLossless: 'Sans perte',
      qualityHigh: 'Élevé',
      qualityMedium: 'Moyen',
      qualityLow: 'Bas',
      frameDetect: 'Frame Detect',
      frameDetectTip:
        "Calcule la différence entre les images. Arrête la transmission du flux vidéo lorsqu'aucun changement n'est détecté sur l'écran de l'hôte distant",
      resetHdmi: 'Reset HDMI'
    },
    keyboard: {
      paste: 'Coller',
      tips: 'Seuls les caractères et symboles standard du clavier sont pris en charge',
      placeholder: 'Veuillez saisir',
      submit: 'Soumettre',
      virtual: 'Clavier'
    },
    mouse: {
      default: 'Curseur par défaut',
      pointer: 'Curseur de la souris',
      cell: 'Curseur de cellule',
      text: 'Curseur de texte',
      grab: 'Curseur de poignée',
      hide: 'Cacher le curseur',
      mode: 'Mode de la souris',
      absolute: 'Mode absolu',
      relative: 'Mode relatif',
      requestPointer:
        'Utilisation du mode relatif. Veuillez cliquer sur le bureau pour obtenir le pointeur de la souris.',
      resetHid: 'Réinitialiser le périphérique HID'
    },
    image: {
      title: 'Images',
      loading: 'Chargement',
      empty: 'Vide',
      mountFailed: "Échec du montage de l'image.",
      mountDesc:
        "Dans certains systèmes, il est nécessaire de déséjecter le disque virtuel sur l'hôte distant avant de monter l'image.",
      tips: {
        title: 'Comment télécharger',
        usb1: 'Connectez le NanoKVM à votre ordinateur via USB.',
        usb2: 'Assurez-vous que le disque virtuel est monté (Paramètres - Disque virtuel).',
        usb3: 'Ouvrez le disque virtuel sur votre ordinateur et copiez le fichier image dans le répertoire racine du disque virtuel.',
        scp1: 'Assurez-vous que le NanoKVM et votre ordinateur sont sur le même réseau local.',
        scp2: 'Ouvrez un terminal sur votre ordinateur et utilisez la commande SCP pour télécharger le fichier image dans le répertoire /data du NanoKVM.',
        scp3: 'Exemple : scp chemin-de-votre-image root@ip-de-votre-nanokvm:/data',
        tfCard: 'Carte TF',
        tf1: 'Cette méthode est adaptée aux systèmes Linux.',
        tf2: 'Retirez la carte TF du NanoKVM (Pour la version FULL, il est nécessaire de retirer le boîtier).',
        tf3: 'Insérez la carte TF dans un lecteur de carte et connectez-la à votre ordinateur.',
        tf4: 'Copiez le fichier image dans le répertoire /data de la carte TF sur votre ordinateur.',
        tf5: 'Réinsérez la carte TF dans le NanoKVM.'
      }
    },
    script: {
      title: 'Script',
      upload: 'Téléverser',
      run: 'Executer',
      runBackground: 'Executer en arrière-plan',
      runFailed: "Échec de l'exécution",
      attention: 'Attention',
      delDesc: 'Etes-vous sûr de vouloir supprimer ce fichier?',
      confirm: 'Oui',
      cancel: 'Non',
      delete: 'Supprimer',
      close: 'Fermer'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal NanoKVM',
      serial: 'Terminal Port Série',
      serialPort: 'Port série',
      serialPortPlaceholder: 'Veuillez entrer le port série',
      baudrate: 'Débit en bauds',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Envoi de la commande...',
      sent: 'Commande envoyée',
      input: "Veuillez entrer l'adresse MAC",
      ok: 'Ok'
    },
    power: {
      title: 'Power',
      reset: 'Reset',
      power: 'Power',
      powerShort: 'Power (appui court)',
      powerLong: 'Power (appui long)'
    },
    settings: {
      title: 'Settings',
      about: {
        title: 'A propos de NanoKVM',
        information: 'Informations',
        ip: 'IP',
        mdns: 'mDNS',
        application: "Version de l'application",
        applicationTip: 'NanoKVM web application version',
        image: "Version de l'image",
        imageTip: 'NanoKVM system image version',
        deviceKey: "Clé de l'appareil",
        community: 'Communauté'
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
        networkDesc: 'Mount virtual network card on the remote host'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Memory optimization',
          tip: "When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. it's recommended to set to 50MB if using Tailscale. A Tailscale restart is required for the change to take effect.",
          disable: 'Disable'
        },
        restart: 'Are you sure to restart Tailscale?',
        stop: 'Are you sure to stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable its automatic startup on boot.',
        loading: 'Chargement...',
        notInstall: "Tailscale non trouvé! Veuillez l'installer.",
        install: 'Installer',
        installing: 'Installation',
        failed: 'Installation échouée',
        retry: "Veuillez rafraîchir et réessayer. Ou essayez d'installer manuellement",
        download: 'Télécharger le',
        package: 'installation package',
        unzip: 'et décompressez-le',
        upTailscale: 'Téléverser tailscale dans le répertoire NanoKVM /usr/sbin/',
        upTailscaled: 'Téléverser tailscaled dans le répertoire NanoKVM /usr/sbin/',
        refresh: 'Rafraîchir la page courante',
        notLogin: "L'appareil n'est pas relié. Connectez-vous et liez cet appareil à votre compte.",
        urlPeriod: "L'URL est valide pendant 10 minutes",
        login: 'Connexion',
        loginSuccess: 'Connexion réussie',
        enable: 'Démarrer Tailscale',
        deviceName: "Nom de l'appareil",
        deviceIP: "IP de l'appareil",
        account: 'Compte',
        logout: 'Déconnexion',
        logout2: 'Voulez-vous vous déconnecter?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Vérifier les mises à jour',
        queryFailed: 'Impossible de vérifier les mises à jour. Veuillez réessayer.',
        updateFailed: 'Mis à jour échouée. Veuillez réessayer.',
        isLatest: 'Vous avez déjà la dernière version.',
        available: 'Une mise à jour est disponible. Voulez-vous vraiment mettre à jour?',
        updating: 'Mise à jour en cours. Veuillez patienter...',
        confirm: 'Confirmer',
        cancel: 'Annuler'
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

export default fr;
