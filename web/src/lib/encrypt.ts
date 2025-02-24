import CryptoJS from 'crypto-js';

// This key is only used to prevent the data from being transmitted in plaintext.
const SECRET_KEY = 'nanokvm-sipeed-2024';

export function encrypt(data: string) {
  const dataEncrypt = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  return encodeURIComponent(dataEncrypt);
}
