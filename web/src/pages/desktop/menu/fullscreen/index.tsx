import { useEffect, useState } from 'react';
import { MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from 'antd';

export const Fullscreen = () => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltipValue, setTooltipValue] = useState(t('fullscreen.toggle'));

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    onFullscreenChange();

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  function handleFullscreen() {
    if (!document.fullscreenElement) {
      const element = document.documentElement;
      element.requestFullscreen().then();
    } else {
      document.exitFullscreen().then();
    }
  }

  return (
    <Tooltip title={tooltipValue} placement="bottom">
      <div
        className="hidden h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white sm:flex"
        onClick={handleFullscreen}
      >
        {isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
      </div>
    </Tooltip>
  );
};
