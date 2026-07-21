import * as React from "react";

import { cn } from "../lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-28 w-full rounded-xl border border-rose-100 bg-white/80 px-4 py-3 text-sm text-royal-ink outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
