import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utilities/ui"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        pos: "border-transparent bg-[#E6F7EE] text-[#0F9F61]",
        neg: "border-transparent bg-[#FDECEA] text-[#E5483D]",
        warn: "border-transparent bg-[#FFF4E2] text-[#D9840A]",
        info: "border-transparent bg-[#EAF2FF] text-[#2E7CF6]",
        brand: "border-[#DCEFB0] bg-[#F4FDDF] text-[#1B232E]",
        gray: "border-transparent bg-[#F3ECE2] text-[#4A5361]",
        dark: "border-transparent bg-[#1B232E] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
