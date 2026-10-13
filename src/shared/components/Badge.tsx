import React from 'react';
import { cn } from '@/shared/utils';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'offline' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  offline: 'bg-orange-50 text-orange-800 border-orange-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
};

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  offline: 'bg-orange-500',
  neutral: 'bg-gray-500',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', dot = false, className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
