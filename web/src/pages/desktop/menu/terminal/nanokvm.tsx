import { SquareTerminalIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type NanokvmProps = {
  onOpen: () => void;
};

export const Nanokvm = ({ onOpen }: NanokvmProps) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-[28px] cursor-pointer select-none items-center space-x-1 rounded px-2 py-1 hover:bg-neutral-700/70"
      onClick={onOpen}
    >
      <SquareTerminalIcon size={14} />
      <span>{t('terminal.nanokvm')}</span>
    </div>
  );
};
