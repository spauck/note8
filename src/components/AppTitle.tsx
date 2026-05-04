import { Infinity as InfinityLucide } from "lucide-react";

interface AppTitleProps {
  viewMode: boolean;
  loadedName: string | null;
}

/** App title block: heading, hand legend hint, and loaded composition name. */
export function AppTitle({ viewMode, loadedName }: AppTitleProps) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
        Note
        <InfinityLucide className="inline" size={40} />
      </h1>
      {!viewMode && (
        <p className="text-sm text-muted-foreground mt-1">
          Tap a cell, pick a position ·{" "}
          <span className="text-hand-right">R</span> ·{" "}
          <span className="text-hand-left">L</span> ·{" "}
          <span className="text-hand-any">A</span> ·{" "}
          <span className="text-hand-none">N</span>
        </p>
      )}
      {loadedName && (
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{loadedName}</span>
        </span>
      )}
    </div>
  );
}
