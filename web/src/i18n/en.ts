export const en = {
  translation: {
    language: 'Language',
    changePassword: 'Change Password',
    logout: 'Logout',
    keyboard: 'Keyboard',
    images: 'Images',
    loading: 'Loading',
    empty: 'Nothing Found',
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
      placeholderPassword: 'please enter password',
      placeholderPassword2: 'please enter password again',
      noEmptyUsername: 'username can not be empty',
      noEmptyPassword: 'password cant not be empty',
      noAccount: 'Failed to get user information, please refresh web page or reset password',
      invalidUser: 'invalid username or password',
      error: 'unexpected error',
      changePassword: 'Change Password',
      differentPassword: 'password do not match',
      illegalUsername: 'username contains illegal characters',
      illegalPassword: 'password contains illegal characters',
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
      fps: 'FPS',
      customizeFps: 'Customize',
      quality: 'Quality',
      frameDetect: 'Frame Detect',
      frameDetectTip:
        "Calculate the difference between frames. Stop transmitting video stream when no changes are detected on the remote host's screen."
    },
    cursor: {
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
      firmware: 'Application Version',
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
      usb: 'Virtual USB'
    },
    tailscale: {
      loading: 'Loading...',
      notInstalled: 'Tailscale not found! Please install.',
      install: 'Install',
      installing: 'Installing...',
      urlPeriod: 'This url is valid for 10 minutes',
      installed: 'Tailscale already installed. Please login.',
      login: 'Login',
      failed: 'Install failed',
      retry: 'Please refresh and try again. Or try to install manually',
      download: 'Download the',
      package: 'installation package',
      unzip: 'and unzip it',
      upTailscale: 'Upload tailscale to NanoKVM directory /usr/bin/',
      upTailscaled: 'Upload tailscaled to NanoKVM directory /usr/sbin/',
      refresh: 'Refresh current page'
    }
  }
};
