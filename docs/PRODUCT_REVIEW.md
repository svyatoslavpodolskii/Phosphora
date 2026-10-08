# Product review checkpoint

Objective: attachment `6d02dc12-86b7-4e66-8dbe-7e4e80f4217d/pasted-text-1.txt`.
The long-term product goal remains active. A published renderer milestone does not prove completion.

## Verified milestone

- Retained PixiJS/WebGL scene, separate input canvas, software fallback, context-loss recovery.
- Gesture appearance remains stable; dense-scene pixel regression covers pointer down/up/hover.
- GPU texture keys now include icon legibility at the current zoom. Eight zoom steps and theme cache invalidations produce identical images before/after rebuilding textures.
- Current checks: zero type errors/warnings, production build, 138 unit tests, four renderer browser regressions.
- Previous milestone browser checks also covered mobile pinch at 100/500/1000 atoms, lasso, bulk actions, neutral startup, preview editing and plugin providers.

## Outstanding objective evidence

1. **Hardware performance comparison:** software WebGL in headless Chromium is slow and is excluded automatically. The GPU regression deliberately overrides device identification to verify correctness, not speed. Real hardware Canvas/Pixi p50/p95/p99, worst frame, memory and touch latency comparisons are still missing. Do not claim a measured GPU performance gain.
2. **Physical relationships:** The map now supports dragging a selected atom handle onto another atom, tapping a visible curve to expose both endpoint handles, reconnecting either end, breaking a link and undoing the last change. Core edits are atomic and conflict checked; deletion suppression prevents automatic resurrection. Desktop and real touch browser scenarios verify positions and reload persistence. Invalid/cancelled gestures, keyboard access and broader zoom/device combinations remain part of the interaction audit.
3. **Pause modifier:** canonical atoms now store `paused` independently of state, in SQLite schema v4. Legacy API inputs and backups are normalized, schema-v3 pause metadata is migrated, and YAML exports retain the modifier. Modifier unit tests cover state changes while paused and idempotent legacy calls; browser tests cover mobile/desktop reload. This closes the data-model gap; paused group presentation in Field/Kanban still belongs to the broader view audit.
4. **Broader mobile review:** existing test evidence does not replace review of real hardware feel, link editing and all nested surfaces.
5. **Remaining product audit:** verify Field/Kanban source grouping, recurrence identity/history, space backup safety, search framing, motion consistency and living graph composition individually against current source and runtime before claiming the full objective achieved.

Next priority: direct link manipulation and the Field/Kanban view audit. Keep the established camera and gestures unless new evidence identifies a regression.

## Task board checkpoint

Implemented Field/Kanban switching, source-atom groups, state changes by selector or pointer drag, independent paused section, daily/weekly recurrence, and completion history. Verified desktop/mobile checkbox and recurrence edits, column changes, reload persistence and return to map in Playwright; verified recurring identity/history through rollover and SQLite reload in unit tests. Remaining broader product and physical-device performance review is still required.

Recurring-task history now shows calendar occurrences in the trailing 7/30-day window, with weekly completions counted once. Desktop mouse and CDP touch group drag are verified. Search from Kanban returns to the visible map before focusing its result. Typecheck/build, 150 unit tests, and both board browser scenarios pass.

Task identity review: unchanged same-line matches are reserved before moved namesakes and renamed lines. This prevents recurrence/history loss when renaming duplicate tasks, renaming into an existing title, or adding fenced examples. Unit coverage includes swaps; a mobile browser scenario edits the source document and verifies IDs/history after saving. Identical tasks edited and reordered simultaneously remain inherently ambiguous without explicit inline IDs.

Kanban direct-manipulation polish: a compact source preview follows the pointer, the original card holds its place, and the destination lane is highlighted before release. Switching representations dismisses stale transient notifications. Desktop/mobile browser checks cover drag feedback and cancellation, persistence and editor saves; mobile screenshots were visually reviewed.

Workspace safety checkpoint: the deletion confirmation offers a full .phosphora backup in place, without requiring a trip to Settings. Download handoff is reported without claiming the file was saved. Mobile end-to-end coverage exports, verifies the typed-name guard, deletes, checks the surviving workspace, restores into a new workspace, and compares note state/pause/properties and preferences. Existing damaged-backup and offline workspace switching scenarios pass alongside 152 unit tests, typecheck and build.

Search keyboard checkpoint: result selection now follows ArrowUp/ArrowDown and Home/End, scrolls into view, resets after query edits, and is exposed through listbox options and the input active descendant. Enter selects the active result; camera behavior is preserved and focus returns to the map for immediate keyboard editing/navigation. Six browser scenarios cover result selection, contextual snippets, spatial history and board interactions; typecheck/build pass.
