export type UsbPreset = {
  id: string;
  labelKey: string;
  group: 'generic' | 'brand';
  descriptor: {
    vendorName: string;
    productName: string;
    vid: string;
    pid: string;
  };
};

export const presets: UsbPreset[] = [
  {
    id: 'generic-keyboard',
    labelKey: 'settings.device.usbDescriptor.presets.genericKeyboard',
    group: 'generic',
    descriptor: {
      vendorName: 'USB',
      productName: 'USB Keyboard',
      vid: '0x0001',
      pid: '0x0001'
    }
  },
  {
    id: 'generic-mouse',
    labelKey: 'settings.device.usbDescriptor.presets.genericMouse',
    group: 'generic',
    descriptor: {
      vendorName: 'USB',
      productName: 'USB Mouse',
      vid: '0x0001',
      pid: '0x0001'
    }
  },
  {
    id: 'generic-composite',
    labelKey: 'settings.device.usbDescriptor.presets.genericComposite',
    group: 'generic',
    descriptor: {
      vendorName: 'USB',
      productName: 'USB Composite Device',
      vid: '0x0001',
      pid: '0x0001'
    }
  },
  {
    id: 'generic-hid',
    labelKey: 'settings.device.usbDescriptor.presets.genericHid',
    group: 'generic',
    descriptor: {
      vendorName: 'USB',
      productName: 'USB HID Device',
      vid: '0x0001',
      pid: '0x0001'
    }
  },
  {
    id: 'logitech-keyboard',
    labelKey: 'settings.device.usbDescriptor.presets.logitechKeyboard',
    group: 'brand',
    descriptor: {
      vendorName: 'Logitech',
      productName: 'Logitech Keyboard K120',
      vid: '0x046D',
      pid: '0xC31C'
    }
  },
  {
    id: 'logitech-mouse',
    labelKey: 'settings.device.usbDescriptor.presets.logitechMouse',
    group: 'brand',
    descriptor: {
      vendorName: 'Logitech',
      productName: 'Logitech USB Optical Mouse',
      vid: '0x046D',
      pid: '0xC077'
    }
  },
  {
    id: 'microsoft-keyboard',
    labelKey: 'settings.device.usbDescriptor.presets.microsoftKeyboard',
    group: 'brand',
    descriptor: {
      vendorName: 'Microsoft',
      productName: 'Microsoft Wired Keyboard',
      vid: '0x045E',
      pid: '0x0750'
    }
  },
  {
    id: 'dell-keyboard',
    labelKey: 'settings.device.usbDescriptor.presets.dellKeyboard',
    group: 'brand',
    descriptor: {
      vendorName: 'Dell',
      productName: 'Dell KB216 Keyboard',
      vid: '0x413C',
      pid: '0x2113'
    }
  }
];
