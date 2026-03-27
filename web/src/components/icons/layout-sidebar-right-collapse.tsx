import { IconBase, type IconProps } from './icon-base.tsx';

export const LayoutSidebarRightCollapse = (props: IconProps) => {
  return (
    <IconBase {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" />
      <path d="M15 4v16" />
      <path d="M9 10l2 2l-2 2" />
    </IconBase>
  );
};
