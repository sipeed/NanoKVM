import CryptoJS from 'crypto-js';

const SECRET_KEY = 'nanokvm-sipeed-2024';

export function encrypt(data: string) {
  const dataEncrypt = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  return encodeURIComponent(dataEncrypt);
}

export function decrypt(data: string) {
  const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
  const dataDecrypt = bytes.toString(CryptoJS.enc.Utf8);
  return decodeURIComponent(dataDecrypt);
}
