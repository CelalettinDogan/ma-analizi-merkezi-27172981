import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfaceVariants = cva(
  "rounded-2xl transition-colors",
  {
    variants: {
      variant: {
        default: "bg-card border border-border/50",
        elevated: "bg-card/80 backdrop-blur-sm border border-border/50 shadow-card",
        highlighted: "bg-primary/5 border border-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceVariants({ variant }), className)}
      {...props}
    />
  )
);
Surface.displayName = "Surface";

export { Surface, surfaceVariants };
