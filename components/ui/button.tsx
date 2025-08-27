import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-base ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-ink hover:bg-accent/90 hover:shadow-lg hover:-translate-y-px active:bg-accent/95 active:translate-y-0",
        destructive:
          "bg-danger text-white hover:bg-danger/90 hover:shadow-lg hover:-translate-y-px active:bg-danger/95 active:translate-y-0",
        outline:
          "border border-border bg-bg text-ink hover:bg-surface hover:shadow-md focus-visible:ring-accent/30",
        secondary:
          "bg-surface text-ink border border-border hover:bg-elevated hover:shadow-md focus-visible:ring-accent/30",
        ghost: "text-ink hover:bg-surface focus-visible:ring-accent/30",
        link: "text-accent underline-offset-4 hover:underline focus-visible:ring-accent/30",
      },
      size: {
        default: "h-10 px-4 py-2 min-w-[44px]", // Touch-friendly minimum
        sm: "h-9 rounded-md px-3 min-w-[36px]",
        lg: "h-11 rounded-md px-8 min-w-[48px]",
        icon: "h-10 w-10 min-w-[44px]", // Touch-friendly square
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }