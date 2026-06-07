---
name: URL Schema
description: Format of composition data in URL query params
type: feature
---
Current schema:
- `n=<notesPerCount>` (default 1)
- `bars=<bar>,<bar>,...` (URL-encoded). Each bar = `<len>[!]<beat>.<beat>...`. `!` after the length marks `breakBefore` (start of a new row). The first bar always starts a row regardless of flag.
- Each beat = `<note>-<note>...`, each note = `<handShort><value>` where handShort is r/l/a/n.
- `name=<composition name>` (optional, used for sharing).
- `id=<6-char id>` (optional; assigned during gist sync, identifies the composition for syncing).
- `ding=<note>` (optional, e.g. `D3`) — composition's ding note. When set with `scale`, overrides the active library scale.
- `scale=<space-separated notes>` (URL-encoded, e.g. `A3 A%233 C4 D4 E4 F4 G4 A4`) — composition's scale notes.

Legacy schema (still decoded, marked with BEGIN/END LEGACY MIGRATION in `composer-state.ts`):
- `b=<beatsPerBar>&r=<barsPerRow>&d=<row>&d=<row>...` — flat rows; each row split into `barsPerRow` bars of `beatsPerBar` beats. Remove migration block once stale URLs/saves are gone.
