import { http } from '@/lib/http.ts';

// enable/disable frame detect
export function updateFrameDetect(enabled: boolean) {
  const data = {
    enabled
  };
  return http.post('/api/stream/mjpeg/detect', data);
}

// pause frame detect for a while (prevent a black screen when opening the page for the first time)
export function stopFrameDetect(duration: number) {
  const data = {
    duration
  };
  return http.post('/api/stream/mjpeg/detect/stop', data);
}
