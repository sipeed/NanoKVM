#!/usr/bin/env bash
set -euo pipefail

print_usage() {
  cat <<'EOF'
Usage:
  deploy_cube_overlay.sh deploy --host <ip> [--archive <file>] [--user <user>] [--port <port>] [--keep-backups <N>] [--remote-stage-dir <dir>] [--restart-timeout <sec>] [--no-restart]
  deploy_cube_overlay.sh list-backups --host <ip> [--user <user>] [--port <port>]
  deploy_cube_overlay.sh rollback --host <ip> --backup <remote_backup_path> [--user <user>] [--port <port>] [--restart-timeout <sec>] [--no-restart]

Examples:
  ./scripts/deploy_cube_overlay.sh deploy --host 192.168.0.36 --archive "build/nanokvm-cube-overlay.tar.gz" --keep-backups 3
  ./scripts/deploy_cube_overlay.sh list-backups --host 192.168.0.36
  ./scripts/deploy_cube_overlay.sh rollback --host 192.168.0.36 --backup /root/kvmapp.backup.2026-02-16-230501.tar.gz
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

MODE=""
HOST=""
USER_NAME="root"
PORT="22"
ARCHIVE_PATH=""
BACKUP_PATH=""
NO_RESTART="0"
KEEP_BACKUPS="3"
REMOTE_STAGE_DIR=""
RESTART_TIMEOUT="60"

if [[ $# -lt 1 ]]; then
  print_usage
  exit 1
fi

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  print_usage
  exit 0
fi

MODE="$1"
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --user)
      USER_NAME="${2:-}"
      shift 2
      ;;
    --port)
      PORT="${2:-}"
      shift 2
      ;;
    --archive)
      ARCHIVE_PATH="${2:-}"
      shift 2
      ;;
    --backup)
      BACKUP_PATH="${2:-}"
      shift 2
      ;;
    --no-restart)
      NO_RESTART="1"
      shift
      ;;
    --keep-backups)
      KEEP_BACKUPS="${2:-}"
      shift 2
      ;;
    --remote-stage-dir)
      REMOTE_STAGE_DIR="${2:-}"
      shift 2
      ;;
    --restart-timeout)
      RESTART_TIMEOUT="${2:-}"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

[[ -n "$HOST" ]] || die "--host is required"
case "$KEEP_BACKUPS" in
  ''|*[!0-9]*)
    die "--keep-backups must be a non-negative integer"
    ;;
esac
case "$RESTART_TIMEOUT" in
  ''|*[!0-9]*)
    die "--restart-timeout must be a non-negative integer (seconds)"
    ;;
esac
require_cmd ssh
require_cmd scp

SSH_OPTS=(-p "$PORT" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 -o ServerAliveInterval=5 -o ServerAliveCountMax=3)
SCP_OPTS=(-P "$PORT" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8)
REMOTE="${USER_NAME}@${HOST}"

