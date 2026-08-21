import { useEffect, useRef, useState } from 'react';
import { notification, Spin } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { w3cwebsocket as W3cWebSocket } from 'websocket';

import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';

import { ScreenViewport } from './viewport.tsx';

type SignalingMessage = {
  event?: string;
  data?: string;
};

const WEBRTC_CONNECTION_FAILED_NOTIFICATION_KEY = 'webrtc_connection_failed';
const WEBRTC_CONNECTION_TIMEOUT = 10 * 1000;
const WEBRTC_RECONNECT_DELAY = 3 * 1000;

const parseSignalingData = <T,>(data?: string): T | null => {
  if (!data) {
    return null;
  }

  return JSON.parse(data) as T;
};

export const H264Webrtc = () => {
  const { t } = useTranslation();
  const mouseStyle = useAtomValue(mouseStyleAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [notificationApi, contextHolder] = notification.useNotification();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoOfferSent = useRef(false);
  const videoIceCandidates = useRef<RTCIceCandidate[]>([]);
  const translationRef = useRef(t);

  useEffect(() => {
    translationRef.current = t;
  }, [t]);

  useEffect(() => {
    const url = `${getBaseUrl('ws')}/api/stream/h264`;
    const ws = new W3cWebSocket(url);
    const videoElement = videoRef.current;

    let video: RTCPeerConnection | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const showConnectionFailureNotification = () => {
      notificationApi.error({
        key: WEBRTC_CONNECTION_FAILED_NOTIFICATION_KEY,
        message: translationRef.current('screen.webrtcConnectionFailed.title'),
        description: translationRef.current('screen.webrtcConnectionFailed.description'),
        placement: 'topRight',
        closable: false,
        duration: null
      });
    };

    const cancelReconnect = () => {
      if (!reconnectTimer) {
        return;
      }

      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    };

    const scheduleReconnect = (reason: string, error?: unknown) => {
      if (disposed) {
        return;
      }

      console.error(`WebRTC connection failed: ${reason}`, error);
      showConnectionFailureNotification();
      setIsLoading(false);

      if (reconnectTimer) {
        return;
      }

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        setConnectionAttempt((attempt) => attempt + 1);
      }, WEBRTC_RECONNECT_DELAY);
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
          scheduleReconnect('creating or sending the offer', error);
        }
      };

      peer.onconnectionstatechange = () => {
        if (disposed || peer !== video) {
          return;
        }

        if (peer.connectionState === 'failed') {
          scheduleReconnect('peer connection state is failed');
        } else if (peer.connectionState === 'connected') {
          cancelReconnect();
          notificationApi.destroy(WEBRTC_CONNECTION_FAILED_NOTIFICATION_KEY);
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
          scheduleReconnect('setting the remote description', error);
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

    ws.onerror = (error) => {
      scheduleReconnect('the signaling WebSocket returned an error', error);
    };

    ws.onclose = () => {
      scheduleReconnect('the signaling WebSocket closed');
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

      if (!video || video.connectionState !== 'connected') {
        showConnectionFailureNotification();
      }
    }, 5 * 1000);

    const connectionTimeoutTimer = setTimeout(() => {
      if (!video || video.connectionState !== 'connected') {
        scheduleReconnect(
          `connection timed out in state ${video?.connectionState ?? 'not initialized'}`
        );
      }
    }, WEBRTC_CONNECTION_TIMEOUT);

    return () => {
      disposed = true;
      cancelReconnect();

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
      clearTimeout(connectionTimeoutTimer);
    };
  }, [connectionAttempt, notificationApi]);

  useEffect(() => {
    return () => {
      notificationApi.destroy(WEBRTC_CONNECTION_FAILED_NOTIFICATION_KEY);
    };
  }, [notificationApi]);

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden">
      {contextHolder}

      <ScreenViewport>
        <video
          id="screen"
          ref={videoRef}
          className={clsx('block touch-none select-none', mouseStyle)}
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
      </ScreenViewport>

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all duration-300">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};
