const ko = {
  translation: {
    language: '언어',
    changePassword: '비밀번호 변경',
    logout: '로그아웃',
    settings: '설정',
    showMouse: '마우스 보이기',
    hideMouse: '마우스 숨기기',
    power: '전원',
    reset: '리셋',
    powerShort: '전원 (짧게 누르기)',
    powerLong: '전원 (길게 누르기)',
    hddLed: 'HDD LED',
    checkLibFailed: '런타임 라이브러리를 체크하는데 실패했습니다. 다시 시도해주세요.',
    updateLibFailed: '런타임 라이브러리를 업데이트하는데 실패했습니다. 다시 시도해주세요.',
    updatingLib: '런타임 라이브러리를 업데이트 하는 중입니다. 업데이트 완료 후 새로고침 해주세요.',
    checkForUpdate: '업데이트 체크하기',
    head: {
      desktop: '원격 데스크톱',
      login: '로그인',
      changePassword: '비밀번호 변경',
      terminal: '터미널'
    },
    auth: {
      login: '로그인',
      placeholderUsername: '유저 이름을 입력하세요.',
      placeholderPassword: '비밀번호를 입력하세요.',
      placeholderPassword2: '비밀번호를 다시 입력하세요.',
      noEmptyUsername: '유저 이름은 비어있을 수 없습니다.',
      noEmptyPassword: '비밀번호는 비어있을 수 없습니다.',
      noAccount:
        '유저 정보를 불러오는데 실패하였습니다. 새로고침하거나, 비밀번호를 초기화 해주세요.',
      invalidUser: '유저 이름이나 비밀번호가 틀렸습니다.',
      error: '정의되지 않은 에러',
      changePassword: '비밀번호 변경',
      differentPassword: '두 비밀번호가 서로 상이합니다.',
      illegalUsername: '유저 이름에 사용할 수 없는 문자가 있습니다.',
      illegalPassword: '비밀번호에 사용할 수 없는 문자가 있습니다.',
      forgetPassword: '비밀번호 분실',
      resetPassword: '비밀번호 초기화',
      reset1: '비밀번호를 분실하신 경우, 아래 순서로 리셋하세요.:',
      reset2: '1. NanoKVM 기기에 SSH를 통해 로그인 합니다.;',
      reset3: '2. 기기내 파일을 제거합니다.: ',
      reset4: '3. 기본 계정으로 로그인 합니다.: ',
      ok: '확인',
      cancel: '취소'
    },
    screen: {
      resolution: '해상도',
      auto: '오토매틱',
      autoTips:
        '일부 해상도에서는 화면 왜곡이나 마우스 오류가 발생할 수 있습니다. 원격 컴퓨터의 해상도를 변경하거나, 자동 설정 대신 수동 설정을 사용해 보시기 바랍니다.',
      fps: 'FPS',
      customizeFps: 'FPS 설정',
      quality: '품질',
      frameDetect: '프레임 탐지',
      frameDetectTip:
        '프레임 간의 차이를 계산합니다. 원격 호스트 화면에 변경 사항이 감지되지 않으면 비디오 스트림 전송을 중지합니다.'
    },
    keyboard: {
      paste: '붙여넣기',
      tips: '표준 키보드 문자 및 기호만 지원됩니다',
      placeholder: '입력하세요',
      submit: '제출하다',
      virtual: '키보드'
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
      requestPointer: '상대값 모드를 사용 중입니다. 커서를 찾으려면 데스크탑을 클릭하세요.',
      resetHid: 'HID 초기화'
    },
    image: {
      title: '이미지',
      loading: 'Loading...',
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
        scp3: '예: scp your-image-path root@your-nanokvm-ip:/data',
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
      upload: '업르도',
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
      sending: '패킷 전송 중...',
      sent: '패킷 전송 완료',
      input: 'MAC주소를 입력하세요.',
      ok: '확인'
    },
    about: {
      title: 'NanoKVM 정보',
      information: '정보',
      ip: 'IP',
      mdns: 'mDNS',
      application: '펌웨어 버전',
      image: '이미지 버전',
      deviceKey: '장치 키',
      queryFailed: '불러오기 실패',
      community: '커뮤니티'
    },
    update: {
      title: '업데이트 확인 중',
      queryFailed: '버전 확인 실패',
      updateFailed: '업데이트 실패, 재시도하세요.',
      isLatest: '이미 최신 버전입니다.',
      available: '업데이트가 가능합니다. 정말로 업데이트 할까요?',
      updating: '업데이트 시작. 잠시 기다려주세요...',
      confirm: '확인',
      cancel: '취소'
    },
    virtualDevice: {
      network: '가상 네트워크 카드',
      disk: '가상 디스크'
    },
    tailscale: {
      loading: 'Loading...',
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
      logout2: '정말로 로그아웃 합니까?'
    }
  }
};

export default ko;
