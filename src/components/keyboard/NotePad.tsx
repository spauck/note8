import type { Hand } from "@/lib/composer-state";
import type { Settings } from "@/lib/settings";
import { handColor } from "../handColor";
import { getNotes } from "../Notes";

interface NotePadProps {
  settings: Settings;
  activeMap: Map<string, Hand>;
  onTap: (value: string) => void;
}

/** Row of note buttons; active notes are tinted by their assigned hand. */
export function NotePad({ settings, activeMap, onTap }: NotePadProps) {
  return (
    <>
      {Object.entries(getNotes(settings)).map(([val, note]) => {
        const noteHand = activeMap.get(val);
        const isActive = noteHand !== undefined;
        return (
          <button
            type="button"
            key={val}
            onClick={() => onTap(val)}
            className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg transition-colors border
              ${
                isActive
                  ? "bg-secondary border-current"
                  : "bg-secondary hover:bg-accent text-foreground border-border"
              }`}
            style={isActive ? { color: handColor(noteHand) } : undefined}
            title={val === "0" ? "Ding" : `Field ${val}`}
          >
            <note.Component
              {...note.props}
              noteId={val}
              hand={noteHand ?? "none"}
              settings={settings}
              className="relative inset-0 flex items-center justify-center"
            />
          </button>
        );
      })}
    </>
  );
}
