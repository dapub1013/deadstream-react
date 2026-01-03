import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large';
  children: ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'normal',
  className,
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg font-semibold transition-colors',
        {
          'bg-blue-500 hover:bg-blue-600 text-white': variant === 'primary',
          'bg-gray-200 hover:bg-gray-300 text-gray-800': variant === 'secondary',
          'h-touch w-touch text-touch': size === 'normal',
          'h-touch-lg w-touch-lg text-touch-lg': size === 'large',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}