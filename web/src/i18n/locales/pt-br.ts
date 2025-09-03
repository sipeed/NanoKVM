const ptBR = {
  translation: {
    head: {
      desktop: 'Área de Trabalho Remota',
      login: 'Login',
      changePassword: 'Alterar Senha',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Login',
      placeholderUsername: 'Nome de usuário',
      placeholderPassword: 'Senha',
      placeholderPassword2: 'Por favor, digite a senha novamente',
      noEmptyUsername: 'Nome de usuário obrigatório',
      noEmptyPassword: 'Senha obrigatória',
      noAccount: 'Falha ao obter informações do usuário, por favor atualize a página ou redefina a senha',
      invalidUser: 'Nome de usuário ou senha inválidos',
      error: 'Erro inesperado',
      changePassword: 'Alterar Senha',
      changePasswordDesc: 'Para a segurança do seu dispositivo, por favor altere a senha!',
      differentPassword: 'As senhas não coincidem',
      illegalUsername: 'Nome de usuário contém caracteres inválidos',
      illegalPassword: 'Senha contém caracteres inválidos',
      forgetPassword: 'Esqueceu a senha',
      ok: 'Ok',
      cancel: 'Cancelar',
      loginButtonText: 'Entrar',
      tips: {
        reset1:
          'Para redefinir as senhas, pressione e segure o botão BOOT no NanoKVM por 10 segundos.',
        reset2: 'Para instruções detalhadas, consulte este documento:',
        reset3: 'Conta padrão para web:',
        reset4: 'Conta padrão para SSH:',
        change1: 'Note que esta ação irá alterar as seguintes senhas:',
        change2: 'Senha de login da web',
        change3: 'Senha root do sistema (senha de login SSH)',
        change4: 'Para redefinir as senhas, pressione e segure o botão BOOT no NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configurar Wi-Fi para NanoKVM',
      success: 'Por favor, verifique o status da rede do NanoKVM e acesse o novo endereço IP.',
      failed: 'Operação falhou, por favor tente novamente.',
      confirmBtn: 'Ok',
      finishBtn: 'Concluído'
    },
    screen: {
      title: 'Tela',
      video: 'Modo de Vídeo',
      videoDirectTips: 'Ative HTTPS em "Configurações > Dispositivo" para usar este modo',
      resolution: 'Resolução',
      auto: 'Automático',
      autoTips:
        "Pode ocorrer tearing da tela ou desvio do mouse em determinadas resoluções. Considere ajustar a resolução do host remoto ou desative o modo automático.",
      fps: 'FPS',
      customizeFps: 'Personalizar',
      quality: 'Qualidade',
      qualityLossless: 'Sem perda',
      qualityHigh: 'Alta',
      qualityMedium: 'Média',
      qualityLow: 'Baixa',
      frameDetect: 'Detecção de quadros',
      frameDetectTip:
        "Calcula a diferença entre quadros. Para de transmitir o vídeo quando não há mudanças na tela do host remoto.",
      resetHdmi: 'Resetar HDMI'
    },
    keyboard: {
      title: 'Teclado',
      paste: 'Colar',
      tips: 'Apenas letras e símbolos padrão do teclado são suportados',
      placeholder: 'Digite aqui',
      submit: 'Enviar',
      virtual: 'Teclado',
      ctrlaltdel: 'Ctrl+Alt+Del'
    },
    mouse: {
      title: 'Mouse',
      cursor: 'Estilo do cursor',
      default: 'Cursor padrão',
      pointer: 'Cursor de ponteiro',
      cell: 'Cursor de célula',
      text: 'Cursor de texto',
      grab: 'Cursor de agarrar',
      hide: 'Ocultar cursor',
      mode: 'Modo do mouse',
      absolute: 'Modo absoluto',
      relative: 'Modo relativo',
      speed: 'Velocidade da roda',
      fast: 'Rápido',
      slow: 'Lento',
      requestPointer: 'Usando modo relativo. Por favor, clique na área de trabalho para ativar o ponteiro do mouse.',
      resetHid: 'Resetar HID',
      hidOnly: {
        title: 'Modo somente HID',
        desc: "Se seu mouse e teclado pararem de responder e resetar HID não ajudar, pode ser um problema de compatibilidade entre o NanoKVM e o dispositivo. Tente ativar o modo somente HID para melhor compatibilidade.",
        tip1: 'Ativar modo somente HID irá desmontar o disco virtual e a rede virtual',
        tip2: 'No modo somente HID, o montagem de imagens é desativado',
        tip3: 'NanoKVM irá reiniciar automaticamente após a troca de modo',
        enable: 'Ativar modo somente HID',
        disable: 'Desativar modo somente HID'
      }
    },
    image: {
      title: 'Imagens',
      loading: 'Carregando...',
      empty: 'Nada encontrado',
      cdrom: 'Montar imagem no modo CD-ROM',
      mountFailed: 'Falha ao montar',
      mountDesc:
        "Em alguns sistemas, é necessário ejetar o disco virtual no host remoto antes de montar a imagem.",
      refresh: 'Atualizar lista de imagens',
      tips: {
        title: 'Como enviar',
        usb1: 'Conecte o NanoKVM ao computador via USB.',
        usb2: 'Certifique-se que o disco virtual está montado (Configurações - Disco Virtual).',
        usb3: 'Abra o disco virtual no computador e copie o arquivo de imagem para a raiz do disco virtual.',
        scp1: 'Certifique-se que o NanoKVM e seu computador estão na mesma rede local.',
        scp2: 'Abra o terminal no computador e use o comando SCP para enviar o arquivo de imagem para o diretório /data no NanoKVM.',
        scp3: 'Exemplo: scp caminho-da-imagem root@ip-do-nanokvm:/data',
        tfCard: 'Cartão TF',
        tf1: 'Método suportado no sistema Linux',
        tf2: 'Remova o cartão TF do NanoKVM (para a versão FULL, desmonte o cartão primeiro).',
        tf3: 'Insira o cartão TF em um leitor de cartões e conecte ao computador.',
        tf4: 'Copie o arquivo de imagem para o diretório /data no cartão TF.',
        tf5: 'Insira o cartão TF no NanoKVM.'
      }
    },
    script: {
      title: 'Scripts',
      upload: 'Enviar',
      run: 'Executar',
      runBackground: 'Executar em Segundo Plano',
      runFailed: 'Falha ao executar',
      attention: 'Atenção',
      delDesc: 'Tem certeza que deseja deletar este arquivo?',
      confirm: 'Sim',
      cancel: 'Não',
      delete: 'Deletar',
      close: 'Fechar'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal NanoKVM',
      serial: 'Terminal Porta Serial',
      serialPort: 'Porta Serial',
      serialPortPlaceholder: 'Por favor, digite a porta serial',
      baudrate: 'Baud Rate',
      parity: 'Paridade',
      parityNone: 'Nenhuma',
      parityEven: 'Paridade Par',
      parityOdd: 'Paridade Ímpar',
      flowControl: 'Controle de Fluxo',
      flowControlNone: 'Nenhum',
      flowControlSoft: 'Soft',
      flowControlHard: 'Hard',
      dataBits: 'Bits de dados',
      stopBits: 'Bits de parada',
      confirm: 'Ok'
    },
    wol: {
      title: 'Wake-on-LAN',
      sending: 'Enviando comando...',
      sent: 'Comando enviado',
      input: 'Por favor, digite o MAC',
      ok: 'Ok'
    },
    download: {
      title: 'Download de Imagem',
      input: 'Por favor, digite uma URL de imagem remota',
      ok: 'Ok',
      disabled: 'A partição /data está somente leitura, não é possível baixar a imagem'
    },
    power: {
      title: 'Energia',
      showConfirm: 'Confirmação',
      showConfirmTip: 'Operações de energia exigem confirmação adicional',
      reset: 'Reiniciar',
      power: 'Energia',
      powerShort: 'Energia (clique curto)',
      powerLong: 'Energia (clique longo)',
      resetConfirm: 'Deseja realmente reiniciar?',
      powerConfirm: 'Deseja realmente realizar a operação de energia?',
      okBtn: 'Sim',
      cancelBtn: 'Não'
    },
    settings: {
      title: 'Configurações',
      about: {
        title: 'Sobre o NanoKVM',
        information: 'Informações',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Versão do Aplicativo',
        applicationTip: 'Versão do aplicativo web do NanoKVM',
        image: 'Versão da Imagem',
        imageTip: 'Versão da imagem do sistema NanoKVM',
        deviceKey: 'Chave do Dispositivo',
        community: 'Comunidade',
        hostname: 'Nome do Host',
        hostnameUpdated: 'Nome do host atualizado. Reinicie para aplicar.',
        ipType: {
          Wired: 'Com fio',
          Wireless: 'Sem fio',
          Other: 'Outro'
        }
      },
      appearance: {
        title: 'Aparência',
        display: 'Tela',
        language: 'Idioma',
        menuBar: 'Barra de Menu',
        menuBarDesc: 'Exibir ícones na barra de menu',
        webTitle: 'Título da Web',
        webTitleDesc: 'Personalizar o título da página web'
      },
      device: {
        title: 'Dispositivo',
        oled: {
          title: 'OLED',
          description: 'Desligar a tela OLED após',
          0: 'Nunca',
          15: '15 segundos',
          30: '30 segundos',
          60: '1 minuto',
          180: '3 minutos',
          300: '5 minutos',
          600: '10 minutos',
          1800: '30 minutos',
          3600: '1 hora'
        },
        wifi: {
          title: 'Wi-Fi',
          description: 'Configurar Wi-Fi',
          setBtn: 'Configurar'
        },
        ssh: {
          description: 'Ativar acesso SSH remoto',
          tip: 'Configure uma senha forte antes de habilitar (Conta - Alterar Senha)'
        },
        tls: {
          description: 'Ativar protocolo HTTPS',
          tip: 'Aviso: Usar HTTPS pode aumentar a latência, especialmente no modo de vídeo MJPEG.'
        },
        advanced: 'Configurações Avançadas',
        swap: {
          title: 'Swap',
          disable: 'Desativar',
          description: 'Definir o tamanho do arquivo swap',
          tip: 'Ativar essa função pode reduzir a vida útil do seu cartão SD!'
        },
        mouseJiggler: {
          title: 'Agitador de Mouse',
          description: 'Impede que o host remoto entre em modo de suspensão',
          disable: 'Desativar',
          absolute: 'Modo Absoluto',
          relative: 'Modo Relativo'
        },
        mdns: {
          description: 'Ativar serviço de descoberta mDNS',
          tip: 'Desative se não for necessário'
        },
        hdmi: {
          description: 'Ativar saída HDMI/monitor'
        },
        hidOnly: 'Modo somente HID',
        disk: 'Disco Virtual',
        diskDesc: 'Montar disco virtual no host remoto',
        network: 'Rede Virtual',
        networkDesc: 'Montar placa de rede virtual no host remoto',
        reboot: 'Reiniciar',
        rebootDesc: 'Tem certeza que deseja reiniciar o NanoKVM?',
        okBtn: 'Sim',
        cancelBtn: 'Não'
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Otimização de memória',
          tip: 'Quando o uso de memória ultrapassa o limite, a coleta de lixo é mais agressiva para tentar liberar memória. Recomenda-se configurar para 75MB se usar Tailscale. É necessário reiniciar o Tailscale para aplicar a alteração.',
          disable: 'Desabilitar'
        },
        restart: 'Reiniciar Tailscale?',
        stop: 'Parar Tailscale?',
        stopDesc: 'Sair do Tailscale e desativar inicialização automática na inicialização.',
        loading: 'Carregando...',
        notInstall: 'Tailscale não encontrado! Por favor, instale.',
        install: 'Instalar',
        installing: 'Instalando',
        failed: 'Falha na instalação',
        retry: 'Por favor, atualize e tente novamente. Ou tente instalar manualmente',
        download: 'Baixar o',
        package: 'pacote de instalação',
        unzip: 'e descompacte',
        upTailscale: 'Envie o tailscale para o diretório NanoKVM /usr/bin/',
        upTailscaled: 'Envie o tailscaled para o diretório NanoKVM /usr/sbin/',
        refresh: 'Atualizar página atual',
        notLogin:
          'Dispositivo ainda não está vinculado. Faça login e vincule este dispositivo à sua conta.',
        urlPeriod: 'Este URL é válido por 10 minutos',
        login: 'Login',
        loginSuccess: 'Login bem-sucedido',
        enable: 'Habilitar Tailscale',
        deviceName: 'Nome do Dispositivo',
        deviceIP: 'IP do Dispositivo',
        account: 'Conta',
        logout: 'Sair',
        logoutDesc: 'Tem certeza que deseja sair?',
        uninstall: 'Desinstalar Tailscale',
        okBtn: 'Sim',
        cancelBtn: 'Não'
      },
      update: {
        title: 'Verificar Atualizações',
        queryFailed: 'Falha ao obter versão',
        updateFailed: 'Falha na atualização. Por favor, tente novamente.',
        isLatest: 'Já está na versão mais recente.',
        available: 'Atualização disponível. Deseja atualizar agora?',
        updating: 'Atualização iniciada. Por favor aguarde...',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        preview: 'Visualizar Atualizações',
        previewDesc: 'Obtenha acesso antecipado a novos recursos e melhorias',
        previewTip:
          'Esteja ciente de que versões de visualização podem conter bugs ou funcionalidades incompletas!'
      },
      account: {
        title: 'Conta',
        webAccount: 'Nome da conta web',
        password: 'Senha',
        updateBtn: 'Alterar',
        logoutBtn: 'Sair',
        logoutDesc: 'Tem certeza que deseja sair?',
        okBtn: 'Sim',
        cancelBtn: 'Não'
      }
    },
    error: {
      title: 'Encontramos um problema',
      refresh: 'Atualizar'
    },
    fullscreen: {
      toggle: 'Alternar Tela Cheia'
    },
    menu: {
      collapse: 'Recolher Menu',
      expand: 'Expandir Menu'
    }
  }
};
export default ptBR;
