import * as React from "react";

import { cn } from "../lib/utils";

export function FloralFrame({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-rose-200/80 bg-jaipur-paper shadow-aura",
        "before:absolute before:left-0 before:top-0 before:h-28 before:w-28 before:bg-[radial-gradient(circle_at_18%_22%,#d88995_0_4px,transparent_5px),radial-gradient(circle_at_42%_36%,#9aaf8b_0_4px,transparent_5px),linear-gradient(45deg,transparent_48%,rgba(111,138,105,.42)_49%_52%,transparent_53%)] before:bg-[length:36px_36px,42px_42px,100%_100%] before:opacity-60",
        "after:absolute after:bottom-0 after:right-0 after:h-28 after:w-28 after:rotate-180 after:bg-[radial-gradient(circle_at_18%_22%,#d88995_0_4px,transparent_5px),radial-gradient(circle_at_42%_36%,#9aaf8b_0_4px,transparent_5px),linear-gradient(45deg,transparent_48%,rgba(111,138,105,.42)_49%_52%,transparent_53%)] after:bg-[length:36px_36px,42px_42px,100%_100%] after:opacity-60",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
