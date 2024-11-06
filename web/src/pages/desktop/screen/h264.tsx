import { useEffect, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { w3cwebsocket as W3cWebSocket } from 'websocket';

import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom } from '@/jotai/screen.ts';

export const H264 = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let heartbeatTimer: any;
    const videoElement = document.getElementById('screen') as HTMLVideoElement;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.ontrack = function (event) {
      if (event.track.kind !== 'video') {
        console.log('unhandled track kind: ', event.track.kind);
        return;
      }
      videoElement.srcObject = event.streams[0];
    };

    const url = `${getBaseUrl('ws')}/api/stream/h264`;
    const ws = new W3cWebSocket(url);

    ws.onopen = () => {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ event: 'candidate', data: JSON.stringify(event.candidate) }));
        }
      };

      pc.addTransceiver('video', { direction: 'recvonly' });

      pc.createOffer({ offerToReceiveVideo: true })
        .then((offer) => {
          pc.setLocalDescription(offer).catch(console.log);
          ws.send(JSON.stringify({ event: 'offer', data: JSON.stringify(offer) }));
        })
        .catch(console.log);

      heartbeatTimer = setInterval(() => {
        ws.send(JSON.stringify({ event: 'heartbeat', data: '' }));
      }, 60 * 1000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string);
      if (!msg) return;

      const data = JSON.parse(msg.data);
      if (!data) return;

      switch (msg.event) {
        case 'answer':
          pc.setRemoteDescription(data).catch(console.log);
          break;

        case 'candidate':
          pc.addIceCandidate(data).catch(console.log);
          break;

        case 'heartbeat':
          break;

        default:
          console.log('unhandled event: ', msg.event);
      }
    };

    setTimeout(() => {
      setIsLoading(false);
    }, 10 * 1000);

    return () => {
      heartbeatTimer && clearInterval(heartbeatTimer);
      ws.close();
      pc.close();
    };
  }, []);

  return (
    <>
      {isLoading && <Spin indicator={<LoadingOutlined spin />} size="large" fullscreen />}

      <div className={clsx('flex h-screen w-screen items-start justify-center xl:items-center')}>
        <video
          id="screen"
          className={clsx('block select-none bg-neutral-950', mouseStyle)}
          style={
            resolution?.width
              ? { width: resolution.width, height: resolution.height, objectFit: 'cover' }
              : { maxWidth: '100%', maxHeight: '100%', objectFit: 'scale-down' }
          }
          muted
          autoPlay
          playsInline
          controls={false}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPlaying={() => {
            setIsLoading(false);
          }}
        />
      </div>
    </>
  );
};
