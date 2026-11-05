const en = {
  translation: {
    head: {
      desktop: 'Remote Desktop',
      login: 'Login',
      changePassword: 'Change Password',
      storage: 'Images & File sharing',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Login',
      placeholderUsername: 'Username',
      placeholderPassword: 'Password',
      placeholderCurrentPassword: 'Current password',
      placeholderPassword2: 'Please enter password again',
      noEmptyUsername: 'Username required',
      noEmptyPassword: 'Password required',
      passwordLength: 'Password must be between 8 and 72 characters',
      noAccount: 'Failed to get user information, please refresh web page or reset password',
      invalidUser: 'Invalid username or password',
      locked: 'Too many logins, please try again later',
      globalLocked: 'System under protection, please try again later',
      error: 'Unexpected error',
      invalidCurrentPassword: 'Current password is incorrect',
      changePassword: 'Change Password',
      changePasswordDesc: 'For the security of your device, please change the password!',
      differentPassword: 'Passwords do not match',
      illegalUsername: 'Username contains illegal characters',
      illegalPassword: 'Password contains illegal characters',
      forgetPassword: 'Forgot Password',
      ok: 'Ok',
      cancel: 'Cancel',
      loginButtonText: 'Login',
      tips: {
        reset1:
          'To reset the passwords, press and hold the BOOT button on the NanoKVM for 10 seconds.',
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
      success: 'Please go to the device to check the network status of NanoKVM.',
      failed: 'Operation failed, please try again.',
      invalidMode:
        'The current mode does not support network setup. Please go to your device and enable Wi-Fi configuration mode.',
      confirmBtn: 'Ok',
      finishBtn: 'Finished',
      ap: {
        authTitle: 'Authentication Required',
        authDescription: 'Please enter the AP password to continue',
        authFailed: 'Invalid AP password',
        passPlaceholder: 'AP password',
        verifyBtn: 'Verify'
      }
    },
    desktop: {
      readOnly: 'View Only',
      readOnlyTip:
        'This account cannot send keyboard or mouse input to the target machine, so the console only shows the screen.'
    },
    noConsole: {
      title: 'This account has no console access',
      description:
        'It was granted other capabilities. Open one of the pages it can use, or ask an administrator for console access.',
      nothing: 'This account has no feature permissions yet. Ask an administrator to grant some.'
    },

    screen: {
      scale: 'Scale',
      title: 'Screen',
      video: 'Video Mode',
      videoDirectTips: 'Enable HTTPS in "Settings > Device" to use this mode',
      resolution: 'Resolution',
      controlRegion: {
        title: 'Mouse Calibration',
        description:
          'Use this setting when the controlled device uses a non-16:9 resolution and the cursor is misaligned horizontally or vertically.',
        off: 'Off',
        auto: 'Auto',
        autoWarning: 'Calibration may fail when the user application has a pure black background.',
        manual: 'Manual',
        selectedResolution: 'Selected Area Resolution',
        unused: 'Not used',
        originalResolution: 'Original Resolution',
        selectResolution: 'Select original resolution',
        addResolution: 'Add custom resolution',
        add: 'Add',
        duplicateResolution: 'This resolution already exists.',
        width: 'Width',
        height: 'Height',
        apply: 'Calculate and Apply',
        invalidResolution: 'Enter a valid original resolution after the video is ready.',
        select: 'Select Area',
        clear: 'Restore Automatic',
        saveFailed: 'Failed to save the input area.',
        tooSmall: 'The selected area is too small.',
        previewUnavailable: 'Preview unavailable',
        clearConfirm: 'Restore automatic black-border detection?',
        dragHint: 'Drag to select the remote desktop area',
        finish: 'Done',
        confirm: 'Confirm',
        cancel: 'Cancel'
      },
      auto: 'Automatic',
      autoTips:
        "Screen tearing or mouse offset may occur at specific resolutions. Consider adjusting the remote host's resolution or disable automatic mode.",
      fps: 'FPS',
      customizeFps: 'Customize',
      quality: 'Quality',
      qualityLossless: 'Lossless',
      qualityHigh: 'High',
      qualityMedium: 'Medium',
      qualityLow: 'Low',
      frameDetect: 'Frame Detect',
      frameDetectTip:
        "Calculate the difference between frames. Stop transmitting video stream when no changes are detected on the remote host's screen.",
      resetHdmi: 'Reset HDMI',
      mixedH264: {
        title: 'H.264 stream conflict',
        description:
          'H.264 Direct and H.264 WebRTC are being used at the same time. This may cause screen tearing or corrupted video. Please use only one H.264 mode.'
      },
      webrtcConnectionFailed: {
        title: 'WebRTC connection failed',
        description: 'Check the network connection or switch the video mode.'
      },
      captureStatus: {
        hdmiError: 'HDMI screen error',
        unsupportedResolution: 'Current resolution is not supported',
        retrieving: 'Getting screen...',
        changingResolution: 'Switching resolution...',
        updateFailed: 'Screen cannot update right now',
        videoError: 'Video display error',
        noHdmi: 'No HDMI signal detected',
        unavailable: 'Screen cannot be displayed right now'
      }
    },
    keyboard: {
      title: 'Keyboard',
      paste: 'Paste',
      tips: 'Only standard keyboard letters and symbols are supported',
      placeholder: 'Please input',
      submit: 'Submit',
      virtual: 'Keyboard',
      readClipboard: 'Read from Clipboard',
      clipboardPermissionDenied:
        'Clipboard permission denied. Please allow clipboard access in your browser.',
      clipboardReadError: 'Failed to read clipboard',
      dropdownEnglish: 'English',
      dropdownGerman: 'German',
      dropdownFrench: 'French',
      dropdownRussian: 'Russian',
      shortcut: {
        title: 'Shortcuts',
        custom: 'Custom',
        capture: 'Click here to capture shortcut',
        clear: 'Clear',
        save: 'Save',
        captureTips:
          'Capturing system-level keys (such as the Windows key) requires full-screen permission.',
        enterFullScreen: 'Toggle full-screen mode.'
      },
      leaderKey: {
        title: 'Leader Key',
        desc: 'Bypass browser restrictions and send system shortcuts directly to the remote host.',
        howToUse: 'How to Use',
        simultaneous: {
          title: 'Simultaneous Mode',
          desc1: 'Press and hold the Leader Key, then press the shortcut.',
          desc2: 'Intuitive, but may conflict with system shortcuts.'
        },
        sequential: {
          title: 'Sequential Mode',
          desc1:
            'Press the Leader Key → press the shortcut in sequence → press the Leader Key again.',
          desc2: 'Requires more steps, but completely avoids system conflicts.'
        },
        enable: 'Enable Leader Key',
        tip: 'When assigned as a Leader Key, this key functions exclusively as a shortcut trigger and loses its default behavior.',
        placeholder: 'Please press the Leader Key',
        shiftRight: 'Right Shift',
        ctrlRight: 'Right Ctrl',
        metaRight: 'Right Win',
        submit: 'Submit',
        recorder: {
          rec: 'REC',
          activate: 'Activate keys',
          input: 'Please press the shortcut...'
        }
      }
    },
    mouse: {
      title: 'Mouse',
      cursor: 'Cursor style',
      default: 'Default cursor',
      pointer: 'Pointer cursor',
      cell: 'Cell cursor',
      text: 'Text cursor',
      grab: 'Grab cursor',
      hide: 'Hide cursor',
      mode: 'Mouse mode',
      absolute: 'Absolute mode',
      relative: 'Relative mode',
      direction: 'Wheel direction',
      scrollUp: 'Scroll up',
      scrollDown: 'Scroll down',
      speed: 'Wheel speed',
      fast: 'Fast',
      slow: 'Slow',
      requestPointer: 'Using relative mode. Please click desktop to get mouse pointer.',
      resetHid: 'Reset HID',
      hidOnly: {
        title: 'HID-Only mode',
        desc: "If your mouse and keyboard stop responding and resetting HID doesn't help, it could be a compatibility issue between the NanoKVM and the device. Try to enable HID-Only mode for better compatibility.",
        tip1: 'Enabling HID-Only mode will unmount the virtual U-disk and virtual network',
        tip2: 'In HID-Only mode, image mounting is disabled',
        tip3: 'NanoKVM will automatically reboot after switching modes',
        enable: 'Enable HID-Only mode',
        disable: 'Disable HID-Only mode'
      }
    },
    storage: {
      title: 'Images & File sharing',
      empty:
        'No images yet. Upload an ISO or IMG, or copy one onto the disk from the target machine.',
      notAttached: 'Nothing mounted',
      attached: 'Mounted: {{name}}',
      eject: 'Eject',
      mount: 'Mount',
      mountMode: 'Mount mode',
      mountModeDisk: 'Mass storage',
      mountModeCdrom: 'CD-ROM',
      openManager: 'Open file manager',
      refresh: 'Refresh',
      delete: 'Delete',
      deleteTitle: 'Delete medium',
      deleteConfirm: 'Delete {{name}}? The files inside it are lost.',
      downloadImage: 'Download the image',
      typePartition: 'Shared files',
      volumeLabel: 'Removable disk',
      groups: {
        share: 'File sharing',
        images: 'Images'
      },
      failed: 'Operation failed',
      hidOnly: 'HID-only mode: the virtual disk is unavailable',
      disabled: 'The virtual disk is disabled (Settings - Device)',
      force: {
        title: 'Take the medium back by force?',
        desc: 'The target machine is still using this medium. Taking it back re-enumerates the USB device and can lose whatever it has not written to disk yet.',
        menuHint:
          'The target machine is using this medium. Open the file manager to take it back by force.'
      },
      tips: {
        title: 'How to upload',
        usb1: 'Connect the NanoKVM to your computer via USB.',
        usb2: 'On this page, mount the shared files in mass storage mode.',
        usb3: 'Open the virtual disk on your computer and copy the image file to the root directory of the virtual disk.',
        usb4: 'Eject the disk when the copy is done: the image then shows up in the list.',
        scp1: 'Make sure the NanoKVM and your computer are on the same local network.',
        scp2: 'Open a terminal on your computer and use the SCP command to upload the image file to the /data directory on the NanoKVM.',
        scp3: 'Example: scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'TF Card',
        tf1: 'This method is supported on Linux system',
        tf2: 'Get TF card from the NanoKVM (for the FULL version, disassemble the case first).',
        tf3: 'Insert the TF card into a card reader and connect it to your computer.',
        tf4: 'Copy the image file to the /data directory on the TF card.',
        tf5: 'Insert the TF card into the NanoKVM.'
      },
      job: {
        running: 'Working on {{name}}'
      },
      enableDisk: {
        title: 'Enable the virtual disk?',
        desc: 'Mounting a medium needs the virtual disk, which is currently switched off. Enable it now? The keyboard and mouse of the target machine will disconnect for a moment.',
        menuHint: 'The virtual disk is disabled. Enable it in Settings - Device.',
        askDevice:
          'The virtual disk is disabled. An account with the device permission has to enable it first.'
      },
      add: {
        title: 'Add media',
        upload: 'Upload an ISO or IMG',
        fromUrl: 'Download from a URL',
        url: 'Image URL',
        urlRequired: 'Please enter a URL',
        onlyImages: 'Only .iso and .img files can be mounted',
        dropHint: 'Drag an ISO or IMG here, or click to choose a file',
        cdromOnlyIso: 'A CD-ROM can only carry an ISO 9660 image',
        uploadFailed: 'Upload failed',
        downloadFailed: 'Download failed',
        uploading: 'Uploading {{name}}',
        downloading: 'Downloading {{name}}',
        done: '{{name}} is ready',
        checksumFailed: 'The image does not match the SHA-256 checksum.',
        blocked: 'The target machine is using the disk',
        copyHint:
          'You can also copy an image into the data partition over SCP, or from the target machine.'
      },
      files: {
        selectMedium: 'Select a medium to browse the files inside it.',
        reasonAttached: 'This medium is attached to the target machine.',
        reasonAttachedHint:
          'Eject it first: the target machine has to release the disk before its files can be read.',
        reasonNotBrowsable: 'This medium holds a filesystem the file manager cannot open.',
        reasonNoLoop: 'This device cannot mount disk images (no loop support).',
        reasonISOImage:
          'An ISO 9660 image cannot be browsed here. It can still be mounted to the target machine.',
        empty: 'This folder is empty',
        noMatch: 'No files match the search.',
        free: '{{size}} free',
        search: 'Search this folder',
        sort: {
          name: 'Name',
          size: 'Size',
          type: 'Type',
          asc: 'Ascending',
          desc: 'Descending'
        },
        upload: 'Upload a file into the medium',
        deleteFolderTitle: 'Delete folder',
        deleteFolderConfirm:
          'Delete the folder {{name}} and everything inside it? This cannot be undone.',
        uploading: 'Uploading…',
        uploadFailed: 'Upload failed',
        download: 'Download',
        delete: 'Delete',
        deleteTitle: 'Delete file',
        deleteConfirm: 'Delete {{name}} from the medium?'
      },
      yes: 'Yes',
      no: 'No'
    },
    script: {
      title: 'Scripts',
      upload: 'Upload',
      run: 'Run',
      runBackground: 'Run Background',
      runFailed: 'Run failed',
      attention: 'Attention',
      delDesc: 'Are you sure you want to delete this file?',
      confirm: 'Yes',
      cancel: 'No',
      delete: 'Delete',
      close: 'Close'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'NanoKVM Terminal',
      serial: 'Serial Port Terminal',
      serialPort: 'Serial Port',
      serialPortPlaceholder: 'Please enter the serial port',
      baudrate: 'Baud rate',
      parity: 'Parity',
      parityNone: 'None',
      parityEven: 'Even',
      parityOdd: 'Odd',
      flowControl: 'Flow control',
      flowControlNone: 'None',
      flowControlSoft: 'Soft',
      flowControlHard: 'Hard',
      dataBits: 'Data bits',
      stopBits: 'Stop bits',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Sending command...',
      sent: 'Command sent',
      input: 'Please enter the MAC',
      ok: 'Ok'
    },
    download: {
      disabled:
        'The data partition is read-only while the target machine uses it: new images cannot be written, existing files can still be downloaded.',
      sha256: 'SHA-256 (optional)',
      sha256Placeholder: 'Enter a 64-character SHA-256 checksum',
      invalidSHA256: 'SHA-256 must be a 64-character hexadecimal string',
      cancel: 'Cancel',
      cancelFailed: 'Failed to cancel download'
    },
    power: {
      title: 'Power',
      showConfirm: 'Confirmation',
      showConfirmTip: 'Power operations require an extra confirmation',
      reset: 'Reset',
      power: 'Power',
      powerShort: 'Power (short click)',
      powerLong: 'Power (long click)',
      resetConfirm: 'Proceed reset operation?',
      powerConfirm: 'Proceed power operation?',
      okBtn: 'Yes',
      cancelBtn: 'No'
    },
    settings: {
      title: 'Settings',
      mcp: {
        title: 'MCP Service',
        service: 'Remote control MCP',
        serviceDesc:
          'Allow trusted MCP clients to control the keyboard and mouse and capture screenshots',
        securityWarning:
          'Anyone with this API key can control the remote host and view its screen. Use HTTPS and enable it only on trusted networks.',
        endpoint: 'Endpoint',
        apiKey: 'API Key',
        regenerateConfirmTitle: 'Regenerate MCP API key?',
        regenerateConfirmDesc: 'The current key will stop working immediately.',
        enableConfirmTitle: 'Enable external MCP control?',
        enableConfirmDesc: 'Enabling MCP will stop PicoClaw and close any active PicoClaw session.',
        failed: 'MCP operation failed',
        copyFailed: 'Copy failed. Copy manually.',
        okBtn: 'Confirm',
        cancelBtn: 'Cancel'
      },
      about: {
        title: 'About NanoKVM',
        information: 'Information',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Application Version',
        applicationTip: 'NanoKVM web application version',
        image: 'Image Version',
        imageTip: 'NanoKVM system image version',
        deviceKey: 'Device Key',
        community: 'Community',
        hostname: 'Hostname',
        hostnameUpdated: 'Hostname updated. Reboot to apply.',
        ipType: {
          Wired: 'Wired',
          Wireless: 'Wireless',
          Other: 'Other'
        }
      },
      appearance: {
        title: 'Appearance',
        display: 'Display',
        language: 'Language',
        languageDesc: 'Select the language for the interface',
        webTitle: 'Web Title',
        webTitleDesc: 'Customize the web page title',
        menuBar: {
          title: 'Menu Bar',
          mode: 'Display Mode',
          modeDesc: 'Display menu bar on the screen',
          modeOff: 'Off',
          modeAuto: 'Auto hide',
          modeAlways: 'Always visible',
          keyboardLedStatus: 'Keyboard lock indicators',
          keyboardLedStatusDesc: 'Display remote Num Lock, Caps Lock, and Scroll Lock status',
          icons: 'Submenu Icons',
          iconsDesc: 'Display submenu icons in the menu bar'
        }
      },
      keyboardLedStatus: {
        groupLabel: 'Remote keyboard lock status',
        indicatorLabel: '{{label}}: {{state}}',
        numLock: 'Num Lock',
        numLockShort: 'Num',
        capsLock: 'Caps Lock',
        capsLockShort: 'Caps',
        scrollLock: 'Scroll Lock',
        scrollLockShort: 'Scr',
        on: 'On',
        off: 'Off',
        unknown: 'Unknown'
      },
      device: {
        title: 'Device',
        oled: {
          title: 'OLED',
          description: 'Turn off OLED screen after',
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
        ssh: {
          description: 'Enable SSH remote access',
          tip: 'Set a strong password before enabling (Account - Change Password)'
        },
        advanced: 'Advanced Settings',
        swap: {
          title: 'Swap',
          disable: 'Disable',
          description: 'Set the swap file size',
          tip: "Enabling this feature could shorten your SD card's usable life!"
        },
        mouseJiggler: {
          title: 'Mouse Jiggler',
          description: 'Prevent the remote host from sleeping',
          disable: 'Disable',
          absolute: 'Absolute Mode',
          relative: 'Relative Mode'
        },
        mdns: {
          description: 'Enable mDNS discovery service',
          tip: "Turning it off if it's not needed"
        },
        hdmi: {
          description: 'Enable HDMI/monitor output',
          idleTimeoutTitle: 'Capture idle timeout',
          idleTimeoutDescription: 'Stop HDMI capture after there are no active viewers for',
          minutes: 'min'
        },
        autostart: {
          title: 'Autostart Scripts Settings',
          description: 'Manage scripts that run automatically on system startup',
          new: 'New',
          deleteConfirm: 'Are you sure you want to delete this file?',
          yes: 'Yes',
          no: 'No',
          scriptName: 'Autostart Script Name',
          scriptContent: 'Autostart Script Content',
          settings: 'Settings'
        },
        hidOnly: 'HID-Only Mode',
        hidOnlyDesc: 'Stop emulating virtual devices, retaining only basic HID control',
        disk: 'Virtual Disk',
        diskDesc: 'Mount SD card on the remote host',
        network: 'Virtual Network',
        networkDesc: 'Mount virtual network card on the remote host',
        reboot: 'Reboot',
        rebootDesc: 'Are you sure you want to reboot NanoKVM?',
        okBtn: 'Yes',
        cancelBtn: 'No',
        diskLocked: 'Off while an image is mounted (turning it on cancels the mount)',
        diskCancelMount:
          'Enabling the virtual disk cancels the mounted image and interrupts a running image download or upload. Continue?',
        diskBreakDownload: 'Enabling the virtual disk interrupts the image download. Continue?',
        attention: 'Attention',
        updateFailed: 'Failed to update the virtual device'
      },
      network: {
        title: 'Network',
        wifi: {
          title: 'Wi-Fi',
          description: 'Configure Wi-Fi',
          apMode: 'AP mode is enabled, connect to Wi-Fi by scanning QR code',
          connect: 'Join Wi-Fi',
          connectDesc1: 'Please enter the network ssid and password',
          connectDesc2: 'Please enter the password to join this network',
          disconnect: 'Are you sure to disconnect the network?',
          failed: 'Connection failed, please try again.',
          ssid: 'Name',
          password: 'Password',
          joinBtn: 'Join',
          confirmBtn: 'Ok',
          cancelBtn: 'Cancel'
        },
        tls: {
          description: 'Enable HTTPS protocol',
          tip: 'Be aware: Using HTTPS can increase latency, especially with MJPEG video mode.'
        },
        dns: {
          title: 'DNS',
          description: 'Configure DNS servers for NanoKVM',
          mode: 'Mode',
          dhcp: 'DHCP',
          manual: 'Manual',
          add: 'Add DNS',
          save: 'Save',
          invalid: 'Please enter a valid IP address',
          noDhcp: 'No DHCP DNS is currently available',
          saved: 'DNS settings saved',
          saveFailed: 'Failed to save DNS settings',
          unsaved: 'Unsaved changes',
          maxServers: 'Maximum {{count}} DNS servers allowed',
          dnsServers: 'DNS Servers',
          dhcpServersDescription: 'DNS servers are automatically obtained from DHCP',
          manualServersDescription: 'DNS servers can be edited manually',
          networkDetails: 'Network Details',
          interface: 'Interface',
          ipAddress: 'IP Address',
          subnetMask: 'Subnet Mask',
          router: 'Router',
          none: 'None'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Memory optimization',
          tip: 'When memory usage exceeds the limit, garbage collection is performed more aggressively to attempt to free up memory. A Tailscale restart is required for the change to take effect.'
        },
        swap: {
          title: 'Swap memory',
          tip: 'If issues persist after enabling memory optimization, try enabling swap memory. This sets the swap file size to 256MB by default, which can be adjusted in "Settings > Device".'
        },
        restart: 'Restart Tailscale?',
        stop: 'Stop Tailscale?',
        stopDesc: 'Log out Tailscale and disable automatic startup on boot.',
        loading: 'Loading...',
        notInstall: 'Tailscale not found! Please install.',
        install: 'Install',
        installing: 'Installing',
        failed: 'Install failed',
        retry: 'Please refresh and try again. Or try to install manually',
        download: 'Download the',
        package: 'installation package',
        unzip: 'and unzip it',
        upTailscale: 'Upload tailscale to NanoKVM directory /usr/bin/',
        upTailscaled: 'Upload tailscaled to NanoKVM directory /usr/sbin/',
        refresh: 'Refresh current page',
        notRunning: 'Tailscale is not running. Please start it to continue.',
        run: 'Start',
        notLogin:
          'The device has not been bound yet. Please login and bind this device to your account.',
        urlPeriod: 'This url is valid for 10 minutes',
        login: 'Login',
        loginSuccess: 'Login Success',
        enable: 'Enable Tailscale',
        deviceName: 'Device Name',
        deviceIP: 'Device IP',
        account: 'Account',
        logout: 'Logout',
        logoutDesc: 'Are you sure you want to logout?',
        uninstall: 'Uninstall Tailscale',
        uninstallDesc: 'Are you sure you want to uninstall Tailscale?',
        okBtn: 'Yes',
        cancelBtn: 'No'
      },
      update: {
        title: 'Check for Updates',
        queryFailed: 'Get version failed',
        updateFailed: 'Update failed. Please retry.',
        isLatest: 'You already have the latest version.',
        available: 'An update is available. Are you sure you want to update now?',
        updating: 'Update started. Please wait...',
        confirm: 'Confirm',
        cancel: 'Cancel',
        preview: 'Preview Updates',
        previewDesc: 'Get early access to new features and improvements',
        previewTip:
          'Please be aware that preview releases may contain bugs or incomplete functionality!',
        customServer: {
          title: 'Custom Update Server',
          desc: 'Check for and download online updates from a specified server',
          invalidUrl:
            'Enter a valid HTTP or HTTPS server directory without a query, fragment, or latest.json.',
          loadFailed: 'Failed to load the update server configuration.',
          saveFailed: 'Failed to save the update server configuration.',
          saved: 'Update server configuration saved.',
          save: 'Save',
          confirmTitle: 'Use a custom update server?',
          confirmDesc:
            'SHA-512 only checks that the package matches the manifest supplied by this server. It does not prove that the package is an official NanoKVM release. A faulty or malicious server may make the device unusable, cause data loss, or compromise the system.',
          confirm: 'Use Anyway',
          previewDisabled: 'Preview Updates are unavailable while a custom update server is enabled'
        },
        offline: {
          title: 'Offline App Updates',
          desc: 'Update just the App through local installation package',
          upload: 'Upload',
          checksumPlaceholder: 'SHA-256 checksum (optional)',
          invalidChecksum: 'The SHA-256 checksum must contain 64 hexadecimal characters.',
          checksumMismatch: 'SHA-256 verification failed. The package may be corrupted.',
          invalidName: 'Invalid filename format. Please download from GitHub releases.',
          updateFailed: 'Update failed. Please retry.'
        }
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Name',
        role: 'Role',
        roles: {
          admin: 'Administrator',
          user: 'User'
        },
        password: 'Password',
        updateBtn: 'Change',
        logoutBtn: 'Logout',
        logoutDesc: 'Are you sure you want to logout?',
        okBtn: 'Yes',
        cancelBtn: 'No',
        users: {
          title: 'Users',
          create: 'Create User',
          enabled: 'Enabled',
          disabled: 'Disabled',
          deviceOwner: 'Device owner',
          resetPassword: 'Reset Password',
          delete: 'Delete',
          deleteConfirm: 'Delete this user and revoke all of their sessions?',
          created: 'User created',
          deleted: 'User deleted',
          passwordUpdated: 'Password updated',
          loadFailed: 'Failed to load users',
          saveFailed: 'Failed to save user',
          deleteFailed: 'Failed to delete user',
          editPermissions: 'Permissions',
          mcpLossTitle: 'Revoke MCP access',
          mcpLossDesc:
            '{{name}} will lose MCP access. The MCP API key is shared by the whole device, so a copy of it keeps working until the key is regenerated. Regenerating it disconnects every MCP client until it is given the new key.',
          mcpLossRotate: 'Regenerate the MCP API key',
          mcpLossKeep:
            'The current key stays valid, and whoever has a copy can still control the keyboard and mouse. You can regenerate it later in the MCP settings.',
          mcpKeyRotated: 'MCP API key regenerated. MCP clients need the new key.'
        },
        permissions: {
          title: 'Permissions',
          editTitle: 'Edit Permissions',
          save: 'Save',
          saved: 'Saved',
          close: 'Close',
          groupConsole: 'Console',
          groupTarget: 'Target machine',
          groupLibrary: 'Media library',
          groupHost: 'This device',
          groupServices: 'Services',
          consoleView: 'Watch the screen',
          consoleControl: 'Keyboard & mouse',
          power: 'Power & wake',
          mediumAttach: 'Attach a medium',
          libraryRead: 'Browse the media library',
          libraryWrite: 'Manage the media library',
          terminal: 'Terminal & scripts',
          device: 'Device settings',
          network: 'Network settings',
          update: 'System update',
          mcp: 'MCP service',
          tailscale: 'Tailscale',
          ai: 'AI assistant',
          effectConsoleView:
            'Shows the target screen, and sets the video mode, resolution, frame rate and quality that every viewer shares.',
          effectConsoleControl: 'Sends keyboard and mouse input to the target machine.',
          effectPower:
            'Powers on, powers off and resets the target machine, and manages the Wake-on-LAN device list.',
          effectMediumAttach:
            'Mounts and ejects media on the target machine, and exchanges files with it through the shared partition.',
          effectLibraryRead: 'Lists and downloads the images and the files inside them.',
          effectLibraryWrite:
            'Uploads, creates and deletes images, and changes the files inside them.',
          effectTerminal: 'Gives a root shell on this device, without the web session in between.',
          effectDevice:
            'Enables SSH (also root), reboots the device, hands the raw data partition to the target machine, and changes the OLED, HDMI, mDNS, memory and swap settings.',
          effectNetwork: 'Changes Wi-Fi, DNS and TLS, which can take this device off the network.',
          effectUpdate: 'Installs firmware and application packages.',
          effectMcp:
            'Issues a device-wide API key that drives the keyboard, mouse and screenshots outside the web session; a copied key keeps working after this grant is revoked unless the key is regenerated, which is offered when the grant is removed.',
          effectTailscale: 'Joins this device to a VPN mesh.',
          effectAi:
            'Drives the device through a local interface that the other grants do not restrict, so this is effectively full device control.',
          fullControlWarning: 'These grants amount to full device control:',
          emptyWarning: 'This account will have no features at all and can only sign in.',
          impliedBy: 'Included by {{name}}',
          grantCount_one: '{{count}} grant',
          grantCount: '{{count}} grants',
          adminAll: 'Administrators hold every permission',
          catalogFailed:
            'The permission catalog could not be loaded. Close this dialog and try again.'
        }
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistant',
      empty: 'Open the panel and start a task to begin.',
      inputPlaceholder: 'Describe what you want the PicoClaw to do',
      newConversation: 'New conversation',
      processing: 'Processing...',
      agent: {
        defaultTitle: 'General Assistant',
        defaultDescription: 'General chat, search, and workspace help.',
        kvmTitle: 'Remote Control',
        kvmDescription: 'Operate the remote host through NanoKVM.',
        switched: 'Agent role switched',
        switchFailed: 'Failed to switch agent role'
      },
      send: 'Send',
      cancel: 'Cancel',
      status: {
        connecting: 'Connecting to gateway...',
        connected: 'PicoClaw session connected',
        disconnected: 'PicoClaw session closed',
        stopped: 'Stop request sent',
        runtimeStarted: 'PicoClaw runtime started',
        runtimeStartFailed: 'Failed to start PicoClaw runtime',
        runtimeStopped: 'PicoClaw runtime stopped',
        runtimeStopFailed: 'Failed to stop PicoClaw runtime',
        controlSwitchedToMCP: 'Control switched to the external MCP service'
      },
      connection: {
        runtime: {
          checking: 'Checking',
          restoring: 'Restoring PicoClaw',
          ready: 'Runtime ready',
          stopped: 'Runtime stopped',
          blockedByMCP: 'External MCP control is active',
          readyBlockedByMCP:
            'The runtime is running, but external MCP currently controls device input.',
          readyWithoutControl:
            'The runtime is running. Grant PicoClaw device control before reconnecting.',
          unavailable: 'Runtime unavailable',
          configError: 'Configuration error'
        },
        transport: {
          connecting: 'Connecting',
          connected: 'Connected',
          disconnected: 'Disconnected',
          reconnect: 'Reconnect',
          reconnectDescription: 'Reconnect to the running PicoClaw session.',
          reconnectBlocked: 'PicoClaw needs device control before reconnecting.'
        },
        run: {
          idle: 'Idle',
          busy: 'Busy'
        }
      },
      message: {
        toolAction: 'Action',
        observation: 'Observation',
        screenshot: 'Screenshot'
      },
      overlay: {
        locked: 'PicoClaw is controlling the device. Manual input is paused.'
      },
      control: {
        picoclaw: 'Device control: PicoClaw',
        picoclawDescription: 'PicoClaw can write keyboard and mouse input. Manual input may pause.',
        mcp: 'Device control: external MCP',
        mcpDescription: 'External MCP can write to the device. PicoClaw will not take over input.',
        off: 'Device control: manual/no AI',
        offDescription:
          'AI will not write keyboard or mouse input. Manual control remains available.',
        transitioning: 'Device control: switching',
        transitioningDescription: 'Device control is syncing. Please wait.',
        grant: 'Take over',
        release: 'Return control',
        releasing: 'Releasing...',
        switching: 'Switching...',
        releasingLabel: 'Device control: releasing',
        releasingDescription:
          'Device control is being returned. PicoClaw has stopped current writes.',
        granted: 'PicoClaw control granted',
        released: 'Device control returned',
        grantFailed: 'Failed to grant PicoClaw control',
        releaseFailed: 'Failed to release PicoClaw control',
        grantConfirmTitle: 'Switch device control to PicoClaw?',
        grantConfirmDesc: 'External MCP device writes will be interrupted.'
      },
      install: {
        install: 'Install PicoClaw',
        installing: 'Installing PicoClaw',
        success: 'PicoClaw installed successfully',
        failed: 'Failed to install PicoClaw',
        uninstalling: 'Uninstalling runtime...',
        uninstalled: 'Runtime uninstalled successfully.',
        uninstallFailed: 'Uninstall failed.',
        requiredTitle: 'PicoClaw is not installed',
        requiredDescription: 'Install PicoClaw before starting the PicoClaw runtime.',
        progressDescription: 'PicoClaw is being downloaded and installed.',
        stages: {
          preparing: 'Preparing',
          downloading: 'Downloading',
          extracting: 'Extracting',
          verifying: 'Verifying',
          installing: 'Installing',
          installed: 'Installed',
          install_timeout: 'Timed Out',
          install_failed: 'Failed'
        }
      },
      model: {
        requiredTitle: 'Model configuration is required',
        requiredDescription: 'Configure the PicoClaw model before using PicoClaw chat.',
        docsTitle: 'Configuration Guide',
        docsDesc: 'Supported models and protocols',
        menuLabel: 'Configure model',
        modelIdentifier: 'Model Identifier',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API Key',
        apiKeyPlaceholder: 'Enter the model API key',
        save: 'Save',
        saving: 'Saving',
        saved: 'Model configuration saved',
        saveFailed: 'Failed to save model configuration',
        invalid: 'Model identifier, API base URL, and API key are required'
      },
      uninstall: {
        menuLabel: 'Uninstall',
        confirmTitle: 'Uninstall PicoClaw',
        confirmContent:
          'Are you sure you want to uninstall PicoClaw? This will delete the executable and all configuration files.',
        confirmOk: 'Uninstall',
        confirmCancel: 'Cancel'
      },
      history: {
        title: 'History',
        loading: 'Loading sessions...',
        emptyTitle: 'No history yet',
        emptyDescription: 'Previous PicoClaw sessions will appear here.',
        loadFailed: 'Failed to load session history',
        deleteFailed: 'Failed to delete session',
        deleteConfirmTitle: 'Delete session',
        deleteConfirmContent: 'Are you sure you want to delete "{{title}}"?',
        deleteConfirmOk: 'Delete',
        deleteConfirmCancel: 'Cancel',
        messageCount_one: '{{count}} message',
        messageCount_other: '{{count}} messages',
        messageCount: '{{count}} messages'
      },
      config: {
        startRuntime: 'Start PicoClaw',
        stopRuntime: 'Stop PicoClaw'
      },
      start: {
        enableConfirmTitle: 'Switch control to PicoClaw?',
        enableConfirmDesc: 'External MCP device writes will be interrupted before PicoClaw starts.',
        enableConfirmOk: 'Start PicoClaw',
        enableConfirmCancel: 'Cancel',
        title: 'Start PicoClaw',
        description: 'Start the runtime to begin using the PicoClaw assistant.',
        switchFromMCP: 'Switch to PicoClaw and start',
        takeoverAndStart: 'Take over and start'
      }
    },
    error: {
      title: "We've ran into an issue",
      refresh: 'Refresh'
    },
    fullscreen: {
      toggle: 'Toggle Fullscreen'
    },
    menu: {
      collapse: 'Collapse Menu',
      expand: 'Expand Menu'
    }
  }
};

export default en;
