import { useEffect, useState } from 'react';
import { notification } from 'antd';
import clsx from 'clsx';
import {
  ArrowBigDownDashIcon,
  ArrowBigUpDashIcon,
  LoaderCircleIcon,
  PackageIcon,
  PackageSearchIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/storage.ts';
import { client } from '@/lib/websocket.ts';

type ImagesProps = {
  setIsMounted: (isMounted: boolean) => void;
};

export const Images = ({ setIsMounted }: ImagesProps) => {
  const { t } = useTranslation();
  const [notify, contextHolder] = notification.useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mountingImage, setMountingImage] = useState('');
  const [mountedImage, setMountedImage] = useState('');

  useEffect(() => {
    getImages();
  }, []);

  function getImages() {
    if (isLoading) return;
    setIsLoading(true);

    api
      .getImages()
      .then((rsp) => {
        if (rsp.code !== 0) {
          return;
        }

        const files = rsp.data?.files;

        if (files?.length > 0) {
          setImages(files);
          getMountedImage();
        } else {
          setImages([]);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  async function getMountedImage() {
    try {
      const rsp = await api.getMountedImage();
      if (rsp.code !== 0) return;

      const file = rsp.data?.file;
      setMountedImage(file);
      setIsMounted(!!file);
    } catch (e) {
      console.log(e);
    }
  }

  function mountImage(image: string) {
    if (mountingImage) return;
    setMountingImage(image);

    client.close();

    const filename = mountedImage === image ? '' : image;

    api
      .mountImage(filename)
      .then((rsp) => {
        if (rsp.code !== 0) {
          openNotification();
          return;
        }

        setMountedImage(filename);
        setIsMounted(!!filename);
      })
      .finally(() => {
        setMountingImage('');
        client.connect();
      });
  }

  function openNotification() {
    notify.open({
      message: t('image.mountFailed'),
      description: t('image.mountDesc'),
      duration: 6
    });
  }

  return (
    <>
      {contextHolder}

      {isLoading ? (
        // loading
        <div className="flex items-center space-x-2 py-2 pl-2 pr-4 text-neutral-400">
          <LoaderCircleIcon className="animate-spin" size={18} />
          <span className="text-sm">{t('image.loading')}</span>
        </div>
      ) : images.length === 0 ? (
        // no image
        <div className="flex items-center space-x-2 pl-2 pr-4 text-neutral-500">
          <PackageSearchIcon size={18} />
          <span className="text-sm">{t('image.empty')}</span>
        </div>
      ) : (
        // image list
        images.map((image) => (
          <div
            key={image}
            className={clsx(
              'group flex max-w-[300px] cursor-pointer select-none items-center space-x-1 rounded p-2 hover:bg-neutral-700/70',
              mountedImage === image && 'text-blue-500'
            )}
            onClick={() => mountImage(image)}
          >
            <div className="h-[18px] w-[18px]">
              {mountingImage === image ? (
                <LoaderCircleIcon className="animate-spin" size={18} />
              ) : (
                <PackageIcon size={18} />
              )}
            </div>

            <div className="flex-1 truncate">{image.replace(/^.*[\\/]/, '')}</div>

            <div className="h-[18px] w-[18px]">
              {mountedImage === image ? (
                <ArrowBigDownDashIcon size={18} className="hidden text-red-500 group-hover:block" />
              ) : (
                <ArrowBigUpDashIcon size={18} className="hidden text-blue-500 group-hover:block" />
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
};
