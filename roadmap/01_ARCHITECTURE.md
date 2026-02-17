# NanoKVM Cube — Архитектура системы

Дата: 2026-02-17
Платформа: NanoKVM Cube (SG2002, RISC-V C906 @ 1GHz, 256MB DDR3)
Версия документа: 1.0

---

## 1. Аппаратная платформа

SoC: SG2002 (Sophgo/CVITEK), изначально спроектирован для IP-камер видеонаблюдения.
CPU: C906 RISC-V 64-bit, 1 GHz, одно ядро. Это единственный доступный CPU — Go runtime, GC, CGO, kvm_system и обработка прерываний конкурируют за него.
RAM: 256 MB DDR3 общая. Из них 158 MB жёстко отданы мультимедийной подсистеме (VI, VPSS, VENC буферы) и недоступны приложениям. Оставшиеся ~98 MB — для Linux, NanoKVM-Server (Go) и kvm_system (C/C++).
Сеть: 100 Mbps Ethernet (Fast Ethernet). Реальная пропускная способность с TCP overhead ~90-94 Mbps.
Видеовход: HDMI → LT6911 (HDMItoCSI конвертер на плате) → MIPI CSI.
Хардварный энкодер: VENC — выделенный блок в кремнии SG2002, кодирует MJPEG, H.264, H.265 аппаратно, практически без нагрузки на CPU.
USB: USB 2.0, Gadget mode через dwc2 контроллер. Эмулирует HID (клавиатура/мышь), Mass Storage (виртуальный USB-диск), RNDIS/NCM (сетевой адаптер).
Хранилище: microSD ~12 MB/s.

---

## 2. Видеопайплайн

Полный путь кадра от HDMI-входа до браузера:

HDMI → LT6911 (HDMItoCSI) → MIPI CSI → VI → VPSS → VENC (аппаратный) → libkvm_mmf.so (C, MaixCDK) → CGO bridge → NanoKVM-Server (Go, Gin) → WebSocket или WebRTC → Браузер

Первые пять звеньев (HDMI → VI → VPSS → VENC) — это аппаратный пайплайн в мультимедийной подсистеме SG2002. Работает на выделенных блоках в чипе, не нагружает CPU. Управляется через libkvm_mmf.so.

libkvm_mmf.so — C-библиотека на базе MaixCDK. Является единственным способом доступа Go к аппаратному энкодеру. Go не может напрямую обращаться к MIPI CSI → VI → VPSS → VENC (подтверждено README NanoKVM-System).

CGO bridge — механизм вызова C-кода из Go. Каждый кадр проходит через переключение стека Go↔C. На одноядерном C906 @ 1GHz один CGO-вызов стоит ~50-100 мкс, при 30fps это 30 вызовов/сек = 1.5-3 мс суммарного overhead плюс cache thrashing (вымывание L1/L2 кеша при переключении стека). Каждый CGO-вызов также блокирует OS-тред.

NanoKVM-Server — Go-приложение на Gin. Получает закодированные кадры через CGO, копирует их в Go heap, отправляет клиентам через WebSocket (TCP) или WebRTC (UDP/DTLS). Потребляет 20-40 МБ RAM под нагрузкой. GC паузы 1-5 мс на C906.

Режимы стриминга:
- MJPEG — через WebSocket (TCP), каждый кадр = отдельный JPEG, декодируется браузером программно (Canvas). Минимальная задержка кодирования, но огромный bitrate (30-80 Mbps при 1080p@30fps).
- H.264 Direct — через WebSocket (TCP), H.264 поток, декодируется браузером аппаратно через MediaSource API. Bitrate 4-15 Mbps при 1080p@30fps.
- WebRTC — через UDP/DTLS, H.264 поток, декодируется через RTCPeerConnection. Теоретически минимальная латентность, но текущая реализация работает хуже H.264 Direct из-за overhead pion/webrtc стека на одноядерном CPU.

---

## 3. Компоненты системы

libkvm_mmf.so — язык C (MaixCDK), расположение /kvmapp/server/dl_lib/, роль: обёртка VENC API для Go, инициализирует хардварный энкодер, получает закодированные кадры, отдаёт их Go через CGO. Исходники: NanoKVM-System/components/kvm_mmf/.

NanoKVM-Server — язык Go (Gin framework), расположение /kvmapp/server/NanoKVM-Server (бинарник ~15-25 MB), роль: HTTP/HTTPS сервер (порт 80/443), WebSocket для видеостриминга и HID-ввода, WebRTC через pion/webrtc, JWT-аутентификация, REST API для управления. Конфигурация: /etc/kvm/server.yaml (порты, TLS, JWT, STUN/TURN). Исходники: github.com/sipeed/NanoKVM/server/.

kvm_system — язык C/C++ (MaixCDK), расположение /kvmapp/kvm_system/kvm_system, роль: низкоуровневое управление железом — OLED-дисплей, ATX power control (GPIO), мониторинг состояния (сеть, USB, HDMI), инициализация видеозахвата. Исходники: github.com/sipeed/NanoKVM-System/support/sg2002/kvm_system/.

