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
      className="flex h-[30px] cursor-pointer items-center justify-center space-x-1 rounded px-2 text-white hover:bg-neutral-700"
      onClick={handleFullscreen}
    >
      {isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
    </div>
  );
};
