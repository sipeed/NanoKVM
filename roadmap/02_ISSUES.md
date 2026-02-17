# NanoKVM Cube — Карта проблем

Дата: 2026-02-17
Версия: 1.0

---

## Сводка проблем

P1: H.264 периодические фризы — критическая, слой VENC/C, issue #276, код в components/kvm_mmf/.
P2: Регрессия v2.2.7→v2.2.8 — критическая, слой Go/JS, issue #537, код в server/service/.
P3: CGO overhead — средняя, слой Go↔C bridge, системная проблема, код в server/ (CGO calls).
P4: USB Gadget wakeup spam — средняя, слой Kernel/USB, dmesg из issue #276, код в S03usbdev и kernel dwc2.
P5: MJPEG чоппинг и 7-сек задержки — средняя, аппаратное ограничение сети, issue #368.
P6: WebRTC хуже WebSocket — средняя, слой Transport, пользовательские отчёты, код в server/service/ и pion/webrtc.
P7: Go Runtime memory pressure — низкая, слой Go runtime, конфигурационная проблема.
P8: Frame difference detection latency — низкая, слой VENC/Go, код в components/kvm_mmf/ и server/.

---

## P1: H.264 периодические фризы

GitHub Issue: https://github.com/sipeed/NanoKVM/issues/276
Критичность: критическая — основная жалоба пользователей, делает H.264 режим непригодным для повседневного использования.

Симптомы: видео гладкое ~10 секунд, затем замирает на 2-3 секунды, цикл повторяется бесконечно. В режиме MJPEG этот конкретный паттерн отсутствует (там другая проблема — чоппинг). Проблема появилась или усилилась после обновлений прошивки.

Корневая причина — конфигурация GOP (Group of Pictures) и IDR (Instantaneous Decoder Refresh) в VENC. Если GOP = 300 при 30fps, IDR-кейфрейм генерируется раз в 10 секунд (300 кадров / 30 fps = 10 сек). Браузерный декодер (MSE/MediaSource API) нуждается в IDR для синхронизации. При потере или некорректном парсинге одного IDR декодер ждёт следующего. Результат: ровно тот паттерн «10 сек работает, 2-3 сек стоит».

Подтверждение гипотезы: 10 секунд × 30 fps = 300 кадров — типичный GOP по умолчанию. Совпадение цикла фризов с GOP-интервалом — сильный индикатор.

Расположение кода:
- Конфигурация VENC (где задаётся GOP): NanoKVM-System/components/kvm_mmf/ — C-код, инициализация кодека.
- Получение и отправка стрима: NanoKVM/server/service/ — Go-код, WebSocket/WebRTC отправка.
- Парсинг на клиенте: NanoKVM/web/src/ — TypeScript, MediaSource API.

Диагностика на устройстве:
- cat /kvmapp/kvm/quality — текущее качество.
- cat /kvmapp/kvm/res — текущее разрешение.
- cat /kvmapp/kvm/fps — текущий FPS.
- top -d 1 — CPU spikes во время фриза.
- dmesg | tail -50 — ошибки ядра.

---

## P2: Регрессия v2.2.7 → v2.2.8

GitHub Issue: https://github.com/sipeed/NanoKVM/issues/537
Критичность: критическая — пользователи отмечают заметную деградацию отзывчивости H.264 Direct.

Симптомы: H.264 Direct режим в v2.2.7 был заметно отзывчивее, чем в v2.2.8. WebRTC стал работать лучше H.264 Direct после обновления (раньше было наоборот).

Корневая причина — из CHANGELOG v2.2.8: "Video (H.264 Direct): Refactored to optimize data transmission and support data parsing even when the page is in the background." Рефакторинг добавил буферизацию кадров для поддержки фоновых вкладок. Это ввело дополнительный слой буферизации, который увеличил латентность для активных вкладок.

Расположение кода:
- Go-сервер: server/service/ — логика отправки H.264 стрима.
- Фронтенд: web/src/ — MediaSource API, буферизация кадров.

---

## P3: CGO Overhead

Критичность: средняя — вносит ~1.5-3 мс latency на одноядерном CPU, системная проблема без отдельного issue.

Суть проблемы: каждый видеокадр проходит через CGO bridge — libkvm_mmf.so (C) → CGO stack switch (~50-100 мкс) → Go heap copy (~50-200 мкс) → Go WebSocket send.

На одноядерном C906 @ 1 GHz: 30 CGO-вызовов/сек × ~100 мкс = 3 мс чистого overhead. Каждый CGO-вызов блокирует OS-тред (при GOMAXPROCS=1 это единственный тред). Cache thrashing: переключение стека вымывает L1/L2 кеш. Go копирует буфер кадра из C-памяти в Go heap — дополнительные аллокации, увеличение GC давления.

