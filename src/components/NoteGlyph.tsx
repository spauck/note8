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
  const lastNoteValue = notes.at(-1);
  const lastNote = lastNoteValue && notesById[lastNoteValue.value];
  const BackgroundComponent = lastNote?.BackgroundComponent;

  return (
    <>
      {BackgroundComponent && (
        <span className="absolute inset-0 flex items-center justify-center">
          <BackgroundComponent
            noteId={lastNoteValue.value}
            hand={lastNoteValue.hand}
            settings={settings}
          />
        </span>
      )}
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
