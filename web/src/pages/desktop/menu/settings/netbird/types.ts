export type State = 'notInstall' | 'notRunning' | 'notLogin' | 'stopped' | 'running';

export type Status = {
  state: State;
  name: string;
  ip: string;
  version: string;
  // The release this firmware ships. It does not gate the installed client:
  // an older one keeps running, and updating is an explicit user action.
  pinnedVersion?: string;
  // The install marker, which is what updateAvailable compared. `version` may
  // carry the daemon's own string instead.
  installedVersion?: string;
  updateAvailable?: boolean;
};
