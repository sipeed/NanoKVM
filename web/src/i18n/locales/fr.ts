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
      locked: 'Trop de connexions, veuillez réessayer plus tard',
      globalLocked: 'Système sous protection, veuillez réessayer plus tard',
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
          'Pour réinitialiser les mots de passe, appuyez et maintenez enfoncé le bouton BOOT sur le NanoKVM pendant 10 secondes.',
        reset2: 'Pour les étapes détaillées, veuillez consulter ce document :',
        reset3: 'Compte Web par défaut :',
        reset4: 'Compte SSH par défaut :',
        change1: 'Veuillez noter que cette action modifiera les mots de passe suivants :',
        change2: 'Mot de passe de connexion Web',
        change3: 'Mot de passe racine du système (mot de passe de connexion SSH)',
        change4:
          'Pour réinitialiser les mots de passe, appuyez et maintenez enfoncé le bouton BOOT sur le NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configurez le Wi-Fi pour le NanoKVM',
      success:
        'Veuillez vérifier le statut du réseau du NanoKVM et visitez la nouvelle adresse IP.',
      failed: "L'opération a échoué, veuillez réessayer.",
      invalidMode:
        'Le mode actuel ne prend pas en charge la configuration réseau. Veuillez accéder à votre appareil et activer le mode de configuration Wi-Fi.',
      confirmBtn: 'Ok',
      finishBtn: 'Terminé',
      ap: {
        authTitle: 'Authentification requise',
        authDescription: 'Veuillez saisir le mot de passe AP pour continuer',
        authFailed: 'Mot de passe AP invalide',
        passPlaceholder: 'AP mot de passe',
        verifyBtn: 'Vérifier'
      }
    },
    screen: {
      scale: 'Échelle',
      title: 'Écran',
      video: 'Mode vidéo',
      videoDirectTips: 'Activez HTTPS dans "Paramètres > Appareil" pour utiliser ce mode',
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
      title: 'Clavier',
      paste: 'Coller',
      tips: 'Seuls les caractères et symboles standard du clavier sont pris en charge',
      placeholder: 'Veuillez saisir',
      submit: 'Soumettre',
      virtual: 'Clavier',
      readClipboard: 'Lire le presse-papiers',
      clipboardPermissionDenied:
        "Accès au presse-papiers refusé. Veuillez autoriser l'accès dans votre navigateur.",
      clipboardReadError: 'Échec de la lecture du presse-papiers',
      dropdownEnglish: 'Anglais',
      dropdownGerman: 'Allemand',
      dropdownFrench: 'Français',
      dropdownRussian: 'Russe',
      shortcut: {
        title: 'Raccourcis',
        custom: 'Personnalisé',
        capture: 'Cliquez ici pour capturer le raccourci',
        clear: 'Effacer',
        save: 'Enregistrer',
        captureTips:
          'La capture de touches système (comme la touche Windows) nécessite l’autorisation du plein écran.',
        enterFullScreen: 'Basculer en mode plein écran.'
      },
      leaderKey: {
        title: 'Touche Leader',
        desc: "Contournez les restrictions du navigateur et envoyez les raccourcis système directement à l'hôte distant.",
        howToUse: 'Comment utiliser',
        simultaneous: {
          title: 'Mode simultané',
          desc1: 'Maintenez la touche Leader enfoncée, puis appuyez sur le raccourci.',
          desc2: 'Intuitif, mais peut entrer en conflit avec les raccourcis système.'
        },
        sequential: {
          title: 'Mode séquentiel',
          desc1:
            'Appuyez sur la touche Leader → appuyez sur le raccourci dans l’ordre → appuyez à nouveau sur la touche Leader.',
          desc2: "Nécessite plus d'étapes, mais évite complètement les conflits système."
        },
        enable: 'Activer la touche Leader',
        tip: 'Lorsqu’elle est définie comme touche Leader, cette touche sert uniquement de déclencheur de raccourci et perd son comportement par défaut.',
        placeholder: 'Appuyez sur la touche Leader',
        shiftRight: 'Shift droit',
        ctrlRight: 'Ctrl droit',
        metaRight: 'Win droit',
        submit: 'Soumettre',
        recorder: {
          rec: 'REC',
          activate: 'Activer les touches',
          input: 'Veuillez appuyer sur le raccourci...'
        }
      }
    },
    mouse: {
      title: 'Souris',
      cursor: 'Style de curseur',
      default: 'Curseur par défaut',
      pointer: 'Curseur de la souris',
      cell: 'Curseur de cellule',
      text: 'Curseur de texte',
      grab: 'Curseur de poignée',
      hide: 'Cacher le curseur',
      mode: 'Mode de la souris',
      absolute: 'Mode absolu',
      relative: 'Mode relatif',
      direction: 'Sens de la molette',
      scrollUp: 'Faire défiler vers le haut',
      scrollDown: 'Faites défiler vers le bas',
      speed: 'Vitesse de la molette',
      fast: 'Rapide',
      slow: 'Lent',
      requestPointer:
        'Pour utiliser le mode relatif, cliquez sur le bureau pour capturer le pointeur de la souris.',
      resetHid: 'Réinitialiser le périphérique HID',
      hidOnly: {
        title: 'Mode HID uniquement',
        desc: "Si votre souris et votre clavier ne répondent plus et que la réinitialisation de HID ne vous aide pas, il peut s'agir d'un problème de compatibilité entre le NanoKVM et l'appareil. Essayez d'activer le mode HID-Only pour une meilleure compatibilité.",
        tip1: "L'activation du mode HID-Only démontera le disque U virtuel et le réseau virtuel",
        tip2: "En mode HID-Only, le montage d'image est désactivé",
        tip3: 'NanoKVM redémarrera automatiquement après avoir changé de mode',
        enable: 'Activer le mode HID uniquement',
        disable: 'Désactiver le mode HID uniquement'
      }
    },
    image: {
      title: 'Images',
      loading: 'Chargement',
      empty: 'Vide',
      mountMode: 'Mode de montage',
      mountFailed: "Échec du montage de l'image.",
      mountDesc:
        "Dans certains systèmes, il est nécessaire de déséjecter le disque virtuel sur l'hôte distant avant de monter l'image.",
      unmountFailed: 'Échec du démontage',
      unmountDesc:
        "Sur certains systèmes, vous devez l'éjecter manuellement de l'hôte distant avant de démonter l'image.",
      refresh: 'Actualiser la liste des images',
      attention: 'Attention',
      deleteConfirm: 'Etes-vous sûr de vouloir supprimer cette image?',
      okBtn: 'Oui',
      cancelBtn: 'Non',
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
      parity: 'Parité',
      parityNone: 'Aucun',
      parityEven: 'Paire',
      parityOdd: 'Impaire',
      flowControl: 'Contrôle de débit',
      flowControlNone: 'Aucun',
      flowControlSoft: 'Logiciel',
      flowControlHard: 'Matériel',
      dataBits: 'Bits de données',
      stopBits: "Bits d'arrêt",
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
      disabled: 'La partition /data est en lecture seule, impossible de télécharger l’image',
      uploadbox: 'Déposez le fichier ici ou cliquez pour sélectionner',
      inputfile: 'Veuillez saisir le fichier image',
      NoISO: 'Aucun ISO'
    },
    power: {
      title: 'Power',
      showConfirm: 'Confirmation',
      showConfirmTip: 'Les opérations électriques nécessitent une confirmation supplémentaire',
      reset: 'Réinitialiser',
      power: 'Power',
      powerShort: 'Power (appui court)',
      powerLong: 'Power (appui long)',
      resetConfirm: "Procéder à l'opération de réinitialisation?",
      powerConfirm: 'Continuer le fonctionnement électrique?',
      okBtn: 'Oui',
      cancelBtn: 'Non'
    },
    settings: {
      title: 'Paramètres',
      about: {
        title: 'A propos de NanoKVM',
        information: 'Informations',
        ip: 'IP',
        mdns: 'mDNS',
        application: "Version de l'application",
        applicationTip: "Version de l'application Web NanoKVM",
        image: "Version de l'image",
        imageTip: "Version de l'image système NanoKVM",
        deviceKey: "Clé de l'appareil",
        community: 'Communauté',
        hostname: "Nom d'hôte",
        hostnameUpdated: "Nom d'hôte mis à jour. Redémarrez pour appliquer.",
        ipType: {
          Wired: 'Filaire',
          Wireless: 'Sans fil',
          Other: 'Autre'
        }
      },
      appearance: {
        title: 'Apparence',
        display: 'Affichage',
        language: 'Langue',
        languageDesc: "Sélectionnez la langue de l'interface",
        webTitle: 'Titre Web',
        webTitleDesc: 'Personnaliser le titre de la page Web',
        menuBar: {
          title: 'Barre de menus',
          mode: "Mode d'affichage",
          modeDesc: "Afficher la barre de menu sur l'écran",
          modeOff: 'Désactivé',
          modeAuto: 'Masquer automatiquement',
          modeAlways: 'Toujours visible',
          icons: 'Icônes du sous-menu',
          iconsDesc: 'Afficher les icônes des sous-menus dans la barre de menus'
        }
      },
      device: {
        title: 'Appareil',
        oled: {
          title: 'OLED',
          description: "Écran OLED s'éteint automatiquement",
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
        ssh: {
          description: "Activer l'accès à distance SSH",
          tip: "Définissez un mot de passe fort avant d'activer (Compte - Modifier le mot de passe)"
        },
        advanced: 'Paramètres avancés',
        swap: {
          title: 'Échange',
          disable: 'Désactiver',
          description: "Définir la taille du fichier d'échange",
          tip: "L'activation de cette fonctionnalité pourrait réduire la durée de vie de votre carte SD!"
        },
        mouseJiggler: {
          title: 'Souris Jiggler',
          description: "Empêcher l'hôte distant de dormir",
          disable: 'Désactiver',
          absolute: 'Mode absolu',
          relative: 'Mode relatif'
        },
        mdns: {
          description: 'Activer le service de découverte mDNS',
          tip: "L'éteindre si ce n'est pas nécessaire"
        },
        hdmi: {
          description: 'Activer HDMI/sortie moniteur'
        },
        autostart: {
          title: 'Paramètres des scripts de démarrage automatique',
          description: "Gérer les scripts qui s'exécutent automatiquement au démarrage du système",
          new: 'Nouveau',
          deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce fichier ?',
          yes: 'Oui',
          no: 'Non',
          scriptName: 'Nom du script de démarrage automatique',
          scriptContent: 'Contenu du script de démarrage automatique',
          settings: 'Paramètres'
        },
        hidOnly: 'HID-Mode uniquement',
        hidOnlyDesc:
          "Arrêtez d'émuler des périphériques virtuels, en ne conservant que le contrôle de base HID",
        disk: 'Disque virtuel',
        diskDesc: "Monter le disque virtuel U sur l'hôte distant",
        network: 'Réseau virtuel',
        networkDesc: "Monter la carte réseau virtuelle sur l'hôte distant",
        reboot: 'Redémarrer',
        rebootDesc: 'Êtes-vous sûr de vouloir redémarrer NanoKVM?',
        okBtn: 'Oui',
        cancelBtn: 'Non'
      },
      network: {
        title: 'Réseau',
        wifi: {
          title: 'Wi-Fi',
          description: 'Configurez le Wi-Fi',
          apMode: 'Le mode AP est activé, connectez-vous au Wi-Fi en scannant le code QR',
          connect: 'Connecter le Wi-Fi',
          connectDesc1: 'Veuillez saisir le SSID du réseau et le mot de passe',
          connectDesc2: 'Veuillez saisir le mot de passe pour rejoindre ce réseau',
          disconnect: 'Voulez-vous vraiment déconnecter le réseau ?',
          failed: 'Échec de la connexion, veuillez réessayer.',
          ssid: 'Nom',
          password: 'Mot de passe',
          joinBtn: 'Rejoindre',
          confirmBtn: 'OK',
          cancelBtn: 'Annuler'
        },
        tls: {
          description: 'Activer le protocole HTTPS',
          tip: "Attention : l'utilisation de HTTPS peut augmenter la latence, surtout en mode vidéo MJPEG."
        },
        dns: {
          title: 'DNS',
          description: 'Configurer les serveurs DNS pour NanoKVM',
          mode: 'Mode',
          dhcp: 'DHCP',
          manual: 'Manuel',
          add: 'Ajouter un DNS',
          save: 'Enregistrer',
          invalid: 'Veuillez saisir une adresse IP valide',
          noDhcp: "Aucun DNS DHCP n'est actuellement disponible",
          saved: 'Paramètres DNS enregistrés',
          saveFailed: "Échec de l'enregistrement des paramètres DNS",
          unsaved: 'Modifications non enregistrées',
          maxServers: '{{count}} serveurs DNS maximum autorisés',
          dnsServers: 'Serveurs DNS',
          dhcpServersDescription: 'Les serveurs DNS sont obtenus automatiquement par DHCP',
          manualServersDescription: 'Les serveurs DNS peuvent être modifiés manuellement',
          networkDetails: 'Détails du réseau',
          interface: 'Interface',
          ipAddress: 'Adresse IP',
          subnetMask: 'Masque de sous-réseau',
          router: 'Routeur',
          none: 'Aucun'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Optimisation de la mémoire',
          tip: "Lorsque l'utilisation de la mémoire dépasse la limite, la collecte des ordures est effectuée plus agressivement pour essayer de libérer de la mémoire. Il est recommandé de définir à 50MB si vous utilisez Tailscale. Un redémarrage de Tailscale est nécessaire pour que le changement prenne effet."
        },
        swap: {
          title: 'Échanger la mémoire',
          tip: "Si les problèmes persistent après l'activation de l'optimisation de la mémoire, essayez d'activer la mémoire d'échange. Cela définit la taille du fichier d'échange sur 256MB par défaut, qui peut être ajustée dans « Paramètres > Appareil »."
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
        package: "paquet d'installation",
        unzip: 'et décompressez-le',
        upTailscale: 'Téléverser tailscale dans le répertoire NanoKVM /usr/sbin/',
        upTailscaled: 'Téléverser tailscaled dans le répertoire NanoKVM /usr/sbin/',
        refresh: 'Rafraîchir la page courante',
        notRunning:
          "Tailscale n'est pas en cours d'exécution. Veuillez le démarrer pour continuer.",
        run: 'Début',
        notLogin: "L'appareil n'est pas relié. Connectez-vous et liez cet appareil à votre compte.",
        urlPeriod: "L'URL est valide pendant 10 minutes",
        login: 'Connexion',
        loginSuccess: 'Connexion réussie',
        enable: 'Démarrer Tailscale',
        deviceName: "Nom de l'appareil",
        deviceIP: "IP de l'appareil",
        account: 'Compte',
        logout: 'Déconnexion',
        logoutDesc: 'Êtes-vous sûr de vouloir vous déconnecter?',
        uninstall: 'Désinstaller Tailscale',
        uninstallDesc: 'Êtes-vous sûr de vouloir désinstaller Tailscale?',
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
        cancel: 'Annuler',
        preview: 'Aperçu des mises à jour',
        previewDesc:
          "Bénéficiez d'un accès anticipé aux nouvelles fonctionnalités et améliorations",
        previewTip:
          'Veuillez noter que les versions préliminaires peuvent contenir des bugs ou des fonctionnalités incomplètes!',
        offline: {
          title: 'Mises à jour hors ligne',
          desc: "Mise à jour via le package d'installation local",
          upload: 'Téléverser',
          invalidName:
            'Format de nom de fichier invalide. Veuillez télécharger à partir des versions de GitHub.',
          updateFailed: 'Mise à jour échouée. Veuillez réessayer.'
        }
      },
      users: {
        title: 'Gestion des utilisateurs',
        addUser: 'Ajouter un utilisateur',
        colUsername: 'Nom d\'utilisateur',
        colRole: 'Rôle',
        colEnabled: 'Actif',
        colActions: 'Actions',
        rolesTitle: 'Aperçu des rôles',
        roleAdmin: 'Accès complet + gestion des utilisateurs',
        roleOperator: 'Utiliser le KVM : flux, clavier, souris, boutons d\'alimentation',
        roleViewer: 'Visualisation du flux uniquement',
        changePassword: 'Changer le mot de passe',
        newPassword: 'Nouveau mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        pwdMismatch: 'Les mots de passe ne correspondent pas',
        pwdSuccess: 'Mot de passe modifié avec succès',
        pwdFailed: 'Échec du changement de mot de passe',
        password: 'Mot de passe',
        delete: 'Supprimer',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
        createSuccess: 'Utilisateur créé',
        createFailed: 'Échec de la création',
        deleteSuccess: 'Utilisateur supprimé',
        deleteFailed: 'Échec de la suppression',
        updateSuccess: 'Mis à jour',
        updateFailed: 'Échec de la mise à jour',
        loadFailed: 'Échec du chargement des utilisateurs',
        usernameRequired: 'Saisissez le nom d\'utilisateur',
        passwordRequired: 'Saisissez le mot de passe',
        okBtn: 'OK',
        cancelBtn: 'Annuler'
      },
      account: {
        title: 'Compte',
        webAccount: 'Nom du compte Web',
        password: 'Mot de passe',
        updateBtn: 'Mettre à jour',
        logoutBtn: 'Déconnexion',
        logoutDesc: 'Êtes-vous sûr de vouloir vous déconnecter?',
        okBtn: 'Oui',
        cancelBtn: 'Non'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistante',
      empty: 'Ouvrez le panneau et démarrez une tâche pour commencer.',
      inputPlaceholder: 'Décrivez ce que vous voulez que le PicoClaw fasse',
      newConversation: 'Nouvelle conversation',
      processing: 'Traitement...',
      agent: {
        defaultTitle: 'Assistant général',
        defaultDescription: "Aide générale sur le chat, la recherche et l'espace de travail.",
        kvmTitle: 'Contrôle à distance',
        kvmDescription: "Faites fonctionner l'hôte distant via NanoKVM.",
        switched: "Rôle d'agent modifié",
        switchFailed: "Échec du changement de rôle d'agent"
      },
      send: 'Envoyer',
      cancel: 'Annuler',
      status: {
        connecting: 'Connexion à la passerelle...',
        connected: 'Session PicoClaw connectée',
        disconnected: 'Session PicoClaw fermée',
        stopped: "Demande d'arrêt envoyée",
        runtimeStarted: 'Runtime PicoClaw démarré',
        runtimeStartFailed: 'Échec du démarrage du runtime PicoClaw',
        runtimeStopped: 'Runtime PicoClaw arrêté',
        runtimeStopFailed: "Échec de l'arrêt du runtime PicoClaw"
      },
      connection: {
        runtime: {
          checking: 'Vérification',
          ready: 'Runtime prêt',
          stopped: 'Runtime arrêté',
          unavailable: 'Runtime indisponible',
          configError: 'Erreur de configuration'
        },
        transport: {
          connecting: 'Connexion',
          connected: 'Connecté'
        },
        run: {
          idle: 'Inactif',
          busy: 'Occupé'
        }
      },
      message: {
        toolAction: 'Action',
        observation: 'Observation',
        screenshot: "Capture d'écran"
      },
      overlay: {
        locked: "PicoClaw contrôle l'appareil. La saisie manuelle est suspendue."
      },
      install: {
        install: 'Installer PicoClaw',
        installing: 'Installation de PicoClaw',
        success: 'PicoClaw installé avec succès',
        failed: "Échec de l'installation de PicoClaw",
        uninstalling: 'Désinstallation du runtime...',
        uninstalled: 'Runtime désinstallé avec succès.',
        uninstallFailed: 'Échec de la désinstallation.',
        requiredTitle: "PicoClaw n'est pas installé",
        requiredDescription: 'Installez PicoClaw avant de démarrer le runtime PicoClaw.',
        progressDescription: "PicoClaw est en cours de téléchargement et d'installation.",
        stages: {
          preparing: 'Préparation',
          downloading: 'Téléchargement',
          extracting: 'Extraction',
          installing: 'Installation',
          installed: 'Installé',
          install_timeout: 'Délai expiré',
          install_failed: 'Échec'
        }
      },
      model: {
        requiredTitle: 'La configuration du modèle est requise',
        requiredDescription: "Configurez le modèle PicoClaw avant d'utiliser le chat PicoClaw.",
        docsTitle: 'Guide de configuration',
        docsDesc: 'Modèles et protocoles pris en charge',
        menuLabel: 'Configurer le modèle',
        modelIdentifier: 'Identifiant du modèle',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Clé API',
        apiKeyPlaceholder: 'Saisissez la clé API du modèle',
        save: 'Enregistrer',
        saving: 'Enregistrement',
        saved: 'Configuration du modèle enregistrée',
        saveFailed: "Échec de l'enregistrement de la configuration du modèle",
        invalid: 'L’identifiant du modèle, l’API Base URL et la clé API sont requis'
      },
      uninstall: {
        menuLabel: 'Désinstaller',
        confirmTitle: 'Désinstaller PicoClaw',
        confirmContent:
          "Êtes-vous sûr de vouloir désinstaller PicoClaw? Cela supprimera l'exécutable et tous les fichiers de configuration.",
        confirmOk: 'Désinstaller',
        confirmCancel: 'Annuler'
      },
      history: {
        title: 'Historique',
        loading: 'Chargement des sessions...',
        emptyTitle: "Pas encore d'historique",
        emptyDescription: 'Les sessions précédentes PicoClaw apparaîtront ici.',
        loadFailed: "Échec du chargement de l'historique de la session",
        deleteFailed: 'Échec de la suppression de la session',
        deleteConfirmTitle: 'Supprimer la session',
        deleteConfirmContent: 'Etes-vous sûr de vouloir supprimer « {{title}} »?',
        deleteConfirmOk: 'Supprimer',
        deleteConfirmCancel: 'Annuler',
        messageCount_one: '{{count}} message',
        messageCount_other: '{{count}} messages'
      },
      config: {
        startRuntime: 'Démarrer PicoClaw',
        stopRuntime: 'Arrêter PicoClaw'
      },
      start: {
        title: 'Démarrer PicoClaw',
        description: "Démarrez le runtime pour commencer à utiliser l'assistant PicoClaw."
      }
    },
    error: {
      title: 'Nous avons rencontré un problème',
      refresh: 'Actualiser'
    },
    fullscreen: {
      toggle: 'Basculer vers le plein écran'
    },
    menu: {
      collapse: 'Réduire le menu',
      expand: 'Développer le menu'
    }
  }
};

export default fr;
