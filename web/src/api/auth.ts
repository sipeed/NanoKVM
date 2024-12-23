import { http } from '@/lib/http';

export function login(username: string, password: string) {
  const data = {
    username,
    password
  };
  return http.post('/api/auth/login', data);
}

export function changePassword(username: string, password: string) {
  const data = {
    username,
    password
  };
  return http.post('/api/auth/password', data);
}

export function isPasswordUpdated() {
  return http.get('/api/auth/password');
}

export function connectWifi(ssid: string, password: string) {
  const data = {
    ssid,
    password
  };
  return http.post('/api/auth/wifi', data);
}
