import { useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  exportAllCompositions,
  importCompositions,
} from "@/lib/composition-storage";

/** File-based export/import of all saved compositions. */
export function useCompositionFileIO() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const data = exportAllCompositions();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "handpan-compositions.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Compositions exported");
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const count = importCompositions(reader.result as string, false);
          toast.success(
            `Imported ${count} composition${count !== 1 ? "s" : ""}`,
          );
        } catch {
          toast.error("Invalid file format");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [],
  );

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".json"
      className="hidden"
      onChange={handleFileChange}
    />
  );

  return { handleExport, handleImport, fileInput };
}
