const th = {
    translation: {
      head: {
        desktop: 'Remote Desktop',
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
          reset1:
            'เพื่อรีเช็ทรหัสผ่าน, กดปุ่ม BOOT ค้างไว้ 10 วินาที.',
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
        confirmBtn: 'โอเค',
        finishBtn: 'เสร็จ'
      },
      screen: {
        video: 'โหมดวีดีโอ',
        resolution: 'ความคมชัด',
        auto: 'อัตโนมัติ',
        autoTips:
          "อาการภาพฉีกขาดหรือเมาส์ไม่ตรงตำแหน่งอาจเกิดขึ้นที่ความละเอียดบางระดับ แนะนำให้ปรับความละเอียดของคอมพิวเตอร์ต้นทางหรือปิดโหมดอัตโนมัติ",
        fps: 'FPS',
        customizeFps: 'กำหนดเอง',
        quality: 'คุณภาพ',
        qualityLossless: 'ไม่สูญเสียคุณภาพ',
        qualityHigh: 'สูง',
        qualityMedium: 'กลาง',
        qualityLow: 'ต่ำ',
        frameDetect: 'ตรวจจับเฟรม',
        frameDetectTip:
          "ระบบจะคำนวณความแตกต่างระหว่างเฟรม และหยุดส่งสตรีมวิดีโอเมื่อไม่พบการเปลี่ยนแปลงบนหน้าจอของคอมพิวเตอร์ต้นทาง",
        resetHdmi: 'รีเช็ท HDMI'
      },
      keyboard: {
        paste: 'วาง',
        tips: 'รองรับเฉพาะตัวอักษรและสัญลักษณ์มาตรฐานของแป้นพิมพ์เท่านั้น',
        placeholder: 'กรุณาป้อน',
        submit: 'ยืนยัน',
        virtual: 'คีบอร์ด',
        ctrlaltdel: 'Ctrl+Alt+Del'
      },
      mouse: {
        default: 'ตัวชี้เริ่มต้น',
        pointer: 'ตัวชี้แบบชี้',
        cell: 'ตัวชี้แบบเซลล์',
        text: 'ตัวชี้แบบข้อความ',
        grab: 'ตัวชี้แบบจับ',
        hide: 'ซ่อนตัวชี้',
        mode: 'โหมดเมาส์',
        absolute: 'โหมดสัมบูรณ์',
        relative: 'โหมดสัมพัทธ์',
        requestPointer: 'กำลังใช้โหมดสัมพัทธ์ กรุณาคลิกที่เดสก์ท็อปเพื่อรับตัวชี้เมาส์',
        resetHid: 'รีเซ็ต HID',
        hidOnly: {
          title: 'โหมด HID-Only',
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
        mountFailed: 'การติดตั้งล้มเหลว',
        mountDesc:
          "ในบางระบบ, จะต้อง eject ดิสก์จำลองก่อนที่จะใส่ดิสก์ใหม่.",
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
        serialPort: 'Serial Port',
        serialPortPlaceholder: 'กรุณาเลือก serial port',
        baudrate: 'Baud rate',
        confirm: 'ยืนยัน',
        parity: 'Parity',
        parityNone: 'ไม่มี',
        parityEven: 'คู่',
        parityOdd: 'คี่',
        flowControl: 'การควบคุมการไหล',
        flowControlNone: 'ไม่มี',
        flowControlSoft: 'ซอฟต์',
        flowControlHard: 'ฮาร์ด',
        dataBits: 'บิตข้อมูล',
        stopBits: 'บิตหยุด'
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
        input: 'กรุณาใส่ลิงค์ของ Disk Image.',
        ok: 'ยืนยัน',
        disabled: '/data มีการตั้งค่าเป็นอ่านอย่างเดียว ดังนั้นเราไม่สามารถดาวโหลด Disk Image ได้'
      },
      power: {
        title: 'เปิด/ปิด',
        reset: 'รีเช็ท',
        power: 'เปิด/ปิด',
        powerShort: 'เปิด/ปิด (กดปล่อย)',
        powerLong: 'เปิด/ปิด (กดค้าง)'
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
          community: 'ชุมชน'
        },
        appearance: {
            title: 'ลักษณะการแสดงผล',
            display: 'การแสดงผล',
            language: 'ภาษา',
            menuBar: 'แถบเมนู',
            menuBarDesc: 'แสดงไอคอนในแถบเมนู'
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
          wifi: {
            title: 'Wi-Fi',
            description: 'ตั้งค่า Wi-Fi',
            setBtn: 'ยืนยัน'
          },
          ssh: {
            description: 'เปิดใช้งาน SSH',
            tip: 'ตั้งรหัสผ่านทีปลอดถัยก่อนเปิดใช้งาน (บัญชี - เปลี่ยนรหัสผ่าน)'
          },
          disk: 'ดิสก์จำลอง',
          diskDesc: 'เปิดใช้งาน U-disk จำลอง',
          network: 'เครือข่ายจำลอง',
          networkDesc: 'เปิดใช้งานอุปกรณ์เครือข่ายจำลอง',
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
            title: 'การปรับแต่งหน่วยความจำ',
            tip: "เมื่อการใช้งานหน่วยความจำเกินขีดจำกัด การเก็บขยะจะทำงานอย่างเข้มงวดมากขึ้นเพื่อพยายามปล่อยหน่วยความจำ คำแนะนำคือการตั้งค่าเป็น 50MB หากใช้ Tailscale และต้องทำการรีสตาร์ท Tailscale เพื่อให้การเปลี่ยนแปลงมีผล",
            disable: 'ปิดใช้งาน'
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
          notLogin: 'อุปกรณ์ยังไม่ได้ผูกบัญชี กรุณาล็อกอินและผูกอุปกรณ์นี้กับบัญชีของคุณ',
          urlPeriod: 'ลิงก์นี้ใช้ได้ 10 นาที',
          login: 'ล็อกอิน',
          loginSuccess: 'ล็อกอินสำเร็จ',
          enable: 'เปิดใช้งาน Tailscale',
          deviceName: 'ชื่ออุปกรณ์',
          deviceIP: 'IP อุปกรณ์',
          account: 'บัญชีผู้ใช้',
          logout: 'ออกจากระบบ',
          logout2: 'คุณแน่ใจที่จะออกจากระบบหรือไม่?',
          uninstall: 'ถอนการติดตั้ง Tailscale',
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
            previewTip: 'โปรดทราบว่าการเผยแพร่ตัวอย่างอาจมีข้อบกพร่องหรือฟังก์ชันการทำงานที่ไม่สมบูรณ์!'
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
