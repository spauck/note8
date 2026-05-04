interface NotesPerCountSelectProps {
  value: number;
  onChange: (value: number) => void;
}

/** Configuration row containing the notes-per-count selector. */
export function NotesPerCountSelect({
  value,
  onChange,
}: NotesPerCountSelectProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-5 bg-card rounded-lg p-3 border border-border">
      <label className="flex items-center gap-2 text-sm text-secondary-foreground">
        <span className="text-muted-foreground">Notes/count</span>
        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="bg-secondary text-foreground rounded px-2 py-1 text-sm font-mono border border-border"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <span className="text-xs text-muted-foreground">
        Bar length is configured per bar below.
      </span>
    </div>
  );
}
