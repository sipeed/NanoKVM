export interface KeyInfo {
  code: string;
  label: string;
}

export interface Shortcut {
  id?: string;
  keys: KeyInfo[];
}
