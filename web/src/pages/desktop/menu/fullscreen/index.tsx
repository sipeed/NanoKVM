import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Fullscreen = () => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    onFullscreenChange();

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      const element = document.documentElement;
      element.requestFullscreen();

      // @ts-expect-error - https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/lock
      navigator.keyboard?.lock();
    } else {
      document.exitFullscreen();

      // @ts-expect-error - https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/unlock
      navigator.keyboard?.unlock();
    }
  }

  return (
    <Tooltip title={t('fullscreen.toggle')} placement="bottom" mouseEnterDelay={0.6}>
      <button
        type="button"
        aria-label={t('fullscreen.toggle')}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-neutral-300 hover:bg-neutral-700/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 min-[850px]:h-[30px] min-[850px]:w-[30px]"
        onClick={handleFullscreen}
      >
        {isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
      </button>
    </Tooltip>
  );
};
