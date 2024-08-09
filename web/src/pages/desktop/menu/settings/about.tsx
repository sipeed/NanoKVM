import { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useSetAtom } from 'jotai';
import { BookOpenIcon, GithubIcon, LoaderCircleIcon, MessageSquareIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getInfo } from '@/api/vm';
import { isSettingsOpenAtom } from '@/jotai/settings';

type Info = {
  ip: string;
  mdns: string;
  image: string;
  firmware: string;
  deviceKey: string;
};

export const About = () => {
  const { t } = useTranslation();
  const setIsSettingsOpen = useSetAtom(isSettingsOpenAtom);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<Info | undefined>();

  const communities = [
    { name: 'wiki', icon: <BookOpenIcon size={24} />, url: 'https://wiki.sipeed.com/nanokvm' },
    { name: 'github', icon: <GithubIcon size={24} />, url: 'https://github.com/sipeed/NanoKVM' },
    {
      name: 'discussion',
      icon: <MessageSquareIcon size={24} />,
      url: 'https://maixhub.com/discussion/nanokvm'
    }
  ];

  useEffect(() => {
    setLoading(true);

    getInfo()
      .then((rsp: any) => {
        if (rsp.code !== 0) {
          console.log(rsp.msg);
          setInfo(undefined);
          return;
        }

        setInfo(rsp.data);
      })
      .catch(() => {
        setInfo(undefined);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function showModal() {
    setIsModalOpen(true);
    setIsSettingsOpen(false);
  }

  function openPage(url: string) {
    window.open(url, '_blank');
  }

  return (
    <>
      <div
        className="flex cursor-pointer select-none items-center rounded px-3 py-1.5 hover:bg-neutral-600"
        onClick={showModal}
      >
        {t('about.title')}
      </div>

      <Modal
        title={t('about.title')}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={450}
        footer={null}
        centered
      >
        <div className="my-5 h-[1px] bg-neutral-700/50" />

        <div className="flex w-full flex-col space-y-2">
          <span className="text-neutral-400">{t('about.information')}</span>

          {loading ? (
            <LoaderCircleIcon className="animate-spin" size={18} />
          ) : info ? (
            <div className="flex w-full flex-col space-y-1">
              {Object.entries(info).map(([key, value]) => (
                <div key={key} className="flex w-full items-center justify-between">
                  <span>{t(`about.${key}`)}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <span>{t('about.queryFailed')}</span>
          )}
        </div>

        <div className="my-5 h-[1px] bg-neutral-700/50" />
        <div className="text-neutral-400">{t('about.community')}</div>
        <div className="my-3 flex space-x-5">
          {communities.map((community) => (
            <div
              key={community.name}
              className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center space-y-1 rounded text-neutral-400 outline outline-1 outline-neutral-700 hover:bg-neutral-800"
              onClick={() => openPage(community.url)}
            >
              {community.icon}
              <span className="text-xs text-neutral-300">{community.name}</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};
