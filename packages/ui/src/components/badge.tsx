import * as React from "react";

import { cn } from "../lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700",
        className
      )}
      {...props}
    />
  );
}
