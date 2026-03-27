import type { ReactNode, SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'color'> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
};

type IconBaseProps = IconProps & {
  children: ReactNode;
};

export const IconBase = ({
  children,
  className,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  viewBox = '0 0 24 24',
  fill = 'none',
  strokeLinecap = 'round',
  strokeLinejoin = 'round',
  ...props
}: IconBaseProps) => {
  return (
    <svg
      aria-hidden={props['aria-label'] ? undefined : true}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      {...props}
    >
      {children}
    </svg>
  );
};
