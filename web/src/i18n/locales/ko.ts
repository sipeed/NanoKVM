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
      description: 'Wi-Fi 설정 for NanoKVM',
      success: 'NanoKVM의 네트워크 상태를 확인하고 새 IP 주소로 접속하세요.',
      failed: '작업이 실패했습니다. 다시 시도하세요.',
      confirmBtn: '확인',
      finishBtn: '완료'
    },
    screen: {
      video: '비디오 모드',
      resolution: '해상도',
      auto: '자동 설정',
      autoTips:
        '일부 해상도에서는 화면이 왜곡되거나 마우스 동작이 비정상적으로 나타날 수 있습니다. 원격 컴퓨터의 해상도를 변경하거나 자동 설정 대신 수동 설정을 사용해 보세요.',
      fps: 'FPS',
      customizeFps: 'FPS 설정',
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
      paste: '붙여넣기',
      tips: '표준 키보드 문자 및 기호만 지원됩니다',
      placeholder: '입력하세요',
      submit: '전송',
      virtual: '키보드',
      ctrlaltdel: 'Ctrl+Alt+Del'
    },
    mouse: {
      default: '기본 커서',
      pointer: '포인터 커서',
      cell: '셀 커서',
      text: '텍스트 커서',
      grab: '잡기 커서',
      hide: '커서 숨기기',
      mode: '마우스 모드',
      absolute: '절대값 모드',
      relative: '상대값 모드',
      requestPointer: '상대값 모드를 사용 중입니다. 커서를 찾으려면 데스크톱을 클릭하세요.',
      resetHid: 'HID 초기화'
    },
    image: {
      title: '이미지',
      loading: '불러오는 중...',
      empty: '아무것도 없습니다.',
      mountFailed: '이미지 마운트 실패',
      mountDesc:
        '일부 시스템에서는 이미지를 마운트하기 전에 원격 호스트에서 가상 디스크를 제거해야 합니다.',
      tips: {
        title: '업로드 방법',
        usb1: 'USB를 통해 NanoKVM을 컴퓨터에 연결하세요.',
        usb2: '가상 디스크가 마운트되었는지 확인하세요. (설정 - 가상 디스크).',
        usb3: '컴퓨터에서 가상 디스크를 열고 이미지 파일을 가상 디스크의 루트 디렉토리로 복사하세요.',
        scp1: 'NanoKVM과 컴퓨터가 동일한 로컬 네트워크에 있는지 확인하세요.',
        scp2: '컴퓨터에서 터미널을 열고 SCP 명령을 사용하여 이미지 파일을 NanoKVM의 /data 디렉터리에 업로드하세요.',
        scp3: '예: scp [이미지 파일 경로] root@[NanoKVM IP 주소]:/data',
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
      confirm: '예',
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
      baudrate: 'Baud rate',
      confirm: '확인'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: '패킷 전송 중...',
      sent: '패킷 전송 완료',
      input: 'MAC주소를 입력하세요.',
      ok: '확인'
    },
    power: {
      title: '전원',
      reset: '리셋',
      power: '전원',
      powerShort: '전원 (짧게 누르기)',
      powerLong: '전원 (길게 누르기)'
    },
    download: {
      download: '이미지 다운로드',
      input: '원격 이미지 URL을 입력하세요.',
      ok: '확인',
      disabled: '/data 파티션이 읽기 전용(RO) 상태이므로 이미지를 다운로드할 수 없습니다.'
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
        community: '커뮤니티'
      },
      appearance: {
        title: '디자인',
        display: '표시',
        language: '언어',
        menuBar: '메뉴 바',
        menuBarDesc: '메뉴 바에 아이콘을 표시'
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
        wifi: {
          title: 'Wi-Fi',
          description: 'Wi-Fi 설정',
          setBtn: '설정'
        },
        disk: '가상 디스크',
        diskDesc: '원격 호스트에서 가상 U-디스크를 마운트합니다.',
        network: '가상 네트워크',
        networkDesc: '원격 호스트에서 가상 네트워크 카드를 마운트합니다.'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: '메모리 최적화',
          tip: '메모리 사용량이 제한을 초과하면 가비지 컬렉션이 더 적극적으로 실행되어 메모리를 확보하려고 시도합니다. Tailscale을 사용할 경우 50MB로 설정하는 것이 좋습니다. 변경 사항을 적용하려면 Tailscale을 다시 시작해야 합니다.',
          disable: '비활성화'
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
        upTailscale: 'tailscale을 NanoKVM 의 다음 경로에 업로드 했습니다. : /usr/bin/',
        upTailscaled: 'tailscaled을 NanoKVM 의 다음 경로에 업로드 했습니다. :  /usr/sbin/',
        refresh: '현재 페이지 새로고침',
        notLogin: '이 기기는 현재 연동 되지 않았습니다. 로그인해서 계정에 이 장치를 연동하세요.',
        urlPeriod: '이 주소는 10분간 유효합니다.',
        login: '로그인',
        loginSuccess: '로그인 성공',
        enable: 'Tailscale 활성화',
        deviceName: '장치 이름',
        deviceIP: '장치 IP',
        account: '계정',
        logout: '로그아웃',
        logout2: '정말로 로그아웃 합니까?',
        okBtn: '예',
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
        cancel: '취소'
      },
      account: {
        title: '계정',
        webAccount: 'Web 계정',
        password: '비밀번호',
        updateBtn: '업데이트',
        logoutBtn: '로그아웃'
      }
    }
  }
};

export default ko;
