import { SquareTerminalIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Nanokvm = () => {
  const { t } = useTranslation();

  function openTerminal() {
    window.open('/#terminal', '_blank');
  }

  return (
    <div
      className="flex h-[28px] cursor-pointer select-none items-center space-x-1 rounded px-2 py-1 hover:bg-neutral-700/70"
      onClick={openTerminal}
    >
      <SquareTerminalIcon size={14} />
      <span>{t('terminal.nanokvm')}</span>
    </div>
  );
};
