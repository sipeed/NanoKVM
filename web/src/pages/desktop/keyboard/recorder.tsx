import { useTranslation } from 'react-i18next';

interface RecorderProps {
  recordMode: boolean;
  recordedKeys: string[];
}

export const Recorder = ({ recordMode, recordedKeys }: RecorderProps) => {
  const { t } = useTranslation();

  if (!recordMode) {
    return <></>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-4 pointer-events-none fixed right-5 top-5 z-[9999] flex min-w-[150px] flex-col gap-2 rounded-xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-md transition-all duration-200">
      {recordedKeys.length === 0 ? (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-amber-500"></span>
            </div>
            <span className="text-xs font-semibold tracking-wider text-white/90">
              {t('keyboard.leaderKey.recorder.rec')}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-sm italic text-white/50">
              {t('keyboard.leaderKey.recorder.input')}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-green-500"></span>
            </div>
            <span className="text-xs text-white/90">
              {t('keyboard.leaderKey.recorder.activate')}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {recordedKeys.map((key) => (
              <span
                key={key}
                className="flex items-center justify-center rounded border-b-2 border-white/20 bg-white/10 px-2 py-0.5 font-mono text-sm font-medium text-white shadow-sm"
              >
                {key}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
