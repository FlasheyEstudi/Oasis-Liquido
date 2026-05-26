'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-extrabold uppercase tracking-wider transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] cursor-pointer select-none active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 border border-teal-400/20",
        destructive:
          "bg-destructive text-white shadow-lg shadow-red-500/20 hover:bg-destructive/90",
        outline:
          "border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xs hover:bg-slate-100/50 dark:hover:bg-white/[0.05] hover:text-foreground text-slate-700 dark:text-slate-200",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/90",
        ghost:
          "hover:bg-slate-100/60 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
        link: "text-primary underline-offset-4 hover:underline normal-case tracking-normal font-bold",
        clay: "bg-gradient-to-b from-teal-400 to-teal-500 text-white font-black shadow-[0_4px_12px_rgba(0,194,160,0.3),_inset_0_2px_4px_rgba(255,255,255,0.4),_inset_0_-2px_4px_rgba(0,0,0,0.15)] border-none rounded-2xl",
        glass: "bg-white/15 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 text-foreground shadow-lg shadow-black/5 hover:bg-white/20"
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl text-xs gap-1.5 px-4",
        lg: "h-13 rounded-3xl text-base px-8",
        icon: "size-11 rounded-2xl",
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
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as any}
        {...(props as any)}
      />
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