Расположение кода:
- CGO-вызовы: NanoKVM/server/ — все файлы с import "C".
- C-библиотека: NanoKVM-System/components/kvm_mmf/.

---

## P4: USB Gadget Wakeup Spam

Источник: dmesg из issue #276 (https://github.com/sipeed/NanoKVM/issues/276).
Критичность: средняя — крадёт CPU у видеопайплайна на одноядерном процессоре.

Симптомы: в dmesg сотни сообщений в секунду вида "configfs-gadget gadget: usb_gadget_wakeup" и "dwc2 4340000.usb: wakeup: signalling skipped: is not allowed by host".

Воздействие: каждое сообщение = прерывание CPU. На одноядерном процессоре каждое прерывание отнимает время у видео-обработки. Сотни прерываний/сек = заметная деградация.

Расположение:
- Init-скрипт: kvmapp/system/init.d/S03usbdev.
- Kernel driver: dwc2 (USB 2.0 controller SG2002).
- sysfs путь: /sys/bus/platform/drivers/dwc2/4340000.usb/power/wakeup.

Диагностика:
- dmesg | grep -c "usb_gadget_wakeup" — количество wakeup-сообщений.
- dmesg | grep -c "signalling skipped" — подтверждение проблемы.

---

## P5: MJPEG чоппинг и 7-секундные задержки

GitHub Issue: https://github.com/sipeed/NanoKVM/issues/368
Критичность: средняя — фундаментальное аппаратное ограничение, не софтверный баг.

Суть проблемы: MJPEG при 1080p@30fps генерирует 30-80 Mbps трафика. MJPEG не использует межкадровое сжатие — каждый кадр = полный JPEG. При quality=80% и 1080p@30fps bitrate достигает 50-80 Mbps. При 1080p@60fps — 80-120 Mbps. Реальная пропускная способность 100 Mbps Ethernet с TCP/IP overhead = ~90-94 Mbps. При 720p@30fps quality=70% bitrate падает до 15-25 Mbps — сеть справляется свободно.

При насыщении канала начинаются TCP retransmits, кумулятивные задержки растут, достигая 7 секунд отставания.

Вывод: это не баг софта — это физическое ограничение. MJPEG не может хорошо работать при 1080p на 100 Mbps канале. Решение — использовать H.264 (bitrate в 5-10 раз ниже) или снижать разрешение/качество MJPEG.

---

## P6: WebRTC хуже WebSocket H.264

Критичность: средняя — парадокс, UDP должен быть быстрее TCP.

Симптомы: пользователи отмечают, что H.264 через WebSocket (TCP) работает отзывчивее, чем через WebRTC (UDP).

Причины:
- STUN/TURN overhead в LAN — ICE-переговоры бессмысленны в локальной сети с <1 мс latency.
- Jitter buffer — WebRTC добавляет 20-50 мс буферизации для компенсации потерь UDP, что избыточно в LAN.
- Codec negotiation — начальная задержка согласования кодека при установке WebRTC-соединения.
- pion/webrtc стек — тяжёлый для одноядерного RISC-V: много горутин, аллокаций, DTLS шифрование на каждый пакет.

Расположение кода:
- WebRTC стек: server/service/ (pion/webrtc).
- WebSocket стек: server/service/ (gorilla/websocket или стандартный).
- Фронтенд: web/src/ (RTCPeerConnection vs MediaSource).

---

## P7: Go Runtime Memory Pressure

Критичность: низкая — влияет на стабильность, не на latency напрямую.

Суть: Go-сервер потребляет 20-40 МБ VmRSS под нагрузкой. При ~98 МБ свободной RAM это 20-40% всей доступной памяти. GC паузы: 1-5 мс на C906 @ 1GHz (пропорционально размеру heap). Во время GC sweep видеокадры копятся в очереди.

Диагностика:
- cat /proc/$(pidof NanoKVM-Server)/status | grep VmRSS — реальное потребление RAM.
- free -m — общая свободная память.

---

## P8: Frame Difference Detection — задержка при возобновлении

Критичность: низкая — микрооптимизация, но заметна пользователями.

Суть: NanoKVM по умолчанию не передаёт кадры при статичном экране (экономит bandwidth). Когда экран снова меняется, происходит цепочка задержек: детекция изменения (1-2 кадра), ожидание следующего IDR-кейфрейма (если GOP большой — до 10 секунд, см. проблему P1), восстановление стрима на стороне браузера.

Воздействие: ощущается как «торможение» при начале ввода после паузы. Особенно заметно при большом GOP (связано с P1).
