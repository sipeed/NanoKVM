type PicocomParameters = {
  port: string | null;
  baud: string | null;
  parity: string | null;
  flowControl: string | null;
  dataBits: string | null;
  stopBits: string | null;
};

const ALLOWED_BAUD_RATES = [
  '50',
  '75',
  '110',
  '134',
  '150',
  '200',
  '300',
  '600',
  '1200',
  '1800',
  '2400',
  '4800',
  '9600',
  '19200',
  '38400',
  '57600',
  '115200',
  '230400',
  '460800',
  '500000',
  '576000',
  '921600',
  '1000000',
  '1152000',
  '1500000',
  '2000000',
  '2500000',
  '3000000',
  '3500000',
  '4000000'
];
const ALLOWED_PARITIES = ['n', 'o', 'e', 'm', 's', 'none', 'even', 'odd'];
const ALLOWED_FLOW_CONTROLS = ['n', 'h', 's', 'x', 'none', 'soft', 'hard'];
const ALLOWED_DATA_BITS = ['5', '6', '7', '8'];
const ALLOWED_STOP_BITS = ['1', '2'];

const PROHIBITED_PORT_CHARS_REGEX = /[;&|`$()<>!*?"'\s\\]/;

export function validatePicocomParameters(params: PicocomParameters) {
  if (!params.port || params.port.trim() === '') {
    return false;
  }

  const port = params.port.trim();
  if (!port.startsWith('/')) {
    return false;
  }
  if (port.includes('..')) {
    return false;
  }
  if (PROHIBITED_PORT_CHARS_REGEX.test(port)) {
    return false;
  }
  if (!/^\/dev\/[a-zA-Z0-9.-_]+$/.test(port)) {
    return false;
  }

  if (params.baud !== undefined && params.baud !== null && String(params.baud).trim() !== '') {
    const baudStr = String(params.baud).trim();
    if (!ALLOWED_BAUD_RATES.includes(baudStr)) {
      return false;
    }
  }

  if (
    params.parity !== undefined &&
    params.parity !== null &&
    String(params.parity).trim() !== ''
  ) {
    const parityStr = String(params.parity).trim().toLowerCase();
    if (!ALLOWED_PARITIES.includes(parityStr)) {
      return false;
    }
  }

  if (
    params.flowControl !== undefined &&
    params.flowControl !== null &&
    String(params.flowControl).trim() !== ''
  ) {
    const flowStr = String(params.flowControl).trim().toLowerCase();
    if (!ALLOWED_FLOW_CONTROLS.includes(flowStr)) {
      return false;
    }
  }

  if (
    params.dataBits !== undefined &&
    params.dataBits !== null &&
    String(params.dataBits).trim() !== ''
  ) {
    const dataBitsStr = String(params.dataBits).trim();
    if (!ALLOWED_DATA_BITS.includes(dataBitsStr)) {
      return false;
    }
  }

  if (
    params.stopBits !== undefined &&
    params.stopBits !== null &&
    String(params.stopBits).trim() !== ''
  ) {
    const stopBitsStr = String(params.stopBits).trim();
    if (!ALLOWED_STOP_BITS.includes(stopBitsStr)) {
      return false;
    }
  }

  return true;
}
