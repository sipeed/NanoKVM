export type EncoderTransport = 'direct' | 'webrtc';
export type EncoderCodec = 'h264' | 'h265';

export type EncoderCapabilities = {
  directH265: boolean;
  webRTCH265: boolean;
};

const CODEC_KEY = 'nano-kvm-video-codec';
const DEFAULT_CODEC: EncoderCodec = 'h265';

export function getEncoderCodec(): EncoderCodec {
  const stored = localStorage.getItem(CODEC_KEY);
  return stored === 'h264' || stored === 'h265' ? stored : DEFAULT_CODEC;
}

export function setEncoderCodec(codec: EncoderCodec) {
  localStorage.setItem(CODEC_KEY, codec);
}

export function encoderCodecQuery(codec: EncoderCodec) {
  return new URLSearchParams({ codec });
}

export async function detectEncoderCapabilities(): Promise<EncoderCapabilities> {
  const directH265 = await supportsDirectH265();
  const webRTCH265 = supportsWebRTCH265();

  return { directH265, webRTCH265 };
}

export async function isEncoderCodecSupported(
  transport: EncoderTransport,
  codec: EncoderCodec
): Promise<boolean> {
  if (codec === 'h264') return true;

  return transport === 'direct' ? supportsDirectH265() : supportsWebRTCH265();
}

async function supportsDirectH265() {
  if (!window.VideoDecoder || !window.isSecureContext) return false;

  try {
    const support = await window.VideoDecoder.isConfigSupported({
      codec: 'hev1.1.6.L120.B0',
      hardwareAcceleration: 'prefer-hardware',
      optimizeForLatency: true
    });
    return support.supported === true;
  } catch {
    return false;
  }
}

export function supportsWebRTCH265() {
  if (!window.RTCRtpReceiver?.getCapabilities) return false;

  return (
    window.RTCRtpReceiver.getCapabilities('video')?.codecs.some(
      ({ mimeType }) => mimeType.toLowerCase() === 'video/h265'
    ) ?? false
  );
}
