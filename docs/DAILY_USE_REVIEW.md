# Daily-use review: 0.2.0

## Findings and changes

- A loaded page kept executing old code even after deployment. Replace the one-shot automatic worker registration with foreground/online checks and an explicit update action. The action waits for controller replacement before reloading; another tab activating a worker only announces availability. Settings has a manual check and the visible version is now 0.2.0. Never clear OPFS to update.
- Editor, Settings, workspace management and Kanban were in the initial bundle. Load these surfaces on demand with a focus-owning loading/error surface. Separate lightweight note-reference resolution from ZIP/YAML vault operations without changing its algorithms or public re-exports. Main entry is approximately 330 KB versus 520 KB before (uncompressed); this is a bundle-size reduction, not a measured phone startup-time reduction. GPU/SQLite still load for the map; the worker precaches optional features for offline use.
- Losing a tab discarded unfinished text. Store the editor draft, original revision, parent and relationship edits in a workspace-local SQLite setting after a 300 ms debounce, and flush on backgrounding. Restore the editor on reopening. Consume the checkpoint in the same transaction as a successful editor save. Plugin writes do not consume it; failed commits retain it. Explicit discard clears it. Capture large text at flush time rather than cloning it per keystroke. A force-kill before persistence finishes can still lose the latest unsaved keystrokes.
- New thoughts in Now were saved as normal and disappeared from that lens. New drafts inherit Now; successful creation selects/reveals the atom and keeps a compatible lens. Empty search offers creation at the current view center, with the query as the title.
- Returning a pan to its initial point could be treated as a tap. Latch movement through release, suppress implicit Enter activation when opening the lazy editor, and fully reset canceled hold/pinch state.
- Direct dragging explicitly transmitted movement to connected neighbors. Move only the held atom or selected group, and stop post-drop relaxation until a content/model change requests it. Resting physics is not restarted by an ordinary camera gesture or closing a surface. Existing structural providers and Plugin API stay available.
- Overlapping atom bodies could reverse trimmed curve endpoints. Bound trimming to 45% per endpoint, skip coincident points and use round GPU joins/caps to avoid degenerate spikes. This prevents the identified geometric failure; the exact visual glitch reported on the old Android build still needs device confirmation.

## Verification

Svelte check; full unit suite; Chromium and desktop Firefox narrow-viewport daily-flow tests (draft recovery, explicit discard, Now lens, independent dragging), navigation, WebGL and Canvas zoom, render stability and retained-texture zoom tests. PWA tests serve the built app with a real changing Service Worker, verify waiting/activation/reload and preserved SQLite data. The fixture changes only its own in-memory worker revision and uses an isolated localhost origin.

No physical Nothing Phone 1 is connected. Desktop Gecko and software-WebGL work counts cannot establish Android frame pacing. First installation and database opening remain distinct from warm/offline startup. Third-party draft policies still finish registration before editing becomes available, preserving their write semantics.

## One-time transition from older builds

Save open edits, close all Phosphora tabs/installed windows, then reopen online. If the old worker has just fetched an update, closing all old clients allows it to activate. Verify 0.2.0 in Settings. Subsequent releases show an Update action. Do not clear site data or uninstall to force an update.
