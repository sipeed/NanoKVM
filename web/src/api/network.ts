import { http } from '@/lib/http.ts';

export type DNSMode = 'manual' | 'dhcp';
export type WiFiSecurityMode = 'psk' | 'enterprise';
export type EthernetSecurityMode = 'off' | 'enterprise';
export type EthernetIPMode = 'manual' | 'dhcp';
export type WiFiIPMode = EthernetIPMode;

export type ConnectWifiOptions = {
  mode?: WiFiSecurityMode;
  ipMode?: WiFiIPMode;
  address?: string;
  subnetMask?: string;
  gateway?: string;
  identity?: string;
  eap?: string;
  phase2?: string;
  anonymousIdentity?: string;
  caCert?: string;
  clientCert?: string;
  privateKey?: string;
  privateKeyPasswd?: string;
  domainSuffixMatch?: string;
};

export type Ethernet8021XOptions = {
  mode?: EthernetSecurityMode;
  ipMode?: EthernetIPMode;
  address?: string;
  subnetMask?: string;
  gateway?: string;
  password?: string;
  identity?: string;
  eap?: string;
  phase2?: string;
  anonymousIdentity?: string;
  caCert?: string;
  clientCert?: string;
  privateKey?: string;
  privateKeyPasswd?: string;
  domainSuffixMatch?: string;
};

// wake on lan
export function wol(mac: string) {
  const data = {
    mac
  };
  return http.post('/api/network/wol', data);
}

// get wake-on-lan macs history
export function getWolMacs() {
  return http.get('/api/network/wol/mac');
}

export function deleteWolMac(mac: string) {
  const data = {
    mac
  };
  return http.delete('/api/network/wol/mac', data);
}

// set Mac name
export function setWolMacName(mac: string, name: string) {
  return http.post('/api/network/wol/mac/name', { mac, name });
}

// get wifi information
export function getWiFi() {
  return http.get('/api/network/wifi');
}

// connect wifi without auth (only available in wifi configuration mode)
export function connectWifiNoAuth(
  ssid: string,
  password: string,
  apPassword?: string,
  options: ConnectWifiOptions = {}
) {
  const data = {
    ssid,
    password,
    ...options
  };
  return http.post('/api/network/wifi', data, {
    headers: {
      'X-AP-Key': apPassword || ''
    }
  });
}

// verify ap login
export function verifyApLogin(apPassword: string) {
  return http.post(
    '/api/network/wifi/verify',
    {},
    {
      headers: {
        'X-AP-Key': apPassword || ''
      }
    }
  );
}

// connect wifi
export function connectWifi(ssid: string, password: string, options: ConnectWifiOptions = {}) {
  const data = {
    ssid,
    password,
    ...options
  };
  return http.post('/api/network/wifi/connect', data);
}

// disconnect wifi
export function disconnectWifi() {
  return http.post('/api/network/wifi/disconnect');
}

export function getEthernet() {
  return http.get('/api/network/ethernet');
}

export function setEthernet(options: Ethernet8021XOptions = {}) {
  return http.post('/api/network/ethernet', options);
}

export function getDNS() {
  return http.get('/api/network/dns');
}

export function setDNS(mode: DNSMode, servers: string[]) {
  return http.post('/api/network/dns', { mode, servers });
}
