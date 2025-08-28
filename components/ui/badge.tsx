import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent/10 text-accent border-accent/20",
        secondary:
          "border-transparent bg-surface text-ink-muted border-border",
        info:
          "border-transparent bg-accent/10 text-accent border-accent/20",
        success:
          "border-transparent bg-success/10 text-success border-success/20",
        warning:
          "border-transparent bg-warning/10 text-warning border-warning/20",
        danger:
          "border-transparent bg-danger/10 text-danger border-danger/20",
        destructive:
          "border-transparent bg-danger/10 text-danger border-danger/20",
        featured:
          "border-transparent bg-accent text-accent-ink shadow-sm",
        outline: "text-ink border-border bg-transparent",
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
