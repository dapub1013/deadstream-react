import type { ReactNode } from 'react';
import clsx from 'clsx';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Container component for consistent padding and max-width
 * Optimized for 7" touchscreen (1280x720)
 */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={clsx('w-full h-full px-4 py-4', className)}>
      {children}
    </div>
  );
}
