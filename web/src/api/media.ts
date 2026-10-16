import { http } from '@/lib/http.ts';
import { getBaseUrl } from '@/lib/service.ts';

export type MediaType = 'image' | 'partition';

// What the emulated USB disk currently exposes to the target machine. "none"
// is a medium that was really released, "unsupported" means the gadget has no
// mass storage at all because the virtual disk is off or the device runs in
// HID-only mode.
export type MediaState = 'none' | 'image' | 'partition' | 'unsupported';

export interface MediaItem {
  type: MediaType;
  rel: string;
  name: string;
  size: number;
  fs: string;
  browsable: boolean;
  attached: boolean;
  modifiedAt: string;
}

export interface MediaCapabilities {
  loop: boolean;
}

export interface MediaStateInfo {
  state: MediaState;
  type?: MediaType;
  rel?: string;
  hidOnly: boolean;
  open: string[];
  // True while the attached medium is served as a CD-ROM.
  cdrom: boolean;
}

export interface MediaFileEntry {
  name: string;
  size: number;
  isDir: boolean;
  modifiedAt: string;
}

export interface MediaFiles {
  path: string;
  entries: MediaFileEntry[];
  free: number;
  total: number;
  // True while the medium is seeing writes: a zero length entry in that state
  // is a transfer in progress, not an empty file.
  writing?: boolean;
}

export interface MediaStatus {
  status: 'idle' | 'in_progress' | 'success' | 'failed';
  name: string;
  percentage: string;
  // Bytes transferred so far and the expected total; total is 0 while the
  // server does not know the size yet.
  loaded: number;
  total: number;
  message: string;
}

// Error codes the media API reports; the UI reacts to these instead of
// matching on message text.
export const codeStorageDisabled = -10;
export const codeMediumLocked = -11;
export const codeMediumBusy = -12;
export const codeNotBrowsable = -13;
export const codeInsufficientSpace = -14;
// A CD-ROM was asked for a medium that is not an ISO 9660 image.
export const codeNotOptical = -15;

export function getMedia() {
  return http.get('/api/storage/media');
}

export function getMediaState() {
  return http.get('/api/storage/media/state');
}

export function getMediaStatus() {
  return http.get('/api/storage/media/status');
}

export function deleteMedia(data: { type: MediaType; rel: string }) {
  return http.post('/api/storage/media/delete', data);
}

export function mountMedia(data: {
  type: MediaType;
  rel: string;
  cdrom: boolean;
  force?: boolean;
}) {
  return http.post('/api/storage/media/mount', data);
}

export function ejectMedia(force = false) {
  return http.post('/api/storage/media/eject', { force });
}

export function listMediaFiles(params: { type: MediaType; rel: string; path: string }) {
  return http.get('/api/storage/media/files', params);
}

export function deleteMediaFile(data: { type: MediaType; rel: string; path: string }) {
  return http.post('/api/storage/media/files/delete', data);
}

// enable/disable the emulated USB disk (Settings - Device). Without `enable`
// the server toggles, which is only what a switch wants.
export function setVirtualDevice(device: 'network' | 'disk', enable?: boolean) {
  return http.post(
    '/api/vm/device/virtual',
    enable === undefined ? { device } : { device, enable }
  );
}

export function mediaQuery(type: MediaType, rel: string, path = ''): string {
  const params = new URLSearchParams();
  params.set('type', type);
  if (type === 'image') {
    params.set('rel', rel);
  }
  if (path) {
    params.set('path', path);
  }
  return params.toString();
}

// Downloads go through the browser so it can show its own progress: an anchor
// with the session cookie is all a file transfer needs.
export function mediaFileDownloadUrl(type: MediaType, rel: string, path: string): string {
  return `${getBaseUrl('http')}/api/storage/media/files/download?${mediaQuery(type, rel, path)}`;
}

export function mediaImageDownloadUrl(rel: string): string {
  return `${getBaseUrl('http')}/api/storage/media/download?${mediaQuery('image', rel)}`;
}

// Uploads use fetch rather than the axios client: the request can outlive the
// client's timeout, and the progress comes from the status endpoint.
export async function uploadMediaFile(
  type: MediaType,
  rel: string,
  path: string,
  file: File
): Promise<{ code: number; msg: string; data: unknown }> {
  const form = new FormData();
  form.append('file', file, file.name);

  const url = `${getBaseUrl('http')}/api/storage/media/files/upload?${mediaQuery(type, rel, path)}`;
  const response = await fetch(url, {
    method: 'POST',
    body: form,
    credentials: import.meta.env.VITE_WITH_CREDENTIALS === 'false' ? 'omit' : 'include'
  });

  return response.json();
}
