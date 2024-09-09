const fr = {
  translation: {
    language: 'Langue',
    changePassword: 'Changer le mot de passe',
    logout: 'Déconnexion',
    settings: 'Réglages',
    showMouse: 'Afficher la souris',
    hideMouse: 'Masquer la souris',
    power: 'Power',
    reset: 'Reset',
    powerShort: 'Power (appui court)',
    powerLong: 'Power (appui long)',
    hddLed: 'HDD LED',
    checkLibFailed: "Impossible de vérifier la bibliothèque d'exécution, veuillez réessayer",
    updateLibFailed: "Impossible de mettre à jour la bibliothèque d'exécution, veuillez réessayer",
    updatingLib:
      "Mise à jour de la bibliothèque d'exécution. Veuillez rafraîchir la page après la mise à jour.",
    checkForUpdate: 'Chercher des mises à jour',
    head: {
      desktop: 'Bureau à distance',
      login: 'Connexion',
      changePassword: 'Changer le mot de passe',
      terminal: 'Terminal'
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
      differentPassword: 'Les mots de passe ne correspondent pas',
      illegalUsername: "Le nom d'utilisateur contient des caractères illégaux",
      illegalPassword: 'Le mot de passe contient des caractères illégaux',
      forgetPassword: 'Mot de passe oublié',
      resetPassword: 'Réinitialiser le mot de passe',
      reset1:
        'Si vous avez oublié le mot de passe, veuillez suivre les étapes pour le réinitialiser:',
      reset2: "1. Connectez-vous à l'appareil NanoKVM via SSH;",
      reset3: "2. Supprimez le fichier de l'appareil: ",
      reset4: '3. Utilisez le compte par défaut pour vous connecter: ',
      ok: 'Se connecter',
      cancel: 'Annuler'
    },
    screen: {
      resolution: 'Résolution',
      auto: 'Automatique',
      autoTips:
        "Sous certaines résolutions, il peut y avoir des artefacts visuels ou un décalage de la souris. Veuillez ajuster la résolution de l'hôte distant ou désactiver le mode automatique.",
      fps: 'FPS',
      customizeFps: 'Personnaliser',
      quality: 'Qualité',
      frameDetect: 'Frame Detect',
      frameDetectTip:
        "Calcule la différence entre les images. Arrête la transmission du flux vidéo lorsqu'aucun changement n'est détecté sur l'écran de l'hôte distant"
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
      tips: {
        title: 'Comment télécharger',
        usb1: 'Connectez le NanoKVM à votre ordinateur via USB.',
        usb2: 'Assurez-vous que le disque virtuel est monté (Paramètres - Disque virtuel).',
        usb3: 'Ouvrez le disque virtuel sur votre ordinateur et copiez le fichier image dans le répertoire racine du disque.',
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
      sending: 'Envoi de la commande...',
      sent: 'Commande envoyée',
      input: "Veuillez entrer l'adresse MAC",
      ok: 'Ok'
    },
    about: {
      title: 'A propos de NanoKVM',
      information: 'Informations',
      ip: 'IP',
      mdns: 'mDNS',
      firmware: "Version de l'application",
      image: "Version de l'image",
      deviceKey: "Clé de l'appareil",
      queryFailed: 'Echec de la requête',
      community: 'Communauté'
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
    virtualDevice: {
      network: 'Réseau virtuel',
      usb: 'USB virtuel'
    },
    tailscale: {
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
      logout2: 'Voulez-vous vous déconnecter?'
    }
  }
};

export default fr;
