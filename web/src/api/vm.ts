import { ControlRegionMode, InputRegion, OriginalResolution } from '@/types';
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

// get the device-level absolute mouse input region
export function getInputRegion() {
  return http.get('/api/vm/input-region');
}

export function getInputResolution() {
  return http.get('/api/vm/input-resolution');
}

// save the device-level absolute mouse input region
export function setInputRegion(region: InputRegion) {
  return http.post('/api/vm/input-region', { mode: 'manual', ...region });
}

export function setInputRegionConfig(region: InputRegion, selectedResolution: string) {
  return http.post('/api/vm/input-region', {
    mode: 'manual',
    ...region,
    selectedResolution
  });
}

export function setControlRegionMode(mode: ControlRegionMode) {
  return http.post('/api/vm/input-region', { mode });
}

export function setOriginalResolutions(mode: ControlRegionMode, resolutions: OriginalResolution[]) {
  return http.post('/api/vm/input-region', { mode, resolutions });
}

export function setOriginalResolutionConfig(
  resolutions: OriginalResolution[],
  selectedResolution: string
) {
  return http.post('/api/vm/input-region', {
    mode: 'manual',
    resolutions,
    selectedResolution
  });
}

export function setSelectedOriginalResolution(selectedResolution: string) {
  return http.post('/api/vm/input-region', { mode: 'manual', selectedResolution });
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

// get HDMI state
export function getHdmiState() {
  return http.get('/api/vm/hdmi');
}

// enable HDMI
export function enableHdmi() {
  return http.post('/api/vm/hdmi/enable');
}

// disable HDMI
export function disableHdmi() {
  return http.post('/api/vm/hdmi/disable');
}

// set HDMI state
export function setHdmiState(enabled: boolean) {
  if (enabled) {
    return enableHdmi();
  }
  return disableHdmi();
}

// set HDMI idle timeout in minutes
export function setHdmiIdleTimeout(minutes: number) {
  return http.post('/api/vm/hdmi/timeout', { minutes });
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

// get swap file size
export function getSwap() {
  return http.get('/api/vm/swap');
}

// set swap file size
export function setSwap(size: number) {
  return http.post('/api/vm/swap', { size });
}

// get mouse jiggler
export function getMouseJiggler() {
  return http.get('/api/vm/mouse-jiggler');
}

// set mouse jiggler
export function setMouseJiggler(enabled: boolean, mode: string) {
  return http.post('/api/vm/mouse-jiggler', { enabled, mode });
}

// get Hostname
export function getHostname() {
  return http.get('/api/vm/hostname');
}

// set Hostname
export function setHostname(hostname: string) {
  return http.post('/api/vm/hostname', { hostname });
}

// get WebTitle
export function getWebTitle() {
  return http.get('/api/vm/web-title');
}

// set WebTitle
export function setWebTitle(title: string) {
  return http.post('/api/vm/web-title', { title });
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

// enable / disable TLS
export function setTLS(enabled: boolean) {
  return http.post('/api/vm/tls', { enabled });
}

// reboot
export function reboot() {
  return http.post('/api/vm/system/reboot');
}
