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
      noAccount: "Impossible de récupérer les informations de l'utilisateur, veuillez rafraîchir la page ou réinitialiser le mot de passe",
      invalidUser: "Nom d'utilisateur ou mot de passe invalide",
      error: 'Erreur inattendue',
      changePassword: 'Changer le mot de passe',
      changePasswordDesc: 'Pour la sécurité de votre appareil, veuillez modifier le mot de passe de connexion Web.',
      differentPassword: 'Les mots de passe ne correspondent pas',
      illegalUsername: "Le nom d'utilisateur contient des caractères illégaux",
      illegalPassword: 'Le mot de passe contient des caractères illégaux',
      forgetPassword: 'Mot de passe oublié',
      ok: 'Se connecter',
      cancel: 'Annuler',
      loginButtonText: 'Connexion',
      tips: {
        reset1:
          'Pour réinitialiser les mots de passe, appuyez et maintenez enfoncé le bouton BOOT sur le NanoKVM pendant 10 secondes.',
        reset2: 'Pour les étapes détaillées, veuillez consulter ce document :',
        reset3: 'Compte Web par défaut :',
        reset4: 'Compte SSH par défaut :',
        change1: 'Veuillez noter que cette action modifiera les mots de passe suivants :',
        change2: 'Mot de passe de connexion Web',
        change3: 'Mot de passe racine du système (mot de passe de connexion SSH)',
        change4: 'Pour réinitialiser les mots de passe, appuyez et maintenez enfoncé le bouton BOOT sur le NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configurez le Wi-Fi pour le NanoKVM',
      success: 'Veuillez vérifier le statut du réseau du NanoKVM et visitez la nouvelle adresse IP.',
      failed: 'L\'opération a échoué, veuillez réessayer.',
      confirmBtn: 'Ok',
      finishBtn: 'Terminé'
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
      frameDetect: 'Détection de trame',
      frameDetectTip:
        "Calcule la différence entre les images. Arrête la transmission du flux vidéo lorsqu'aucun changement n'est détecté sur l'écran de l'hôte distant",
      resetHdmi: 'Réinitialiser le HDMI'
    },
    keyboard: {
      paste: 'Coller',
      tips: 'Seuls les caractères et symboles standard du clavier sont pris en charge',
      placeholder: 'Veuillez saisir',
      submit: 'Soumettre',
      virtual: 'Clavier',
      ctrlaltdel: 'Ctrl+Alt+Del'
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
        'Pour utiliser le mode relatif, cliquez sur le bureau pour capturer le pointeur de la souris.',
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
        scp2: 'Ouvrez un terminal sur votre ordinateur et utilisez la commande SCP pour copier le fichier image dans le répertoire /data du NanoKVM.',
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
      run: 'Exécuter',
      runBackground: 'Exécuter en arrière-plan',
      runFailed: "Échec de l'exécution",
      attention: 'Attention',
      delDesc: 'Êtes-vous sûr de vouloir supprimer ce fichier ?',
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
    download: {
      title: 'Télécharger l’image',
      input: 'Veuillez entrer l’URL d’une image distante',
      ok: 'Ok',
      disabled: 'La partition /data est en lecture seule, impossible de télécharger l’image'
    },
    power: {
      title: 'Power',
      reset: 'Réinitialiser',
      power: 'Power',
      powerShort: 'Power (appui court)',
      powerLong: 'Power (appui long)'
    },
    settings: {
      title: 'Paramètres',
      about: {
        title: 'A propos de NanoKVM',
        information: 'Informations',
        ip: 'IP',
        mdns: 'mDNS',
        application: "Version de l'application",
        applicationTip: 'Version de l\'application Web NanoKVM',
        image: "Version de l'image",
        imageTip: 'Version de l\'image système NanoKVM',
        deviceKey: "Clé de l'appareil",
        community: 'Communauté'
      },
      appearance: {
        title: 'Apparence',
        display: 'Affichage',
        language: 'Langue',
        menuBar: 'Barre de menus',
        menuBarDesc: 'Afficher les icônes dans la barre de menus'
      },
      device: {
        title: 'Appareil',
        oled: {
          title: 'OLED',
          description: 'Écran OLED s\'éteint automatiquement',
          0: 'Jamais',
          15: '15 sec',
          30: '30 sec',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 heure'
        },
        wifi: {
          title: 'Wi-Fi',
          description: 'Configurez le Wi-Fi',
          setBtn: 'Configurer'
        },
        disk: 'Disque virtuel',
        diskDesc: 'Monter le disque virtuel U sur l\'hôte distant',
        network: 'Réseau virtuel',
        networkDesc: 'Monter la carte réseau virtuelle sur l\'hôte distant',
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
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Optimisation de la mémoire',
          tip: "Lorsque l'utilisation de la mémoire dépasse la limite, la collecte des ordures est effectuée plus agressivement pour essayer de libérer de la mémoire. Il est recommandé de définir à 50MB si vous utilisez Tailscale. Un redémarrage de Tailscale est nécessaire pour que le changement prenne effet.",
          disable: 'Désactiver'
        },
        restart: 'Êtes-vous sûr de vouloir redémarrer Tailscale ?',
        stop: 'Êtes-vous sûr de vouloir arrêter Tailscale ?',
        stopDesc: 'Arrêtez Tailscale et désactivez son démarrage automatique.',
        loading: 'Chargement...',
        notInstall: "Tailscale non trouvé ! Veuillez l'installer.",
        install: 'Installer',
        installing: 'Installation',
        failed: 'Installation échouée',
        retry: "Veuillez rafraîchir et réessayer. Ou essayez d'installer manuellement",
        download: 'Télécharger le',
        package: 'paquet d\'installation',
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
        okBtn: 'Oui',
        cancelBtn: 'Non'
      },
      update: {
        title: 'Vérifier les mises à jour',
        queryFailed: 'Impossible de vérifier les mises à jour. Veuillez réessayer.',
        updateFailed: 'Mise à jour échouée. Veuillez réessayer.',
        isLatest: 'Vous avez déjà la dernière version.',
        available: 'Une mise à jour est disponible. Voulez-vous vraiment mettre à jour?',
        updating: 'Mise à jour en cours. Veuillez patienter...',
        confirm: 'Confirmer',
        cancel: 'Annuler'
      },
      account: {
        title: 'Compte',
        webAccount: 'Nom du compte Web',
        password: 'Mot de passe',
        updateBtn: 'Mettre à jour',
        logoutBtn: 'Déconnexion'
      },
      error: {
        title: "Une erreur est survenue",
        refresh: 'Rafraîchir'
      }
    }
  }
};

export default fr;
