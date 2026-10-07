import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utilities/ui'

const badgeVariants = cva(
  'inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-[7px] border px-2 text-[11.5px] font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-[#FDECEA] text-[#E5483D]',
        outline: 'border-transparent bg-[#F3ECE2] text-[#4A5361]',
        pos: 'border-transparent bg-[#E6F7EE] text-[#0F9F61]',
        neg: 'border-transparent bg-[#FDECEA] text-[#E5483D]',
        warn: 'border-transparent bg-[#FFF4E2] text-[#D9840A]',
        info: 'border-transparent bg-[#EAF2FF] text-[#2E7CF6]',
        brand: 'border-[#DCEFB0] bg-[#F4FDDF] text-[#1B232E]',
        gray: 'border-transparent bg-[#F3ECE2] text-[#4A5361]',
        dark: 'border-transparent bg-[#1B232E] text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
