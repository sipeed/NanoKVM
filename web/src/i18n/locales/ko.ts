const ko = {
  translation: {
    head: {
      desktop: '원격 데스크톱',
      login: '로그인',
      changePassword: '비밀번호 변경',
      terminal: '터미널',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: '로그인',
      placeholderUsername: '사용자 이름을 입력하세요.',
      placeholderPassword: '비밀번호를 입력하세요.',
      placeholderPassword2: '비밀번호를 다시 입력하세요.',
      noEmptyUsername: '사용자 이름은 비어있을 수 없습니다.',
      noEmptyPassword: '비밀번호는 비어있을 수 없습니다.',
      noAccount:
        '사용자 정보를 불러오는 데 실패했습니다. 페이지를 새로고침하거나 비밀번호를 초기화하세요.',
      invalidUser: '사용자 이름이나 비밀번호가 틀렸습니다.',
      locked: '로그인 횟수가 너무 많습니다. 나중에 다시 시도해 주세요.',
      globalLocked: '시스템이 보호 중입니다. 나중에 다시 시도해 주세요.',
      error: '알 수 없는 오류',
      changePassword: '비밀번호 변경',
      changePasswordDesc: '보안을 위해 웹 로그인 비밀번호를 변경하세요.',
      differentPassword: '비밀번호가 서로 일치하지 않습니다.',
      illegalUsername: '사용자 이름에 사용할 수 없는 문자가 있습니다.',
      illegalPassword: '비밀번호에 사용할 수 없는 문자가 있습니다.',
      forgetPassword: '비밀번호 분실',
      ok: '확인',
      cancel: '취소',
      loginButtonText: '로그인',
      tips: {
        reset1: '비밀번호를 재설정하려면 NanoKVM의 BOOT 버튼을 10초 동안 누르고 계세요.',
        reset2: '자세한 절차는 이 문서를 참조하세요:',
        reset3: '웹 기본 계정:',
        reset4: 'SSH 기본 계정:',
        change1: '이 작업을 수행하면 다음 비밀번호가 변경됩니다:',
        change2: '웹 로그인 비밀번호',
        change3: '시스템 루트 비밀번호 (SSH 로그인 비밀번호)',
        change4: '비밀번호를 재설정하려면 NanoKVM의 BOOT 버튼을 길게 누르세요.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'NanoKVM Wi-Fi 설정',
      success: 'NanoKVM의 네트워크 상태를 확인하고 새 IP 주소로 접속하세요.',
      failed: '작업에 실패했습니다. 다시 시도하세요.',
      invalidMode:
        '현재 모드는 네트워크 설정을 지원하지 않습니다. 장치로 이동하여 Wi-Fi 구성 모드를 활성화하십시오.',
      confirmBtn: '확인',
      finishBtn: '완료',
      ap: {
        authTitle: '인증 필요',
        authDescription: '계속하려면 AP 비밀번호를 입력하세요',
        authFailed: '잘못된 AP 비밀번호',
        passPlaceholder: 'AP 비밀번호',
        verifyBtn: '확인'
      }
    },
    screen: {
      scale: '규모',
      title: '화면',
      video: '비디오 모드',
      videoDirectTips: '이 모드를 사용하려면 "설정 > 장치"에서 HTTPS를 활성화하세요',
      resolution: '해상도',
      auto: '자동 설정',
      autoTips:
        '일부 해상도에서는 화면이 왜곡되거나 마우스 동작이 비정상적으로 나타날 수 있습니다. 원격 컴퓨터의 해상도를 변경하거나 자동 설정 대신 수동 설정을 사용해 보세요.',
      fps: 'FPS',
      customizeFps: '사용자 지정',
      quality: '품질',
      qualityLossless: '무손실',
      qualityHigh: '높음',
      qualityMedium: '중간',
      qualityLow: '낮음',
      frameDetect: '프레임 탐지',
      frameDetectTip:
        '프레임 간의 차이를 계산합니다. 원격 호스트 화면에 변경 사항이 감지되지 않으면 비디오 스트림 전송을 중지합니다.',
      resetHdmi: 'HDMI 초기화'
    },
    keyboard: {
      title: '키보드',
      paste: '붙여넣기',
      tips: '표준 키보드 문자 및 기호만 지원됩니다',
      placeholder: '입력하세요',
      submit: '전송',
      virtual: '키보드',
      readClipboard: '클립보드에서 읽기',
      clipboardPermissionDenied:
        '클립보드 권한이 거부되었습니다. 브라우저에서 클립보드 액세스를 허용해 주세요.',
      clipboardReadError: '클립보드를 읽지 못했습니다.',
      dropdownEnglish: '영어',
      dropdownGerman: '독일어',
      dropdownFrench: '프랑스어',
      dropdownRussian: '러시아어',
      shortcut: {
        title: '바로가기',
        custom: '관습',
        capture: '바로가기를 캡처하려면 여기를 클릭하세요',
        clear: '클리어',
        save: '저장',
        captureTips: 'Windows 키와 같은 시스템 수준 키를 캡처하려면 전체 화면 권한이 필요합니다.',
        enterFullScreen: '전체 화면 모드를 전환합니다.'
      },
      leaderKey: {
        title: '리더 키',
        desc: '브라우저 제한을 우회하고 시스템 바로가기를 원격 호스트에 직접 보냅니다.',
        howToUse: '사용방법',
        simultaneous: {
          title: '동시 모드',
          desc1: '리더 키를 누른 상태에서 단축키를 누르세요.',
          desc2: '직관적이지만 시스템 단축키와 충돌할 수 있습니다.'
        },
        sequential: {
          title: '순차 모드',
          desc1: '리더 키를 누름 → 단축키를 순서대로 누름 → 리더 키를 다시 누름.',
          desc2: '더 많은 단계가 필요하지만 시스템 충돌을 완전히 방지합니다.'
        },
        enable: '리더 키 활성화',
        tip: '리더 키로 지정하면 이 키는 단축키 트리거로만 동작하며 기본 동작을 잃습니다.',
        placeholder: '리더 키를 누르세요',
        shiftRight: '오른쪽 Shift',
        ctrlRight: '오른쪽 Ctrl',
        metaRight: '오른쪽 Win',
        submit: '전송',
        recorder: {
          rec: 'REC',
          activate: '키 활성화',
          input: '단축키를 눌러주세요...'
        }
      }
    },
    mouse: {
      title: '마우스',
      cursor: '커서 스타일',
      default: '기본 커서',
      pointer: '포인터 커서',
      cell: '셀 커서',
      text: '텍스트 커서',
      grab: '잡기 커서',
      hide: '커서 숨기기',
      mode: '마우스 모드',
      absolute: '절대값 모드',
      relative: '상대값 모드',
      direction: '스크롤 휠 방향',
      scrollUp: '위로 스크롤',
      scrollDown: '아래로 스크롤',
      speed: '스크롤 휠 속도',
      fast: '빠름',
      slow: '느림',
      requestPointer: '상대값 모드를 사용 중입니다. 커서를 찾으려면 데스크톱을 클릭하세요.',
      resetHid: 'HID 초기화',
      hidOnly: {
        title: 'HID 전용 모드',
        desc: '마우스와 키보드가 응답하지 않고 HID 초기화도 도움이 되지 않는다면, NanoKVM과 장치 간의 호환성 문제일 수 있습니다. 더 나은 호환성을 위해 HID 전용 모드를 활성화해 보세요.',
        tip1: 'HID 전용 모드를 활성화하면 가상 USB와 가상 네트워크가 언마운트됩니다',
        tip2: 'HID 전용 모드에서는 이미지 마운트가 비활성화됩니다',
        tip3: '모드 전환 후 NanoKVM이 자동으로 재부팅됩니다',
        enable: 'HID 전용 모드 활성화',
        disable: 'HID 전용 모드 비활성화'
      }
    },
    image: {
      title: '이미지',
      loading: '불러오는 중...',
      empty: '아무것도 없습니다.',
      mountMode: '마운트 모드',
      mountFailed: '마운트 실패',
      mountDesc:
        '일부 시스템에서는 이미지를 마운트하기 전에 원격 호스트에서 가상 디스크를 제거해야 합니다.',
      unmountFailed: '언마운트 실패',
      unmountDesc:
        '일부 시스템에서는 이미지를 언마운트하기 전에 원격 호스트에서 수동으로 제거하여야 합니다.',
      refresh: '이미지 목록 새로고침',
      attention: '주의',
      deleteConfirm: '이 이미지를 제거하시겠습니까?',
      okBtn: '네',
      cancelBtn: '아니오',
      tips: {
        title: '업로드 방법',
        usb1: 'USB를 통해 NanoKVM을 컴퓨터에 연결하세요.',
        usb2: '가상 디스크가 마운트되었는지 확인하세요. (설정 - 가상 디스크).',
        usb3: '컴퓨터에서 가상 디스크를 열고 이미지 파일을 가상 디스크의 루트 디렉토리로 복사하세요.',
        scp1: 'NanoKVM과 컴퓨터가 동일한 로컬 네트워크에 있는지 확인하세요.',
        scp2: '컴퓨터에서 터미널을 열고 SCP 명령을 사용하여 이미지 파일을 NanoKVM의 /data 디렉터리에 업로드하세요.',
        scp3: '예시: scp [이미지 파일 경로] root@[NanoKVM IP 주소]:/data',
        tfCard: 'TF 카드',
        tf1: '이 방법은 Linux 시스템에서 지원됩니다',
        tf2: 'NanoKVM에서 TF 카드를 가져옵니다(전체 버전의 경우 먼저 케이스를 분해하세요).',
        tf3: 'TF 카드를 카드 리더기에 삽입하고 컴퓨터에 연결하세요.',
        tf4: '이미지 파일을 TF 카드의 /data 디렉터리에 복사하세요.',
        tf5: 'TF 카드를 NanoKVM에 삽입하세요.'
      }
    },
    script: {
      title: '스크립트',
      upload: '업로드',
      run: '실행',
      runBackground: '백그라운드에서 실행',
      runFailed: '실행 실패',
      attention: '주의',
      delDesc: '이 파일을 정말로 삭제합니까?',
      confirm: '네',
      cancel: '아니오',
      delete: '삭제',
      close: '닫기'
    },
    terminal: {
      title: '터미널',
      nanokvm: 'NanoKVM 터미널',
      serial: '시리얼 포트 터미널',
      serialPort: '시리얼 포트',
      serialPortPlaceholder: '시리얼 포트를 입력하세요',
      baudrate: '전송 속도',
      parity: '패리티',
      parityNone: '없음',
      parityEven: '짝수',
      parityOdd: '홀수',
      flowControl: '흐름 제어',
      flowControlNone: '없음',
      flowControlSoft: '소프트웨어',
      flowControlHard: '하드웨어',
      dataBits: '데이터 비트',
      stopBits: '정지 비트',
      confirm: '확인'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: '패킷 전송 중...',
      sent: '패킷 전송 완료',
      input: 'MAC주소를 입력하세요.',
      ok: '확인'
    },
    download: {
      title: '이미지 다운로드',
      input: '원격 이미지 URL을 입력하세요.',
      ok: '확인',
      disabled: '/data 파티션이 읽기 전용(RO) 상태이므로 이미지를 다운로드할 수 없습니다.',
      uploadbox: '여기에 파일을 놓거나 클릭하여 선택하세요.',
      inputfile: '이미지 파일을 입력해주세요',
      NoISO: 'ISO 없음'
    },
    power: {
      title: '전원',
      showConfirm: '확인',
      showConfirmTip: '전원 작업에는 추가 확인이 필요합니다',
      reset: '리셋',
      power: '전원',
      powerShort: '전원 (짧게 누르기)',
      powerLong: '전원 (길게 누르기)',
      resetConfirm: '리셋 작업을 진행하시겠습니까?',
      powerConfirm: '전원 작업을 진행하시겠습니까?',
      okBtn: '네',
      cancelBtn: '아니오'
    },
    settings: {
      title: '설정',
      about: {
        title: 'NanoKVM 정보',
        information: '정보',
        ip: 'IP',
        mdns: 'mDNS',
        application: '펌웨어 버전',
        applicationTip: 'NanoKVM 웹 애플리케이션 버전',
        image: '이미지 버전',
        imageTip: 'NanoKVM 시스템 이미지 버전',
        deviceKey: '장치 키',
        community: '커뮤니티',
        hostname: '호스트 이름',
        hostnameUpdated: '호스트 이름이 업데이트되었습니다. 적용하려면 재부팅하세요.',
        ipType: {
          Wired: '유선',
          Wireless: '무선',
          Other: '기타'
        }
      },
      appearance: {
        title: '디자인',
        display: '표시',
        language: '언어',
        languageDesc: '인터페이스 언어를 선택하세요',
        webTitle: '웹 제목',
        webTitleDesc: '웹 페이지 제목 사용자 지정',
        menuBar: {
          title: '메뉴 바',
          mode: '표시 모드',
          modeDesc: '메뉴 바를 화면에 표시합니다',
          modeOff: '꺼짐',
          modeAuto: '자동 숨기기',
          modeAlways: '항상 보이기',
          icons: '하위 메뉴 아이콘',
          iconsDesc: '메뉴 바에 하위 메뉴 아이콘을 표시합니다'
        }
      },
      device: {
        title: '장치',
        oled: {
          title: 'OLED',
          description: 'OLED 화면 자동 절전',
          0: '사용 안 함',
          15: '15초',
          30: '30초',
          60: '1분',
          180: '3분',
          300: '5분',
          600: '10분',
          1800: '30분',
          3600: '1시간'
        },
        ssh: {
          description: 'SSH 원격 접속 활성화',
          tip: '활성화하기 전에 강력한 비밀번호를 설정하세요. (계정 - 비밀번호 변경)'
        },
        advanced: '고급 설정',
        swap: {
          title: '스왑',
          disable: '비활성화',
          description: '스왑 파일 크기 설정',
          tip: '이 기능을 활성화하면 SD 카드의 수명이 단축될 수 있습니다!'
        },
        mouseJiggler: {
          title: '마우스 흔들기',
          description: '원격 호스트가 절전 모드로 진입하는 것을 방지',
          disable: '비활성화',
          absolute: '절대값 모드',
          relative: '상대값 모드'
        },
        mdns: {
          description: 'mDNS 검색 서비스 활성화',
          tip: '사용하지 않는 경우 끄는 것이 좋습니다'
        },
        hdmi: {
          description: 'HDMI/모니터 출력 활성화'
        },
        autostart: {
          title: '자동 시작 스크립트 설정',
          description: '시스템 시작 시 자동으로 실행되는 스크립트를 관리합니다.',
          new: '새로운',
          deleteConfirm: '이 파일을 정말로 삭제합니까?',
          yes: '네',
          no: '아니오',
          scriptName: '자동 시작 스크립트 이름',
          scriptContent: '자동 시작 스크립트 내용',
          settings: '설정'
        },
        hidOnly: 'HID 전용 모드',
        hidOnlyDesc: '가상 장치 에뮬레이션을 중지하고 기본 HID 제어만 유지합니다.',
        disk: '가상 디스크',
        diskDesc: '원격 호스트에서 가상 USB를 마운트합니다.',
        network: '가상 네트워크',
        networkDesc: '원격 호스트에서 가상 네트워크 카드를 마운트합니다.',
        reboot: '재부팅',
        rebootDesc: 'NanoKVM을 재부팅하시겠습니까?',
        okBtn: '네',
        cancelBtn: '아니오'
      },
      network: {
        title: '네트워크',
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi 설정',
          apMode: 'AP 모드가 활성화되었습니다. QR 코드를 스캔하여 Wi-Fi에 연결하세요',
          connect: 'Wi-Fi 연결',
          connectDesc1: '네트워크 SSID와 비밀번호를 입력하세요',
          connectDesc2: '이 네트워크에 연결할 비밀번호를 입력하세요',
          disconnect: '네트워크 연결을 끊으시겠습니까?',
          failed: '연결에 실패했습니다. 다시 시도하세요.',
          ssid: '이름',
          password: '비밀번호',
          joinBtn: '연결',
          confirmBtn: '확인',
          cancelBtn: '취소'
        },
        tls: {
          description: 'HTTPS 프로토콜 활성화',
          tip: '주의: HTTPS 사용 시 특히 MJPEG 비디오 모드에서 지연 시간이 증가할 수 있습니다.'
        },
        dns: {
          title: 'DNS',
          description: 'NanoKVM의 DNS 서버 설정',
          mode: '모드',
          dhcp: 'DHCP',
          manual: '수동',
          add: 'DNS 추가',
          save: '저장',
          invalid: '유효한 IP 주소를 입력하세요',
          noDhcp: '현재 사용 가능한 DHCP DNS가 없습니다',
          saved: 'DNS 설정이 저장되었습니다',
          saveFailed: 'DNS 설정 저장 실패',
          unsaved: '저장되지 않은 변경사항',
          maxServers: '최대 {{count}}개의 DNS 서버가 허용됩니다',
          dnsServers: 'DNS 서버',
          dhcpServersDescription: 'DNS 서버는 DHCP에서 자동으로 가져옵니다',
          manualServersDescription: 'DNS 서버를 수동으로 편집할 수 있습니다',
          networkDetails: '네트워크 세부 정보',
          interface: '인터페이스',
          ipAddress: 'IP 주소',
          subnetMask: '서브넷 마스크',
          router: '라우터',
          none: '없음'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: '메모리 최적화',
          tip: '메모리 사용량이 제한을 초과하면 가비지 컬렉션이 더 적극적으로 실행되어 메모리를 확보하려고 시도합니다. Tailscale을 사용할 경우 50MB로 설정하는 것이 좋습니다. 변경 사항을 적용하려면 Tailscale을 다시 시작해야 합니다.'
        },
        swap: {
          title: '스왑 메모리',
          tip: '메모리 최적화를 활성화한 후에도 문제가 지속되면 스왑 메모리를 활성화해 보세요. 이 설정은 스왑 파일 크기를 기본값으로 256MB로 설정하며, "설정 > 기기"에서 조정할 수 있습니다.'
        },
        restart: '정말로 Tailscale을 다시 시작하시겠습니까?',
        stop: '정말로 Tailscale을 중지하시겠습니까?',
        stopDesc: 'Tailscale에서 로그아웃하고 자동 시작을 비활성화합니다.',
        loading: '불러오는 중...',
        notInstall: 'Tailscale이 없습니다. 설치해주세요.',
        install: '설치',
        installing: '설치중',
        failed: '설치 실패',
        retry: '새로고침하고 다시 시도하거나, 수동으로 설치하세요',
        download: '다운로드 중 :',
        package: '패키지 설치',
        unzip: '압축 해제',
        upTailscale: 'tailscale을 NanoKVM의 /usr/bin/ 경로에 업로드 했습니다.',
        upTailscaled: 'tailscaled을 NanoKVM의 /usr/sbin/ 경로에 업로드 했습니다.',
        refresh: '현재 페이지 새로고침',
        notRunning: 'Tailscale이 실행되고 있지 않습니다. 계속하려면 시작해 주세요.',
        run: '시작',
        notLogin: '이 기기는 현재 연동 되지 않았습니다. 로그인해서 계정에 이 장치를 연동하세요.',
        urlPeriod: '이 주소는 10분간 유효합니다.',
        login: '로그인',
        loginSuccess: '로그인 성공',
        enable: 'Tailscale 활성화',
        deviceName: '장치 이름',
        deviceIP: '장치 IP',
        account: '계정',
        logout: '로그아웃',
        logoutDesc: '정말로 로그아웃 하시겠습니까?',
        uninstall: 'Tailscale 제거',
        uninstallDesc: '정말로 Tailscale을 제거할까요?',
        okBtn: '네',
        cancelBtn: '아니오'
      },
      update: {
        title: '업데이트 확인',
        queryFailed: '버전 확인 실패',
        updateFailed: '업데이트 실패, 재시도하세요.',
        isLatest: '이미 최신 버전입니다.',
        available: '업데이트가 가능합니다. 정말로 업데이트 할까요?',
        updating: '업데이트 시작. 잠시 기다려주세요...',
        confirm: '확인',
        cancel: '취소',
        preview: '미리보기 업데이트',
        previewDesc: '새로운 기능과 개선 사항에 미리 접근하세요',
        previewTip: '미리보기 버전에는 버그나 완성되지 않은 기능이 포함될 수 있으니 주의하세요!',
        offline: {
          title: '오프라인 업데이트',
          desc: '로컬 설치 패키지를 통한 업데이트',
          upload: '업로드',
          invalidName: '유효하지 않은 파일 이름 형식입니다. GitHub 릴리즈에서 다운로드하세요.',
          updateFailed: '업데이트에 실패했습니다. 재시도하세요.'
        }
      },
      account: {
        title: '계정',
        webAccount: '웹 계정',
        password: '비밀번호',
        updateBtn: '업데이트',
        logoutBtn: '로그아웃',
        logoutDesc: '정말로 로그아웃 하시겠습니까?',
        okBtn: '네',
        cancelBtn: '아니오'
      }
    },
    picoclaw: {
      title: 'PicoClaw 어시스턴트',
      empty: '패널을 열고 작업을 시작하세요.',
      inputPlaceholder: 'PicoClaw가 무엇을 하기를 원하는지 설명하세요',
      newConversation: '새 대화',
      processing: '처리 중...',
      agent: {
        defaultTitle: '일반 어시스턴트',
        defaultDescription: '일반 대화, 검색, 작업 공간 지원.',
        kvmTitle: '원격 제어',
        kvmDescription: 'NanoKVM을 통한 원격 호스트 제어.',
        switched: '에이전트 역할 변경됨',
        switchFailed: '에이전트 역할 변경에 실패했습니다'
      },
      send: '전송',
      cancel: '취소',
      status: {
        connecting: '게이트웨이 연결 중...',
        connected: 'PicoClaw 세션이 연결되었습니다',
        disconnected: 'PicoClaw 세션이 종료되었습니다',
        stopped: '중지 요청이 전송되었습니다',
        runtimeStarted: 'PicoClaw 런타임이 시작되었습니다',
        runtimeStartFailed: 'PicoClaw 런타임 시작에 실패했습니다',
        runtimeStopped: 'PicoClaw 런타임이 중지되었습니다',
        runtimeStopFailed: 'PicoClaw 런타임 중지에 실패했습니다'
      },
      connection: {
        runtime: {
          checking: '확인 중',
          ready: '런타임 준비됨',
          stopped: '런타임 중지됨',
          unavailable: '런타임 사용 불가',
          configError: '구성 에러'
        },
        transport: {
          connecting: '연결 중',
          connected: '연결됨'
        },
        run: {
          idle: '대기',
          busy: '작업 중'
        }
      },
      message: {
        toolAction: '동작',
        observation: '관찰',
        screenshot: '스크린샷'
      },
      overlay: {
        locked: 'PicoClaw가 기기를 제어하고 있습니다. 수동 입력이 일시 중지됩니다.'
      },
      install: {
        install: 'PicoClaw 설치',
        installing: 'PicoClaw 설치 중',
        success: 'PicoClaw가 성공적으로 설치되었습니다',
        failed: 'PicoClaw 설치에 실패했습니다',
        uninstalling: '런타임 삭제 중...',
        uninstalled: '런타임 삭제에 성공했습니다.',
        uninstallFailed: '삭제에 실패했습니다.',
        requiredTitle: 'PicoClaw가 설치되지 않았습니다',
        requiredDescription: 'PicoClaw 런타임을 시작하기 전에 PicoClaw를 설치하세요.',
        progressDescription: 'PicoClaw가 다운로드되고 설치되고 있습니다.',
        stages: {
          preparing: '준비 중',
          downloading: '다운로드 중',
          extracting: '압축 해제 중',
          installing: '설치 중',
          installed: '설치 완료',
          install_timeout: '시간 초과',
          install_failed: '실패'
        }
      },
      model: {
        requiredTitle: '모델 구성이 필요합니다',
        requiredDescription: 'PicoClaw 채팅을 사용하기 전에 PicoClaw 모델을 구성하세요.',
        docsTitle: '구성 가이드',
        docsDesc: '지원하는 모델과 프로트콜',
        menuLabel: '모델 구성',
        modelIdentifier: '모델 식별자',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'API 키',
        apiKeyPlaceholder: '모델 API 키를 입력하세요',
        save: '저장',
        saving: '저장 중',
        saved: '모델 구성이 저장되었습니다',
        saveFailed: '모델 구성 저장에 실패했습니다',
        invalid: '모델 식별자, API Base URL, API 키가 필요합니다'
      },
      uninstall: {
        menuLabel: '제거',
        confirmTitle: 'PicoClaw 제거',
        confirmContent: 'PicoClaw를 정말로 제거할까요? 실행 파일과 모든 구성 파일이 삭제됩니다.',
        confirmOk: '제거',
        confirmCancel: '취소'
      },
      history: {
        title: '기록',
        loading: '기록 불러오는 중...',
        emptyTitle: '기록 없음',
        emptyDescription: '이전 PicoClaw 세션은 여기에 표시됩니다.',
        loadFailed: '세션 기록을 불러오지 못했습니다',
        deleteFailed: '세션 삭제에 실패했습니다',
        deleteConfirmTitle: '세션 삭제',
        deleteConfirmContent: '정말로 "{{title}}"를 삭제할까요?',
        deleteConfirmOk: '삭제',
        deleteConfirmCancel: '취소',
        messageCount_one: '{{count}}개의 메시지',
        messageCount_other: '{{count}}개의 메시지'
      },
      config: {
        startRuntime: 'PicoClaw 시작',
        stopRuntime: 'PicoClaw 중지'
      },
      start: {
        title: 'PicoClaw 시작',
        description: '런타임을 시작하여 PicoClaw 어시스턴트 사용을 시작하세요.'
      }
    },
    error: {
      title: '문제가 발생했습니다.',
      refresh: '새로고침'
    },
    fullscreen: {
      toggle: '전체 화면 전환'
    },
    menu: {
      collapse: '메뉴 접기',
      expand: '메뉴 펼치기'
    }
  }
};

export default ko;
