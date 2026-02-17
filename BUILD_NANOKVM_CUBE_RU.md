# NanoKVM Cube: подробная инструкция по сборке и установке кастомной прошивки

## 1. Что именно мы собираем

В рамках этого репозитория практичный и безопасный путь обновления для NanoKVM Cube:

1. Собрать новый backend бинарник `NanoKVM-Server` (RISC-V).
2. Собрать frontend (`web/dist`).
3. Обновить каталог `kvmapp` и залить его на устройство.

Это обновляет систему NanoKVM без обязательной полной пересборки SD-образа (`.img`).

## 2. Важные ограничения

- Для backend сборки нужен **Linux x86_64**.
- На Windows/macOS редактировать код можно, но кросс-компиляция backend официально не поддерживается.
- Перед обновлением всегда делайте бэкап `/kvmapp` на устройстве.

## 3. Готовые скрипты в репозитории

Для повседневной работы используйте готовые скрипты из каталога `scripts`:

1. Сборка overlay:
```bash
./scripts/build_cube_overlay.sh
```
Windows (интерактивно): `scripts\build_cube_overlay.bat`

2. Деплой/откат overlay:
```bash
./scripts/deploy_cube_overlay.sh deploy --host 192.168.0.36 --archive build/nanokvm-cube-overlay.tar.gz --remote-stage-dir /data --restart-timeout 60 --keep-backups 3
./scripts/deploy_cube_overlay.sh list-backups --host 192.168.0.36
./scripts/deploy_cube_overlay.sh rollback --host 192.168.0.36 --backup /data/kvmapp.backup.<STAMP>.tar.gz --restart-timeout 60
```
Windows (интерактивно): `scripts\deploy_cube_overlay_interactive.bat`

3. Диагностика состояния:
```bash
./scripts/check_nanokvm_health.sh
```
Windows (с авто-выгрузкой лога): `scripts\check_nanokvm_health.bat`

Примечание:
- Для NanoKVM Cube staging лучше держать в `/data`, а не в `/tmp` (в `/tmp` обычно мало места).
- `--restart-timeout 60` защищает от зависания SSH при `restart`.

## 4. Подготовка Linux-хоста

Рекомендуется Ubuntu 22.04/24.04.

Установите базовые зависимости:

```bash
sudo apt update
sudo apt install -y git curl tar xz-utils rsync openssh-client
```

Установите Node.js (для frontend):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Проверьте:

```bash
node -v
npm -v
```

## 5. Получение исходников

```bash
git clone https://github.com/sipeed/NanoKVM.git
cd NanoKVM
```

Если вы работаете в своем форке/ветке, переключитесь на нужную ветку с вашими изменениями.

## 6. Сборка backend (`NanoKVM-Server`)

### Вариант A (рекомендуется): через Docker/Makefile

Установите Docker и убедитесь, что демон запущен.

Соберите backend:

```bash
make app
```

После успешной сборки должен появиться файл:

```bash
ls -lh server/NanoKVM-Server
```

### Вариант B: ручная сборка (если у вас уже есть toolchain)

Из каталога `server`:

```bash
cd server
./build.sh
cd ..
```

## 7. Сборка frontend

```bash
cd web
npx pnpm@10.17.1 install --frozen-lockfile
npx pnpm@10.17.1 build
cd ..
```

После этого появится `web/dist`.

## 8. Подготовка обновленного `kvmapp`

Обновите веб-часть в пакете:

```bash
rm -rf kvmapp/server/web
cp -r web/dist kvmapp/server/web
```

Обновите backend в пакете:

```bash
cp server/NanoKVM-Server kvmapp/server/NanoKVM-Server
chmod +x kvmapp/server/NanoKVM-Server
```

Проверьте, что скрипты запуска исполняемые:

```bash
chmod +x kvmapp/system/init.d/S95nanokvm
chmod +x kvmapp/system/init.d/S99netbird
```

Проверьте наличие NetBird-бинарника в пакете:

```bash
ls -lh kvmapp/system/netbird/netbird
```

## 9. Упаковка для переноса

```bash
tar czf kvmapp-custom-$(date +%F-%H%M).tar.gz kvmapp
sha256sum kvmapp-custom-*.tar.gz
```

## 10. Установка на NanoKVM Cube

### 10.1 Включить SSH

На устройстве в Web UI: `Settings -> Device -> SSH`.

### 10.2 Сделать бэкап на устройстве

```bash
ssh root@<IP_NANOKVM>
cp -a /kvmapp /kvmapp.backup.$(date +%F-%H%M%S)
exit
```

### 10.3 Залить архив

```bash
scp kvmapp-custom-*.tar.gz root@<IP_NANOKVM>:/tmp/
```

### 10.4 Применить обновление

```bash
ssh root@<IP_NANOKVM>
cd /
tar xzf /tmp/kvmapp-custom-*.tar.gz
sync
/etc/init.d/S95nanokvm restart
```

## 11. Проверка после перезапуска

```bash
ssh root@<IP_NANOKVM>
/etc/init.d/S95nanokvm status
/etc/init.d/S98tailscaled status
/etc/init.d/S99netbird status
```

Дополнительно в UI проверьте:

1. `Settings -> Tailscale`
2. `Settings -> NetBird`

## 12. Быстрый откат

Если что-то пошло не так:

```bash
ssh root@<IP_NANOKVM>
/etc/init.d/S95nanokvm stop
rm -rf /kvmapp
mv /kvmapp.backup.<ВАШ_ТАЙМСТАМП> /kvmapp
sync
/etc/init.d/S95nanokvm restart
```

## 13. Частые проблемы

1. `go: command not found` при сборке backend  
Решение: собирайте через `make app` (Docker) или установите toolchain по `server/README.md`.

2. Web UI не обновился  
Решение: очистить кэш браузера / hard refresh.

3. VPN не стартует  
Проверить вручную:

```bash
/etc/init.d/S98tailscaled restart
/etc/init.d/S99netbird restart
```

И посмотреть ошибки:

```bash
tailscale status --json
netbird status --json --daemon-addr unix:///var/run/netbird.sock
```

## 14. Про полный `.img`

Полная сборка SD-образа (`.img`) обычно требует полный SDK/toolchain-пайплайн LicheeRV/SG2002 и отдельные шаги вне этого репозитория.  
Для практического кастомного релиза на Cube обычно достаточно обновления `/kvmapp`, как описано выше.
