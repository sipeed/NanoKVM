import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import clsx from 'clsx';
import { useAtom, useAtomValue } from 'jotai';
import { w3cwebsocket as W3cWebSocket } from 'websocket';

import * as storage from '@/lib/localstorage.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';
import { resolutionAtom, videoScaleAtom } from '@/jotai/screen.ts';

type SignalingMessage = {
  event?: string;
  data?: string;
};

const parseSignalingData = <T,>(data?: string): T | null => {
  if (!data) {
    return null;
  }

  return JSON.parse(data) as T;
};

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
    const videoElement = videoRef.current;

    let video: RTCPeerConnection | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

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

    const startVideo = (iceServers: RTCIceServer[]) => {
      if (video || disposed) {
        return;
      }

      const peer = new RTCPeerConnection({ iceServers });
      video = peer;
      videoOfferSent.current = false;
      videoIceCandidates.current = [];

      // --- Init Video ---
      peer.onnegotiationneeded = async () => {
        if (videoOfferSent.current || peer.signalingState !== 'stable') {
          console.log('Skipping video negotiation - Waiting for answer or state unstable');
          return;
        }

        try {
          videoOfferSent.current = true;
          const offer = await peer.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false
          });

          await peer.setLocalDescription(offer);

          sendMsg('video-offer', JSON.stringify(peer.localDescription));
        } catch (error) {
          videoOfferSent.current = false;
          console.error('Video negotiation failed:', error);
        }
      };

      peer.ontrack = (event) => {
        if (videoElement && event.track.kind === 'video') {
          videoElement.srcObject = new MediaStream([event.track]);
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          sendMsg('video-candidate', JSON.stringify(event.candidate));
        }
      };

      peer.addTransceiver('video', { direction: 'recvonly' });
    };

    const handleVideoAnswer = (data: RTCSessionDescriptionInit) => {
      const peer = video;
      if (!peer) {
        return;
      }

      if (peer.signalingState !== 'have-local-offer') {
        videoOfferSent.current = false;
        console.warn(`Video signaling state incorrect for answer: ${peer.signalingState}`);
        return;
      }

      peer
        .setRemoteDescription(new RTCSessionDescription(data))
        .then(() => {
          videoOfferSent.current = false;
          videoIceCandidates.current.forEach((candidate) => {
            peer
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

    const handleVideoCandidate = (data: RTCIceCandidateInit) => {
      const peer = video;
      if (!peer || !data.candidate) {
        return;
      }

      const candidate = new RTCIceCandidate(data);
      if (peer.remoteDescription) {
        peer
          .addIceCandidate(candidate)
          .catch((e) => console.error('Video candidate failed to add:', e.message));
      } else {
        videoIceCandidates.current.push(candidate);
      }
    };

    ws.onopen = () => {
      if (disposed) {
        ws.close();
        return;
      }

      heartbeatTimer = setInterval(() => {
        sendMsg('heartbeat', '');
      }, 60 * 1000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as SignalingMessage;

        switch (msg.event) {
          case 'ice-servers': {
            const iceServers = parseSignalingData<RTCIceServer[]>(msg.data);
            startVideo(Array.isArray(iceServers) ? iceServers : []);
            break;
          }
          case 'video-answer': {
            const data = parseSignalingData<RTCSessionDescriptionInit>(msg.data);
            if (data) {
              handleVideoAnswer(data);
            }
            break;
          }
          case 'video-candidate': {
            const data = parseSignalingData<RTCIceCandidateInit>(msg.data);
            if (data) {
              handleVideoCandidate(data);
            }
            break;
          }
          case 'heartbeat':
            break;
          default:
            console.log('Unhandled event:', msg.event);
        }
      } catch (err) {
        console.error('Message processing error:', err);
      }
    };

    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5 * 1000);

    return () => {
      disposed = true;

      if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }

      video?.close();
      video = null;
      if (videoElement) {
        videoElement.srcObject = null;
      }
      videoOfferSent.current = false;
      videoIceCandidates.current = [];

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      clearTimeout(loadingTimer);
    };
  }, []);

  useEffect(() => {
    const scale = storage.getVideoScale();
    if (scale) {
      setVideoScale(scale);
    }
  }, [setVideoScale]);

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden">
        <video
          id="screen"
          ref={videoRef}
          className={clsx('block select-none', mouseStyle)}
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

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all duration-300">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};
