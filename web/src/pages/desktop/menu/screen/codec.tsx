import { useEffect, useState } from 'react';
import { Popover } from 'antd';
import { useAtomValue } from 'jotai';
import { CheckIcon, ClapperboardIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  getEncoderCodec,
  isEncoderCodecSupported,
  setEncoderCodec,
  type EncoderCodec,
  type EncoderTransport
} from '@/lib/encoder.ts';
import { videoModeAtom } from '@/jotai/screen.ts';

const codecs: Array<{ key: EncoderCodec; name: string }> = [
  { key: 'h265', name: 'H.265 / HEVC' },
  { key: 'h264', name: 'H.264 / AVC' }
];

export const Codec = () => {
  const { t } = useTranslation();
  const videoMode = useAtomValue(videoModeAtom);
  const [codec, setCodec] = useState(getEncoderCodec);
  const [h265Supported, setH265Supported] = useState(false);
  const [capabilityReady, setCapabilityReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    const transport: EncoderTransport = videoMode === 'h264' ? 'webrtc' : 'direct';

    void isEncoderCodecSupported(transport, 'h265').then((supported) => {
      if (disposed) return;
      setH265Supported(supported);
      setCapabilityReady(true);

      if (!supported && getEncoderCodec() === 'h265') {
        setEncoderCodec('h264');
        setCodec('h264');
      }
    });

    return () => {
      disposed = true;
    };
  }, [videoMode]);

  function update(nextCodec: EncoderCodec) {
    if (nextCodec === codec || (nextCodec === 'h265' && !h265Supported)) return;

    setEncoderCodec(nextCodec);
    setCodec(nextCodec);
    window.setTimeout(() => window.location.reload(), 250);
  }

  const content = (
    <>
      {codecs.map((item) => {
        const disabled = item.key === 'h265' && (!capabilityReady || !h265Supported);
        return (
          <div
            key={item.key}
            className={`flex select-none items-center rounded py-1.5 pl-1 pr-5 ${
              disabled
                ? 'cursor-not-allowed text-neutral-500'
                : 'cursor-pointer hover:bg-neutral-700/70'
            }`}
            onClick={() => !disabled && update(item.key)}
          >
            <div className="flex h-[14px] w-[20px] items-end text-blue-500">
              {item.key === codec && <CheckIcon size={15} />}
            </div>
            <span>
              {item.name}
              {disabled && capabilityReady ? ` (${t('screen.unsupported')})` : ''}
            </span>
          </div>
        );
      })}
    </>
  );

  return (
    <Popover content={content} placement="rightTop" arrow={false} align={{ offset: [14, 0] }}>
      <div className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70">
        <ClapperboardIcon size={18} />
        <span className="select-none text-sm">{t('screen.codec')}</span>
      </div>
    </Popover>
  );
};
