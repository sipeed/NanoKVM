#!/bin/sh

BIN_PATH="${PICOCLAW_BIN_PATH:-/usr/bin/picoclaw}"
LOG_FILE="${PICOCLAW_LOG_FILE:-/tmp/picoclaw.log}"
BIN_NAME="$(basename "$BIN_PATH")"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

resolve_user_home() {
  user_name="$(id -un 2>/dev/null || echo root)"
  user_home="$(awk -F: -v user="$user_name" '$1 == user { print $6; exit }' /etc/passwd)"
  if [ -n "$user_home" ] && [ -d "$user_home" ]; then
    printf '%s\n' "$user_home"
    return 0
  fi

  if [ -n "${HOME:-}" ] && [ -d "${HOME}" ]; then
    printf '%s\n' "$HOME"
    return 0
  fi

  printf '%s\n' "/root"
}

setup_runtime_env() {
  [ -x "$BIN_PATH" ] || {
    echo "picoclaw binary not found: $BIN_PATH"
    return 1
  }

  USER_HOME="$(resolve_user_home)"
  PICOCLAW_HOME="${PICOCLAW_HOME:-$USER_HOME/.picoclaw}"
  HOME="$USER_HOME"
  export HOME
  export PICOCLAW_HOME

  mkdir -p "$PICOCLAW_HOME" || {
    echo "failed to create picoclaw home: $PICOCLAW_HOME"
    return 1
  }

  cd "$PICOCLAW_HOME" || {
    echo "failed to enter picoclaw home: $PICOCLAW_HOME"
    return 1
  }
}

resolve_kvm_control_source() {
  for candidate in \
    "/kvmapp/picoclaw/skills/kvm-control" \
    "/kvmapp/skills/kvm-control" \
    "$SCRIPT_DIR/../../../picoclaw/skills/kvm-control"
  do
    if [ -d "$candidate" ] && [ -f "$candidate/SKILL.md" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

sync_kvm_control_skill() {
  source_dir="$(resolve_kvm_control_source)" || {
    echo "kvm-control skill source not found"
    return 1
  }

  skills_dir="$PICOCLAW_HOME/workspace/skills"
  target_dir="$skills_dir/kvm-control"
  mkdir -p "$skills_dir" || {
    echo "failed to create skills directory: $skills_dir"
    return 1
  }

  rm -rf "$target_dir" || {
    echo "failed to remove old kvm-control skill: $target_dir"
    return 1
  }

  cp -R "$source_dir" "$target_dir" || {
    echo "failed to copy kvm-control skill to $target_dir"
    return 1
  }
}

sync_agent_profile() {
  source_file="/kvmapp/picoclaw/AGENT_KVM.md"
  target_file="$PICOCLAW_HOME/workspace/AGENT.md"
  workspace_dir="$PICOCLAW_HOME/workspace"

  [ -f "$source_file" ] || {
    echo "agent profile source not found: $source_file"
    return 1
  }

  mkdir -p "$workspace_dir" || {
    echo "failed to create workspace directory: $workspace_dir"
    return 1
  }

  cp -f "$source_file" "$target_file" || {
    echo "failed to copy agent profile to $target_file"
    return 1
  }
}

start_service() {
  setup_runtime_env || return 1

  if pidof "$BIN_NAME" >/dev/null 2>&1; then
    echo "picoclaw already running"
    return 0
  fi

  if [ ! -f "$PICOCLAW_HOME/config.json" ]; then
    echo "picoclaw config not found: $PICOCLAW_HOME/config.json"
    return 1
  fi

  "$BIN_PATH" gateway >>"$LOG_FILE" 2>&1 &
}

onboard_service() {
  setup_runtime_env || return 1
  "$BIN_PATH" onboard >>"$LOG_FILE" 2>&1 || return 1
  sync_kvm_control_skill || return 1
  sync_agent_profile || return 1
}

stop_service() {
  killall "$BIN_NAME" 2>/dev/null || true
}

case "$1" in
  start)
    start_service
    ;;

  stop)
    stop_service
    echo "OK"
    ;;

  onboard)
    onboard_service
    ;;

  restart)
    stop_service
    start_service
    echo "OK"
    ;;

  *)
    echo "Usage: $0 {start|stop|onboard|restart}"
    exit 1
    ;;
esac
