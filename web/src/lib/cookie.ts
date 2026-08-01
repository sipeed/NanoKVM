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
  // sameSite strict keeps the token off cross-site requests, which is what
  // stops another page from driving the device through the API or a websocket.
  // secure is only set on https, otherwise the browser would drop the cookie
  // on devices served over plain http.
  Cookies.set(COOKIE_TOKEN_KEY, token, {
    expires: 30,
    sameSite: 'strict',
    secure: window.location.protocol === 'https:'
  });
}

export function removeToken() {
  Cookies.remove(COOKIE_TOKEN_KEY);
}
