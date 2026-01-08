import { useEffect, useState } from 'react';
import { Button, Modal, notification, Typography } from 'antd';
import clsx from 'clsx';
import {
  ArrowBigDownDashIcon,
  ArrowBigUpDashIcon,
  LoaderCircleIcon,
  PackageIcon,
  PackageSearchIcon,
  Trash2Icon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/storage.ts';
import { client } from '@/lib/websocket.ts';

type ImagesProps = {
  isOpen: boolean;
  cdrom: boolean;
  setIsMounted: (isMounted: boolean) => void;
};

export const Images = ({ isOpen, cdrom, setIsMounted }: ImagesProps) => {
  const { t } = useTranslation();
  const [notify, contextHolder] = notification.useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mountingImage, setMountingImage] = useState('');
  const [mountedImage, setMountedImage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [deletingImage, setDeletingImage] = useState('');

  useEffect(() => {
    if (isOpen) {
      getImages();
    }
  }, [isOpen]);

  // get image list
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

  // get mounted image
  function getMountedImage() {
    api.getMountedImage().then((rsp) => {
      if (rsp.code !== 0) return;

      const file = rsp.data?.file;
      setMountedImage(file);
      setIsMounted(!!file);
    });
  }

  // mount/unmount image
  function mountImage(image: string) {
    if (mountingImage) return;
    setMountingImage(image);

    client.close();

    const isMounted = mountedImage === image;
    const filename = isMounted ? '' : image;

    api
       .mountImage(filename, cdrom)
       .then((rsp) => {
         if (rsp.code !== 0) {
           message.error(t('image.mountFailed'));
           openNotification(isMounted);
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

  // show delete image modal
  function showDeleteModal(e: any, image: string) {
    e.stopPropagation();

    const isMounted = mountedImage === image;
    const isDeleting = deletingImage !== '';

    if (isMounted || isDeleting) {
      return;
    }

    setSelectedImage(image);
    setIsModalOpen(true);
  }

  // delete image
  function deleteImage() {
    if (!selectedImage || !!deletingImage) return;
    setDeletingImage(selectedImage);

    setIsModalOpen(false);

    api
       .deleteImage(selectedImage)
       .then((rsp) => {
         if (rsp.code !== 0) {
           message.error(t('image.deleteFailed'));
           return;
         }

         getImages();

         setSelectedImage('');
       })
       .finally(() => {
         setDeletingImage('');
       });
   }

  // show mount/unmount failed notification
  function openNotification(isMounted: boolean) {
    const message = isMounted ? 'image.unmountFailed' : 'image.mountFailed';
    const description = isMounted ? 'image.unmountDesc' : 'image.mountDesc';

    notify.open({
      message: t(message),
      description: t(description),
      duration: 10
    });
  }

  // loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2 py-5 text-neutral-400">
        <LoaderCircleIcon className="animate-spin" size={18} />
        <span className="text-sm">{t('image.loading')}</span>
      </div>
    );
  }

  // empty image
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center space-x-2 py-5 text-neutral-500">
        <PackageSearchIcon size={18} />
        <span className="text-sm">{t('image.empty')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex max-h-[400px] flex-col overflow-y-auto pb-2">
        {images.map((image) => (
          <div
            key={image}
            className={clsx(
              'group flex cursor-pointer select-none items-center space-x-1 rounded px-1 py-2 hover:bg-neutral-700/70',
              mountedImage === image && 'text-blue-500'
            )}
            onClick={() => mountImage(image)}
          >
            <div className="flex h-[24px] w-[24px] items-center justify-center">
              {mountingImage === image ? (
                <LoaderCircleIcon className="animate-spin" size={18} />
              ) : (
                <PackageIcon size={18} />
              )}
            </div>

            <div className="flex-1 truncate">{image.replace(/^.*[\\/]/, '')}</div>

            <div className="flex h-[24px] w-[24px] items-center justify-center rounded">
              {mountedImage === image ? (
                <ArrowBigDownDashIcon size={22} className="hidden text-red-500 group-hover:block" />
              ) : (
                <ArrowBigUpDashIcon size={22} className="hidden text-blue-500 group-hover:block" />
              )}
            </div>

            <div
              className={clsx(
                'flex h-[24px] w-[24px] items-center justify-center rounded hover:bg-neutral-500/50',
                mountedImage === image
                  ? 'cursor-not-allowed text-neutral-500'
                  : 'text-neutral-300 hover:text-red-500'
              )}
              onClick={(e) => showDeleteModal(e, image)}
            >
              {deletingImage === image ? (
                <LoaderCircleIcon className="animate-spin text-red-500" size={16} />
              ) : (
                <Trash2Icon size={16} />
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        title={t('image.attention')}
        open={isModalOpen}
        width={520}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
      >
        <div className="flex flex-col items-center pb-10">
          <p>{t('image.deleteConfirm')}</p>
          <Typography.Text code>{selectedImage}</Typography.Text>
        </div>

        <div className="flex justify-center space-x-3 pb-3">
          <Button type="primary" danger onClick={deleteImage}>
            {t('image.okBtn')}
          </Button>
          <Button onClick={() => setIsModalOpen(false)}>{t('image.cancelBtn')}</Button>
        </div>
      </Modal>

      {contextHolder}
    </>
  );
};
