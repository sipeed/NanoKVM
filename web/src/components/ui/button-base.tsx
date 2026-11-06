import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement>;

// A button without a look of its own, for the places that draw the whole
// surface themselves (the storage menu's cards, the mount-mode picker). It
// keeps the semantics of a button - disabled, focus ring, keyboard - which a
// div with an onClick loses.
export const ButtonBase = forwardRef<HTMLButtonElement, ButtonBaseProps>(
  ({ className, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          'nanokvm-button-base cursor-pointer touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/80 disabled:cursor-not-allowed disabled:opacity-45',
          className
        )}
        {...props}
      />
    );
  }
);

ButtonBase.displayName = 'ButtonBase';
