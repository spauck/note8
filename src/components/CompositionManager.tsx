import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/composition/ConfirmDialog";
import { LoadCompositionDialog } from "@/components/composition/LoadCompositionDialog";
import { SaveCompositionDialog } from "@/components/composition/SaveCompositionDialog";
import { useCompositionFileIO } from "@/hooks/useCompositionFileIO";
import { type ComposerState, encodeState } from "@/lib/composer-state";
import {
  compositionExists,
  deleteComposition,
  listSavedCompositions,
  type SavedComposition,
  saveComposition,
} from "@/lib/composition-storage";

interface Props {
  state: ComposerState;
  loadedName: string | null;
  onLoad: (queryString: string, name: string) => void;
  hasUnsavedChanges: boolean;
  onSaved: (name: string) => void;
}

/** Coordinates save/load/export/import dialogs and returns hooks for the
 * caller to attach action buttons to. */
export function CompositionManager({
  state,
  loadedName,
  onLoad,
  hasUnsavedChanges,
  onSaved,
}: Props) {
  /* Save flow */
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const openSave = useCallback(() => {
    setSaveName(loadedName ?? "");
    setSaveOpen(true);
  }, [loadedName]);

  const doSave = useCallback(() => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    if (compositionExists(trimmed) && trimmed !== loadedName) {
      setConfirmOverwrite(true);
      return;
    }
    saveComposition(trimmed, encodeState(state));
    onSaved(trimmed);
    setSaveOpen(false);
  }, [saveName, state, loadedName, onSaved]);

  const confirmAndSave = useCallback(() => {
    const trimmed = saveName.trim();
    saveComposition(trimmed, encodeState(state));
    onSaved(trimmed);
    setConfirmOverwrite(false);
    setSaveOpen(false);
  }, [saveName, state, onSaved]);

  /* Load flow */
  const [loadOpen, setLoadOpen] = useState(false);
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);
  const [pendingLoad, setPendingLoad] = useState<SavedComposition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedComposition | null>(
    null,
  );

  const openLoad = useCallback(() => {
    setCompositions(listSavedCompositions());
    setLoadOpen(true);
  }, []);

  const handleLoadClick = useCallback(
    (comp: SavedComposition) => {
      if (hasUnsavedChanges) {
        setPendingLoad(comp);
      } else {
        onLoad(comp.queryString, comp.name);
        setLoadOpen(false);
      }
    },
    [hasUnsavedChanges, onLoad],
  );

  const confirmLoad = useCallback(() => {
    if (pendingLoad) {
      onLoad(pendingLoad.queryString, pendingLoad.name);
      setPendingLoad(null);
      setLoadOpen(false);
    }
  }, [pendingLoad, onLoad]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteComposition(deleteTarget.name);
      setCompositions(listSavedCompositions());
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  /* File IO */
  const { handleExport, handleImport, fileInput } = useCompositionFileIO();

  return {
    openSave,
    openLoad,
    handleExport,
    handleImport,
    dialogs: (
      <>
        {fileInput}
        <SaveCompositionDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          name={saveName}
          onNameChange={setSaveName}
          onSave={doSave}
        />
        <ConfirmDialog
          open={confirmOverwrite}
          onOpenChange={setConfirmOverwrite}
          title={`Overwrite "${saveName.trim()}"?`}
          description="A composition with this name already exists. Saving will replace it."
          confirmLabel="Overwrite"
          onConfirm={confirmAndSave}
        />
        <LoadCompositionDialog
          open={loadOpen}
          onOpenChange={setLoadOpen}
          compositions={compositions}
          onLoad={handleLoadClick}
          onRequestDelete={setDeleteTarget}
        />
        <ConfirmDialog
          open={!!pendingLoad}
          onOpenChange={(o) => {
            if (!o) setPendingLoad(null);
          }}
          title="Unsaved changes"
          description="You have unsaved changes. Loading a new composition will discard them."
          confirmLabel="Load anyway"
          onConfirm={confirmLoad}
        />
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          title={`Delete "${deleteTarget?.name}"?`}
          description="This composition will be permanently removed."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
        />
      </>
    ),
  };
}
