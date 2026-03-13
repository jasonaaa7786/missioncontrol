import { cn } from '../../lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-cyber-bg-tertiary',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
