import * as React from "react";

import { cn } from "../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "h-11 w-full rounded-xl border border-rose-100 bg-white/80 px-4 text-sm text-royal-ink outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
