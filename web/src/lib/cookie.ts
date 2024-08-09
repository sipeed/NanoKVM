import Cookies from 'js-cookie';

const COOKIE_TOKEN_KEY = 'nano-kvm-token';

export function existToken() {
  const token = Cookies.get(COOKIE_TOKEN_KEY);
  return !!token;
}

export function getToken() {
  const token = Cookies.get(COOKIE_TOKEN_KEY);
  if (!token) return null;

  return token;
}

export function setToken(token: string) {
  Cookies.set(COOKIE_TOKEN_KEY, token, { expires: 30 });
}

export function removeToken() {
  Cookies.remove(COOKIE_TOKEN_KEY);
}
