import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAJOR_KEYS, type MajorKey } from "@/lib/sheet-music";

interface SheetKeyPickerProps {
  value: MajorKey;
  onChange: (key: MajorKey) => void;
}

/** Picks the major key the sheet music is written in (key signature). */
export function SheetKeyPicker({ value, onChange }: SheetKeyPickerProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Key</span>
      <Select value={value} onValueChange={(v) => onChange(v as MajorKey)}>
        <SelectTrigger className="h-7 w-24 text-xs px-2 py-0 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {MAJOR_KEYS.map((k) => (
            <SelectItem key={k} value={k} className="text-xs font-mono">
              {k} major
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
