import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppMenu } from "@/components/AppMenu";
import { AppTitle } from "@/components/AppTitle";
import { ComposerGrid } from "@/components/ComposerGrid";
import { CompositionManager } from "@/components/CompositionManager";
import { InfoDialog } from "@/components/InfoDialog";
import { NotesPerCountSelect } from "@/components/NotesPerCountSelect";
import { PositionKeyboard } from "@/components/PositionKeyboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { readAutosave, useAutosave } from "@/hooks/useAutosave";
import { useBarOperations } from "@/hooks/useBarOperations";
import { useComposerState } from "@/hooks/useComposerState";
import { useGistSync } from "@/hooks/useGistSync";
import { useNoteAssignment } from "@/hooks/useNoteAssignment";
import { useRowOperations } from "@/hooks/useRowOperations";
import { encodeState } from "@/lib/composer-state";
import {
  applyColorVars,
  loadSettings,
  type Settings,
  SettingsContext,
  saveSettings,
} from "@/lib/settings";
import { applyTheme, loadTheme } from "@/lib/theme";

interface SelectedCell {
  barIdx: number;
  beatIdx: number;
}

const Index = () => {
  const { state, updateState, searchParams, setSearchParams } =
    useComposerState();

  // On first load, restore from autosave if URL has no composition.
  const initialQuery = useMemo(() => {
    const urlQuery = window.location.search.slice(1);
    return urlQuery || readAutosave();
  }, []);

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (!hasRestoredRef.current && initialQuery && !searchParams.toString()) {
      hasRestoredRef.current = true;
      setSearchParams(initialQuery, { replace: true });
    }
  }, [initialQuery, searchParams, setSearchParams]);

  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [viewMode, setViewMode] = useState(false);

  const [loadedName, setLoadedName] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("name") || null;
  });
  const [lastSavedQuery, setLastSavedQuery] = useState<string | null>(null);

  const autosave = useAutosave(state);

  const currentQuery = encodeState(state);
  const hasUnsavedChanges =
    lastSavedQuery !== null
      ? currentQuery !== lastSavedQuery
      : searchParams.toString() !== "";

  useEffect(() => {
    applyTheme(loadTheme());
    applyColorVars(settings);
  }, [settings]);

  const handleUpdateSettings = useCallback((s: Settings) => {
    setSettings(s);
    saveSettings(s);
    applyColorVars(s);
  }, []);

  const handleSelectCell = useCallback((cell: SelectedCell | null) => {
    setSelectedCell(cell);
  }, []);

  const rowOps = useRowOperations(
    state,
    updateState,
    selectedCell,
    setSelectedCell,
  );
  const barOps = useBarOperations(
    state,
    updateState,
    selectedCell,
    setSelectedCell,
  );
  const noteOps = useNoteAssignment(
    state,
    updateState,
    selectedCell,
    setSelectedCell,
  );

  const handleLoad = useCallback(
    (queryString: string, name: string) => {
      const params = new URLSearchParams(queryString);
      params.set("name", name);
      setSearchParams(params.toString(), { replace: true });
      setLoadedName(name);
      setLastSavedQuery(queryString);
      setSelectedCell(null);
    },
    [setSearchParams],
  );

  const gistSync = useGistSync();

  const handleSaved = useCallback(
    (name: string) => {
      setLoadedName(name);
      setLastSavedQuery(encodeState(state));
      if (gistSync.enabled) gistSync.sync({ silent: true });
    },
    [state, gistSync],
  );

  const handleNotesPerCountChange = useCallback(
    (val: number) => {
      if (val < 1 || val > 16) return;
      updateState({ ...state, notesPerCount: val });
    },
    [state, updateState],
  );

  const reset = useCallback(() => {
    setSearchParams("", { replace: true });
    setSelectedCell(null);
    setLoadedName(null);
    setLastSavedQuery(null);
    autosave.clear();
  }, [setSearchParams, autosave]);

  const shareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    if (loadedName) url.searchParams.set("name", loadedName);
    else url.searchParams.delete("name");
    navigator.clipboard.writeText(url.toString()).then(
      () => toast.success("Link copied to clipboard!"),
      () => toast.error("Failed to copy link"),
    );
  }, [loadedName]);

  const toggleViewMode = useCallback(() => {
    setViewMode((v) => {
      if (!v) setSelectedCell(null);
      return !v;
    });
  }, []);

  const compositionManager = CompositionManager({
    state,
    loadedName,
    onLoad: handleLoad,
    hasUnsavedChanges,
    onSaved: handleSaved,
  });

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings: handleUpdateSettings }}
    >
      <div
        className={`min-h-screen bg-background p-3 sm:p-6 ${selectedCell && !viewMode ? "pb-28" : ""}`}
      >
        <div className="mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <AppTitle viewMode={viewMode} loadedName={loadedName} />
            <div className="flex items-center gap-2">
              {!viewMode && (
                <AppMenu
                  onNew={reset}
                  onSave={compositionManager.openSave}
                  onLoad={compositionManager.openLoad}
                  onShare={shareUrl}
                  onExport={compositionManager.handleExport}
                  onImport={compositionManager.handleImport}
                  onReset={reset}
                />
              )}
              <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />
              <InfoDialog />
              {!viewMode && <SettingsPanel />}
            </div>
          </div>

          {!viewMode && (
            <NotesPerCountSelect
              value={state.notesPerCount}
              onChange={handleNotesPerCountChange}
            />
          )}

          <ComposerGrid
            bars={state.bars}
            notesPerCount={state.notesPerCount}
            viewMode={viewMode}
            selectedCell={selectedCell}
            onSelectCell={handleSelectCell}
            onDeleteBar={barOps.deleteBar}
            onChangeBarLength={barOps.changeBarLength}
            onSetBreak={barOps.setBreak}
            onAddBar={barOps.addBar}
            onMoveRow={rowOps.moveRow}
            onDuplicateRow={rowOps.duplicateRow}
            onDeleteRow={rowOps.deleteRow}
          />
        </div>
      </div>

      {!viewMode && (
        <PositionKeyboard
          selectedCell={selectedCell}
          activeNotes={noteOps.activeNotes}
          bars={state.bars}
          onAssignNote={noteOps.assignNote}
          onRemoveNote={noteOps.removeNote}
          onClearAll={noteOps.clearAll}
          onSetBeat={noteOps.setBeat}
        />
      )}
      {compositionManager.dialogs}
    </SettingsContext.Provider>
  );
};

export default Index;
