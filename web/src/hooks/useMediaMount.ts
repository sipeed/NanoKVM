import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as api from '@/api/media.ts';

type Options = {
  onError: (message: string, description?: string) => void;
  // The gadget has no mass storage because the virtual disk is switched off.
  // The page offers to turn it on, the menu panel just says where the setting
  // lives: a confirm dialog would be dismissed by the popover closing.
  onNeedEnableDisk?: (retry: () => void) => void;
  // The target machine is holding the medium, so taking it back means
  // re-enumerating the device under a machine that is using it. Only the
  // caller can ask whether that is acceptable.
  onNeedForce?: (retry: () => void) => void;
  onChanged?: () => void;
};

type Action = {
  // Retry as a forced operation, which the target machine cannot refuse.
  force?: boolean;
  // False once the user has already been asked.
  prompt?: boolean;
};

// Mounting and ejecting is the one media action both the desktop menu and the
// storage page offer.
export function useMediaMount({ onError, onNeedEnableDisk, onNeedForce, onChanged }: Options) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState('');

  // Every action is retried the same way: the first attempt is the polite one,
  // and a refusal the user can act on is handed to the caller to confirm.
  async function run(
    key: string,
    action: (force: boolean) => Promise<{ code: number; msg: string }>,
    opts: Action,
    retry: (opts: Action) => void
  ) {
    setBusy(key);

    let rsp;
    try {
      rsp = await action(opts.force ?? false);
    } catch {
      onError(t('storage.failed'));
      return;
    } finally {
      setBusy('');
    }

    if (rsp.code === 0) {
      onChanged?.();
      return;
    }

    const mayPrompt = opts.prompt !== false;
    if (rsp.code === api.codeStorageDisabled && mayPrompt && onNeedEnableDisk) {
      onNeedEnableDisk(() => retry({ ...opts, prompt: false }));
      return;
    }
    if (rsp.code === api.codeMediumLocked && mayPrompt && onNeedForce) {
      onNeedForce(() => retry({ ...opts, force: true, prompt: false }));
      return;
    }

    onError(rsp.msg);
  }

  function mount(item: api.MediaItem, cdrom = false, opts: Action = {}) {
    return run(
      `${item.type}:${item.rel}`,
      (force) => api.mountMedia({ type: item.type, rel: item.rel, cdrom, force }),
      opts,
      (next) => void mount(item, cdrom, next)
    );
  }

  function eject(opts: Action = {}) {
    return run(
      'eject',
      (force) => api.ejectMedia(force),
      opts,
      (next) => void eject(next)
    );
  }

  return { mount, eject, busy };
}
