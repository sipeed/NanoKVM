export type State = 'notInstall' | 'notRunning' | 'notLogin' | 'stopped' | 'running';

export type Status = {
  state: State;
  name: string;
  ip: string;
  version: string;
};
