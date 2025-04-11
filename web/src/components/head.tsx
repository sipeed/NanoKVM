import { useEffect, useState } from 'react';
import { Helmet, HelmetData } from 'react-helmet-async';
import * as api from '@/api/vm.ts';


type HeadProps = {
  title?: string;
  description?: string;
};

const helmetData = new HelmetData({});

export const Head = ({ title = '', description = '' }: HeadProps = {}) => {
  const [webTitle, setWebTitle] = useState("");

  useEffect(() => {
    api
      .getWebTitle()
      .then((rsp) => {
        if (rsp.data?.webTitle) {
          setWebTitle(rsp.data?.webTitle.toString());
        } else {
          setWebTitle("NanoKVM");
        }
      })
      
  }, []);



  return (
    <Helmet
      helmetData={helmetData}
      title={title ? `${title} - ${webTitle}` : undefined}
      defaultTitle={webTitle}
    >
      <meta name="description" content={description} />
    </Helmet>
  );
};
