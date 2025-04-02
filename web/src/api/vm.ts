import { http } from '@/lib/http.ts';

// get NanoKVM information
export function getInfo() {
  return http.get('/api/vm/info');
}

// get hardware information
export function getHardware() {
  return http.get('/api/vm/hardware');
}

// set gpio value
export function setGpio(type: string, duration: number) {
  const data = {
    type,
    duration
  };
  return http.post('/api/vm/gpio', data);
}

// get gpio value
export function getGpio() {
  return http.get('/api/vm/gpio');
}

// update screen arguments
export function updateScreen(type: string, value: number) {
  const data = {
    type,
    value
  };
  return http.post('/api/vm/screen', data);
}

// get memory limit
export function getMemoryLimit() {
  return http.get('/api/vm/memory/limit');
}

// set memory limit
export function setMemoryLimit(enabled: boolean, limit: number) {
  const data = {
    enabled,
    limit
  };
  return http.post('/api/vm/memory/limit', data);
}

// get OLED configuration
export function getOLED() {
  return http.get('/api/vm/oled');
}

// set OLED configuration
export function setOLED(sleep: number) {
  return http.post('/api/vm/oled', { sleep });
}

// reset HDMI
export function resetHdmi() {
  return http.post('/api/vm/hdmi/reset');
}

// get SSH state
export function getSSHState() {
  return http.get('/api/vm/ssh');
}

// enable SSH
export function enableSSH() {
  return http.post('/api/vm/ssh/enable');
}

// disable SSH
export function disableSSH() {
  return http.post('/api/vm/ssh/disable');
}

// get Swap state
export function getSwapState() {
  return http.get('/api/vm/swap');
}

// enable Swap
export function enableSwap() {
  return http.post('/api/vm/swap/enable');
}

// disable Swap
export function disableSwap() {
  return http.post('/api/vm/swap/disable');
}

// get MouseJiggler state
export function getMouseJigglerState() {
  return http.get('/api/vm/mouseJiggler');
}

// enable MouseJiggler
export function enableMouseJiggler() {
  return http.post('/api/vm/mouseJiggler/enable');
}

// disable MouseJiggler
export function disableMouseJiggler() {
  return http.post('/api/vm/mouseJiggler/disable');
}

// get mDNS state
export function getMdnsState() {
  return http.get('/api/vm/mdns');
}

// enable mDNS
export function enableMdns() {
  return http.post('/api/vm/mdns/enable');
}

// disable mDNS
export function disableMdns() {
  return http.post('/api/vm/mdns/disable');
}

// reboot
export function reboot() {
  return http.post('/api/vm/system/reboot');
}
