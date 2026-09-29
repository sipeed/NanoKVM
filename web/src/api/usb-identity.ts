import { http } from '@/lib/http.ts';

export interface UsbIdentity {
  vendorId: string;
  productId: string;
  manufacturer: string;
  product: string;
  serial: string;
  isCustom: boolean;
}

// get the current USB gadget VID/PID and string descriptors
export function getUsbIdentity() {
  return http.get('/api/vm/usb-identity');
}

// set the USB gadget VID/PID and string descriptors.
// pass an empty string for any field to reset it to the NanoKVM default.
export function setUsbIdentity(identity: Omit<UsbIdentity, 'isCustom'>) {
  return http.post('/api/vm/usb-identity', identity);
}
