import { useEffect, useState } from 'react';
import { MaximizeIcon, MinimizeIcon } from 'lucide-react';

export const Fullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <div
      className="hidden h-[30px] w-[30px] cursor-pointer items-center justify-center rounded text-neutral-300 hover:bg-neutral-700 hover:text-white sm:flex"
      onClick={handleFullscreen}
    >
      {isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
    </div>
  );
};
