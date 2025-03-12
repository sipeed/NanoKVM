import { Tooltip } from 'antd';
import { Camera, CircleHelpIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export const Screenshot = () => {
    const { t } = useTranslation();

    return (
        <div
            className="flex h-[30px] cursor-pointer items-center space-x-2 rounded px-3 text-neutral-300 hover:bg-neutral-700/70"
            onClick={() => {
                const video = document.querySelector("video");
                if (!video) return;

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                canvas.width = video.offsetWidth;
                canvas.height = video.offsetHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const now = new Date();
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const seconds = now.getSeconds().toString().padStart(2, '0');
                const timeString = `${hours}_${minutes}_${seconds}`;

                const a = document.createElement("a");
                a.download = `Screenshot_${canvas.width.toString()}x${canvas.height.toString()}_${timeString}.jpg`;
                a.href = canvas.toDataURL("image/jpeg");
                document.body.appendChild(a).click();
                a.remove();
            }}
        >
            <div >
                {<Camera size={15} />}
            </div>
            <span>{t('screen.screenshot')}</span>
            <Tooltip
                title={t('screen.screenshotTip')}
                placement="right"
                overlayInnerStyle={{ width: '300px' }}
            >
                <CircleHelpIcon size={14} />
            </Tooltip>


        </div>
    );
};