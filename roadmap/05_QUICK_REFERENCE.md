# NanoKVM Cube — Краткая справка

Дата: 2026-02-17

---

## Ключевой вывод

Язык бэкенда не определяет задержку видео. Кодирование — аппаратное (VENC в кремнии SG2002). Переписать Go на Rust/C → выигрыш ~5-15 мс из общих 90-230 мс. Починить H.264 стриминг (GOP/IDR) → выигрыш 50-100 мс + устранение фризов.

---

## Приоритеты фиксов

1. Починить H.264 (GOP/IDR в C-коде kvm_mmf) → устраняет фризы. Время: 2-4 часа.
2. Отключить USB wakeup spam → освобождает CPU от сотен лишних прерываний/сек. Время: 5 минут.
3. Откатить буферизацию v2.2.8 → восстанавливает отзывчивость H.264 Direct. Время: 2-6 часов.
4. GOGC=50, GOMEMLIMIT=30MiB → короче GC-паузы. Время: 2 минуты.
5. Дефолт 720p вместо 1080p → снижает нагрузку на всё. Время: 1 минута.
6. Shared memory вместо CGO → убирает 30 stack switch/sec. Время: 1-3 дня.
7. WebRTC оптимизация для LAN → делает UDP быстрее TCP. Время: 1-2 дня.

---

## Ограничения платформы

CPU: C906 RISC-V, 1 ядро, 1 GHz — все процессы конкурируют за него.
RAM: 98 МБ для Linux (из 256 общих; 158 МБ отданы мультимедийной подсистеме).
Сеть: 100 Mbps Ethernet (реальная ~90-94 Mbps с TCP overhead).
Хранилище: microSD ~12 MB/s.

---

## Быстрая диагностика через SSH

ssh root@<ip>, пароль root.

Память: free -m
Go RSS: cat /proc/$(pidof NanoKVM-Server)/status | grep VmRSS
Видео: cat /kvmapp/kvm/quality; cat /kvmapp/kvm/res; cat /kvmapp/kvm/fps
USB spam: dmesg | grep -c "signalling skipped"
CPU: top -d 1

---

## Быстрые действия через SSH (обратимы перезагрузкой)

Отключить USB wakeup: echo disabled > /sys/bus/platform/drivers/dwc2/4340000.usb/power/wakeup
Снизить разрешение: echo 720 > /kvmapp/kvm/res
Снизить качество: echo 60 > /kvmapp/kvm/quality
Ограничить FPS: echo 25 > /kvmapp/kvm/fps
GC тюнинг (тест): GOGC=50 GOMEMLIMIT=30MiB /tmp/server/NanoKVM-Server &
