import { http } from '@/lib/http';

export type UserRole = 'admin' | 'user';

export type Account = {
  username: string;
  role: UserRole;
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

export function createUser(username: string, password: string, role: UserRole) {
  return http.post('/api/auth/users', { username, password, role });
}

export function updateUser(username: string, data: Partial<Pick<User, 'role' | 'enabled'>>) {
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
