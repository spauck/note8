import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppMenu } from "@/components/AppMenu";
import { AppTitle } from "@/components/AppTitle";
import { ComposerGrid } from "@/components/ComposerGrid";
import { CompositionManager } from "@/components/CompositionManager";
import { InfoDialog } from "@/components/InfoDialog";
import { NotesPerCountSelect } from "@/components/NotesPerCountSelect";
import { PositionKeyboard } from "@/components/PositionKeyboard";
import { ScaleChangeDialog } from "@/components/ScaleChangeDialog";
import { ScalePicker } from "@/components/ScalePicker";
import { SettingsPanel } from "@/components/SettingsPanel";
import { RootNotePicker } from "@/components/RootNotePicker";
import { SheetMusicToggle } from "@/components/SheetMusicToggle";
import { SheetMusicView } from "@/components/SheetMusicView";
import { rerootScale } from "@/lib/sheet-music";
import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { readAutosave, useAutosave } from "@/hooks/useAutosave";
import { useBarOperations } from "@/hooks/useBarOperations";
import { useComposerState } from "@/hooks/useComposerState";

import { useGistSync } from "@/hooks/useGistSync";
import { useNoteAssignment } from "@/hooks/useNoteAssignment";
import { useRowOperations } from "@/hooks/useRowOperations";
import { encodeState } from "@/lib/composer-state";
import {
  findCompositionById,
  type SavedComposition,
} from "@/lib/composition-storage";
import { ConfirmDialog } from "@/components/composition/ConfirmDialog";
import { parseNote, parseScaleNotes, transposeNoteIds } from "@/lib/scale";
import {
  ensureDefaultScale,
  listScales,
  type SavedScale,
} from "@/lib/scale-library";
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

  const [baseSettings, setBaseSettings] = useState<Settings>(loadSettings);
  const [scales, setScales] = useState<SavedScale[]>(listScales);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [sheetMode, setSheetMode] = useState(false);
  // Root note used for the sheet-music rendering only (null = composition's own).
  const [sheetRoot, setSheetRoot] = useState<string | null>(null);

  // First-run migration: if the library is empty, seed it from the legacy
  // scaleDing/scaleNotes settings and adopt that as the active scale.
  useEffect(() => {
    if (scales.length === 0) {
      const seed = ensureDefaultScale(
        baseSettings.scaleDing,
        baseSettings.scaleNotes,
      );
      const next = listScales();
      setScales(next);
      if (!baseSettings.activeScaleId) {
        const updated = { ...baseSettings, activeScaleId: seed.id };
        setBaseSettings(updated);
        saveSettings(updated);
      }
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: one-shot
  }, []);

  const loadedName = searchParams.get("name");
  const loadedId = searchParams.get("id");
  const setLoadedMeta = useCallback(
    (id: string | null, name: string | null) => {
      const p = new URLSearchParams(searchParams);
      if (name) p.set("name", name);
      else p.delete("name");
      if (id) p.set("id", id);
      else p.delete("id");
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams],
  );
  // Bumped whenever the saved composition library changes (save, sync, etc.)
  // so derived state recomputes from the actual stored data.
  const [savedTick, setSavedTick] = useState(0);
  const bumpSavedTick = useCallback(() => setSavedTick((t) => t + 1), []);

  const autosave = useAutosave(searchParams.toString());

  const isEmpty = useMemo(
    () => state.bars.every((b) => b.beats.every((beat) => beat.length === 0)),
    [state.bars],
  );

  // Resolve the effective scale: URL override > active library scale > legacy.
  const effectiveScale = useMemo(() => {
    if (state.ding && state.scaleNotes) {
      return { ding: state.ding, notes: state.scaleNotes };
    }
    const active =
      scales.find((s) => s.id === baseSettings.activeScaleId) ?? scales[0];
    if (active) return { ding: active.ding, notes: active.notes };
    return { ding: baseSettings.scaleDing, notes: baseSettings.scaleNotes };
  }, [
    state.ding,
    state.scaleNotes,
    scales,
    baseSettings.activeScaleId,
    baseSettings.scaleDing,
    baseSettings.scaleNotes,
  ]);

  // Settings exposed to the rest of the tree carry the effective scale and
  // a notesPerCount derived from it, so chord inference and the keyboard
  // both use the composition's actual scale.
  const effectiveSettings = useMemo<Settings>(() => {
    const noteCount = effectiveScale.notes.trim().split(/\s+/).filter(Boolean)
      .length;
    return {
      ...baseSettings,
      scaleDing: effectiveScale.ding,
      scaleNotes: effectiveScale.notes,
      panscriptFields:
        noteCount >= 1 && noteCount <= 12
          ? noteCount
          : baseSettings.panscriptFields,
    };
  }, [baseSettings, effectiveScale]);

  // Ensure every non-empty composition has a name so it can be synced.
  useEffect(() => {
    if (!isEmpty && !loadedName) setLoadedMeta(loadedId, "Untitled");
  }, [isEmpty, loadedName, loadedId, setLoadedMeta]);

  const currentQuery = encodeState(state);

  const [remoteNewerForLoaded, setRemoteNewerForLoaded] =
    useState<SavedComposition | null>(null);
  const [remotePromptOpen, setRemotePromptOpen] = useState(false);

  const gistSync = useGistSync((result) => {
    setScales(listScales());
    bumpSavedTick();
    if (loadedId && result.remoteNewerIds.includes(loadedId)) {
      const fresh = findCompositionById(loadedId);
      if (fresh && fresh.queryString !== currentQuery) {
        setRemoteNewerForLoaded(fresh);
        setRemotePromptOpen(true);
      }
    }
  });

  // The persisted record for the loaded composition, re-read whenever the
  // library changes (save, sync, etc). Derived state below compares against
  // this real stored value rather than tracking events.
  // biome-ignore lint/correctness/useExhaustiveDependencies: savedTick triggers re-read
  const savedComp = useMemo(
    () => findCompositionById(loadedId),
    [loadedId, savedTick],
  );

  const hasUnsavedChanges = savedComp
    ? currentQuery !== savedComp.queryString
    : !isEmpty;

  // Cloud-upload pending when the local record was saved after the last sync.
  const cloudUploadPending = !!(
    gistSync.enabled &&
    savedComp &&
    gistSync.lastSyncedAt !== null &&
    (savedComp.savedAt ?? 0) > gistSync.lastSyncedAt
  );

  useEffect(() => {
    applyTheme(loadTheme());
    applyColorVars(effectiveSettings);
  }, [effectiveSettings]);

  const handleUpdateSettings = useCallback(
    (s: Settings) => {
      // Strip the effective-scale overrides — those live on the composition
      // or in the active library entry, not in saved settings.
      const persisted: Settings = {
        ...s,
        scaleDing: baseSettings.scaleDing,
        scaleNotes: baseSettings.scaleNotes,
      };
      setBaseSettings(persisted);
      saveSettings(persisted);
      applyColorVars(persisted);
      // The library may have changed via the panel; refresh.
      setScales(listScales());
    },
    [baseSettings.scaleDing, baseSettings.scaleNotes],
  );

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
    (comp: SavedComposition) => {
      const params = new URLSearchParams(comp.queryString);
      params.set("name", comp.name);
      if (comp.id) params.set("id", comp.id);
      else params.delete("id");
      setSearchParams(params.toString(), { replace: true });
      setSelectedCell(null);
      bumpSavedTick();
    },
    [setSearchParams, bumpSavedTick],
  );

  const handleSaved = useCallback(
    (comp: SavedComposition) => {
      setLoadedMeta(comp.id ?? null, comp.name);
      bumpSavedTick();
      if (gistSync.enabled) gistSync.sync({ silent: true });
    },
    [gistSync, setLoadedMeta, bumpSavedTick],
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
    autosave.clear();
    bumpSavedTick();
  }, [setSearchParams, autosave, bumpSavedTick]);

  const loadRemoteNewer = useCallback(() => {
    if (remoteNewerForLoaded) {
      handleLoad(remoteNewerForLoaded);
      setRemoteNewerForLoaded(null);
      setRemotePromptOpen(false);
    }
  }, [remoteNewerForLoaded, handleLoad]);

  const dismissRemoteNewer = useCallback(() => {
    setRemotePromptOpen(false);
  }, []);

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

  const [pendingScale, setPendingScale] = useState<SavedScale | null>(null);

  const rememberActive = useCallback(
    (target: SavedScale) => {
      if (baseSettings.activeScaleId !== target.id) {
        const updated = { ...baseSettings, activeScaleId: target.id };
        setBaseSettings(updated);
        saveSettings(updated);
      }
    },
    [baseSettings],
  );

  // Apply scale without changing any beats — same positional ids now play
  // the new scale's notes.
  const applyScaleOnly = useCallback(
    (target: SavedScale) => {
      updateState({
        ...state,
        ding: target.ding,
        scaleNotes: target.notes,
      });
      rememberActive(target);
      setPendingScale(null);
    },
    [state, updateState, rememberActive],
  );

  // Transpose every note in the composition into the target scale.
  const transposeToScale = useCallback(
    (target: SavedScale) => {
      const fromDing = parseNote(effectiveScale.ding);
      const fromNotes = parseScaleNotes(effectiveScale.notes);
      const toDing = parseNote(target.ding);
      const toNotes = parseScaleNotes(target.notes);

      const newBars = state.bars.map((bar) => ({
        ...bar,
        beats: bar.beats.map((beat) => {
          if (beat.length === 0) return beat;
          const ids = beat.map((n) => n.value);
          const mapped = transposeNoteIds(
            ids,
            fromDing,
            fromNotes,
            toDing,
            toNotes,
          );
          const out = [] as typeof beat;
          let j = 0;
          for (let i = 0; i < beat.length && j < mapped.length; i++) {
            out.push({ ...beat[i], value: mapped[j] });
            j++;
          }
          return out;
        }),
      }));

      updateState({
        ...state,
        bars: newBars,
        ding: target.ding,
        scaleNotes: target.notes,
      });
      rememberActive(target);
      setPendingScale(null);
    },
    [state, effectiveScale, updateState, rememberActive],
  );

  const pickScale = useCallback((target: SavedScale) => {
    setPendingScale(target);
  }, []);


  const compositionManager = CompositionManager({
    state,
    loadedId,
    loadedName,
    onLoad: handleLoad,
    hasUnsavedChanges,
    onSaved: handleSaved,
  });

  // Pick the effective scale's id, if it matches a library entry, so the
  // picker reflects what's actually in use.
  const effectiveScaleId = useMemo(() => {
    const match = scales.find(
      (s) =>
        s.ding.trim() === effectiveScale.ding.trim() &&
        s.notes.trim() === effectiveScale.notes.trim(),
    );
    return match?.id ?? baseSettings.activeScaleId ?? null;
  }, [scales, effectiveScale, baseSettings.activeScaleId]);

  return (
    <SettingsContext.Provider
      value={{
        settings: effectiveSettings,
        updateSettings: handleUpdateSettings,
      }}
    >
      <div
        className={`min-h-screen bg-background p-3 sm:p-6 ${selectedCell && !viewMode ? "pb-28" : ""}`}
      >
        <div className="mx-auto">
          <div className="mb-2 flex items-start justify-between gap-4">
            <AppTitle />
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
                  onSyncGist={() => gistSync.sync()}
                  gistEnabled={gistSync.enabled}
                  gistSyncing={gistSync.syncing}
                />
              )}
              <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />
              <InfoDialog />
              {!viewMode && <SettingsPanel />}
            </div>
          </div>

          <div className="mb-6">
            {!viewMode && isEmpty && (
              <p className="text-sm text-muted-foreground mt-1">
                Tap a cell, pick a position ·{" "}
                <span className="text-hand-right">R</span> ·{" "}
                <span className="text-hand-left">L</span> ·{" "}
                <span className="text-hand-any">A</span> ·{" "}
                <span className="text-hand-none">N</span>
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap mt-1">
              {loadedName && (
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {loadedName}
                  </span>
                  <SaveStatusIndicator
                    dirty={hasUnsavedChanges}
                    hasSavedSlot={!!loadedId}
                    autosavePending={autosave.pending}
                    syncEnabled={gistSync.enabled}
                    syncing={gistSync.syncing}
                    cloudUploadPending={cloudUploadPending}
                    remoteNewerAvailable={!!remoteNewerForLoaded}
                    onLoadRemote={() => setRemotePromptOpen(true)}
                  />
                </span>
              )}
              {!viewMode && (
                <ScalePicker
                  scales={scales}
                  activeId={effectiveScaleId}
                  onPick={pickScale}
                />
              )}
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
      <ScaleChangeDialog
        open={pendingScale !== null}
        target={pendingScale}
        state={state}
        fromDing={effectiveScale.ding}
        fromNotes={effectiveScale.notes}
        onCancel={() => setPendingScale(null)}
        onApplyOnly={applyScaleOnly}
        onTranspose={transposeToScale}
      />
      <ConfirmDialog
        open={remotePromptOpen}
        onOpenChange={(o) => {
          if (!o) dismissRemoteNewer();
        }}
        title="Newer version found in cloud"
        description={
          hasUnsavedChanges
            ? "A more recent version of this composition was found in your cloud sync. Loading it will discard your current unsaved changes."
            : "A more recent version of this composition was found in your cloud sync. Load it?"
        }
        confirmLabel="Load newer version"
        onConfirm={loadRemoteNewer}
      />
    </SettingsContext.Provider>
  );
};

export default Index;
