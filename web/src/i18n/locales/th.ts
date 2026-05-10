const th = {
  translation: {
    head: {
      desktop: 'เดสก์ท็อประยะไกล',
      login: 'เข้าสู่ระบบ',
      changePassword: 'เปลี่ยนรหัสผ่าน',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'เข้าสู่ระบบ',
      placeholderUsername: 'ชื่อผู้ใช้งาน',
      placeholderPassword: 'รห้สผ่าน',
      placeholderPassword2: 'ใส่รหัสผ่านอีกครั้ง',
      noEmptyUsername: 'ต้องใส่ชื่อผู้ใช้งาน',
      noEmptyPassword: 'ต้องใส้รหัสผ่าน',
      noAccount: 'ไม่สามารถอ่านข้อมูลได้, โปรดรีเฟรชหน้าเว็บหรือรีเซ็ตรหัสผ่าน',
      invalidUser: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง',
      locked: 'มีการเข้าสู่ระบบมากเกินไป โปรดลองอีกครั้งในภายหลัง',
      globalLocked: 'ระบบอยู่ระหว่างการป้องกัน โปรดลองอีกครั้งในภายหลัง',
      error: 'เกิดข้อผิดพลาด',
      changePassword: 'เปลี่ยนรหัสผ่าน',
      changePasswordDesc: 'เพื่อความปลอดภัย, โปรดเปลี่ยนรหัสผ่าน!',
      differentPassword: 'รหัสผ่านไม่ตรงกัน',
      illegalUsername: 'ชื่อผู้ใช้ไม่สามารถมีอักขระที่ไม่ถูกต้อง',
      illegalPassword: 'รหัสผ่านไม่สามารถมีอักขระที่ไม่ถูกต้อง',
      forgetPassword: 'ลืมรหัสผ่าน',
      ok: 'โอเค',
      cancel: 'ยกเลิก',
      loginButtonText: 'เข้าสู่ระบบ',
      tips: {
        reset1: 'หากต้องการรีเซ็ตรหัสผ่าน ให้กดปุ่ม BOOT บน NanoKVM ค้างไว้ 10 วินาที',
        reset2: 'สำหรับวิธีแบบลงลึก โปรดอ่าน::',
        reset3: 'ค่าเริ่มต้นบัญชีเว็บ:',
        reset4: 'ค่าเริ่มต้นบัญชี SSH:',
        change1: 'โปรดทราบ การกระทำนี้จะเปลี่ยนรหัสดีงกล่าว:',
        change2: 'รหัสผ่านเว็บไชต์',
        change3: 'รหัส Root ของระบบ (ใช้เข้า SSH)',
        change4: 'เพื่อรีเช็ทรหัสผ่าน, กรุณากดปุ่ม BOOT บนอุปกรณ์ NanoKVM ค้างไว้.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'ตั้งค้า Wi-Fi สำหรับ NanoKVM',
      success: 'กรุณาตรวจสอบสถานะเครื่องข่ายของ NanoKVM และไปที่ IP address ใหม่',
      failed: 'เกิดข้อผิดพลาด กรุณาลองใหม่.',
      invalidMode:
        'โหมดปัจจุบันไม่รองรับการตั้งค่าเครือข่าย โปรดไปที่อุปกรณ์ของคุณและเปิดใช้งานโหมดการกำหนดค่า Wi-Fi',
      confirmBtn: 'โอเค',
      finishBtn: 'เสร็จ',
      ap: {
        authTitle: 'จำเป็นต้องมีการรับรองความถูกต้อง',
        authDescription: 'โปรดป้อนรหัสผ่าน AP เพื่อดำเนินการต่อ',
        authFailed: 'รหัสผ่าน AP ไม่ถูกต้อง',
        passPlaceholder: 'AP รหัสผ่าน',
        verifyBtn: 'ตรวจสอบ'
      }
    },
    screen: {
      scale: 'สเกล',
      title: 'หน้าจอ',
      video: 'โหมดวีดีโอ',
      videoDirectTips: 'เปิดใช้งาน HTTPS ใน "การตั้งค่า > อุปกรณ์" เพื่อใช้โหมดนี้',
      resolution: 'ความคมชัด',
      auto: 'อัตโนมัติ',
      autoTips:
        'อาการภาพฉีกขาดหรือเมาส์ไม่ตรงตำแหน่งอาจเกิดขึ้นที่ความละเอียดบางระดับ แนะนำให้ปรับความละเอียดของคอมพิวเตอร์ต้นทางหรือปิดโหมดอัตโนมัติ',
      fps: 'FPS',
      customizeFps: 'กำหนดเอง',
      quality: 'คุณภาพ',
      qualityLossless: 'ไม่สูญเสียคุณภาพ',
      qualityHigh: 'สูง',
      qualityMedium: 'กลาง',
      qualityLow: 'ต่ำ',
      frameDetect: 'ตรวจจับเฟรม',
      frameDetectTip:
        'ระบบจะคำนวณความแตกต่างระหว่างเฟรม และหยุดส่งสตรีมวิดีโอเมื่อไม่พบการเปลี่ยนแปลงบนหน้าจอของคอมพิวเตอร์ต้นทาง',
      resetHdmi: 'รีเช็ท HDMI'
    },
    keyboard: {
      title: 'คีบอร์ด',
      paste: 'วาง',
      tips: 'รองรับเฉพาะตัวอักษรและสัญลักษณ์มาตรฐานของแป้นพิมพ์เท่านั้น',
      placeholder: 'กรุณาป้อน',
      submit: 'ยืนยัน',
      virtual: 'คีบอร์ด',
      readClipboard: 'อ่านจากคลิปบอร์ด',
      clipboardPermissionDenied:
        'การอนุญาตคลิปบอร์ดถูกปฏิเสธ โปรดอนุญาตการเข้าถึงคลิปบอร์ดในเบราว์เซอร์ของคุณ',
      clipboardReadError: 'ไม่สามารถอ่านคลิปบอร์ดได้',
      dropdownEnglish: 'ภาษาอังกฤษ',
      dropdownGerman: 'เยอรมัน',
      dropdownFrench: 'ฝรั่งเศส',
      dropdownRussian: 'รัสเซีย',
      shortcut: {
        title: 'ทางลัด',
        custom: 'กำหนดเอง',
        capture: 'คลิกที่นี่เพื่อจับภาพทางลัด',
        clear: 'ชัดเจน',
        save: 'บันทึก',
        captureTips: 'การจับปุ่มระดับระบบ (เช่น ปุ่ม Windows) ต้องได้รับสิทธิ์โหมดเต็มหน้าจอ',
        enterFullScreen: 'สลับโหมดเต็มหน้าจอ'
      },
      leaderKey: {
        title: 'ปุ่ม Leader',
        desc: 'ข้ามข้อจำกัดของเบราว์เซอร์และส่งทางลัดของระบบไปยังโฮสต์ระยะไกลโดยตรง',
        howToUse: 'วิธีการใช้งาน',
        simultaneous: {
          title: 'โหมดพร้อมกัน',
          desc1: 'กดปุ่ม Leader ค้างไว้ แล้วกดปุ่มลัด',
          desc2: 'ใช้งานง่าย แต่อาจขัดแย้งกับทางลัดของระบบ'
        },
        sequential: {
          title: 'โหมดต่อเนื่อง',
          desc1: 'กดปุ่ม Leader → กดปุ่มลัดตามลำดับ → กดปุ่ม Leader อีกครั้ง',
          desc2: 'ต้องมีขั้นตอนเพิ่มเติม แต่หลีกเลี่ยงความขัดแย้งของระบบโดยสิ้นเชิง'
        },
        enable: 'เปิดใช้งานปุ่ม Leader',
        tip: 'เมื่อตั้งเป็นปุ่ม Leader ปุ่มนี้จะใช้เป็นตัวเรียกปุ่มลัดเท่านั้น และจะไม่ทำงานตามค่าเริ่มต้นอีกต่อไป',
        placeholder: 'กรุณากดปุ่ม Leader',
        shiftRight: 'Shift ขวา',
        ctrlRight: 'Ctrl ขวา',
        metaRight: 'Win ขวา',
        submit: 'ยืนยัน',
        recorder: {
          rec: 'บันทึก',
          activate: 'เปิดใช้งานปุ่ม',
          input: 'กรุณากดทางลัด...'
        }
      }
    },
    mouse: {
      title: 'เมาส์',
      cursor: 'รูปแบบเคอร์เซอร์',
      default: 'ตัวชี้เริ่มต้น',
      pointer: 'ตัวชี้แบบชี้',
      cell: 'ตัวชี้แบบเซลล์',
      text: 'ตัวชี้แบบข้อความ',
      grab: 'ตัวชี้แบบจับ',
      hide: 'ซ่อนตัวชี้',
      mode: 'โหมดเมาส์',
      absolute: 'โหมดสัมบูรณ์',
      relative: 'โหมดสัมพัทธ์',
      direction: 'ทิศทางล้อเลื่อน',
      scrollUp: 'เลื่อนขึ้น',
      scrollDown: 'เลื่อนลง',
      speed: 'ความเร็วล้อเลื่อน',
      fast: 'รวดเร็ว',
      slow: 'ช้า',
      requestPointer: 'กำลังใช้โหมดสัมพัทธ์ กรุณาคลิกที่เดสก์ท็อปเพื่อรับตัวชี้เมาส์',
      resetHid: 'รีเซ็ต HID',
      hidOnly: {
        title: 'โหมด HID เท่านั้น',
        desc: 'หากเมาส์และคีย์บอร์ดของคุณหยุดตอบสนองและการรีเซ็ต HID ไม่ช่วย อาจเป็นปัญหาความเข้ากันได้ระหว่าง NanoKVM และอุปกรณ์ ลองเปิดโหมด HID-Only เพื่อความเข้ากันได้ที่ดีขึ้น',
        tip1: 'การเปิดโหมด HID-Only จะปิดการทำงานดิสก์จำลองและ NIC จำลอง',
        tip2: 'ในโหมด HID-Only ดิสก์จะลองจะถูกปิดใช้งาน',
        tip3: 'NanoKVM จะรีบูตอัตโนมัติหลังจากเปลี่ยนโหมด',
        enable: 'เปิดใช้งานโหมด HID-Only',
        disable: 'ปิดใช้งานโหมด HID-Only'
      }
    },
    image: {
      title: 'ดิสก์จำลอง',
      loading: 'กำลังโหลด...',
      empty: 'ไม่พบดิสก์',
      mountMode: 'โหมดเมาท์',
      mountFailed: 'การติดตั้งล้มเหลว',
      mountDesc: 'ในบางระบบ, จะต้อง eject ดิสก์จำลองก่อนที่จะใส่ดิสก์ใหม่.',
      unmountFailed: 'การถอนติดตั้งล้มเหลว',
      unmountDesc:
        'ในบางระบบ คุณต้องดีดออกจากโฮสต์ระยะไกลด้วยตนเองก่อนที่จะยกเลิกการต่อเชื่อมอิมเมจ',
      refresh: 'รีเฟรชรายการรูปภาพ',
      attention: 'ความสนใจ',
      deleteConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบภาพนี้?',
      okBtn: 'ใช่',
      cancelBtn: 'ไม่ใช่',
      tips: {
        title: 'วิธีการอัปโหลด',
        usb1: 'เชื่อมต่อ NanoKVM กับคอมพิวเตอร์ของคุณผ่าน USB',
        usb2: 'ตรวจสอบให้แน่ใจว่าได้เปิดใช้งานดิสก์เสมือนแล้ว (ตั้งค่า - ดิสก์เสมือน)',
        usb3: 'เปิดดิสก์บนคอมพิวเตอร์ของคุณและคัดลอกไฟล์อิมเมจไปยังไดเรกทอรีหลักของดิสก์',
        scp1: 'ตรวจสอบให้แน่ใจว่า NanoKVM และคอมพิวเตอร์ของคุณอยู่ในเครือข่ายเดียวกัน',
        scp2: 'เปิดเทอร์มินัลบนคอมพิวเตอร์ของคุณและใช้คำสั่ง SCP เพื่ออัปโหลดไฟล์อิมเมจไปยังไดเรกทอรี /data บน NanoKVM',
        scp3: 'ตัวอย่าง: scp <ที่อยู่ของไฟล์> root@<ip อุปกรณ์>:/data',
        tfCard: 'การ์ด TF',
        tf1: 'วิธีนี้รองรับแค่บนระบบปฏิบัติการ Linux',
        tf2: 'นำการ์ด TF ออกจาก NanoKVM',
        tf3: 'ใส่การ์ด TF ลงในเครื่องอ่านการ์ดและเชื่อมต่อกับคอมพิวเตอร์ของคุณ',
        tf4: 'คัดลอกไฟล์อิมเมจไปยังไดเรกทอรี /data บนการ์ด TF',
        tf5: 'ใส่การ์ด TF กลับเข้า NanoKVM'
      }
    },
    script: {
      title: 'สคริปต์',
      upload: 'อัปโหลด',
      run: 'เรียกใช้',
      runBackground: 'เรียกใช้ในพื้นหลัง',
      runFailed: 'การเรียกใช้ล้มเหลว',
      attention: 'ความสนใจ',
      delDesc: 'คุณแน่ใจที่จะลบไฟล์นี้หรือไม่?',
      confirm: 'ใช่',
      cancel: 'ไม่ใช่',
      delete: 'ลบ',
      close: 'ปิด'
    },
    terminal: {
      title: 'เทอร์มินอล',
      nanokvm: 'เทอร์มินอลของ NanoKVM',
      serial: 'เทอร์มินอลของ Serial Port',
      serialPort: 'พอร์ตอนุกรม',
      serialPortPlaceholder: 'กรุณาเลือก serial port',
      baudrate: 'อัตราบอด',
      parity: 'พาริตี',
      parityNone: 'ไม่มี',
      parityEven: 'คู่',
      parityOdd: 'คี่',
      flowControl: 'การควบคุมการไหล',
      flowControlNone: 'ไม่มี',
      flowControlSoft: 'ซอฟต์แวร์',
      flowControlHard: 'ฮาร์ดแวร์',
      dataBits: 'บิตข้อมูล',
      stopBits: 'บิตหยุด',
      confirm: 'ยืนยัน'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'กำลังส่งคำสั่ง...',
      sent: 'ส่งคำสั่งแล้ว',
      input: 'กรุณาใส่ MAC Address ของเครื่องที่ต้องการปลุก',
      ok: 'ยืนยัน'
    },
    download: {
      title: 'ดาวโหลด Disk Image',
      input: 'กรุณาใส่ URL ของอิมเมจระยะไกล',
      ok: 'ยืนยัน',
      disabled: '/data มีการตั้งค่าเป็นอ่านอย่างเดียว ดังนั้นเราไม่สามารถดาวโหลด Disk Image ได้',
      uploadbox: 'วางไฟล์ที่นี่หรือคลิกเพื่อเลือก',
      inputfile: 'กรุณากรอกไฟล์ภาพ',
      NoISO: 'ไม่มี ISO'
    },
    power: {
      title: 'เปิด/ปิด',
      showConfirm: 'การยืนยัน',
      showConfirmTip: 'การทำงานของระบบไฟฟ้าต้องมีการยืนยันเพิ่มเติม',
      reset: 'รีเช็ท',
      power: 'เปิด/ปิด',
      powerShort: 'เปิด/ปิด (กดปล่อย)',
      powerLong: 'เปิด/ปิด (กดค้าง)',
      resetConfirm: 'ดำเนินการรีเซ็ตต่อไปหรือไม่',
      powerConfirm: 'ดำเนินการจ่ายไฟต่อหรือไม่',
      okBtn: 'ใช่',
      cancelBtn: 'ไม่ใช่'
    },
    settings: {
      title: 'การตั้งค่า',
      about: {
        title: 'เกี๋ยวกับ NanoKVM',
        information: 'ข้อมูล',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'เวอร์ชั่นแอปพิเคชั่น',
        applicationTip: 'เวอร์ชั่นเว็บ NanoKVM',
        image: 'เวอร์ชั่น Image ระบบ',
        imageTip: 'เวอร์ชั่น Image ระบบ NanoKVM',
        deviceKey: 'คีย์อุปกรณ์',
        community: 'ชุมชน',
        hostname: 'ชื่อโฮสต์',
        hostnameUpdated: 'อัปเดตชื่อโฮสต์แล้ว รีบูตเพื่อใช้',
        ipType: {
          Wired: 'มีสาย',
          Wireless: 'ไร้สาย',
          Other: 'อื่นๆ'
        }
      },
      appearance: {
        title: 'ลักษณะการแสดงผล',
        display: 'การแสดงผล',
        language: 'ภาษา',
        languageDesc: 'เลือกภาษาสำหรับอินเทอร์เฟซ',
        webTitle: 'ชื่อเว็บ',
        webTitleDesc: 'ปรับแต่งชื่อหน้าเว็บ',
        menuBar: {
          title: 'แถบเมนู',
          mode: 'โหมดการแสดงผล',
          modeDesc: 'แสดงแถบเมนูบนหน้าจอ',
          modeOff: 'ปิด',
          modeAuto: 'ซ่อนอัตโนมัติ',
          modeAlways: 'มองเห็นได้เสมอ',
          icons: 'ไอคอนเมนูย่อย',
          iconsDesc: 'แสดงไอคอนเมนูย่อยในแถบเมนู'
        }
      },
      device: {
        title: 'อุปกรณ์',
        oled: {
          title: 'OLED',
          description: 'เวลาก่อนจอ OLED จะปิดอัตโนมัติ',
          0: 'ไม่เลย',
          15: '15 วินาที',
          30: '30 วินาที',
          60: '1 นาที',
          180: '3 นาทร',
          300: '5 นาที',
          600: '10 นาที',
          1800: '30 นาที',
          3600: '1 ชั่วโมง'
        },
        ssh: {
          description: 'เปิดใช้งาน SSH',
          tip: 'ตั้งรหัสผ่านทีปลอดถัยก่อนเปิดใช้งาน (บัญชี - เปลี่ยนรหัสผ่าน)'
        },
        advanced: 'การตั้งค่าขั้นสูง',
        swap: {
          title: 'สลับ',
          disable: 'ปิดการใช้งาน',
          description: 'กำหนดขนาดไฟล์สลับ',
          tip: 'การเปิดใช้งานคุณลักษณะนี้อาจทำให้อายุการใช้งานของการ์ด SD สั้นลง!'
        },
        mouseJiggler: {
          title: 'เมาส์กระตุก',
          description: 'ป้องกันไม่ให้โฮสต์ระยะไกลเข้าสู่โหมดสลีป',
          disable: 'ปิดการใช้งาน',
          absolute: 'โหมดสัมบูรณ์',
          relative: 'โหมดสัมพัทธ์'
        },
        mdns: {
          description: 'เปิดใช้งานบริการค้นหา mDNS',
          tip: 'ปิดเครื่องหากไม่จำเป็น'
        },
        hdmi: {
          description: 'เปิดใช้งาน HDMI/เอาต์พุตมอนิเตอร์'
        },
        autostart: {
          title: 'การตั้งค่าสคริปต์เริ่มอัตโนมัติ',
          description: 'จัดการสคริปต์ที่ทำงานโดยอัตโนมัติเมื่อเริ่มต้นระบบ',
          new: 'ใหม่',
          deleteConfirm: 'คุณแน่ใจที่จะลบไฟล์นี้หรือไม่?',
          yes: 'ใช่',
          no: 'ไม่ใช่',
          scriptName: 'ชื่อสคริปต์เริ่มอัตโนมัติ',
          scriptContent: 'เนื้อหาสคริปต์เริ่มอัตโนมัติ',
          settings: 'การตั้งค่า'
        },
        hidOnly: 'HID-โหมดเท่านั้น',
        hidOnlyDesc: 'หยุดการจำลองอุปกรณ์เสมือน โดยคงไว้เพียงการควบคุม HID พื้นฐานเท่านั้น',
        disk: 'ดิสก์จำลอง',
        diskDesc: 'เปิดใช้งาน U-disk จำลอง',
        network: 'เครือข่ายจำลอง',
        networkDesc: 'เปิดใช้งานอุปกรณ์เครือข่ายจำลอง',
        reboot: 'รีบูต',
        rebootDesc: 'คุณแน่ใจหรือไม่ว่าต้องการรีบูต NanoKVM',
        okBtn: 'ใช่',
        cancelBtn: 'ไม่ใช่'
      },
      network: {
        title: 'เครือข่าย',
        wifi: {
          title: 'Wi-Fi',
          description: 'ตั้งค่า Wi-Fi',
          apMode: 'เปิดใช้งานโหมด AP แล้ว ให้เชื่อมต่อ Wi-Fi โดยสแกนรหัส QR',
          connect: 'เชื่อมต่อ Wi-Fi',
          connectDesc1: 'กรุณาใส่ SSID และรหัสผ่านของเครือข่าย',
          connectDesc2: 'กรุณาใส่รหัสผ่านเพื่อเข้าร่วมเครือข่ายนี้',
          disconnect: 'คุณแน่ใจหรือไม่ว่าต้องการตัดการเชื่อมต่อเครือข่าย?',
          failed: 'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง',
          ssid: 'ชื่อ',
          password: 'รหัสผ่าน',
          joinBtn: 'เข้าร่วม',
          confirmBtn: 'ตกลง',
          cancelBtn: 'ยกเลิก'
        },
        tls: {
          description: 'เปิดใช้งานโปรโตคอล HTTPS',
          tip: 'โปรดทราบ: การใช้ HTTPS อาจเพิ่มความหน่วง โดยเฉพาะในโหมดวิดีโอ MJPEG'
        },
        dns: {
          title: 'DNS',
          description: 'ตั้งค่าเซิร์ฟเวอร์ DNS สำหรับ NanoKVM',
          mode: 'โหมด',
          dhcp: 'DHCP',
          manual: 'กำหนดเอง',
          add: 'เพิ่ม DNS',
          save: 'บันทึก',
          invalid: 'กรุณาใส่ที่อยู่ IP ที่ถูกต้อง',
          noDhcp: 'ขณะนี้ไม่มี DHCP DNS ให้ใช้งาน',
          saved: 'บันทึกการตั้งค่า DNS แล้ว',
          saveFailed: 'บันทึกการตั้งค่า DNS ไม่สำเร็จ',
          unsaved: 'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก',
          maxServers: 'อนุญาตเซิร์ฟเวอร์ DNS ได้สูงสุด {{count}} รายการ',
          dnsServers: 'เซิร์ฟเวอร์ DNS',
          dhcpServersDescription: 'เซิร์ฟเวอร์ DNS จะได้รับจาก DHCP โดยอัตโนมัติ',
          manualServersDescription: 'สามารถแก้ไขเซิร์ฟเวอร์ DNS ได้ด้วยตนเอง',
          networkDetails: 'รายละเอียดเครือข่าย',
          interface: 'อินเทอร์เฟซ',
          ipAddress: 'ที่อยู่ IP',
          subnetMask: 'ซับเน็ตมาสก์',
          router: 'เราเตอร์',
          none: 'ไม่มี'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'การปรับแต่งหน่วยความจำ',
          tip: 'เมื่อการใช้งานหน่วยความจำเกินขีดจำกัด การเก็บขยะจะทำงานอย่างเข้มงวดมากขึ้นเพื่อพยายามปล่อยหน่วยความจำ คำแนะนำคือการตั้งค่าเป็น 50MB หากใช้ Tailscale และต้องทำการรีสตาร์ท Tailscale เพื่อให้การเปลี่ยนแปลงมีผล'
        },
        swap: {
          title: 'สลับหน่วยความจำ',
          tip: 'หากปัญหายังคงมีอยู่หลังจากเปิดใช้งานการเพิ่มประสิทธิภาพหน่วยความจำ ให้ลองเปิดใช้งานหน่วยความจำสลับ นี่เป็นการตั้งค่าขนาดไฟล์สลับเป็น 256MB ตามค่าเริ่มต้น ซึ่งสามารถปรับได้ใน "การตั้งค่า > อุปกรณ์"'
        },
        restart: 'คุณแน่ใจที่จะรีสตาร์ท Tailscale หรือไม่?',
        stop: 'คุณแน่ใจที่จะปิด Tailscale หรือไม่?',
        stopDesc: 'ออกจากระบบ Tailscale และปิดใช้งานการเริ่มต้นอัตโนมัติเมื่อบูตเครื่อง',
        loading: 'กำลังโหลด...',
        notInstall: 'ไม่พบ Tailscale! กรุณาติดตั้ง',
        install: 'ติดตั้ง',
        installing: 'กำลังติดตั้ง',
        failed: 'การติดตั้งล้มเหลว',
        retry: 'กรุณารีเฟรชและลองใหม่ หรือพยายามติดตั้งด้วยตนเอง',
        download: 'ดาวน์โหลด',
        package: 'แพ็กเกจการติดตั้ง',
        unzip: 'และแตกไฟล์',
        upTailscale: 'อัปโหลด tailscale ไปยังไดเรกทอรี /usr/bin/ ของ NanoKVM',
        upTailscaled: 'อัปโหลด tailscaled ไปยังไดเรกทอรี /usr/sbin/ ของ NanoKVM',
        refresh: 'รีเฟรชหน้าปัจจุบัน',
        notRunning: 'Tailscale ไม่ทำงาน กรุณาเริ่มต้นเพื่อดำเนินการต่อ',
        run: 'เริ่ม',
        notLogin: 'อุปกรณ์ยังไม่ได้ผูกบัญชี กรุณาล็อกอินและผูกอุปกรณ์นี้กับบัญชีของคุณ',
        urlPeriod: 'ลิงก์นี้ใช้ได้ 10 นาที',
        login: 'ล็อกอิน',
        loginSuccess: 'ล็อกอินสำเร็จ',
        enable: 'เปิดใช้งาน Tailscale',
        deviceName: 'ชื่ออุปกรณ์',
        deviceIP: 'IP อุปกรณ์',
        account: 'บัญชีผู้ใช้',
        logout: 'ออกจากระบบ',
        logoutDesc: 'คุณแน่ใจที่จะออกจากระบบหรือไม่?',
        uninstall: 'ถอนการติดตั้ง Tailscale',
        uninstallDesc: 'คุณแน่ใจหรือไม่ว่าต้องการถอนการติดตั้ง Tailscale',
        okBtn: 'ใช่',
        cancelBtn: 'ไม่ใช่'
      },
      update: {
        title: 'ตรวจสอบการอัปเดต',
        queryFailed: 'ไม่สามารถรับข้อมูลเวอร์ชันได้',
        updateFailed: 'การอัปเดตล้มเหลว กรุณาลองใหม่',
        isLatest: 'คุณมีเวอร์ชันล่าสุดแล้ว',
        available: 'มีการอัปเดตใหม่ คุณแน่ใจที่จะอัปเดตหรือไม่?',
        updating: 'กำลังเริ่มอัปเดต กรุณารอสักครู่...',
        confirm: 'ยืนยัน',
        cancel: 'ยกเลิก',
        preview: 'ดูตัวอย่างการอัปเดต',
        previewDesc: 'เข้าถึงฟีเจอร์และการปรับปรุงใหม่ก่อนใคร',
        previewTip:
          'โปรดทราบว่าการเผยแพร่ตัวอย่างอาจมีข้อบกพร่องหรือฟังก์ชันการทำงานที่ไม่สมบูรณ์!',
        offline: {
          title: 'อัปเดตออฟไลน์',
          desc: 'อัปเดตผ่านแพ็คเกจการติดตั้งในเครื่อง',
          upload: 'อัปโหลด',
          invalidName: 'รูปแบบชื่อไฟล์ไม่ถูกต้อง กรุณาดาวน์โหลดจากรุ่น GitHub',
          updateFailed: 'การอัปเดตล้มเหลว กรุณาลองใหม่'
        }
      },
      users: {
      title: 'การจัดการผู้ใช้',
      addUser: 'เพิ่มผู้ใช้',
      colUsername: 'ชื่อผู้ใช้',
      colRole: 'บทบาท',
      colEnabled: 'เปิดใช้งาน',
      colActions: 'การดำเนินการ',
      rolesTitle: 'ภาพรวมบทบาท',
      roleAdmin: 'เข้าถึงเต็มรูปแบบ + การจัดการผู้ใช้',
      roleOperator: 'การใช้ KVM: สตรีม คีย์บอร์ด เมาส์ ปุ่มเปิด/ปิด',
      roleViewer: 'ดูสตรีมเท่านั้น',
      changePassword: 'เปลี่ยนรหัสผ่าน',
      newPassword: 'รหัสผ่านใหม่',
      confirmPassword: 'ยืนยันรหัสผ่าน',
      pwdMismatch: 'รหัสผ่านไม่ตรงกัน',
      pwdSuccess: 'เปลี่ยนรหัสผ่านสำเร็จ',
      pwdFailed: 'ไม่สามารถเปลี่ยนรหัสผ่านได้',
      password: 'รหัสผ่าน',
      delete: 'ลบ',
      deleteConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?',
      createSuccess: 'สร้างผู้ใช้แล้ว',
      createFailed: 'การสร้างล้มเหลว',
      deleteSuccess: 'ลบผู้ใช้แล้ว',
      deleteFailed: 'การลบล้มเหลว',
      updateSuccess: 'อัปเดตแล้ว',
      updateFailed: 'การอัปเดตล้มเหลว',
      loadFailed: 'โหลดผู้ใช้ไม่สำเร็จ',
      usernameRequired: 'กรุณากรอกชื่อผู้ใช้',
      passwordRequired: 'กรุณากรอกรหัสผ่าน',
      okBtn: 'ตกลง',
      cancelBtn: 'ยกเลิก'
      },
      account: {
        title: 'บัญชี',
        webAccount: 'ชื่อผู้ใช้',
        password: 'รหัสผ่าน',
        updateBtn: 'ยืนยัน',
        logoutBtn: 'ออกจากระบบ',
        logoutDesc: 'คุณแน่ใจที่จะออกจากระบบหรือไม่?',
        okBtn: 'ใช่',
        cancelBtn: 'ไม่ใช่'
      }
    },
    picoclaw: {
      title: 'PicoClaw ผู้ช่วย',
      empty: 'เปิดแผงควบคุมและเริ่มงานเพื่อเริ่มต้น',
      inputPlaceholder: 'อธิบายสิ่งที่คุณต้องการให้ PicoClaw ทำ',
      newConversation: 'บทสนทนาใหม่',
      processing: 'กำลังประมวลผล...',
      agent: {
        defaultTitle: 'ผู้ช่วยทั่วไป',
        defaultDescription: 'แชททั่วไป การค้นหา และพื้นที่ช่วยเหลือ',
        kvmTitle: 'การควบคุมระยะไกล',
        kvmDescription: 'ใช้งานโฮสต์ระยะไกลผ่าน NanoKVM',
        switched: 'เปลี่ยนบทบาทตัวแทนแล้ว',
        switchFailed: 'ไม่สามารถเปลี่ยนบทบาทตัวแทนได้'
      },
      send: 'ส่ง',
      cancel: 'ยกเลิก',
      status: {
        connecting: 'กำลังเชื่อมต่อกับเกตเวย์...',
        connected: 'เชื่อมต่อเซสชัน PicoClaw แล้ว',
        disconnected: 'ตัดการเชื่อมต่อเซสชัน PicoClaw แล้ว',
        stopped: 'ส่งคำขอหยุดแล้ว',
        runtimeStarted: 'เริ่ม Runtime PicoClaw แล้ว',
        runtimeStartFailed: 'ไม่สามารถเริ่ม Runtime PicoClaw ได้',
        runtimeStopped: 'หยุด Runtime PicoClaw แล้ว',
        runtimeStopFailed: 'ไม่สามารถหยุด Runtime PicoClaw ได้'
      },
      connection: {
        runtime: {
          checking: 'กำลังตรวจสอบ',
          ready: 'Runtime พร้อมใช้งาน',
          stopped: 'หยุด Runtime แล้ว',
          unavailable: 'Runtime ไม่พร้อมใช้งาน',
          configError: 'ข้อผิดพลาดในการกำหนดค่า'
        },
        transport: {
          connecting: 'กำลังเชื่อมต่อ',
          connected: 'เชื่อมต่อแล้ว'
        },
        run: {
          idle: 'ไม่ได้ใช้งาน',
          busy: 'ไม่ว่าง'
        }
      },
      message: {
        toolAction: 'การกระทำ',
        observation: 'การสังเกต',
        screenshot: 'ภาพหน้าจอ'
      },
      overlay: {
        locked: 'PicoClaw กำลังควบคุมอุปกรณ์ การป้อนข้อมูลด้วยตนเองถูกหยุดชั่วคราว'
      },
      install: {
        install: 'ติดตั้ง PicoClaw',
        installing: 'กำลังติดตั้ง PicoClaw',
        success: 'PicoClaw ติดตั้งสำเร็จแล้ว',
        failed: 'ไม่สามารถติดตั้ง PicoClaw',
        uninstalling: 'กำลังถอนการติดตั้ง Runtime...',
        uninstalled: 'ถอนการติดตั้ง Runtime สำเร็จแล้ว',
        uninstallFailed: 'การถอนการติดตั้งล้มเหลว',
        requiredTitle: 'PicoClaw ไม่ได้ติดตั้ง',
        requiredDescription: 'ติดตั้ง PicoClaw ก่อนที่จะเริ่ม Runtime PicoClaw',
        progressDescription: 'PicoClaw กำลังดาวน์โหลดและติดตั้ง',
        stages: {
          preparing: 'กำลังเตรียมการ',
          downloading: 'กำลังดาวน์โหลด',
          extracting: 'กำลังแตกไฟล์',
          installing: 'กำลังติดตั้ง',
          installed: 'ติดตั้งแล้ว',
          install_timeout: 'หมดเวลา',
          install_failed: 'ล้มเหลว'
        }
      },
      model: {
        requiredTitle: 'จำเป็นต้องมีการกำหนดค่าโมเดล',
        requiredDescription: 'กำหนดค่าโมเดล PicoClaw ก่อนใช้แชท PicoClaw',
        docsTitle: 'คู่มือการกำหนดค่า',
        docsDesc: 'รุ่นและโปรโตคอลที่รองรับ',
        menuLabel: 'กำหนดค่าโมเดล',
        modelIdentifier: 'ตัวระบุรุ่น',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'คีย์ API',
        apiKeyPlaceholder: 'ป้อนคีย์ API ของโมเดล',
        save: 'บันทึก',
        saving: 'กำลังบันทึก',
        saved: 'บันทึกการกำหนดค่าโมเดลแล้ว',
        saveFailed: 'ไม่สามารถบันทึกการกำหนดค่าโมเดลได้',
        invalid: 'ต้องระบุรหัสโมเดล, API Base URL และคีย์ API'
      },
      uninstall: {
        menuLabel: 'ถอนการติดตั้ง',
        confirmTitle: 'ถอนการติดตั้ง PicoClaw',
        confirmContent:
          'คุณแน่ใจหรือไม่ว่าต้องการถอนการติดตั้ง PicoClaw การดำเนินการนี้จะลบไฟล์ปฏิบัติการและไฟล์การกำหนดค่าทั้งหมด',
        confirmOk: 'ถอนการติดตั้ง',
        confirmCancel: 'ยกเลิก'
      },
      history: {
        title: 'ประวัติ',
        loading: 'กำลังโหลดเซสชัน...',
        emptyTitle: 'ยังไม่มีประวัติ',
        emptyDescription: 'เซสชัน PicoClaw ก่อนหน้าจะปรากฏที่นี่',
        loadFailed: 'ไม่สามารถโหลดประวัติเซสชันได้',
        deleteFailed: 'ไม่สามารถลบเซสชันได้',
        deleteConfirmTitle: 'ลบเซสชัน',
        deleteConfirmContent: 'คุณแน่ใจหรือไม่ว่าต้องการลบ "{{title}}"',
        deleteConfirmOk: 'ลบ',
        deleteConfirmCancel: 'ยกเลิก',
        messageCount_one: '{{count}} ข้อความ',
        messageCount_other: '{{count}} ข้อความ'
      },
      config: {
        startRuntime: 'เริ่ม PicoClaw',
        stopRuntime: 'หยุด PicoClaw'
      },
      start: {
        title: 'เริ่ม PicoClaw',
        description: 'เริ่ม Runtime เพื่อเริ่มใช้ผู้ช่วย PicoClaw'
      }
    },
    error: {
      title: 'เราเจอปัญหา',
      refresh: 'รีเฟรช'
    },
    fullscreen: {
      toggle: 'โหมดเต็มหน้าจอ'
    },
    menu: {
      collapse: 'ย่อเมนู',
      expand: 'ขยายเมนู'
    }
  }
};

export default th;
