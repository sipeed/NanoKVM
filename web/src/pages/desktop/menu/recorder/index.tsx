import { useEffect, useRef, useState } from 'react';
import { Video } from 'lucide-react';

export const Recorder = () => {
  const videoElement = document.getElementById('screen') as HTMLVideoElement;
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const fileWritableRef = useRef<FileSystemWritableFileStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  const formatElapsed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    const stream = (videoElement as any).captureStream();
    if (!stream) {
      return;
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`,
        types: [
          {
            description: 'Sipeed NanoKVM Recorder',
            accept: { 'video/webm': ['.webm'] }
          }
        ]
      });

      const writable = await handle.createWritable();
      fileWritableRef.current = writable;

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });

      recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          if (fileWritableRef.current) {
            await fileWritableRef.current.write(event.data);
          } else {
            recorder.stop();
          }
        }
      };

      recorder.onstop = async () => {
        if (fileWritableRef.current) {
          await fileWritableRef.current.close();
          fileWritableRef.current = null;
        }
        stopTimer();
        setElapsedMs(0);
        setIsRecording(false);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      stopTimer();
      setElapsedMs(0);
      setIsRecording(false);
    }
  };

  return (
    <div
      className="flex h-[28px] cursor-pointer items-center justify-center rounded text-white hover:bg-neutral-700/70"
      onClick={isRecording ? handleStopRecording : handleStartRecording}
    >
      <Video className={isRecording ? 'animate-pulse text-red-400' : ''} size={18} />
      {isRecording && <span className="p-1 text-xs text-red-300">{formatElapsed(elapsedMs)}</span>}
    </div>
  );
};
