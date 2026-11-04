# 0.5.0: folders, camera and daily interaction

The starting point is the newer GitHub main, including its visual editor and folder plugin. The older S: checkout was not used as the implementation base.

## Navigation

- Folder focus uses an absolute camera destination and a shared bounds-fit calculation. The former reveal helper could neither zoom out nor guarantee centering, which made folder focus ineffective.
- Cluster taps fit all original member positions, including room for labels and the mobile header/footer. Folder/All actions return to the main field before framing.
- A logarithmic zoom slider remains available on phones. Its lower endpoint frames the entire current map; intermediate folder/group scales snap back to their corresponding center. While dragging the slider, the thumb follows input rather than the lagging animation.
- Two short taps on empty space zoom towards that point; at maximum zoom they return to the full overview. Long press, lasso, pinch and atom gestures retain their own paths.

## Folders

- The mechanism is available in a new workspace, but its strip is absent until folders exist or multiple notes are selected. The strip can collapse. Creation is offered by a small plus for a selection and the existing plugin context action.
- Holding/right-clicking a folder exposes name/color editing, adding the selection and deleting the folder. Deletion removes its definition, never its notes. All changes use ordinary revision-checked Plugin API atom writes.
- Drop a note or lasso selection on a folder tab to add it. The temporary drag is cancelled before committing membership, keeping the notes out of the toolbar and avoiding an accidental relationship.
- New notes created in an active folder keep a parent context. Context-menu creation uses parent-aware placement; long press retains the chosen world point, with local physics making room. Contextual descendants inherit membership in the draft transaction.
- The earlier directed branch link wins when branches meet; another folder's explicit root is a traversal boundary. Explicit multi-folder roots remain supported. Ordinary cross-links do not absorb a branch.
- Folder projections also refresh after bulk import. Position events do not scan an empty folder set; duplicate host refreshes are avoided for coordinate-only changes.
- Territories use quieter fill and outline opacity.

## Physics, writing and tasks

- Insertion releases only bounded local resistance and wakes the backbone of spatially contacted branches, so they can make room instead of freezing the new offshoot against a stationary boundary.
- Neighbor drag response uses damped motion towards weighted targets, with bounded per-frame displacement. Held atoms remain direct; pins stay fixed. Existing cancellation, failed-commit recovery and settling remain in place.
- The optional Liveliness slider changes presentation only. It respects reduced motion, pauses with interaction/surfaces/hidden tabs and does not write drifting coordinates.
- Background transforms keep a continuous origin during zoom; SVG handles repetition without changing the transform by whole tiles.
- Small maps retain their fine links across selection instead of replacing the visible cycle edges.
- State and importance are directly available in the editor. Importance has three more distinct visual sizes; the duplicate size input is removed, while existing imported overrides remain supported. Editing importance returns that note to automatic sizing.
- Visual/Markdown/Preview controls wrap as one segmented row. The visual field has no bright focus frame. Formatting preserves editor focus; accessibility updates do not emit text changes, and active documents are not reset by parent echoes while typing. Source preservation, wiki links and unsupported Markdown blocks remain supported.
- The pause creation control is removed from Additional; legacy paused notes can still resume. Daily notes start in the normal field.
- Completing a checklist does not archive its note. Kanban offers an explicit archive/keep choice after all one-off tasks are done. Cards, task rows and recurrence details are more compact.
- Notices use theme surfaces, take only the width they need and dismiss after 3.8 seconds. Durable deletion undo remains in the menu.

## Validation and limits

Unit checks cover camera bounds, earlier-parent ownership, root boundaries, plugin add/rename/delete, spring response, persistence recovery, daily state and background transforms. Browser checks exercise mobile folder fit/collapse/rename/delete, zoom slider, double tap, cluster fit, visual/source editing, voluntary archive, nonpersistent drift and folder drop, plus existing gesture, relationship, theme and task-board scenarios.

Desktop Chromium/Firefox automation validates behavior and data, not the frame rate or keyboard feel of a physical Nothing Phone 1. No SQLite schema migration or Plugin API permission expansion is required by this release.
