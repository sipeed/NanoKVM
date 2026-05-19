import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CaptureStatus, getCaptureStatusMessageKey } from './model';

export function CaptureStatusOverlay({ status }: { status: CaptureStatus | null }) {
  const { t } = useTranslation();

  if (!status || status.ok) {
    return null;
  }

  const messageKey = getCaptureStatusMessageKey(status.result);
  const isWarning = status.severity === 'warning';

  const toneClass = isWarning
    ? 'border-amber-500/50 bg-neutral-900/90 text-amber-400 shadow-amber-900/20'
    : 'border-red-500/50 bg-neutral-900/90 text-red-400 shadow-red-900/20';

  const Icon = isWarning ? AlertTriangle : AlertCircle;

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-1/2 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur-md ${toneClass}`}
    >
      <Icon className="h-5 w-5 shrink-0 animate-pulse" />
      <span className="min-w-0 truncate">{t(messageKey)}</span>
    </div>
  );
}
