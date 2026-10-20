import { Permission, PermissionDescriptor, PermissionGroup } from '@/api/auth.ts';

// The catalog itself comes from the server; this module only names the grants in
// the current UI language and derives the set operations the editor needs.

// i18next treats dots as key separators, so permission ids are mapped to
// dot-free i18n keys.
const PERMISSION_KEYS: Record<Permission, string> = {
  'console.view': 'consoleView',
  'console.control': 'consoleControl',
  power: 'power',
  'medium.attach': 'mediumAttach',
  'library.read': 'libraryRead',
  'library.write': 'libraryWrite',
  terminal: 'terminal',
  device: 'device',
  network: 'network',
  update: 'update',
  mcp: 'mcp',
  tailscale: 'tailscale',
  ai: 'ai'
};

const GROUP_KEYS: Record<PermissionGroup, string> = {
  console: 'groupConsole',
  target: 'groupTarget',
  library: 'groupLibrary',
  host: 'groupHost',
  services: 'groupServices'
};

// The order the sections appear in: what the account does with the console it
// watches, then what it does to the target machine, then this device.
export const GROUP_ORDER: PermissionGroup[] = ['console', 'target', 'library', 'host', 'services'];

// A new account starts able to watch and nothing else: every other grant is a
// decision an administrator makes on purpose.
export const DEFAULT_PERMISSIONS: Permission[] = ['console.view'];

export function permissionLabelKey(permission: Permission) {
  const key = PERMISSION_KEYS[permission];
  return key ? `settings.account.permissions.${key}` : permission;
}

export function permissionEffectKey(permission: Permission) {
  const key = PERMISSION_KEYS[permission];
  return key
    ? `settings.account.permissions.effect${key.charAt(0).toUpperCase()}${key.slice(1)}`
    : '';
}

export function groupLabelKey(group: PermissionGroup) {
  return `settings.account.permissions.${GROUP_KEYS[group]}`;
}

// closureOf resolves the grants a set implies, the same way the server does: the
// editor shows an implied grant as held instead of letting an administrator
// check it by hand and wonder why it disappears.
export function closureOf(granted: Permission[], catalog: PermissionDescriptor[]): Set<Permission> {
  const implies = new Map<Permission, Permission[]>(
    catalog.map((descriptor) => [descriptor.id, descriptor.implies ?? []])
  );
  const resolved = new Set<Permission>();

  function add(permission: Permission) {
    if (resolved.has(permission)) return;
    resolved.add(permission);
    for (const implied of implies.get(permission) ?? []) {
      add(implied);
    }
  }

  granted.forEach(add);
  return resolved;
}
