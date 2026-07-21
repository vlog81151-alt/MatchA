import * as React from "react";

import { cn } from "../lib/utils";

export function Logo({ className }: { className?: string }): React.JSX.Element {
  return (
    <div className={cn("inline-flex items-center gap-3", className)} aria-label="MatchA">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-rose-200 bg-cream-100 text-rose-700 shadow-glass">
        M
      </span>
      <span className="font-display text-3xl leading-none text-royal-ink">MatchA</span>
    </div>
  );
}
