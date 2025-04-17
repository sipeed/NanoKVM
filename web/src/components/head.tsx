import { useAtomValue } from 'jotai';
import { Helmet, HelmetData } from 'react-helmet-async';

import { webTitleAtom } from '@/jotai/settings.ts';

type HeadProps = {
  title?: string;
  description?: string;
};

const helmetData = new HelmetData({});

export const Head = ({ title = '', description = '' }: HeadProps = {}) => {
  const webTitle = useAtomValue(webTitleAtom);

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
