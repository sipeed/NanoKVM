# NanoKVM Cube — Диагностика и скрипты

Дата: 2026-02-17
Версия: 1.0

Подключение: ssh root@<ip>, пароль root.

---

## 1. Общее состояние системы

Свободная память: free -m. Ожидаемо: ~98 МБ total, 50-70 МБ available (Go-сервер занимает 20-40 МБ).

RAM Go-сервера: cat /proc/$(pidof NanoKVM-Server)/status | grep VmRSS. Показывает реальное потребление resident memory. Если >50 МБ — система под давлением.

Загрузка CPU: top -d 1. На одноядерном CPU 100% = полная загрузка. Ожидаемо: NanoKVM-Server 20-40%, kvm_system 5-15%, остальное — kernel/interrupts.

Версия прошивки: cat /etc/kvm/hw (версия железа), плюс проверить Application Version в веб-интерфейсе Settings.

---

## 2. Диагностика видеопайплайна

Текущие настройки видео:
- cat /kvmapp/kvm/quality — качество сжатия (50-100%).
- cat /kvmapp/kvm/res — разрешение передачи (1080/720/600/480).
- cat /kvmapp/kvm/fps — максимальный FPS.

Входное разрешение HDMI:
- cat /kvmapp/kvm/width — ширина HDMI-входа.
- cat /kvmapp/kvm/height — высота HDMI-входа.

Проверка загрузки shared libraries:
- ls -la /kvmapp/server/dl_lib/ — наличие libkvm.so, libkvm_mmf.so.
- ldd /tmp/server/NanoKVM-Server 2>/dev/null — зависимости Go-бинарника (может не работать для статически слинкованных).

---

## 3. Диагностика USB wakeup spam (P4)

Подсчёт wakeup-сообщений: dmesg | grep -c "usb_gadget_wakeup". Если >100 — проблема активна.

Подсчёт skipped-сообщений: dmesg | grep -c "signalling skipped". Коррелирует с предыдущим.

Текущее состояние wakeup: cat /sys/bus/platform/drivers/dwc2/4340000.usb/power/wakeup. Если "enabled" — wakeup активен и спамит.

Быстрый фикс для проверки: echo disabled > /sys/bus/platform/drivers/dwc2/4340000.usb/power/wakeup. После этого dmesg | grep -c "signalling skipped" должен перестать расти.

---

## 4. Диагностика сети

Проверка сетевого интерфейса: ip addr show eth0 — IP, маска, состояние.

Пропускная способность: на NanoKVM нет iperf по умолчанию, но можно оценить через dd if=/dev/zero bs=1M count=10 | nc <target_ip> <port> с другого хоста.

Состояние Ethernet link: cat /sys/class/net/eth0/speed — должно быть 100 (Mbps). cat /sys/class/net/eth0/carrier — 1 = link up.

Открытые порты: netstat -tlnp — какие процессы слушают.

---

## 5. Диагностика GC давления (P7)

Включить GC трассировку: GODEBUG=gctrace=1 /tmp/server/NanoKVM-Server 2>&1 | head -20. Покажет длительность GC пауз, размер heap, частоту сборок. Внимание: нужно остановить текущий сервер перед запуском с трассировкой.

Ожидаемые значения: GC паузы 1-5 мс на C906 @ 1GHz. Если >10 мс — heap слишком большой или GOGC слишком высокий.

---

## 6. Диагностика H.264 фризов (P1)

Цикл наблюдения: открыть H.264 Direct в браузере, параллельно в SSH выполнить top -d 1. Наблюдать CPU usage во время фризов. Если CPU не проседает во время фриза — проблема в GOP/IDR (браузер ждёт кейфрейм, устройство работает нормально). Если CPU проседает — проблема в USB wakeup spam (P4) или другом источнике прерываний.

Проверить прерывания: cat /proc/interrupts — сравнить значения с интервалом 10 секунд. watch -n 10 "cat /proc/interrupts | head -30" (если watch доступен).

---

## 7. Комплексный диагностический скрипт

Следующие команды выполняются последовательно через SSH и собирают полную картину состояния:

echo "=== HARDWARE ===" && cat /etc/kvm/hw
echo "=== MEMORY ===" && free -m
echo "=== GO SERVER RSS ===" && cat /proc/$(pidof NanoKVM-Server)/status 2>/dev/null | grep VmRSS
echo "=== KVM_SYSTEM RSS ===" && cat /proc/$(pidof kvm_system)/status 2>/dev/null | grep VmRSS
echo "=== VIDEO CONFIG ===" && echo "quality=$(cat /kvmapp/kvm/quality 2>/dev/null) res=$(cat /kvmapp/kvm/res 2>/dev/null) fps=$(cat /kvmapp/kvm/fps 2>/dev/null)"
echo "=== HDMI INPUT ===" && echo "width=$(cat /kvmapp/kvm/width 2>/dev/null) height=$(cat /kvmapp/kvm/height 2>/dev/null)"
echo "=== NETWORK ===" && ip addr show eth0 | grep "inet " && cat /sys/class/net/eth0/speed 2>/dev/null
echo "=== USB WAKEUP ===" && echo "status=$(cat /sys/bus/platform/drivers/dwc2/4340000.usb/power/wakeup 2>/dev/null) count=$(dmesg | grep -c 'signalling skipped')"
echo "=== TOP PROCESSES ===" && ps aux | sort -k3 -rn | head -10
echo "=== DMESG ERRORS ===" && dmesg | grep -i "error\|fail\|panic" | tail -10

---

## 8. Быстрые действия (применимы через SSH без пересборки)

Отключить USB wakeup spam: echo disabled > /sys/bus/platform/drivers/dwc2/4340000.usb/power/wakeup

Снизить разрешение до 720p: echo 720 > /kvmapp/kvm/res (потребуется переподключение стрима в браузере)

Снизить качество до 60%: echo 60 > /kvmapp/kvm/quality

Ограничить FPS до 25: echo 25 > /kvmapp/kvm/fps

Перезапуск сервисов: /etc/init.d/S95nanokvm restart

Запуск Go-сервера с GC-тюнингом (тест): остановить текущий сервер, затем GOGC=50 GOMEMLIMIT=30MiB /tmp/server/NanoKVM-Server &

Все эти действия обратимы перезагрузкой устройства (reboot).
