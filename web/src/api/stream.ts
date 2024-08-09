import { http } from '@/lib/http.ts';

// get whether the frame detect is enabled
export function getFrameDetect() {
  return http.get('/api/stream/mjpeg/detect');
}

// enable/disable frame detect
export function updateFrameDetect() {
  return http.post('/api/stream/mjpeg/detect');
}

// pause frame detect for a while (prevent a black screen when opening the page for the first time)
export function stopFrameDetect() {
  return http.post('/api/stream/mjpeg/detect/stop');
}
