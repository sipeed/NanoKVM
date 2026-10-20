import { http } from '@/lib/http';

export type UserRole = 'admin' | 'user';

export type Permission =
  | 'console.view'
  | 'console.control'
  | 'power'
  | 'medium.attach'
  | 'library.read'
  | 'library.write'
  | 'terminal'
  | 'device'
  | 'network'
  | 'update'
  | 'mcp'
  | 'tailscale'
  | 'ai';

// Group names the party a grant reaches: the console this account watches, the
// machine behind it, the media library on this device, the device itself, or
// the services that reach it on their own.
export type PermissionGroup = 'console' | 'target' | 'library' | 'host' | 'services';

// Risk states how far a grant reaches. The editor marks the danger ones, which
// are the grants that amount to full device control.
export type PermissionRisk = 'info' | 'warn' | 'danger';

// PermissionDescriptor is one catalog entry as the server serves it. The editor
// renders the catalog instead of keeping its own copy of the model, so labels,
// groups and implied grants cannot drift from what the server enforces.
export type PermissionDescriptor = {
  id: Permission;
  group: PermissionGroup;
  risk: PermissionRisk;
  implies?: Permission[];
};

export type Account = {
  username: string;
  role: UserRole;
  // The effective grants: the stored set plus everything it implies.
  permissions: Permission[];
};

export type User = Account & {
  enabled: boolean;
  systemAccount?: boolean;
};
export function login(username: string, password: string) {
  const data = {
    username,
    password
  };
  return http.post('/api/auth/login', data);
}

export function logout() {
  return http.post('/api/auth/logout');
}

export function getAccount() {
  return http.get('/api/auth/account');
}

export function changePassword(currentPassword: string, password: string) {
  return http.post('/api/auth/password', { currentPassword, password });
}

export function isPasswordUpdated() {
  return http.get('/api/auth/password');
}

export function getUsers() {
  return http.get('/api/auth/users');
}

export function getPermissions() {
  return http.get('/api/auth/permissions');
}

export function createUser(
  username: string,
  password: string,
  role: UserRole,
  permissions?: Permission[]
) {
  return http.post('/api/auth/users', { username, password, role, permissions });
}

export function updateUser(
  username: string,
  data: Partial<Pick<User, 'role' | 'enabled' | 'permissions'>>
) {
  return http.request({
    method: 'put',
    url: `/api/auth/users/${encodeURIComponent(username)}`,
    data
  });
}

export function deleteUser(username: string) {
  return http.delete(`/api/auth/users/${encodeURIComponent(username)}`);
}

export function resetUserPassword(username: string, password: string) {
  return http.post(`/api/auth/users/${encodeURIComponent(username)}/password`, { password });
}
