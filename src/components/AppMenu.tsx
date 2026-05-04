import {
  Download,
  FilePlus,
  FolderOpen,
  Link,
  Menu,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppMenuProps {
  onNew: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}

/** Top-right "≡" menu containing file/share actions. */
export function AppMenu({
  onNew,
  onSave,
  onLoad,
  onShare,
  onExport,
  onImport,
  onReset,
}: AppMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors border text-muted-foreground hover:text-foreground border-border hover:border-primary/50"
        >
          <Menu className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onNew}>
          <FilePlus className="w-3.5 h-3.5 mr-2" />
          New
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSave}>
          <Save className="w-3.5 h-3.5 mr-2" />
          Save
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLoad}>
          <FolderOpen className="w-3.5 h-3.5 mr-2" />
          Load
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShare}>
          <Link className="w-3.5 h-3.5 mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport}>
          <Download className="w-3.5 h-3.5 mr-2" />
          Export
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImport}>
          <Upload className="w-3.5 h-3.5 mr-2" />
          Import
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReset}>
          <RotateCcw className="w-3.5 h-3.5 mr-2" />
          Reset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
