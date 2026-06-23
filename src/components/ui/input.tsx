import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-sm text-gray-900 shadow-sm shadow-gray-950/[0.03] placeholder:text-gray-400 transition focus-visible:border-[var(--theme-primary)] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-soft)] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
