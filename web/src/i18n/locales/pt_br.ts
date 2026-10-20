const pt_br = {
  translation: {
    head: {
      desktop: 'Área de Trabalho Remota',
      login: 'Login',
      changePassword: 'Mudar Senha',
      terminal: 'Terminal',
      wifi: 'Wi-Fi',
      storage: 'Imagens e compartilhamento de arquivos'
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
      },
      placeholderCurrentPassword: 'Senha atual',
      passwordLength: 'A senha deve ter entre 8 e 72 caracteres',
      invalidCurrentPassword: 'A senha atual está incorreta'
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
    desktop: {
      readOnly: 'Somente leitura',
      readOnlyTip:
        'Esta conta não pode enviar entrada de teclado ou mouse para a máquina de destino, portanto o console apenas exibe a tela.'
    },
    screen: {
      scale: 'Escala',
      title: 'Tela',
      video: 'Modo de Vídeo',
      videoDirectTips: 'Ative HTTPS em "Configurações > Dispositivo" para usar este modo',
      resolution: 'Resolução',
      controlRegion: {
        title: 'Calibração do mouse',
        description:
          'Use esta configuração quando o dispositivo controlado usar uma resolução diferente de 16:9 e o cursor estiver desalinhado horizontal ou verticalmente.',
        off: 'Desativado',
        auto: 'Automático',
        autoWarning:
          'A calibração pode falhar se o aplicativo do usuário tiver um fundo totalmente preto.',
        manual: 'Manual',
        selectedResolution: 'Resolução da área selecionada',
        unused: 'Não utilizado',
        originalResolution: 'Resolução original',
        selectResolution: 'Selecionar resolução original',
        addResolution: 'Adicionar resolução personalizada',
        add: 'Adicionar',
        duplicateResolution: 'Esta resolução já existe.',
        width: 'Largura',
        height: 'Altura',
        apply: 'Calcular e aplicar',
        invalidResolution: 'Insira uma resolução original válida quando o vídeo estiver pronto.',
        select: 'Selecionar área',
        clear: 'Restaurar detecção automática',
        saveFailed: 'Falha ao salvar a área de entrada.',
        tooSmall: 'A área selecionada é muito pequena.',
        previewUnavailable: 'Pré-visualização indisponível',
        clearConfirm: 'Restaurar a detecção automática de bordas pretas?',
        dragHint: 'Arraste para selecionar a área da área de trabalho remota',
        finish: 'Concluir',
        confirm: 'Confirmar',
        cancel: 'Cancelar'
      },
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
      resetHdmi: 'Redefinir HDMI',
      mixedH264: {
        title: 'Conflito de transmissão H.264',
        description:
          'H.264 Direct e H.264 WebRTC estão sendo usados ao mesmo tempo. Isso pode causar rasgos na tela ou vídeo corrompido. Use apenas um modo H.264.'
      },
      webrtcConnectionFailed: {
        title: 'Falha na conexão WebRTC',
        description: 'Verifique a conexão de rede ou alterne o modo de vídeo.'
      },
      captureStatus: {
        hdmiError: 'Erro na imagem HDMI',
        unsupportedResolution: 'A resolução atual não é compatível',
        retrieving: 'Obtendo tela...',
        changingResolution: 'Alterando resolução...',
        updateFailed: 'A tela não pode ser atualizada agora',
        videoError: 'Erro na exibição de vídeo',
        noHdmi: 'Nenhum sinal HDMI detectado',
        unavailable: 'A tela não pode ser exibida agora'
      }
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
    storage: {
      title: 'Imagens e compartilhamento de arquivos',
      empty:
        'Ainda não há imagens. Envie uma ISO ou IMG, ou copie uma para o disco a partir da máquina remota.',
      notAttached: 'Nada montado',
      attached: 'Montado: {{name}}',
      eject: 'Ejetar',
      mount: 'Montar',
      mountMode: 'Modo de montagem',
      mountModeDisk: 'Armazenamento em massa',
      mountModeCdrom: 'CD-ROM',
      openManager: 'Abrir o gerenciador de arquivos',
      refresh: 'Atualizar',
      delete: 'Excluir',
      deleteTitle: 'Excluir mídia',
      deleteConfirm: 'Excluir {{name}}? Os arquivos dentro dele serão perdidos.',
      downloadImage: 'Baixar a imagem',
      typePartition: 'Arquivos compartilhados',
      volumeLabel: 'Disco removível',
      groups: {
        share: 'Compartilhamento de arquivos',
        images: 'Imagens'
      },
      failed: 'A operação falhou',
      hidOnly: 'Modo somente HID: o disco virtual não está disponível',
      disabled: 'O disco virtual está desativado (Configurações - Dispositivo)',
      force: {
        title: 'Retomar a mídia à força?',
        desc: 'A máquina remota ainda está usando esta mídia. Retomá-la reenumera o dispositivo USB e pode perder tudo o que ela ainda não gravou no disco.',
        menuHint:
          'A máquina remota está usando esta mídia. Abra o gerenciador de arquivos para retomá-la à força.'
      },
      tips: {
        title: 'Como fazer upload',
        usb1: 'Conecte o NanoKVM ao seu computador via USB.',
        usb2: 'Nesta página, monte os arquivos compartilhados no modo de armazenamento em massa.',
        usb3: 'Abra o disco virtual no seu computador e copie o arquivo de imagem para o diretório raiz do disco virtual.',
        usb4: 'Ejete o disco quando a cópia terminar: a imagem aparecerá na lista.',
        scp1: 'Certifique-se de que o NanoKVM e seu computador estão na mesma rede local.',
        scp2: 'Abra um terminal no seu computador e use o comando SCP para fazer upload do arquivo de imagem para o diretório /data no NanoKVM.',
        scp3: 'Exemplo: scp seu-caminho-da-imagem root@seu-ip-nanokvm:/data',
        tfCard: 'Cartão TF',
        tf1: 'Este método é suportado em sistemas Linux',
        tf2: 'Remova o cartão TF do NanoKVM (para a versão FULL, desmonte a caixa primeiro).',
        tf3: 'Insira o cartão TF em um leitor de cartão e conecte-o ao seu computador.',
        tf4: 'Copie o arquivo de imagem para o diretório /data no cartão TF.',
        tf5: 'Insira o cartão TF no NanoKVM.'
      },
      job: {
        running: 'Processando {{name}}'
      },
      enableDisk: {
        title: 'Ativar o disco virtual?',
        desc: 'Montar uma mídia exige o disco virtual, que está desativado no momento. Ativá-lo agora? O teclado e o mouse da máquina remota serão desconectados por um instante.',
        menuHint: 'O disco virtual está desativado. Ative-o em Configurações - Dispositivo.',
        askDevice:
          'O disco virtual está desativado. Uma conta com a permissão de dispositivo precisa ativá-lo primeiro.'
      },
      add: {
        title: 'Adicionar mídia',
        upload: 'Enviar uma ISO ou IMG',
        fromUrl: 'Baixar de uma URL',
        url: 'URL da imagem',
        urlRequired: 'Informe uma URL',
        onlyImages: 'Só é possível montar arquivos .iso e .img',
        dropHint: 'Arraste uma ISO ou IMG aqui, ou clique para escolher um arquivo',
        cdromOnlyIso: 'Um CD-ROM só pode conter uma imagem ISO 9660',
        uploadFailed: 'Falha no envio',
        downloadFailed: 'Falha no download',
        uploading: 'Enviando {{name}}',
        downloading: 'Baixando {{name}}',
        done: '{{name}} está pronto',
        checksumFailed: 'A imagem não corresponde ao checksum SHA-256.',
        blocked: 'A máquina remota está usando o disco',
        copyHint:
          'Você também pode copiar uma imagem para a partição de dados via SCP, ou a partir da máquina remota.'
      },
      files: {
        selectMedium: 'Selecione uma mídia para ver os arquivos dentro dela.',
        reasonAttached: 'Esta mídia está conectada à máquina remota.',
        reasonAttachedHint:
          'Ejete-a primeiro: a máquina remota precisa liberar o disco antes que seus arquivos possam ser lidos.',
        reasonNotBrowsable:
          'Esta mídia contém um sistema de arquivos que o gerenciador não consegue abrir.',
        reasonNoLoop: 'Este dispositivo não consegue montar imagens de disco (sem suporte a loop).',
        reasonISOImage:
          'Uma imagem ISO 9660 não pode ser navegada aqui. Ela ainda pode ser montada na máquina remota.',
        empty: 'Esta pasta está vazia',
        noMatch: 'Nenhum arquivo corresponde à busca.',
        free: '{{size}} livres',
        search: 'Buscar nesta pasta',
        sort: {
          name: 'Nome',
          size: 'Tamanho',
          type: 'Tipo',
          asc: 'Crescente',
          desc: 'Decrescente'
        },
        upload: 'Enviar um arquivo para a mídia',
        deleteFolderTitle: 'Excluir pasta',
        deleteFolderConfirm:
          'Excluir a pasta {{name}} e todo o seu conteúdo? Esta ação não pode ser desfeita.',
        uploading: 'Enviando…',
        uploadFailed: 'Falha no envio',
        download: 'Baixar',
        delete: 'Excluir',
        deleteTitle: 'Excluir arquivo',
        deleteConfirm: 'Excluir {{name}} da mídia?'
      },
      yes: 'Sim',
      no: 'Não'
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
      disabled:
        'A partição de dados fica somente leitura enquanto a máquina remota a usa: novas imagens não podem ser gravadas, mas os arquivos existentes continuam podendo ser baixados.',
      sha256: 'SHA-256 (opcional)',
      sha256Placeholder: 'Digite um checksum SHA-256 de 64 caracteres',
      invalidSHA256: 'SHA-256 deve ser uma sequência hexadecimal de 64 caracteres',
      cancel: 'Cancelar',
      cancelFailed: 'Falha ao cancelar o download'
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
      mcp: {
        title: 'Serviço MCP',
        service: 'Controle remoto MCP',
        serviceDesc:
          'Permitir que clientes MCP confiáveis controlem o teclado e o mouse e capturem imagens da tela',
        securityWarning:
          'Qualquer pessoa com esta chave de API pode controlar o host remoto e visualizar sua tela. Use HTTPS e habilite o serviço somente em redes confiáveis.',
        endpoint: 'Endpoint',
        apiKey: 'Chave de API',
        regenerateConfirmTitle: 'Gerar novamente a chave de API MCP?',
        regenerateConfirmDesc: 'A chave atual deixará de funcionar imediatamente.',
        enableConfirmTitle: 'Habilitar o controle MCP externo?',
        enableConfirmDesc:
          'Habilitar o MCP interromperá o PicoClaw e fechará todas as sessões ativas do PicoClaw.',
        failed: 'Falha na operação MCP',
        copyFailed: 'Falha ao copiar. Copie manualmente.',
        okBtn: 'Confirmar',
        cancelBtn: 'Cancelar'
      },
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
          keyboardLedStatus: 'Indicadores de bloqueio do teclado',
          keyboardLedStatusDesc:
            'Exibir o estado de Num Lock, Caps Lock e Scroll Lock do computador remoto',
          icons: 'Ícones do submenu',
          iconsDesc: 'Exibir ícones de submenus na barra de menu'
        }
      },
      keyboardLedStatus: {
        groupLabel: 'Estado dos bloqueios do teclado remoto',
        indicatorLabel: '{{label}}: {{state}}',
        numLock: 'Num Lock',
        numLockShort: 'Num',
        capsLock: 'Caps Lock',
        capsLockShort: 'Caps',
        scrollLock: 'Scroll Lock',
        scrollLockShort: 'Scr',
        on: 'Ativado',
        off: 'Desativado',
        unknown: 'Desconhecido'
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
          description: 'Habilitar saída HDMI/monitor',
          idleTimeoutTitle: 'Tempo limite de captura inativa',
          idleTimeoutDescription: 'Parar a captura HDMI após não haver visualizadores ativos por',
          minutes: 'min'
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
        cancelBtn: 'Não',
        diskLocked: 'Desligado enquanto uma imagem estiver montada (ligá-lo cancela a montagem)',
        diskCancelMount:
          'Ativar o disco virtual cancela a imagem montada e interrompe um download ou upload de imagem em andamento. Continuar?',
        diskBreakDownload: 'Ativar o disco virtual interrompe o download de imagens. Continuar?',
        attention: 'Atenção',
        updateFailed: 'Falha ao atualizar o dispositivo virtual'
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
        customServer: {
          title: 'Servidor de atualização personalizado',
          desc: 'Verifique e baixe atualizações online de um servidor especificado',
          invalidUrl:
            'Insira um diretório de servidor HTTP ou HTTPS válido, sem parâmetros de consulta, fragmentos ou latest.json.',
          loadFailed: 'Não foi possível carregar a configuração do servidor de atualização.',
          saveFailed: 'Não foi possível salvar a configuração do servidor de atualização.',
          saved: 'Configuração do servidor de atualização salva.',
          save: 'Salvar',
          confirmTitle: 'Usar um servidor de atualização personalizado?',
          confirmDesc:
            'O SHA-512 apenas verifica se o pacote corresponde ao manifesto fornecido por este servidor. Ele não comprova que o pacote seja uma versão oficial do NanoKVM. Um servidor com falha ou mal-intencionado pode inutilizar o dispositivo, causar perda de dados ou comprometer o sistema.',
          confirm: 'Usar mesmo assim',
          previewDisabled:
            'As atualizações de prévia ficam indisponíveis enquanto um servidor de atualização personalizado estiver ativado.'
        },
        offline: {
          title: 'Atualizações off-line',
          desc: 'Atualização através do pacote de instalação local',
          upload: 'Upload',
          checksumPlaceholder: 'Soma de verificação SHA-256 (opcional)',
          invalidChecksum: 'A soma de verificação SHA-256 deve conter 64 caracteres hexadecimais.',
          checksumMismatch: 'A verificação SHA-256 falhou. O pacote pode estar corrompido.',
          invalidName: 'Formato de nome de arquivo inválido. Faça download das versões do GitHub.',
          updateFailed: 'Falha na atualização. Por favor, tente novamente.'
        }
      },
      account: {
        title: 'Conta',
        webAccount: 'Nome da Conta Web',
        password: 'Senha',
        updateBtn: 'Alterar',
        logoutBtn: 'Sair',
        logoutDesc: 'Tem certeza de que deseja sair?',
        okBtn: 'Sim',
        cancelBtn: 'Não',
        role: 'Função',
        roles: {
          admin: 'Administrador',
          user: 'Usuário'
        },
        users: {
          title: 'Usuários',
          create: 'Criar usuário',
          enabled: 'Ativado',
          disabled: 'Desativado',
          deviceOwner: 'Proprietário do dispositivo',
          resetPassword: 'Redefinir senha',
          delete: 'Excluir',
          deleteConfirm: 'Excluir este usuário e revogar todas as sessões dele?',
          created: 'Usuário criado',
          deleted: 'Usuário excluído',
          passwordUpdated: 'Senha atualizada',
          loadFailed: 'Falha ao carregar os usuários',
          saveFailed: 'Falha ao salvar o usuário',
          deleteFailed: 'Falha ao excluir o usuário',
          editPermissions: 'Permissões'
        },
        permissions: {
          title: 'Permissões',
          editTitle: 'Editar permissões',
          save: 'Salvar',
          consoleGroup: 'Console',
          mediaGroup: 'Mídia',
          serviceGroup: 'Serviços',
          manageGroup: 'Administração',
          consoleView: 'Ver console',
          consoleControl: 'Teclado e mouse',
          power: 'Controle de energia',
          mediaMount: 'Montar e ler imagens',
          mediaManage: 'Gerenciar a biblioteca de imagens',
          terminal: 'Terminal e scripts',
          device: 'Configurações do dispositivo',
          network: 'Configurações de rede',
          update: 'Atualização do sistema',
          mcp: 'Serviço MCP',
          mcpNote:
            'O serviço MCP emite uma chave de API válida para todo o dispositivo que controla teclado, mouse e capturas fora da sessão web, e ela continua funcionando após a revogação desta permissão até que a chave seja regenerada.',
          tailscale: 'Tailscale',
          ai: 'Assistente de IA',
          aiNote:
            'O assistente de IA acessa o dispositivo por uma interface interna local que não é limitada pelas demais permissões, portanto esta permissão equivale, na prática, ao controle total do dispositivo.'
        }
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
        runtimeStopFailed: 'Falha ao parar o runtime do PicoClaw',
        controlSwitchedToMCP: 'Controle transferido para o serviço MCP externo'
      },
      connection: {
        runtime: {
          checking: 'Verificando',
          restoring: 'Restoring PicoClaw',
          ready: 'Runtime pronto',
          stopped: 'Runtime interrompido',
          blockedByMCP: 'O controle MCP externo está ativo',
          readyBlockedByMCP:
            'The runtime is running, but external MCP currently controls device input.',
          readyWithoutControl:
            'The runtime is running. Grant PicoClaw device control before reconnecting.',
          unavailable: 'Runtime indisponível',
          configError: 'Erro de configuração'
        },
        transport: {
          connecting: 'Conectando',
          connected: 'Conectado',
          disconnected: 'Disconnected',
          reconnect: 'Reconnect',
          reconnectDescription: 'Reconnect to the running PicoClaw session.',
          reconnectBlocked: 'PicoClaw needs device control before reconnecting.'
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
      control: {
        picoclaw: 'Controle do dispositivo: PicoClaw',
        picoclawDescription: 'PicoClaw can write keyboard and mouse input. Manual input may pause.',
        mcp: 'Controle do dispositivo: MCP externo',
        mcpDescription: 'External MCP can write to the device. PicoClaw will not take over input.',
        off: 'Controle do dispositivo: desativado',
        offDescription:
          'AI will not write keyboard or mouse input. Manual control remains available.',
        transitioning: 'Device control: switching',
        transitioningDescription: 'Device control is syncing. Please wait.',
        grant: 'Conceder controle',
        release: 'Liberar',
        releasing: 'Releasing...',
        switching: 'Switching...',
        releasingLabel: 'Device control: releasing',
        releasingDescription:
          'Device control is being returned. PicoClaw has stopped current writes.',
        granted: 'Controle do PicoClaw concedido',
        released: 'Controle do PicoClaw liberado',
        grantFailed: 'Falha ao conceder controle ao PicoClaw',
        releaseFailed: 'Falha ao liberar controle do PicoClaw',
        grantConfirmTitle: 'Alternar controle do dispositivo para PicoClaw?',
        grantConfirmDesc: 'As gravações de dispositivo do MCP externo serão interrompidas.'
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
          verifying: 'Verificando',
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
        messageCount_other: '{{count}} mensagens',
        messageCount: '{{count}} mensagens'
      },
      config: {
        startRuntime: 'Iniciar PicoClaw',
        stopRuntime: 'Parar PicoClaw'
      },
      start: {
        enableConfirmTitle: 'Transferir o controle para o PicoClaw?',
        enableConfirmDesc: 'Iniciar o PicoClaw desabilitará o serviço MCP externo.',
        enableConfirmOk: 'Iniciar PicoClaw',
        enableConfirmCancel: 'Cancelar',
        title: 'Iniciar PicoClaw',
        description: 'Inicie o runtime para começar a usar o assistente PicoClaw.',
        switchFromMCP: 'Switch to PicoClaw and start',
        takeoverAndStart: 'Take over and start'
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
