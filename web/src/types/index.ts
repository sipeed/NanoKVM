export type Resolution = {
  width: number;
  height: number;
};

export type InputRegion = {
  frameWidth: number;
  frameHeight: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ControlRegionMode = 'off' | 'auto' | 'manual';

export type OriginalResolution = Resolution;

export type ControlRegionConfig = Partial<InputRegion> & {
  mode: ControlRegionMode;
  resolutions?: OriginalResolution[];
  selectedResolution?: string;
};
