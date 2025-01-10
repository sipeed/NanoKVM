import { http } from '@/lib/http.ts';

// get NanoKVM information
export function getInfo() {
  return http.get('/api/vm/info');
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
