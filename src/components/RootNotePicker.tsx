import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rootNoteOptions } from "@/lib/sheet-music";

interface RootNotePickerProps {
  value: string;
  onChange: (note: string) => void;
}

const OPTIONS = rootNoteOptions(1, 6);

/** Picks the exact root (ding) note the sheet music is rendered in. */
export function RootNotePicker({ value, onChange }: RootNotePickerProps) {
  const options = OPTIONS.includes(value) ? OPTIONS : [value, ...OPTIONS];
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Root note</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-24 text-xs px-2 py-0 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((n) => (
            <SelectItem key={n} value={n} className="text-xs font-mono">
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
