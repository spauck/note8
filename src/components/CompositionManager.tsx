import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/composition/ConfirmDialog";
import { LoadCompositionDialog } from "@/components/composition/LoadCompositionDialog";
import { SaveCompositionDialog } from "@/components/composition/SaveCompositionDialog";
import { useCompositionFileIO } from "@/hooks/useCompositionFileIO";
import { type ComposerState, encodeState } from "@/lib/composer-state";
import {
  deleteComposition,
  listSavedCompositions,
  nameCollidesWith,
  type SavedComposition,
  saveComposition,
} from "@/lib/composition-storage";

interface Props {
  state: ComposerState;
  loadedId: string | null;
  loadedName: string | null;
  onLoad: (comp: SavedComposition) => void;
  hasUnsavedChanges: boolean;
  onSaved: (comp: SavedComposition) => void;
}

/** Coordinates save/load/export/import dialogs and returns hooks for the
 * caller to attach action buttons to. */
export function CompositionManager({
  state,
  loadedId,
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

  const persist = useCallback(
    (name: string) => {
      const entry = saveComposition(name, encodeState(state), loadedId);
      onSaved(entry);
      setSaveOpen(false);
    },
    [state, loadedId, onSaved],
  );

  const doSave = useCallback(() => {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    // Collision only matters when we'd be overwriting a *different* record.
    if (nameCollidesWith(trimmed, loadedId)) {
      setConfirmOverwrite(true);
      return;
    }
    persist(trimmed);
  }, [saveName, loadedId, persist]);

  const confirmAndSave = useCallback(() => {
    persist(saveName.trim());
    setConfirmOverwrite(false);
  }, [saveName, persist]);

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
        onLoad(comp);
        setLoadOpen(false);
      }
    },
    [hasUnsavedChanges, onLoad],
  );

  const confirmLoad = useCallback(() => {
    if (pendingLoad) {
      onLoad(pendingLoad);
      setPendingLoad(null);
      setLoadOpen(false);
    }
  }, [pendingLoad, onLoad]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteComposition(deleteTarget);
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
