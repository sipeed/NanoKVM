import { http } from '@/lib/http';

export type UserRole = 'admin' | 'user';

export type Permission =
  | 'console.view'
  | 'console.control'
  | 'power'
  | 'media.mount'
  | 'media.manage'
  | 'terminal'
  | 'device'
  | 'network'
  | 'update'
  | 'mcp'
  | 'tailscale'
  | 'ai';

// Media access splits along the trust boundary: media.mount attaches a medium to
// the target machine and reads it, media.manage changes the library contents.
// Every screen that shows the library needs either of them, so the pair is
// checked together instead of being spelled out at each call site.
export const MEDIA_PERMISSIONS: Permission[] = ['media.mount', 'media.manage'];

export type Account = {
  username: string;
  role: UserRole;
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
