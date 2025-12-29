import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';
import { w3cwebsocket as W3cWebSocket } from 'websocket';

import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom, videoScaleAtom } from '@/jotai/screen.ts';
import * as storage from '@/lib/localstorage.ts'

export const H264Webrtc = () => {
  const resolution = useAtomValue(resolutionAtom);
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [videoScale, setVideoScale] = useAtom(videoScaleAtom);

  const [isLoading, setIsLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoOfferSent = useRef(false);
  const videoIceCandidates = useRef<RTCIceCandidate[]>([]);

  useEffect(() => {
    const url = `${getBaseUrl('ws')}/api/stream/h264`;
    const ws = new W3cWebSocket(url);

    const iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }];
    const video = new RTCPeerConnection({ iceServers });

    // --- Init Video ---
    video.onnegotiationneeded = async () => {
      if (videoOfferSent.current || video.signalingState !== 'stable') {
        console.log('Skipping video negotiation - Waiting for answer or state unstable');
        return;
      }

      try {
        videoOfferSent.current = true;
        const offer = await video.createOffer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: false
        });

        await video.setLocalDescription(offer);

        sendMsg('video-offer', JSON.stringify(video.localDescription));
      } catch (error) {
        videoOfferSent.current = false;
        console.error('Video negotiation failed:', error);
      }
    };

    video.onconnectionstatechange = () => {
      if (video.iceConnectionState === 'connected') {
        setIsLoading(false);
      }
    };

    video.ontrack = (event) => {
      if (videoRef.current && event.track.kind === 'video') {
        videoRef.current.srcObject = new MediaStream([event.track]);
      }
    };

    ws.onopen = () => {
      videoOfferSent.current = false;

      video.onicecandidate = (event) => {
        if (event.candidate) {
          sendMsg('video-candidate', JSON.stringify(event.candidate));
        }
      };

      video.addTransceiver('video', { direction: 'recvonly' });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (!msg?.data) return;

        const data = JSON.parse(msg.data);
        if (!data) return;

        switch (msg.event) {
          case 'video-answer':
            handleVideoAnswer(data);
            break;
          case 'video-candidate':
            handleVideoCandidate(data);
            break;
          case 'heartbeat':
            break;
          default:
            console.log('Unhandled event:', msg.event);
        }
      } catch (err) {
        console.error('Message processing error:', err);
      }
    };

    const handleVideoAnswer = (data: any) => {
      if (video.signalingState !== 'have-local-offer') {
        videoOfferSent.current = false;
        console.warn(`Video signaling state incorrect for answer: ${video.signalingState}`);
        return;
      }

      video
        .setRemoteDescription(new RTCSessionDescription(data))
        .then(() => {
          videoOfferSent.current = false;
          videoIceCandidates.current.forEach((candidate) => {
            video
              .addIceCandidate(candidate)
              .catch((e) => console.error('Video candidate failed to add:', e.message));
          });
          videoIceCandidates.current = [];
        })
        .catch((error) => {
          console.error('Video answer set failed:', error);
          videoOfferSent.current = false;
        });
    };

    const handleVideoCandidate = (data: any) => {
      if (!data.candidate) {
        return;
      }

      const candidate = new RTCIceCandidate(data);
      if (video.remoteDescription) {
        video
          .addIceCandidate(candidate)
          .catch((e) => console.error('Video candidate failed to add:', e.message));
      } else {
        videoIceCandidates.current.push(candidate);
      }
    };

    const sendMsg = (event: string, data: string) => {
      if (ws.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        ws.send(JSON.stringify({ event, data }));
      } catch (err) {
        console.error('Error sending event: ', err);
      }
    };

    const heartbeatTimer = setInterval(() => {
      sendMsg('heartbeat', '');
    }, 60 * 1000);

    setTimeout(() => {
      setIsLoading(false);
    }, 5 * 1000);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }

      video.close();
      videoOfferSent.current = false;

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    };
  }, []);

  useEffect(() => {
    const scale = storage.getVideoScale()
    if (scale) {
      setVideoScale(scale)
    }
  }, [setVideoScale])

  return (
    <Spin size="large" tip="Loading" spinning={isLoading}>
      <div className="flex h-screen w-screen items-start justify-center xl:items-center">
        <video
          id="screen"
          ref={videoRef}
          className={clsx('block min-h-[480px] min-w-[640px] select-none', mouseStyle)}
          style={{
            transform: `scale(${videoScale})`,
            transformOrigin: 'center',
            ...(resolution?.width
              ? { width: resolution.width, height: resolution.height, objectFit: 'cover' }
              : { maxWidth: '100%', maxHeight: '100%', objectFit: 'scale-down' })
          }}
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
    </Spin>
  );
};
