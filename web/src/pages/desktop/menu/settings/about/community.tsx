import { GithubOutlined, XOutlined } from '@ant-design/icons';
import { BookOpenIcon, MessageCircleQuestionIcon, MessageSquareIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Community = () => {
  const { t } = useTranslation();

  const communities = [
    { name: 'Document', icon: <BookOpenIcon size={24} />, url: 'https://wiki.sipeed.com/nanokvm' },
    {
      name: 'GitHub',
      icon: <GithubOutlined style={{ fontSize: '20px' }} width={24} height={24} />,
      url: 'https://github.com/sipeed/NanoKVM'
    },
    {
      name: 'X',
      icon: <XOutlined style={{ fontSize: '20px' }} width={24} height={24} />,
      url: 'https://twitter.com/SipeedIO'
    },
    {
      name: 'Discussion',
      icon: <MessageSquareIcon size={24} />,
      url: 'https://maixhub.com/discussion/nanokvm'
    },
    {
      name: 'FAQ',
      icon: <MessageCircleQuestionIcon size={24} />,
      url: 'https://wiki.sipeed.com/hardware/en/kvm/NanoKVM/faq.html'
    }
  ];

  return (
    <>
      <div className="text-neutral-400">{t('settings.about.community')}</div>

      <div className="mt-5 flex flex-wrap gap-3">
        {communities.map((community) => (
          <a
            key={community.name}
            className="flex h-[64px] w-[80px] flex-col items-center justify-center space-y-2 rounded-lg text-neutral-300 outline outline-1 outline-neutral-800 hover:bg-neutral-800 hover:text-white focus:bg-neutral-800 md:h-[72px] md:w-[100px]"
            href={community.url}
            target="_blank"
          >
            {community.icon}
            <span className="text-xs">{community.name}</span>
          </a>
        ))}
      </div>
    </>
  );
};
