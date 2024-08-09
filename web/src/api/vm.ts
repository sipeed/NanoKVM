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

// get led gpio enabled
export function getLedGpio() {
  return http.get('/api/vm/gpio/led');
}

// update screen arguments
export function updateScreen(type: string, value: number) {
  const data = {
    type,
    value
  };
  return http.post('/api/vm/screen', data);
}
