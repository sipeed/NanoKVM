const pt_br = {
  translation: {
    head: {
      desktop: 'Área de Trabalho Remota',
      login: 'Login',
      changePassword: 'Mudar Senha',
      terminal: 'Terminal',
      wifi: 'Wi-Fi'
    },
    auth: {
      login: 'Login',
      placeholderUsername: 'Nome de usuário',
      placeholderPassword: 'Senha',
      placeholderPassword2: 'Por favor, digite a senha novamente',
      noEmptyUsername: 'Nome de usuário é obrigatório',
      noEmptyPassword: 'Senha é obrigatória',
      noAccount:
        'Falha ao obter informações do usuário, por favor atualize a página ou redefina a senha',
      invalidUser: 'Nome de usuário ou senha inválidos',
      locked: 'Muitos logins, tente novamente mais tarde',
      globalLocked: 'Sistema sob proteção, tente novamente mais tarde',
      error: 'Erro inesperado',
      changePassword: 'Mudar Senha',
      changePasswordDesc: 'Para a segurança do seu dispositivo, por favor, mude a senha!',
      differentPassword: 'Senhas não conferem',
      illegalUsername: 'Nome de usuário contém caracteres inválidos',
      illegalPassword: 'Senha contém caracteres inválidos',
      forgetPassword: 'Esqueci a senha',
      ok: 'Ok',
      cancel: 'Cancelar',
      loginButtonText: 'Login',
      tips: {
        reset1:
          'Para redefinir as senhas, pressione e segure o botão BOOT no NanoKVM por 10 segundos.',
        reset2: 'Para etapas detalhadas, por favor, consulte este documento:',
        reset3: 'Conta padrão da Web:',
        reset4: 'Conta padrão SSH:',
        change1: 'Por favor, note que esta ação irá alterar as seguintes senhas:',
        change2: 'Senha de login da Web',
        change3: 'Senha root do sistema (senha de login SSH)',
        change4: 'Para redefinir as senhas, pressione e segure o botão BOOT no NanoKVM.'
      }
    },
    wifi: {
      title: 'Wi-Fi',
      description: 'Configurar Wi-Fi para o NanoKVM',
      success: 'Por favor, verifique o status da rede do NanoKVM e visite o novo endereço IP.',
      failed: 'Operação falhou, por favor, tente novamente.',
      invalidMode:
        'O modo atual não suporta configuração de rede. Vá para o seu dispositivo e ative o modo de configuração Wi-Fi.',
      confirmBtn: 'Ok',
      finishBtn: 'Finalizado',
      ap: {
        authTitle: 'Autenticação necessária',
        authDescription: 'Por favor, digite a senha AP para continuar',
        authFailed: 'Senha AP inválida',
        passPlaceholder: 'AP senha',
        verifyBtn: 'Verificar'
      }
    },
    screen: {
      scale: 'Escala',
      title: 'Tela',
      video: 'Modo de Vídeo',
      videoDirectTips: 'Ative HTTPS em "Configurações > Dispositivo" para usar este modo',
      resolution: 'Resolução',
      auto: 'Automático',
      autoTips:
        'Rasgos na tela ou desvio do mouse podem ocorrer em resoluções específicas. Considere ajustar a resolução do host remoto ou desativar o modo automático.',
      fps: 'FPS',
      customizeFps: 'Personalizar',
      quality: 'Qualidade',
      qualityLossless: 'Sem perdas',
      qualityHigh: 'Alta',
      qualityMedium: 'Média',
      qualityLow: 'Baixa',
      frameDetect: 'Detecção de Quadros',
      frameDetectTip:
        'Calcular a diferença entre os quadros. Parar a transmissão de vídeo quando nenhuma alteração for detectada na tela do host remoto.',
      resetHdmi: 'Redefinir HDMI'
    },
    keyboard: {
      title: 'Teclado',
      paste: 'Colar',
      tips: 'Apenas letras e símbolos de teclado padrão são suportados',
      placeholder: 'Por favor, digite',
      submit: 'Enviar',
      virtual: 'Teclado',
      readClipboard: 'Ler da área de transferência',
      clipboardPermissionDenied:
        'Permissão da área de transferência negada. Permita o acesso à área de transferência no seu navegador.',
      clipboardReadError: 'Falha ao ler a área de transferência',
      dropdownEnglish: 'Inglês',
      dropdownGerman: 'Alemão',
      dropdownFrench: 'Francês',
      dropdownRussian: 'Russo',
      shortcut: {
        title: 'Atalhos',
        custom: 'Personalizado',
        capture: 'Clique aqui para capturar o atalho',
        clear: 'Limpar',
        save: 'Salvar',
        captureTips:
          'Capturar teclas do sistema (como a tecla Windows) requer permissão de tela cheia.',
        enterFullScreen: 'Alternar modo de tela cheia.'
      },
      leaderKey: {
        title: 'Tecla Leader',
        desc: 'Ignore as restrições do navegador e envie atalhos do sistema diretamente para o host remoto.',
        howToUse: 'Como usar',
        simultaneous: {
          title: 'Modo Simultâneo',
          desc1: 'Pressione e segure a tecla Leader e depois pressione o atalho.',
          desc2: 'Intuitivo, mas pode entrar em conflito com atalhos do sistema.'
        },
        sequential: {
          title: 'Modo Sequencial',
          desc1:
            'Pressione a tecla Leader → pressione o atalho em sequência → pressione a tecla Leader novamente.',
          desc2: 'Requer mais etapas, mas evita completamente conflitos de sistema.'
        },
        enable: 'Habilitar tecla Leader',
        tip: 'Quando atribuída como tecla Leader, esta tecla funciona apenas como gatilho de atalho e perde seu comportamento padrão.',
        placeholder: 'Pressione a tecla Leader',
        shiftRight: 'Shift direito',
        ctrlRight: 'Ctrl direito',
        metaRight: 'Win direito',
        submit: 'Enviar',
        recorder: {
          rec: 'REC',
          activate: 'Ativar teclas',
          input: 'Por favor, pressione o atalho...'
        }
      }
    },
    mouse: {
      title: 'Mouse',
      cursor: 'Estilo do cursor',
      default: 'Cursor padrão',
      pointer: 'Cursor de ponteiro',
      cell: 'Cursor de célula',
      text: 'Cursor de texto',
      grab: 'Cursor de arrastar',
      hide: 'Ocultar cursor',
      mode: 'Modo do mouse',
      absolute: 'Modo absoluto',
      relative: 'Modo relativo',
      direction: 'Direção da roda de rolagem',
      scrollUp: 'Role para cima',
      scrollDown: 'Role para baixo',
      speed: 'Velocidade da roda de rolagem',
      fast: 'Rápido',
      slow: 'Lento',
      requestPointer:
        'Usando modo relativo. Por favor, clique na área de trabalho para obter o ponteiro do mouse.',
      resetHid: 'Redefinir HID',
      hidOnly: {
        title: 'Modo somente HID',
        desc: 'Se o seu mouse e teclado pararem de responder e a redefinição de HID não ajudar, pode ser um problema de compatibilidade entre o NanoKVM e o dispositivo. Tente habilitar o modo Somente-HID para melhor compatibilidade.',
        tip1: 'Habilitar o modo Somente-HID irá desmontar o U-disk virtual e a rede virtual',
        tip2: 'No modo Somente-HID, a montagem de imagem está desativada',
        tip3: 'NanoKVM será reiniciado automaticamente após a troca de modos',
        enable: 'Habilitar modo Somente-HID',
        disable: 'Desabilitar modo Somente-HID'
      }
    },
    image: {
      title: 'Imagens',
      loading: 'Carregando...',
      empty: 'Nada Encontrado',
      mountMode: 'Modo de montagem',
      mountFailed: 'Falha na Montagem',
      mountDesc:
        'Em alguns sistemas, é necessário ejetar o disco virtual no host remoto antes de montar a imagem.',
      unmountFailed: 'Falha na desmontagem',
      unmountDesc:
        'Em alguns sistemas, é necessário ejetar manualmente do host remoto antes de desmontar a imagem.',
      refresh: 'Atualizar a lista de imagens',
      attention: 'Atenção',
      deleteConfirm: 'Tem certeza que deseja excluir esta imagem?',
      okBtn: 'Sim',
      cancelBtn: 'Não',
      tips: {
        title: 'Como fazer upload',
        usb1: 'Conecte o NanoKVM ao seu computador via USB.',
        usb2: 'Certifique-se de que o disco virtual está montado (Configurações - Disco Virtual).',
        usb3: 'Abra o disco virtual no seu computador e copie o arquivo de imagem para o diretório raiz do disco virtual.',
        scp1: 'Certifique-se de que o NanoKVM e seu computador estão na mesma rede local.',
        scp2: 'Abra um terminal no seu computador e use o comando SCP para fazer upload do arquivo de imagem para o diretório /data no NanoKVM.',
        scp3: 'Exemplo: scp seu-caminho-da-imagem root@seu-ip-nanokvm:/data',
        tfCard: 'Cartão TF',
        tf1: 'Este método é suportado em sistemas Linux',
        tf2: 'Remova o cartão TF do NanoKVM (para a versão FULL, desmonte a caixa primeiro).',
        tf3: 'Insira o cartão TF em um leitor de cartão e conecte-o ao seu computador.',
        tf4: 'Copie o arquivo de imagem para o diretório /data no cartão TF.',
        tf5: 'Insira o cartão TF no NanoKVM.'
      }
    },
    script: {
      title: 'Scripts',
      upload: 'Upload',
      run: 'Executar',
      runBackground: 'Executar em segundo plano',
      runFailed: 'Falha na execução',
      attention: 'Atenção',
      delDesc: 'Tem certeza de que deseja excluir este arquivo?',
      confirm: 'Sim',
      cancel: 'Não',
      delete: 'Excluir',
      close: 'Fechar'
    },
    terminal: {
      title: 'Terminal',
      nanokvm: 'Terminal NanoKVM',
      serial: 'Terminal de Porta Serial',
      serialPort: 'Porta Serial',
      serialPortPlaceholder: 'Por favor, digite a porta serial',
      baudrate: 'Taxa de transmissão',
      parity: 'Paridade',
      parityNone: 'Nenhum',
      parityEven: 'Par',
      parityOdd: 'Ímpar',
      flowControl: 'Controle de fluxo',
      flowControlNone: 'Nenhum',
      flowControlSoft: 'Software',
      flowControlHard: 'Hardware',
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
      title: 'Baixador de Imagens',
      input: 'Por favor, digite uma URL de imagem remota',
      ok: 'Ok',
      disabled: 'A partição /data é RO, então não podemos baixar a imagem',
      uploadbox: 'Solte o arquivo aqui ou clique para selecionar',
      inputfile: 'Por favor insira o arquivo de imagem',
      NoISO: 'Sem ISO'
    },
    power: {
      title: 'Energia',
      showConfirm: 'Confirmação',
      showConfirmTip: 'Operações de energia requerem uma confirmação extra',
      reset: 'Redefinir',
      power: 'Energia',
      powerShort: 'Energia (clique curto)',
      powerLong: 'Energia (clique longo)',
      resetConfirm: 'Prosseguir com a operação de redefinição?',
      powerConfirm: 'Prosseguir com a operação de energia?',
      okBtn: 'Sim',
      cancelBtn: 'Não'
    },
    settings: {
      title: 'Configurações',
      about: {
        title: 'Sobre o NanoKVM',
        information: 'Informação',
        ip: 'IP',
        mdns: 'mDNS',
        application: 'Versão do Aplicativo',
        applicationTip: 'Versão do aplicativo web NanoKVM',
        image: 'Versão da Imagem',
        imageTip: 'Versão da imagem do sistema NanoKVM',
        deviceKey: 'Chave do Dispositivo',
        community: 'Comunidade',
        hostname: 'Nome do Host',
        hostnameUpdated: 'Nome do host atualizado. Reinicie para aplicar.',
        ipType: {
          Wired: 'Com Fio',
          Wireless: 'Sem Fio',
          Other: 'Outro'
        }
      },
      appearance: {
        title: 'Aparência',
        display: 'Exibição',
        language: 'Idioma',
        languageDesc: 'Selecione o idioma da interface',
        webTitle: 'Título da Web',
        webTitleDesc: 'Personalizar o título da página web',
        menuBar: {
          title: 'Barra de Menu',
          mode: 'Modo de exibição',
          modeDesc: 'Exibir barra de menu na tela',
          modeOff: 'Desligado',
          modeAuto: 'Ocultar automaticamente',
          modeAlways: 'Sempre visível',
          icons: 'Ícones do submenu',
          iconsDesc: 'Exibir ícones de submenus na barra de menu'
        }
      },
      device: {
        title: 'Dispositivo',
        oled: {
          title: 'OLED',
          description: 'Desligar tela OLED após',
          0: 'Nunca',
          15: '15 seg',
          30: '30 seg',
          60: '1 min',
          180: '3 min',
          300: '5 min',
          600: '10 min',
          1800: '30 min',
          3600: '1 hora'
        },
        ssh: {
          description: 'Habilitar acesso remoto SSH',
          tip: 'Defina uma senha forte antes de habilitar (Conta - Mudar Senha)'
        },
        advanced: 'Configurações Avançadas',
        swap: {
          title: 'Swap',
          disable: 'Desativar',
          description: 'Defina o tamanho do arquivo de swap',
          tip: 'Habilitar esta função pode encurtar a vida útil do seu cartão SD!'
        },
        mouseJiggler: {
          title: 'Movimentador de Mouse',
          description: 'Impedir que o host remoto entre em suspensão',
          disable: 'Desativar',
          absolute: 'Modo Absoluto',
          relative: 'Modo Relativo'
        },
        mdns: {
          description: 'Habilitar serviço de descoberta mDNS',
          tip: 'Desligue se não for necessário'
        },
        hdmi: {
          description: 'Habilitar saída HDMI/monitor'
        },
        autostart: {
          title: 'Configurações de scripts de inicialização automática',
          description:
            'Gerencia scripts que são executados automaticamente na inicialização do sistema',
          new: 'Novo',
          deleteConfirm: 'Tem certeza de que deseja excluir este arquivo?',
          yes: 'Sim',
          no: 'Não',
          scriptName: 'Nome do script de inicialização automática',
          scriptContent: 'Conteúdo do script de inicialização automática',
          settings: 'Configurações'
        },
        hidOnly: 'Modo Somente-HID',
        hidOnlyDesc: 'Pare de emular dispositivos virtuais, mantendo apenas o controle básico HID',
        disk: 'Disco Virtual',
        diskDesc: 'Montar U-disk virtual no host remoto',
        network: 'Rede Virtual',
        networkDesc: 'Montar placa de rede virtual no host remoto',
        reboot: 'Reiniciar',
        rebootDesc: 'Tem certeza de que deseja reiniciar o NanoKVM?',
        okBtn: 'Sim',
        cancelBtn: 'Não'
      },
      network: {
        title: 'Rede',
        wifi: {
          title: 'Wi-Fi',
          description: 'Configurar Wi-Fi',
          apMode: 'O modo AP está ativado, conecte-se ao Wi-Fi escaneando o QR code',
          connect: 'Conectar Wi-Fi',
          connectDesc1: 'Digite o SSID da rede e a senha',
          connectDesc2: 'Digite a senha para entrar nesta rede',
          disconnect: 'Tem certeza de que deseja desconectar a rede?',
          failed: 'Falha na conexão, tente novamente.',
          ssid: 'Nome',
          password: 'Senha',
          joinBtn: 'Entrar',
          confirmBtn: 'OK',
          cancelBtn: 'Cancelar'
        },
        tls: {
          description: 'Habilitar protocolo HTTPS',
          tip: 'Atenção: O uso de HTTPS pode aumentar a latência, especialmente com o modo de vídeo MJPEG.'
        },
        dns: {
          title: 'DNS',
          description: 'Configurar servidores DNS para o NanoKVM',
          mode: 'Modo',
          dhcp: 'DHCP',
          manual: 'Manual',
          add: 'Adicionar DNS',
          save: 'Salvar',
          invalid: 'Digite um endereço IP válido',
          noDhcp: 'Nenhum DNS DHCP está disponível no momento',
          saved: 'Configurações de DNS salvas',
          saveFailed: 'Falha ao salvar as configurações de DNS',
          unsaved: 'Alterações não salvas',
          maxServers: 'Máximo de {{count}} servidores DNS permitido',
          dnsServers: 'Servidores DNS',
          dhcpServersDescription: 'Os servidores DNS são obtidos automaticamente via DHCP',
          manualServersDescription: 'Os servidores DNS podem ser editados manualmente',
          networkDetails: 'Detalhes da rede',
          interface: 'Interface',
          ipAddress: 'Endereço IP',
          subnetMask: 'Máscara de sub-rede',
          router: 'Roteador',
          none: 'Nenhum'
        }
      },
      tailscale: {
        title: 'Tailscale',
        memory: {
          title: 'Otimização de memória',
          tip: 'Quando o uso de memória excede o limite, a coleta de lixo é realizada de forma mais agressiva para tentar liberar memória. Recomenda-se definir para 75MB se estiver usando Tailscale. É necessário reiniciar o Tailscale para que a alteração tenha efeito.'
        },
        swap: {
          title: 'Trocar memória',
          tip: 'Se os problemas persistirem após ativar a otimização de memória, tente ativar a memória swap. Isso define o tamanho do arquivo de troca para 256MB por padrão, que pode ser ajustado em "Configurações > Dispositivo".'
        },
        restart: 'Reiniciar Tailscale?',
        stop: 'Parar Tailscale?',
        stopDesc: 'Sair do Tailscale e desabilitar a inicialização automática no boot.',
        loading: 'Carregando...',
        notInstall: 'Tailscale não encontrado! Por favor, instale.',
        install: 'Instalar',
        installing: 'Instalando',
        failed: 'Falha na instalação',
        retry: 'Por favor, atualize e tente novamente. Ou tente instalar manualmente',
        download: 'Baixar o',
        package: 'pacote de instalação',
        unzip: 'e descompacte-o',
        upTailscale: 'Fazer upload do tailscale para o diretório NanoKVM /usr/bin/',
        upTailscaled: 'Fazer upload do tailscaled para o diretório NanoKVM /usr/sbin/',
        refresh: 'Atualizar página atual',
        notRunning: 'Tailscale não está em execução. Por favor, inicie-o para continuar.',
        run: 'Iniciar',
        notLogin:
          'O dispositivo ainda não foi vinculado. Por favor, faça login e vincule este dispositivo à sua conta.',
        urlPeriod: 'Esta URL é válida por 10 minutos',
        login: 'Login',
        loginSuccess: 'Login Bem-sucedido',
        enable: 'Habilitar Tailscale',
        deviceName: 'Nome do Dispositivo',
        deviceIP: 'IP do Dispositivo',
        account: 'Conta',
        logout: 'Sair',
        logoutDesc: 'Tem certeza de que deseja sair?',
        uninstall: 'Desinstalar Tailscale',
        uninstallDesc: 'Tem certeza de que deseja desinstalar Tailscale?',
        okBtn: 'Sim',
        cancelBtn: 'Não'
      },
      update: {
        title: 'Verificar Atualizações',
        queryFailed: 'Falha ao obter a versão',
        updateFailed: 'Falha na atualização. Por favor, tente novamente.',
        isLatest: 'Você já tem a versão mais recente.',
        available: 'Uma atualização está disponível. Tem certeza de que deseja atualizar agora?',
        updating: 'Atualização iniciada. Por favor, aguarde...',
        confirm: 'Confirmar',
        cancel: 'Cancelar',
        preview: 'Prévia das Atualizações',
        previewDesc: 'Tenha acesso antecipado a novos recursos e melhorias',
        previewTip:
          'Esteja ciente de que as versões de prévia podem conter bugs ou funcionalidade incompleta!',
        offline: {
          title: 'Atualizações off-line',
          desc: 'Atualização através do pacote de instalação local',
          upload: 'Upload',
          invalidName: 'Formato de nome de arquivo inválido. Faça download das versões do GitHub.',
          updateFailed: 'Falha na atualização. Por favor, tente novamente.'
        }
      },
      users: {
        title: 'Gerenciamento de usuários',
        addUser: 'Adicionar usuário',
        colUsername: 'Nome de usuário',
        colRole: 'Função',
        colEnabled: 'Ativo',
        colActions: 'Ações',
        rolesTitle: 'Visão geral das funções',
        roleAdmin: 'Acesso total + gerenciamento de usuários',
        roleOperator: 'Uso do KVM: stream, teclado, mouse, botões de energia',
        roleViewer: 'Apenas visualização do stream',
        changePassword: 'Alterar senha',
        newPassword: 'Nova senha',
        confirmPassword: 'Confirmar senha',
        pwdMismatch: 'As senhas não coincidem',
        pwdSuccess: 'Senha alterada com sucesso',
        pwdFailed: 'Falha ao alterar a senha',
        password: 'Senha',
        delete: 'Excluir',
        deleteConfirm: 'Tem certeza que deseja excluir este usuário?',
        createSuccess: 'Usuário criado',
        createFailed: 'Falha ao criar usuário',
        deleteSuccess: 'Usuário excluído',
        deleteFailed: 'Falha ao excluir',
        updateSuccess: 'Atualizado',
        updateFailed: 'Falha na atualização',
        loadFailed: 'Falha ao carregar usuários',
        usernameRequired: 'Digite o nome de usuário',
        passwordRequired: 'Digite a senha',
        okBtn: 'OK',
        cancelBtn: 'Cancelar'
      },
      account: {
        title: 'Conta',
        webAccount: 'Nome da Conta Web',
        password: 'Senha',
        updateBtn: 'Alterar',
        logoutBtn: 'Sair',
        logoutDesc: 'Tem certeza de que deseja sair?',
        okBtn: 'Sim',
        cancelBtn: 'Não'
      }
    },
    picoclaw: {
      title: 'PicoClaw Assistente',
      empty: 'Abra o painel e inicie uma tarefa para começar.',
      inputPlaceholder: 'Descreva o que você deseja que PicoClaw faça',
      newConversation: 'Nova conversa',
      processing: 'Processando...',
      agent: {
        defaultTitle: 'Assistente geral',
        defaultDescription: 'Ajuda geral sobre bate-papo, pesquisa e espaço de trabalho.',
        kvmTitle: 'Controle remoto',
        kvmDescription: 'Opera o host remoto por meio de NanoKVM.',
        switched: 'Função de agente trocada',
        switchFailed: 'Falha ao mudar de função de agente'
      },
      send: 'Enviar',
      cancel: 'Cancelar',
      status: {
        connecting: 'Conectando ao gateway...',
        connected: 'Sessão PicoClaw conectada',
        disconnected: 'Sessão PicoClaw desconectada',
        stopped: 'Solicitação de parada enviada',
        runtimeStarted: 'Runtime do PicoClaw iniciado',
        runtimeStartFailed: 'Falha ao iniciar o runtime do PicoClaw',
        runtimeStopped: 'Runtime do PicoClaw interrompido',
        runtimeStopFailed: 'Falha ao parar o runtime do PicoClaw'
      },
      connection: {
        runtime: {
          checking: 'Verificando',
          ready: 'Runtime pronto',
          stopped: 'Runtime interrompido',
          unavailable: 'Runtime indisponível',
          configError: 'Erro de configuração'
        },
        transport: {
          connecting: 'Conectando',
          connected: 'Conectado'
        },
        run: {
          idle: 'Inativo',
          busy: 'Ocupado'
        }
      },
      message: {
        toolAction: 'Ação',
        observation: 'Observação',
        screenshot: 'Captura de tela'
      },
      overlay: {
        locked: 'PicoClaw está controlando o dispositivo. A entrada manual está pausada.'
      },
      install: {
        install: 'Instalar PicoClaw',
        installing: 'Instalando PicoClaw',
        success: 'PicoClaw instalado com sucesso',
        failed: 'Falha ao instalar PicoClaw',
        uninstalling: 'Desinstalando o runtime...',
        uninstalled: 'Runtime desinstalado com sucesso.',
        uninstallFailed: 'Falha na desinstalação.',
        requiredTitle: 'PicoClaw não está instalado',
        requiredDescription: 'Instale o PicoClaw antes de iniciar o runtime do PicoClaw.',
        progressDescription: 'PicoClaw está sendo baixado e instalado.',
        stages: {
          preparing: 'Preparando',
          downloading: 'Baixando',
          extracting: 'Extraindo',
          installing: 'Instalando',
          installed: 'Instalado',
          install_timeout: 'Tempo limite esgotado',
          install_failed: 'Falhou'
        }
      },
      model: {
        requiredTitle: 'A configuração do modelo é necessária',
        requiredDescription: 'Configure o modelo PicoClaw antes de usar o chat PicoClaw.',
        docsTitle: 'Guia de configuração',
        docsDesc: 'Modelos e protocolos suportados',
        menuLabel: 'Configurar modelo',
        modelIdentifier: 'Identificador do modelo',
        modelIdentifierPlaceholder: 'openai/gpt-5.4',
        apiBase: 'API Base URL',
        apiBasePlaceholder: 'https://api.example.com/v1',
        apiKey: 'Chave API',
        apiKeyPlaceholder: 'Insira a chave API do modelo',
        save: 'Salvar',
        saving: 'Salvando',
        saved: 'Configuração do modelo salva',
        saveFailed: 'Falha ao salvar a configuração do modelo',
        invalid: 'Identificador do modelo, API Base URL e chave API são obrigatórios'
      },
      uninstall: {
        menuLabel: 'Desinstalar',
        confirmTitle: 'Desinstalar PicoClaw',
        confirmContent:
          'Tem certeza de que deseja desinstalar PicoClaw? Isso excluirá o executável e todos os arquivos de configuração.',
        confirmOk: 'Desinstalar',
        confirmCancel: 'Cancelar'
      },
      history: {
        title: 'Histórico',
        loading: 'Carregando sessões...',
        emptyTitle: 'Ainda sem histórico',
        emptyDescription: 'As sessões anteriores de PicoClaw aparecerão aqui.',
        loadFailed: 'Falha ao carregar o histórico da sessão',
        deleteFailed: 'Falha ao excluir sessão',
        deleteConfirmTitle: 'Excluir sessão',
        deleteConfirmContent: 'Tem certeza de que deseja excluir "{{title}}"?',
        deleteConfirmOk: 'Excluir',
        deleteConfirmCancel: 'Cancelar',
        messageCount_one: '{{count}} mensagem',
        messageCount_other: '{{count}} mensagens'
      },
      config: {
        startRuntime: 'Iniciar PicoClaw',
        stopRuntime: 'Parar PicoClaw'
      },
      start: {
        title: 'Iniciar PicoClaw',
        description: 'Inicie o runtime para começar a usar o assistente PicoClaw.'
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

export default pt_br;
