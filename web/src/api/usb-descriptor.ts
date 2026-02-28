import { http } from '@/lib/http.ts';

export function getUsbDescriptor() {
  return http.get('/api/hid/usb-descriptor');
}

export function setUsbDescriptor(data: {
  vendorName: string;
  productName: string;
  serialNumber: string;
  vid: string;
  pid: string;
}) {
  return http.post('/api/hid/usb-descriptor', data);
}

export function restoreUsbDefaults() {
  return http.post('/api/hid/usb-descriptor/restore');
}
