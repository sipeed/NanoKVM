import clsx from 'clsx';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={clsx(
        'pointer-events-none inline-flex h-5 w-fit min-w-9 select-none items-center justify-center gap-1 rounded border-b border-b-neutral-600 bg-neutral-700/70 px-1 font-sans text-xs font-medium text-neutral-300',
        "[&_svg:not([class*='size-'])]:size-3",
        '[[data-slot=tooltip-content]_&]:text-background [[data-slot=tooltip-content]_&]:bg-background/10',
        className
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <kbd
      data-slot="kbd-group"
      className={clsx('inline-flex items-center gap-1', className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
