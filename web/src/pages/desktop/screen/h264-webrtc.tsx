import { useEffect, useRef, useState } from 'react';
import { notification, Spin } from 'antd';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { w3cwebsocket as W3cWebSocket } from 'websocket';

import { notifyAuthRefresh } from '@/lib/auth-events.ts';
import { getBaseUrl } from '@/lib/service.ts';
import { mouseStyleAtom } from '@/jotai/mouse.ts';

import { ScreenViewport } from './viewport.tsx';

type SignalingMessage = {
  event?: string;
  data?: string;
};

const WEBRTC_CONNECTION_FAILED_NOTIFICATION_KEY = 'webrtc_connection_failed';
const WEBRTC_CONNECTION_TIMEOUT = 30 * 1000;
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
    let offerSent = false;
    let connectionStage = 'opening signaling WebSocket';
    let pendingLocalCandidates: RTCIceCandidateInit[] = [];
    let localCandidateCount = 0;
    let remoteCandidateCount = 0;
    let noLocalCandidates = false;

    const markStage = (stage: string) => {
      connectionStage = stage;
      console.info(`WebRTC: ${stage}`);
    };

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
      if (disposed || noLocalCandidates) {
        return;
      }

      console.error(`WebRTC connection failed at ${connectionStage}: ${reason}`, error);
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

    // A 4403 close means permissions changed but the login is still valid:
    // reconnect quickly and quietly instead of alarming the user.
    const scheduleSilentReconnect = () => {
      if (disposed || reconnectTimer) {
        return;
      }

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        setConnectionAttempt((attempt) => attempt + 1);
      }, 500);
    };

    const sendMsg = (event: string, data: string): boolean => {
      if (ws.readyState !== WebSocket.OPEN) {
        return false;
      }

      try {
        ws.send(JSON.stringify({ event, data }));
        return true;
      } catch (err) {
        console.error('Error sending event: ', err);
        return false;
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
      offerSent = false;
      pendingLocalCandidates = [];
      localCandidateCount = 0;
      remoteCandidateCount = 0;
      markStage('creating offer');

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

          if (!sendMsg('video-offer', JSON.stringify(peer.localDescription))) {
            throw new Error('the signaling WebSocket is unavailable');
          }

          // ICE gathering can start before setLocalDescription resolves. Always
          // deliver the offer first so the server has a remote description when
          // it receives candidates on this WebSocket.
          offerSent = true;
          markStage('offer sent');
          for (const candidate of pendingLocalCandidates) {
            if (!sendMsg('video-candidate', JSON.stringify(candidate))) {
              throw new Error('the signaling WebSocket closed while sending ICE candidates');
            }
          }
          pendingLocalCandidates = [];
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

        markStage(`peer ${peer.connectionState}`);
        if (peer.connectionState === 'failed') {
          scheduleReconnect('peer connection state is failed');
        } else if (peer.connectionState === 'connected') {
          cancelReconnect();
          notificationApi.destroy(WEBRTC_CONNECTION_FAILED_NOTIFICATION_KEY);
        }
      };

      peer.oniceconnectionstatechange = () => {
        if (!disposed && peer === video) {
          markStage(`ICE ${peer.iceConnectionState}`);
        }
      };

      peer.onicegatheringstatechange = () => {
        if (!disposed && peer === video) {
          console.info(`WebRTC: ICE gathering ${peer.iceGatheringState}; local candidates ${localCandidateCount}`);

          if (peer.iceGatheringState === 'complete' && localCandidateCount === 0) {
            noLocalCandidates = true;
            console.error('WebRTC: the browser gathered no local ICE candidates; a connection cannot be established');
            showConnectionFailureNotification();
            setIsLoading(false);
            cancelReconnect();
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
              heartbeatTimer = null;
            }
            ws.close();
            peer.close();
          }
        }
      };

      peer.ontrack = (event) => {
        if (videoElement && event.track.kind === 'video') {
          videoElement.srcObject = new MediaStream([event.track]);
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          localCandidateCount += 1;
          console.info(`WebRTC: local ${event.candidate.type ?? 'unknown'} candidate ${localCandidateCount}`);
          if (!offerSent) {
            pendingLocalCandidates.push(event.candidate.toJSON());
          } else if (!sendMsg('video-candidate', JSON.stringify(event.candidate))) {
            scheduleReconnect('sending a local ICE candidate');
          }
        } else {
          console.info(`WebRTC: local ICE gathering complete; ${localCandidateCount} candidates`);
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
          markStage('answer applied');
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
      remoteCandidateCount += 1;
      console.info(`WebRTC: remote ${candidate.type ?? 'unknown'} candidate ${remoteCandidateCount}`);
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

      markStage('signaling WebSocket open');

      heartbeatTimer = setInterval(() => {
        sendMsg('heartbeat', '');
      }, 60 * 1000);
    };

    ws.onerror = (error) => {
      scheduleReconnect('the signaling WebSocket returned an error', error);
    };

    ws.onclose = (event) => {
      if (noLocalCandidates) {
        return;
      }
      if (event?.code === 4403) {
        notifyAuthRefresh();
        scheduleSilentReconnect();
        return;
      }
      scheduleReconnect('the signaling WebSocket closed');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as SignalingMessage;

        switch (msg.event) {
          case 'ice-servers': {
            markStage('ICE configuration received');
            const iceServers = parseSignalingData<RTCIceServer[]>(msg.data);
            startVideo(Array.isArray(iceServers) ? iceServers : []);
            break;
          }
          case 'video-answer': {
            markStage('answer received');
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

    const connectionTimeoutTimer = setTimeout(() => {
      if (noLocalCandidates) {
        return;
      }
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
      pendingLocalCandidates = [];

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
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
