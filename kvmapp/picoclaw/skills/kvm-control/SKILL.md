---
name: kvm-control
description: Control the downstream remote host connected to NanoKVM through the NanoKVM Bridge API when a PicoClaw session needs screenshots, mouse actions, keyboard input, hotkeys, scrolling, or drag operations. Invoke only ./scripts/nanokvm-bridge.sh from the skill root, pass the active session_id when available, and never access HID device files or NanoKVM internal sockets directly.
---

# NanoKVM Bridge

Use this skill when you need to inspect or operate the downstream remote host desktop that NanoKVM exposes over HDMI and USB HID. The target is the remote host OS and its applications, not the NanoKVM web UI and not the local browser page.

> **Fallback skill.** Prefer the `kvm_screenshot` and `kvm_actions` MCP tools for remote GUI work. Use this shell-based skill only when MCP tools are unavailable.

## Rules

1. Only use `./scripts/nanokvm-bridge.sh`. Prefer `./scripts/nanokvm-bridge.sh ...` over `scripts/...`, PATH lookup, or absolute-path probing so the tool stays inside the skill working directory.
2. Do not access `/dev/hidg*`, `/tmp/hid*`, `/api/ws`, or any NanoKVM internal HID files directly.
3. Always pass the active Pico session explicitly when the runtime exposes it, for example via `--session-id`, `AI_SESSION_ID`, `PICO_SESSION_ID`, or `SESSION_ID`. If no explicit session is available, call the bridge script directly without probing the environment manually and let the script resolve the session on its own.
4. Assume the skill working directory is the `kvm-control` skill root. Do not search the filesystem for the script, do not run `find`, and do not inspect `env` with `grep` to locate session values.
5. Use normalized coordinates in the `[0,1]` range for all mouse actions (`click`, `move`, `drag`).
6. A successful bridge command only means the HID event was sent. It does not prove that the remote UI changed. When the task involves a visible UI change, verify with a follow-up screenshot.

## Common Patterns

Use these templates for common sequences. Choose mouse or keyboard based on what is visible and simplest.

### Click a visible UI element (button, icon, menu item, link)

```sh
./scripts/nanokvm-bridge.sh click --x <X> --y <Y> --button left
```

### Double-click to open a file, folder, or desktop icon

```sh
./scripts/nanokvm-bridge.sh double-click --x <X> --y <Y>
```

### Open a URL (when browser is already focused and address bar shortcut is confirmed)

```sh
./scripts/nanokvm-bridge.sh open-url --url "<URL>" --focus-shortcut <CONFIRMED_ADDRESS_BAR_KEYS>
```

### Launch an application (when the launcher shortcut is confirmed for the current OS)

```sh
./scripts/nanokvm-bridge.sh launch-app --text "<APP_NAME>" --launcher-shortcut <CONFIRMED_LAUNCHER_KEYS>
```

### Type text and press Enter (for search boxes, dialogs, prompts)

```sh
./scripts/nanokvm-bridge.sh type-enter --text "<TEXT>"
```

> Replace `<X>` and `<Y>` with normalized `[0,1]` coordinates from the screenshot. Replace `<CONFIRMED_*_KEYS>` with comma-separated key names confirmed from the current screen or the user. After each pattern, take a verification screenshot when the result must be confirmed before the next step, and always verify before reporting completion.

## Commands

```sh
./scripts/nanokvm-bridge.sh screenshot --format base64
./scripts/nanokvm-bridge.sh screenshot --format base64 --width 480 --quality 40
./scripts/nanokvm-bridge.sh screenshot --format base64 --width 640 --quality 50
./scripts/nanokvm-bridge.sh click --x 0.42 --y 0.31 --button left
./scripts/nanokvm-bridge.sh double-click --x 0.42 --y 0.31
./scripts/nanokvm-bridge.sh move --x 0.42 --y 0.31
./scripts/nanokvm-bridge.sh type --text "hello world"
./scripts/nanokvm-bridge.sh type-enter --text "hello world"
./scripts/nanokvm-bridge.sh hotkey --keys <KEY1>,<KEY2>
./scripts/nanokvm-bridge.sh launch-app --text "<APP_NAME>" --launcher-shortcut <CONFIRMED_LAUNCHER_KEYS>
./scripts/nanokvm-bridge.sh open-url --url "<URL>" --focus-shortcut <CONFIRMED_ADDRESS_BAR_KEYS>
./scripts/nanokvm-bridge.sh scroll --direction down --amount 3
./scripts/nanokvm-bridge.sh drag --from-x 0.20 --from-y 0.40 --to-x 0.80 --to-y 0.40
./scripts/nanokvm-bridge.sh wait --duration-ms 800
./scripts/nanokvm-bridge.sh actions-json '{"actions":[{"action":"move","x":0.42,"y":0.31},{"action":"click","x":0.42,"y":0.31,"button":"left"}]}'
```

## Output Handling

- `screenshot --format base64` returns the raw NanoKVM JSON response.
- Action commands return the raw NanoKVM JSON response.
- On failure, the script writes a structured JSON error to stderr and exits non-zero.

## Notes

- `screenshot` captures the HDMI frame seen by NanoKVM, which should correspond to the downstream remote host.
- For quick verification screenshots, use `--width 480 --quality 40`. Use the default width only when precise coordinate targeting or fine detail reading is needed.
- `type` is the safest way to enter normal text.
- `hotkey --keys` expects a comma-separated list. Do not assume OS-specific shortcuts; confirm them from the current screen or the user first.
- Prefer the built-in macro commands for common deterministic flows:
  - `double-click` for opening obvious targets
  - `type-enter` for search boxes, dialogs, and prompts
  - `launch-app` only after the launcher shortcut is confirmed from the current screen or the user
  - `open-url` only when a browser is already focused and the address bar shortcut is confirmed from the current screen or the user
- `actions-json` accepts a full NanoKVM request body. Use it for deterministic multi-step sequences to minimize round-trips.
