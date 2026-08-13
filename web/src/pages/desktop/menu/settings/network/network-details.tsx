import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/network.ts';

type NetworkInfo = {
  interface?: string;
  type?: string;
  address?: string;
  subnetMask?: string;
  gateway?: string;
  signal?: string;
  rxRate?: string;
  txRate?: string;
};

type NetworkDetailsData = {
  info?: NetworkInfo;
  infos?: NetworkInfo[];
};

function formatInterfaceType(type: string | undefined, t: (key: string) => string) {
  const translate = t as unknown as (key: string, options?: { defaultValue?: string }) => string;
  switch ((type || '').toLowerCase()) {
    case 'wired':
      return translate('settings.network.dns.wired', { defaultValue: 'Wired' });
    case 'wireless':
      return translate('settings.network.dns.wireless', { defaultValue: 'Wireless' });
    default:
      return type || '';
  }
}

function isWireless(info: NetworkInfo) {
  return (info.type || '').toLowerCase() === 'wireless';
}

function formatInterface(info: NetworkInfo, t: (key: string) => string) {
  if (!info.interface) return '';
  const type = formatInterfaceType(info.type, t);
  if (!type) return info.interface;

  return `${type} (${info.interface})`;
}

const InfoRow = ({
  label,
  value,
  isLast = false
}: {
  label: string;
  value?: string;
  isLast?: boolean;
}) => {
  return (
    <div
      className={`flex min-h-[44px] items-center justify-between px-4 ${
        isLast ? '' : 'border-b border-neutral-700/50'
      }`}
    >
      <span className="text-sm text-neutral-300">{label}</span>
      <span className="max-w-[330px] break-all text-right text-sm text-neutral-500">
        {value || '-'}
      </span>
    </div>
  );
};

const WirelessRow = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;

  return <InfoRow label={label} value={value} />;
};

const NetworkCard = ({ info, isLast = false }: { info: NetworkInfo; isLast?: boolean }) => {
  const { t } = useTranslation();

  return (
    <div className={`overflow-hidden rounded-xl bg-neutral-800/50 ${isLast ? '' : 'mb-3'}`}>
      <div className="px-4 pb-1.5 pt-3">
        <div className="font-semibold text-neutral-100">{formatInterface(info, t) || '-'}</div>
      </div>
      <div>
        <InfoRow label={t('settings.network.dns.ipAddress')} value={info.address} />
        <InfoRow label={t('settings.network.dns.subnetMask')} value={info.subnetMask} />
        <InfoRow label={t('settings.network.dns.router')} value={info.gateway} isLast />
        {isWireless(info) && (
          <>
            <WirelessRow
              label={t('settings.network.dns.signalStrength', { defaultValue: 'Signal Strength' })}
              value={info.signal}
            />
            <WirelessRow
              label={t('settings.network.dns.rxRate', { defaultValue: 'Receive Rate' })}
              value={info.rxRate}
            />
            <WirelessRow
              label={t('settings.network.dns.txRate', { defaultValue: 'Transmit Rate' })}
              value={info.txRate}
            />
          </>
        )}
      </div>
    </div>
  );
};

export const NetworkDetails = () => {
  const { t } = useTranslation();
  const [details, setDetails] = useState<NetworkInfo[]>([]);

  useEffect(() => {
    getNetworkDetails();
  }, []);

  async function getNetworkDetails() {
    try {
      const rsp = await api.getDNS();
      if (rsp.code !== 0) return;

      const data = rsp.data as NetworkDetailsData | undefined;
      const infos = data?.infos?.length ? data.infos : data?.info ? [data.info] : [];
      setDetails(infos);
    } catch {
      /* empty */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-neutral-800/50">
      <div className="px-4 pb-1.5 pt-3">
        <div className="font-semibold text-neutral-100">
          {t('settings.network.dns.networkDetails')}
        </div>
      </div>
      <div className="pb-3">
        {details.length > 0 ? (
          details.map((info, index) => (
            <NetworkCard
              key={`${info.interface}-${index}`}
              info={info}
              isLast={index === details.length - 1}
            />
          ))
        ) : (
          <div className="px-4 py-3 text-sm text-neutral-500">
            {t('settings.network.dns.none')}
          </div>
        )}
      </div>
    </div>
  );
};
