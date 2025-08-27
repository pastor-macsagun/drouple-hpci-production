import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-bg text-ink px-3 py-2 text-base placeholder:text-ink-muted transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface md:text-sm min-h-[44px]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }