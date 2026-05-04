import type { Note } from "@/lib/composer-state";
import type { Settings } from "@/lib/settings";
import { getNotes } from "./Notes";

export const NoteGlyph = ({
  notes,
  settings,
}: {
  notes: Note[];
  settings: Settings;
}) => {
  const notesById = getNotes(settings);

  return (
    <>
      {notes.map((noteValue, index) => {
        const note = notesById[noteValue.value];
        if (!note) return null;
        return (
          <span
            key={`${noteValue.value}-${noteValue.hand}-${index}`}
            className="absolute inset-0 flex items-center justify-center"
          >
            <note.Component
              {...note.props}
              noteId={noteValue.value}
              hand={noteValue.hand}
              settings={settings}
            />
          </span>
        );
      })}
    </>
  );
};
