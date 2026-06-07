import { Music } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SavedScale } from "@/lib/scale-library";

interface ScalePickerProps {
  scales: SavedScale[];
  activeId: string | null;
  onPick: (scale: SavedScale) => void;
}

export function ScalePicker({ scales, activeId, onPick }: ScalePickerProps) {
  if (scales.length === 0) return null;
  const active = scales.find((s) => s.id === activeId) ?? scales[0];

  return (
    <div className="flex items-center gap-1 text-xs">
      <Music className="w-3 h-3 text-muted-foreground" />
      <Select
        value={active.id}
        onValueChange={(id) => {
          const next = scales.find((s) => s.id === id);
          if (next && next.id !== active.id) onPick(next);
        }}
      >
        <SelectTrigger className="h-7 text-xs px-2 py-0 w-auto gap-1 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {scales.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              <span className="font-medium">{s.name}</span>
              <span className="text-muted-foreground ml-2 font-mono">
                {s.ding} / {s.notes}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
