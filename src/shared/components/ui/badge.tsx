import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-[#e3f4e9] text-[#136b3f] border-[#a7ddb8]",
        warning: "bg-[#fdf0da] text-[#8a5300] border-[#f1c97a]",
        danger: "bg-[#fbe8e5] text-[#a52b22] border-[#e8b4ae]",
        info: "bg-[#e8eef7] text-[#12507f] border-[#b3c8e8]",
        offline: "bg-[#fdf0da] text-[#8a5300] border-[#f1c97a]",
        neutral: "bg-[#f7f8fa] text-[#5a6675] border-[#cbd2dc]",
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

const dotStyles: Record<string, string> = {
  success: 'bg-[#136b3f]',
  warning: 'bg-[#8a5300]',
  danger: 'bg-[#a52b22]',
  info: 'bg-[#12507f]',
  offline: 'bg-[#8a5300]',
  neutral: 'bg-[#5a6675]',
  default: 'bg-primary',
  secondary: 'bg-secondary',
  destructive: 'bg-destructive',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, dot = false, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(badgeVariants({ variant }), "px-3 py-1", className)} 
        {...props}
      >
        {dot && variant && (
          <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />
        )}
        {children}
      </div>
    )
  }
)

Badge.displayName = "Badge"

export { Badge, badgeVariants }
