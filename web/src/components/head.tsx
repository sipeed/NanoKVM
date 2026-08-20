import { useEffect } from 'react';
import { useOptionalAuth } from '@/contexts/auth.ts';
import { useAtom } from 'jotai';
import { Helmet, HelmetData } from 'react-helmet-async';

import { getWebTitle } from '@/api/vm.ts';
import { webTitleAtom } from '@/jotai/settings.ts';

type HeadProps = {
  title?: string;
  description?: string;
};

const helmetData = new HelmetData({});

export const Head = ({ title = '', description = '' }: HeadProps = {}) => {
  const [webTitle, setWebTitle] = useAtom(webTitleAtom);
  const auth = useOptionalAuth();

  useEffect(() => {
    if (!auth) return;

    getWebTitle().then((rsp) => {
      if (rsp.data?.title) {
        setWebTitle(rsp.data.title);
      }
    });
  }, [auth, setWebTitle]);

  return (
    <Helmet
      helmetData={helmetData}
      title={webTitle ? webTitle : title ? `${title} - NanoKVM` : undefined}
      defaultTitle={webTitle}
    >
      <meta name="description" content={description} />
    </Helmet>
  );
};
