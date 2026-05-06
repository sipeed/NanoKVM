import { http } from '@/lib/http';

export function login(username: string, password: string) {
  const data = { username, password };
  return http.post('/api/auth/login', data);
}

export function logout() {
  return http.post('/api/auth/logout');
}

export function getAccount() {
  return http.get('/api/auth/account');
}

export function changePassword(username: string, password: string) {
  const data = { username, password };
  return http.post('/api/auth/password', data);
}

export function isPasswordUpdated() {
  return http.get('/api/auth/password');
}

// Multi-user management
export function listUsers() {
  return http.get('/api/auth/users');
}

export function createUser(username: string, password: string, role: string) {
  return http.post('/api/auth/users', { username, password, role });
}

export function updateUser(username: string, data: { role?: string; enabled?: boolean }) {
  return http.put(`/api/auth/users/${username}`, data);
}

export function deleteUser(username: string) {
  return http.delete(`/api/auth/users/${username}`);
}

export function changeUserPassword(username: string, password: string) {
  return http.post(`/api/auth/users/${username}/password`, { username, password });
}
