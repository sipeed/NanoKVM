import { http } from '@/lib/http.ts';

// get virtual devices status
export function getUsbState() {
  return http.get('/api/vm/usb');
}

// enable usb
export function enableUsb() {
  return http.post('/api/vm/usb/enable');
}

// disable usb
export function disableUsb() {
  return http.post('/api/vm/usb/disable');
}