const en = {
  translation: {
    language: 'Language',
    changePassword: 'Change Password',
    logout: 'Logout',
    settings: 'Settings',
    showMouse: 'Show mouse',
    hideMouse: 'Hide mouse',
    power: 'Power',
    reset: 'Reset',
    powerShort: 'Power (short click)',
    powerLong: 'Power (long click)',
    hddLed: 'HDD LED',
    checkLibFailed: 'Failed to check runtime library, please try again',
    updateLibFailed: 'Failed to update runtime library, please try again',
    updatingLib: 'Updating runtime library. Please refresh the page after updating.',
    checkForUpdate: 'Check for Update',
    head: {
      desktop: 'Remote Desktop',
      login: 'Login',
      changePassword: 'Change Password',
      terminal: 'Terminal'
    },
    auth: {
      login: 'Login',
      placeholderUsername: 'Please enter username',
      placeholderPassword: 'Please enter password',
      placeholderPassword2: 'Please enter password again',
      noEmptyUsername: 'Username can not be empty',
      noEmptyPassword: 'Password cant not be empty',
      noAccount: 'Failed to get user information, please refresh web page or reset password',
      invalidUser: 'Invalid username or password',
      error: 'Unexpected error',
      changePassword: 'Change Password',
      differentPassword: 'Passwords do not match',
      illegalUsername: 'Username contains illegal characters',
      illegalPassword: 'Password contains illegal characters',
      forgetPassword: 'Forget Password',
      resetPassword: 'Reset Password',
      reset1: 'If you have forgotten the password, please follow the steps to reset it:',
      reset2: '1. Log into the NanoKVM device via SSH;',
      reset3: '2. Delete the file in the device: ',
      reset4: '3. Use the default account to login: ',
      ok: 'Ok',
      cancel: 'Cancel'
    },
    screen: {
      resolution: 'Resolution',
      auto: 'Automatic',
      autoTips:
        "Screen tearing or mouse offset may occur at specific resolutions. Consider adjusting the remote host's resolution or disable automatic mode.",
      fps: 'FPS',
      customizeFps: 'Customize',
      quality: 'Quality',
      frameDetect: 'Frame Detect',
      frameDetectTip:
        "Calculate the difference between frames. Stop transmitting video stream when no changes are detected on the remote host's screen."
    },
    keyboard: {
      paste: 'Paste',
      tips: 'Only standard keyboard letters and symbols are supported',
      placeholder: 'Please input',
      submit: 'Submit',
      virtual: 'Keyboard'
    },
    mouse: {
      default: 'Default cursor',
      pointer: 'Pointer cursor',
      cell: 'Cell cursor',
      text: 'Text cursor',
      grab: 'Grab cursor',
      hide: 'Hide cursor',
      mode: 'Mouse mode',
      absolute: 'Absolute mode',
      relative: 'Relative mode',
      requestPointer: 'Using relative mode. Please click desktop to get mouse pointer.',
      resetHid: 'Reset HID'
    },
    image: {
      title: 'Images',
      loading: 'Loading...',
      empty: 'Nothing Found',
      mountFailed: 'Mount Failed',
      mountDesc:
        "In some systems, it's necessary to eject the virtual disk on the remote host before mounting the image.",
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
      title: 'Script',
      upload: 'Upload',
      run: 'Run',
      runBackground: 'Run Background',
      runFailed: 'Run failed',
      attention: 'Attention',
      delDesc: 'Are you sure to delete this file?',
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
      confirm: 'Ok'
    },
    wol: {
      sending: 'Sending command...',
      sent: 'Command sent',
      input: 'Please enter the MAC',
      ok: 'Ok'
    },
    about: {
      title: 'About NanoKVM',
      information: 'Information',
      ip: 'IP',
      mdns: 'mDNS',
      application: 'Application Version',
      image: 'Image Version',
      deviceKey: 'Device Key',
      queryFailed: 'Query failed',
      community: 'Community'
    },
    update: {
      title: 'Check for Update',
      queryFailed: 'Get version failed',
      updateFailed: 'Update failed. Please retry.',
      isLatest: 'You already have the latest version.',
      available: 'An update is available. Are you sure to update?',
      updating: 'Update started. Please wait...',
      confirm: 'Confirm',
      cancel: 'Cancel'
    },
    virtualDevice: {
      network: 'Virtual Network',
      disk: 'Virtual Disk'
    },
    tailscale: {
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
      logout2: 'Sure to logout?'
    }
  }
};

export default en;