Web Frontend — язык TypeScript, React, Vite, расположение /kvmapp/server/web/ (статические файлы), роль: UI, декодирование видео (MSE API / RTCPeerConnection), захват клавиатуры и мыши через WebSocket. Исходники: github.com/sipeed/NanoKVM/web/.

---

## 4. Файловая система — ключевые пути

/kvmapp/ — корень приложения, persistent на microSD.
/kvmapp/server/NanoKVM-Server — Go-бинарник.
/kvmapp/server/dl_lib/ — shared libraries (libkvm.so, libkvm_mmf.so).
/kvmapp/server/web/ — React frontend (статика).
/kvmapp/kvm_system/kvm_system — C/C++ бинарник.
/kvmapp/kvm/quality — текущее качество сжатия, 50-100%.
/kvmapp/kvm/res — разрешение передачи (1080/720/600/480).
/kvmapp/kvm/fps — максимальный FPS.
/kvmapp/kvm/width — HDMI входное разрешение, read-only.
/kvmapp/kvm/height — HDMI входное разрешение, read-only.
/kvmapp/system/init.d/ — init-скрипты.

/etc/kvm/server.yaml — конфигурация Go-сервера (порты, TLS, JWT, логирование, STUN/TURN).
/etc/kvm/hw — версия железа: alpha, beta, pcie, atx, pro.
/etc/kvm/gateway — ручной override шлюза (опционально).

/tmp/kvm_system/ — runtime-копия kvm_system (tmpfs, для снижения износа SD).
/tmp/server/ — runtime-копия Go-сервера (tmpfs).

/boot/eth.nodhcp — флаг статического IP (формат: ip/mask gateway).
/boot/usb.rndis0 — флаг включения USB RNDIS.
/boot/usb.ncm — флаг включения USB NCM.
/boot/usb.hid_only — HID-only режим (без виртуального диска).
/boot/BIOS — режим совместимости с BIOS.

---

## 5. Init-скрипты (порядок запуска)

S00kmod — загрузка kernel-модулей.
S03usbdev — инициализация USB Gadget: ConfigFS /sys/kernel/config/usb_gadget/g0/, создание HID + Mass Storage + RNDIS/NCM функций.
S03usbhid — конфигурация USB HID (клавиатура /dev/hidg0, мышь /dev/hidg1, тачпад /dev/hidg2).
S30eth — настройка Ethernet. Приоритет: Static IP из /boot/eth.nodhcp → DHCP (udhcpc, 10 попыток) → Fallback IP 192.168.90.1/22.
S50sshd — запуск SSH-демона.
S95nanokvm — копирование приложений в tmpfs, настройка iptables, генерация device key, запуск kvm_system и NanoKVM-Server.

---

## 6. Возможности хардварного энкодера VENC (SG2002)

Поддерживаемые кодеки: MJPEG, H.264 (Baseline/Main/High Profile), H.265 (Main Profile). Всё аппаратное, CPU не участвует в кодировании.

Максимальное разрешение: 2880×1620@20fps или 1920×1080@60fps.

ROI-кодирование (Region of Interest): поддерживается 8 регионов одновременно. Для каждого региона можно задать абсолютный QP (фиксированное качество) или относительный QP (смещение от rate control). Позволяет кодировать область курсора/активного окна в высоком качестве, а фон — в низком. API: CVI_VENC_SetRoiAttr. Ограничение: при включении ROI в H.264 отключается макроблочный rate control.

Rate Control режимы: CBR (постоянный битрейт), VBR (переменный), AVBR (адаптивный переменный), QVBR (quality-based VBR), FixQP (фиксированный QP), QPMap (QP на уровне макроблоков).

VB Pool: PrivateVB (VENC сам создаёт буферы) или UserVB (пользователь создаёт буферы через CVI_VB_CreatePool и привязывает к каналу через CVI_VENC_AttachVbPool). UserVB позволяет zero-copy — используется только в H.264/H.265.

Принудительный IDR: CVI_VENC_RequestIDR() — можно запросить немедленную генерацию IDR-кейфрейма в любой момент.

Документация VENC API: https://doc.sophgo.com/cvitek-develop-docs/master/docs_latest_release/CV180x_CV181x/en/01.software/MPI/

---

## 7. Репозитории

github.com/sipeed/NanoKVM — Go-сервер (server/), React-фронтенд (web/), init-скрипты (kvmapp/system/). Основной репозиторий. Открытый.

github.com/sipeed/NanoKVM-System — kvm_system (C/C++), components/kvm_mmf/ (libkvm_mmf.so — VENC bridge). Содержит код работы с хардварным энкодером. Открытый.

github.com/sipeed/MaixCDK — фреймворк для сборки kvm_system. SDK для SG2002.

---

## 8. Справочные документы

SG2002 Datasheet: https://plati.ma/wp-content/uploads/2024/01/SG2002_Preliminary_Datasheet_V1.0-alpha_EN.pdf
VENC API Reference: https://doc.sophgo.com/cvitek-develop-docs/master/docs_latest_release/CV180x_CV181x/en/01.software/MPI/
Sipeed Wiki: https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/introduction.html
DeepWiki (архитектура): https://deepwiki.com/sipeed/NanoKVM
