import { SquareTerminalIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type NanokvmProps = {
  setIsPopoverOpen: (open: boolean) => void;
};

export const Nanokvm = ({ setIsPopoverOpen }: NanokvmProps) => {
  const { t } = useTranslation();

  function openTerminal() {
    setIsPopoverOpen(false);
    window.open('/#terminal', '_blank');
  }

  return (
    <div
      className="flex h-[28px] cursor-pointer select-none items-center space-x-1 rounded px-2 py-1 hover:bg-neutral-700/80"
      onClick={openTerminal}
    >
      <SquareTerminalIcon size={14} />
      <span>{t('terminal.nanokvm')}</span>
    </div>
  );
};
