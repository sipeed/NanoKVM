import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FileBoxIcon, LoaderCircleIcon, PackageIcon, PackageSearchIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/storage.ts';
import { client } from '@/lib/websocket.ts';

type ImagesProps = {
  setIsMounted: (isMounted: boolean) => void;
};

export const Images = ({ setIsMounted }: ImagesProps) => {
  const { t } = useTranslation();

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

  return (
    <>
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
              'group my-1 flex max-w-[300px] cursor-pointer select-none items-center space-x-2 rounded py-2 pl-2 pr-4 hover:bg-neutral-700/80',
              { 'text-blue-500': mountedImage === image }
            )}
            onClick={() => mountImage(image)}
          >
            {/* image state icon */}
            {mountedImage === image ? (
              <div className="h-[18px] w-[18px] group-hover:text-red-500">
                <PackageIcon size={18} className="block group-hover:hidden" />
                <XIcon size={18} className="hidden group-hover:block" />
              </div>
            ) : mountingImage === image ? (
              <div className="h-[18px] w-[18px]">
                <LoaderCircleIcon className="animate-spin" size={18} />
              </div>
            ) : (
              <div className="h-[18px] w-[18px]">
                <FileBoxIcon size={18} />
              </div>
            )}

            <span className="break-all">{image.replace(/^.*[\\/]/, '')}</span>
          </div>
        ))
      )}
    </>
  );
};
