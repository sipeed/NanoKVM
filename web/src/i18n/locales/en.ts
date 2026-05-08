const en = {
  translation: {
    head: {
      desktop: 'Remote Desktop',
      login: 'Login',
      changePassword: 'Change Password',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Login',
      placeholderUsername: 'Username',
      placeholderPassword: 'Password',
      placeholderPassword2: 'Please enter password again',
      noEmptyUsername: 'Username required',
      noEmptyPassword: 'Password required',
      noAccount: 'Failed to get user information, please refresh web page or reset password',
      invalidUser: 'Invalid username or password',
      locked: 'Too many logins, please try again later',
      globalLocked: 'System under protection, please try again later',
      error: 'Unexpected error',
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
    screen: {
      scale: 'Scale',
      title: 'Screen',
      video: 'Video Mode',
      videoDirectTips: 'Enable HTTPS in "Settings > Device" to use this mode',
      resolution: 'Resolution',
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
      resetHdmi: 'Reset HDMI'
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
    image: {
      title: 'Images',
      loading: 'Loading...',
      empty: 'Nothing Found',
      mountMode: 'Mount mode',
      mountFailed: 'Mount failed',
      mountDesc:
        'On some systems, you need to eject the virtual disk from the remote host before mounting the image.',
      unmountFailed: 'Unmount failed',
      unmountDesc:
        'On some systems, you need to manually eject from the remote host before unmounting the image.',
      refresh: 'Refresh the image list',
      attention: 'Attention',
      deleteConfirm: 'Are you sure you want to delete this image?',
      okBtn: 'Yes',
      cancelBtn: 'No',
      tips: {
        title: 'How to upload',
        usb1: 'Connect the NanoKVM to your computer via USB.',
        usb2: 'Ensure that the virtual disk is mounted (Settings - Virtual Disk).',
        usb3: 'Open the virtual disk on your computer and copy the image file to the root directory of the virtual disk.',
        scp1: 'Make sure the NanoKVM and your computer are on the same local network.',
        scp2: 'Open a terminal on your computer and use the SCP command to upload the image file to the /data directory on the NanoKVM.',
        scp3: 'Example: scp your-image-path root@your-nanokvm-ip:/data',
        tfCard: 'TF Card',
        tf1: 'This method is supported on Linux system',
        tf2: 'Get TF card from the NanoKVM (for the FULL version, disassemble the case first).',
        tf3: 'Insert the TF card into a card reader and connect it to your computer.',
        tf4: 'Copy the image file to the /data directory on the TF card.',
        tf5: 'Insert the TF card into the NanoKVM.'
      }
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
      title: 'Image Downloader',
      input: 'Please enter a remote image URL',
      ok: 'Ok',
      disabled: '/data partition is RO, so we cannot download the image',
      uploadbox: 'Drop file here or click to select',
      inputfile: 'Please enter the image File',
      NoISO: 'No ISO'
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
          icons: 'Submenu Icons',
          iconsDesc: 'Display submenu icons in the menu bar'
        }
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
          description: 'Enable HDMI/monitor output'
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
        cancelBtn: 'No'
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
        offline: {
          title: 'Offline Updates',
          desc: 'Update through local installation package',
          upload: 'Upload',
          invalidName: 'Invalid filename format. Please download from GitHub releases.',
          updateFailed: 'Update failed. Please retry.'
        }
      },
      account: {
        title: 'Account',
        webAccount: 'Web Account Name',
        password: 'Password',
        updateBtn: 'Change',
        logoutBtn: 'Logout',
        logoutDesc: 'Are you sure you want to logout?',
        okBtn: 'Yes',
        cancelBtn: 'No'
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
        runtimeStopFailed: 'Failed to stop PicoClaw runtime'
      },
      connection: {
        runtime: {
          checking: 'Checking',
          ready: 'Runtime ready',
          stopped: 'Runtime stopped',
          unavailable: 'Runtime unavailable',
          configError: 'Configuration error'
        },
        transport: {
          connecting: 'Connecting',
          connected: 'Connected'
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
        messageCount_other: '{{count}} messages'
      },
      config: {
        startRuntime: 'Start PicoClaw',
        stopRuntime: 'Stop PicoClaw'
      },
      start: {
        title: 'Start PicoClaw',
        description: 'Start the runtime to begin using the PicoClaw assistant.'
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
