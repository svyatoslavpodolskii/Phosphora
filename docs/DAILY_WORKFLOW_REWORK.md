# Posphorea 0.4.0: daily workflow

## Behavior

- Closing a changed note commits it. A failed commit leaves the complete editor open for correction and retry. Explicit discard lives in Additional settings. Untouched empty capture creates no atom; body-only capture derives a title from its first line.
- Save stays in the editor header above the software keyboard. Formatting, type, aliases and pause no longer compete with writing. VisualViewport updates the sheet and search room; desktop fullscreen retains access to metadata.
- Search opens the note directly. Show on map and Shift+Enter provide spatial navigation; closing the reader restores its original map location.
- Single and group deletion retain an atomic, durable undo record with incident relationships. Undo survives reload, preserves unrelated edits and refuses ID/path conflicts. Editing before deletion commits the latest text first. The menu keeps Undo after the notice expires.
- Deletion and undo preserve the resting map arrangement. Restoring a camera also clears direct gesture state.
- Checking for updates and applying an available update use separate button branches and handlers. An arriving update cannot change the check button's click into a reload between pointer press and release.

## Startup and resource use

- Canvas can paint and accept input before the optional GPU renderer finishes loading. Backend adoption waits until hands, camera and transient surfaces are idle. Both pending and active renderers are disposed on unmount.
- Graph worker clients start their worker on the first request, rather than construction. Closed clients cannot restart; failed message cloning clears its pending timeout immediately.
- Typing reuses an atom snapshot for matching, instead of copying the vault for each character.
- Reading attachments imports a small storage helper rather than the ZIP/YAML importer. The production editor chunk is approximately 20 kB plus the 0.43 kB helper; archive import stays lazy in settings.
- Explicit diagnostic export contains browser, renderer, viewport, startup timing and counts, without note text, titles or IDs. Nothing is uploaded automatically.

## Compatibility and validation

Plugin API and persisted atom schema are unchanged. Undo and checkpoint metadata are ordinary workspace settings. Existing full local deletion backups remain available.

Unit coverage includes ordered checkpoint writes, lazy worker lifecycle, camera state reset, durable undo, transaction failure/retry and preserving unrelated edits. Browser coverage exercises direct search, body-first capture, failed save recovery, closing to save, latest-text deletion/undo after reload, deferred GPU adoption and diagnostic download fallback, alongside existing vault, gesture, navigation and PWA update scenarios.

Headless desktop Chromium/Firefox checks do not establish frame rate or software keyboard behavior on the user's Nothing Phone 1. The first-map diagnostic records elapsed navigation time at the first map draw, not completed GPU rendering or an FPS benchmark.
