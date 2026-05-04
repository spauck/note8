import type { Hand } from "@/lib/composer-state";
import type { Settings } from "@/lib/settings";
import { handColor } from "../handColor";
import { NoteGlyph } from "../NoteGlyph";
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
      {Object.keys(getNotes(settings)).map((val) => {
        const noteHand = activeMap.get(val);
        const isActive = noteHand !== undefined;
        return (
          <button
            type="button"
            key={val}
            onClick={() => onTap(val)}
            className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg transition-colors border relative
              ${
                isActive
                  ? "bg-secondary border-current"
                  : "bg-secondary hover:bg-accent text-foreground border-border"
              }`}
            style={isActive ? { color: handColor(noteHand) } : undefined}
            title={val === "0" ? "Ding" : `Field ${val}`}
          >
            <NoteGlyph
              notes={[{ value: val, hand: noteHand ?? "none" }]}
              settings={settings}
            />
          </button>
        );
      })}
    </>
  );
}