case "$MODE" in
  deploy)
    require_cmd tar
    [[ -n "$ARCHIVE_PATH" ]] || ARCHIVE_PATH="build/nanokvm-cube-overlay.tar.gz"
    [[ -f "$ARCHIVE_PATH" ]] || die "archive not found: $ARCHIVE_PATH"

    if ! tar -tzf "$ARCHIVE_PATH" >/dev/null 2>&1; then
      die "archive is not a valid .tar.gz: $ARCHIVE_PATH"
    fi
    has_kvmapp_root=0
    while IFS= read -r entry; do
      case "$entry" in
        kvmapp/*|kvmapp/)
          has_kvmapp_root=1
          break
          ;;
      esac
    done < <(tar -tzf "$ARCHIVE_PATH")
    [[ "$has_kvmapp_root" -eq 1 ]] || die "archive must contain top-level directory: kvmapp/"

    archive_size_bytes="$(wc -c < "$ARCHIVE_PATH")"
    archive_size_kb="$(( (archive_size_bytes + 1023) / 1024 ))"
    need_kb="$(( archive_size_kb + 4096 ))"

    stage_candidates=()
    if [[ -n "$REMOTE_STAGE_DIR" ]]; then
      stage_candidates+=("$REMOTE_STAGE_DIR")
    fi
    stage_candidates+=("/data" "/tmp" "/root")

    STAGE_DIR="$(ssh "${SSH_OPTS[@]}" "$REMOTE" "sh -s" -- "$need_kb" "${stage_candidates[@]}" <<'REMOTE_STAGE'
set -eu
need_kb="$1"
shift

for dir in "$@"; do
  [ -d "$dir" ] || continue

  probe="$dir/.overlay_write_test.$$"
  if ! ( : > "$probe" ) 2>/dev/null; then
    continue
  fi
  rm -f "$probe"

  avail_kb="$(df -Pk "$dir" | awk 'NR==2 {print $4}')"
  case "$avail_kb" in
    ''|*[!0-9]*)
      continue
      ;;
  esac

  if [ "$avail_kb" -ge "$need_kb" ]; then
    echo "$dir"
    exit 0
  fi
done

exit 1
REMOTE_STAGE
)" || die "no writable staging directory with enough free space (need >= ${need_kb}KB)"

    REMOTE_ARCHIVE="${STAGE_DIR}/$(basename "$ARCHIVE_PATH").upload.$(date +%s)"

    echo "Uploading archive to $REMOTE:$REMOTE_ARCHIVE"
    scp "${SCP_OPTS[@]}" "$ARCHIVE_PATH" "$REMOTE:$REMOTE_ARCHIVE"

    echo "Applying overlay on $REMOTE"
    ssh "${SSH_OPTS[@]}" "$REMOTE" "sh -s" -- "$REMOTE_ARCHIVE" "$NO_RESTART" "$KEEP_BACKUPS" "$RESTART_TIMEOUT" <<'REMOTE_SCRIPT'
set -eu

REMOTE_ARCHIVE="$1"
NO_RESTART="$2"
KEEP_BACKUPS="$3"
RESTART_TIMEOUT="$4"
STAMP="$(date +%F-%H%M%S)"
BACKUP_PATH=""
BACKUP_DIR_BASE="$(dirname "$REMOTE_ARCHIVE")"

if [ ! -d "$BACKUP_DIR_BASE" ]; then
  BACKUP_DIR_BASE="/root"
fi
probe_backup="$BACKUP_DIR_BASE/.backup_write_test.$$"
if ! ( : > "$probe_backup" ) 2>/dev/null; then
  BACKUP_DIR_BASE="/root"
else
  rm -f "$probe_backup"
fi

cleanup() {
  rm -f "$REMOTE_ARCHIVE" 2>/dev/null || true
}
trap cleanup EXIT

[ -d /kvmapp ] || { echo "missing /kvmapp on target" >&2; exit 2; }

# remove stale temp from interrupted runs
rm -rf /tmp/kvmapp-overlay.* 2>/dev/null || true

# keep only newest N-1 backups before creating a new one
if [ "$KEEP_BACKUPS" -eq 0 ] 2>/dev/null; then
  for backup in $(ls -1dt "$BACKUP_DIR_BASE"/kvmapp.backup.* 2>/dev/null); do
    rm -rf "$backup"
  done
else
  limit_before=$((KEEP_BACKUPS - 1))
  i=0
  for backup in $(ls -1dt "$BACKUP_DIR_BASE"/kvmapp.backup.* 2>/dev/null); do
    i=$((i + 1))
    if [ "$i" -gt "$limit_before" ]; then
      rm -rf "$backup"
    fi
  done
fi

if [ "$KEEP_BACKUPS" -gt 0 ] 2>/dev/null; then
  BACKUP_PATH="$BACKUP_DIR_BASE/kvmapp.backup.$STAMP.tar.gz"
  if tar cf - /kvmapp 2>/dev/null | gzip > "$BACKUP_PATH"; then
    :
  else
    busybox tar c -f - /kvmapp | busybox gzip > "$BACKUP_PATH"
  fi
fi

if tar xzf "$REMOTE_ARCHIVE" -C / 2>/dev/null; then
  :
else
  if command -v gzip >/dev/null 2>&1; then
    gzip -dc "$REMOTE_ARCHIVE" | tar xf - -C /
  else
    busybox gzip -dc "$REMOTE_ARCHIVE" | tar xf - -C /
  fi
fi

[ -d /kvmapp ] || { echo "archive does not contain kvmapp/" >&2; exit 3; }
chmod -R 755 /kvmapp
sync

if [ "$NO_RESTART" != "1" ]; then
  if [ "$RESTART_TIMEOUT" -gt 0 ] 2>/dev/null && command -v timeout >/dev/null 2>&1; then
    if ! timeout "${RESTART_TIMEOUT}s" /etc/init.d/S95nanokvm restart >/tmp/nanokvm_restart.log 2>&1; then
      echo "WARN: /etc/init.d/S95nanokvm restart timed out or failed; see /tmp/nanokvm_restart.log" >&2
    fi
  else
    (/etc/init.d/S95nanokvm restart >/tmp/nanokvm_restart.log 2>&1 &) || true
  fi
fi

# keep only the newest N backups
if [ "$KEEP_BACKUPS" -ge 0 ] 2>/dev/null; then
  i=0
  for backup in $(ls -1dt "$BACKUP_DIR_BASE"/kvmapp.backup.* 2>/dev/null); do
    i=$((i + 1))
    if [ "$i" -gt "$KEEP_BACKUPS" ]; then
      rm -rf "$backup"
    fi
  done
fi

echo "DEPLOY_OK"
if [ -n "$BACKUP_PATH" ]; then
  echo "BACKUP_PATH=$BACKUP_PATH"
else
  echo "BACKUP_PATH=(disabled)"
fi
REMOTE_SCRIPT
    ;;

  list-backups)
    echo "Backups on $REMOTE:"
    ssh "${SSH_OPTS[@]}" "$REMOTE" "sh -s" <<'REMOTE_SCRIPT'
set -eu
found=0
for base in /data /root /tmp; do
  if ls -1dt "$base"/kvmapp.backup.* >/dev/null 2>&1; then
    found=1
    ls -1dt "$base"/kvmapp.backup.*
  fi
done
if [ "$found" -eq 0 ]; then
  echo "(no backups found)"
fi
REMOTE_SCRIPT
    ;;

  rollback)
    [[ -n "$BACKUP_PATH" ]] || die "--backup is required for rollback"

    echo "Rolling back on $REMOTE from $BACKUP_PATH"
    ssh "${SSH_OPTS[@]}" "$REMOTE" "sh -s" -- "$BACKUP_PATH" "$NO_RESTART" "$RESTART_TIMEOUT" <<'REMOTE_SCRIPT'
set -eu

BACKUP_PATH="$1"
NO_RESTART="$2"
RESTART_TIMEOUT="$3"

[ -e "$BACKUP_PATH" ] || { echo "backup not found: $BACKUP_PATH" >&2; exit 2; }

/etc/init.d/S95nanokvm stop || true
rm -rf /kvmapp

if [ -d "$BACKUP_PATH" ]; then
  cp -a "$BACKUP_PATH" /kvmapp
elif [ -f "$BACKUP_PATH" ]; then
  if tar xzf "$BACKUP_PATH" -C / 2>/dev/null; then
    :
  else
    if command -v gzip >/dev/null 2>&1; then
      gzip -dc "$BACKUP_PATH" | tar xf - -C /
    else
      busybox gzip -dc "$BACKUP_PATH" | tar xf - -C /
    fi
  fi
else
  echo "invalid backup type: $BACKUP_PATH" >&2
  exit 3
fi

[ -d /kvmapp ] || { echo "rollback did not restore /kvmapp" >&2; exit 4; }
chmod -R 755 /kvmapp
sync

if [ "$NO_RESTART" != "1" ]; then
  if [ "$RESTART_TIMEOUT" -gt 0 ] 2>/dev/null && command -v timeout >/dev/null 2>&1; then
    if ! timeout "${RESTART_TIMEOUT}s" /etc/init.d/S95nanokvm restart >/tmp/nanokvm_restart.log 2>&1; then
      echo "WARN: /etc/init.d/S95nanokvm restart timed out or failed; see /tmp/nanokvm_restart.log" >&2
    fi
  else
    (/etc/init.d/S95nanokvm restart >/tmp/nanokvm_restart.log 2>&1 &) || true
  fi
fi

echo "ROLLBACK_OK"
REMOTE_SCRIPT
    ;;

  *)
    die "unknown mode: $MODE"
    ;;
esac
