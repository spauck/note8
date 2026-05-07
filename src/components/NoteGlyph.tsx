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
      {notes
        .map((n) => [n.hand, notesById[n.value]] as const)
        .filter(([, note]) => note)
        .sort(([_, a], [__, b]) => {
          return a.precedence - b.precedence;
        })
        .map(([hand, note], index) => {
          return (
            <span
              key={`${note.id}-${hand}-${index}`}
              className="absolute inset-0 flex items-center justify-center"
            >
              <note.Component
                {...note.props}
                noteId={note.id}
                hand={hand}
                settings={settings}
              />
            </span>
          );
        })}
    </>
  );
};
