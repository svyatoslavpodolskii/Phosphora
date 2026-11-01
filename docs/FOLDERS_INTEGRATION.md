# Folders phase: host integration

The implementation is optional and uses only the existing public Plugin API. No
App, Map, Editor, database, runtime or sandbox changes were made for this phase.

## Register once per runtime/workspace

```ts
import {createFoldersPlugin} from '../plugins/folders';
import {folderTerritories} from '../graph/folders';

const {plugin, controller} = createFoldersPlugin({
  getSelection: () => selectedRawAtomIds,
  requestCreate: ids => folderStrip?.beginCreate(ids),
  changed: projection => {
    folderProjection = projection;
    if (projection === null) activeFolderId = null;
  },
  focus: ({bounds, center}) => frameExistingWorld(bounds, center),
});
```

Add `plugin` to the host's builtin list and expose the normal enable/disable toggle
under `builtin.folders`. Add it to the optional/default-disabled list if that is the
desired rollout. Retain this same factory instance across disable/re-enable.
`links.write` is requested only because the public draft-policy registration contract
requires all four atom/link read/write permissions; this plugin never writes links.

## Mount and wire

Only mount while `folderProjection !== null` and the map surface is visible:

```svelte
<FolderTerritories
  territories={territories}
  {camera} {width} {height}
  activeId={activeFolderId}
/>
<FolderStrip
  bind:this={folderStrip}
  folders={folderProjection.folders}
  selectionIds={selectedRawAtomIds}
  bind:activeId={activeFolderId}
  oncreate={controller.create}
  onfocus={controller.focus}
/>
```

- Expand rendered clusters into original atom IDs before supplying selection IDs.
  The context action captures those IDs and opens the strip's naming form. It does
  not create anything until the user submits. A single context atom is a fallback.
- Compute `territories = folderTerritories(folderProjection, liveAtomPositions)` on
  projection/position changes, not on every camera frame. Positions are world
  coordinates `{id,x,y,radius?}`. For a collapsed cluster, supply each constituent
  atom ID at that cluster's current rendered position. Never feed `cluster:*` IDs.
- Place territories behind the node canvas. The SVG has `z-index:0` and no pointer
  events; the host must ensure its node canvas is above it. Keep its origin and
  viewport dimensions identical to the map. The transform is
  `translate(width/2 + camera.x, height/2 + camera.y) scale(camera.zoom)`.
- Folder/All focus is an ordinary callback returning `{folderId,center,bounds}` in
  world coordinates. Feed bounds to the existing camera fit behavior with suitable
  padding for chrome. Never filter atoms, change the lens, move notes or create a
  separate world. Unknown/empty targets return `null` without a focus callback.
- Strip position defaults to 88px desktop / 128px mobile. Override
  `--folder-strip-top` on its parent if existing chrome needs different clearance.
- Disable sends `changed(null)`, unregisters context action/command/event listeners
  and draft policy, and suppresses pending presentation callbacks. Unmount both
  components and clear local active folder state; no stored data is removed.
- The host may call `controller.refresh()` after replacing/importing a snapshot or
  workspace. Dispose the old runtime before binding a different workspace.

## Data and semantics

`builtin.folders.definitions` is an array of `{id,name,color,roots}` on the first
selected ordinary note. Folder creation performs one revision-checked public atom
update, preserving unrelated properties. It creates no extra graph nodes, tables,
files, links or positional mutations. Names are plain text and colors validated hex.

`builtin.folders.membership` stores a weight map on newly created contextual
descendants through the public draft policy, committed atomically with their draft.
Explicit imported/caller-supplied membership takes precedence. Existing directed
`source:context` or `relation:grouped` branches inherit full root strength at any
depth. Ordinary related/manual/automatic/Markdown cross-links do not convey branch
membership. Overlapping strengths normalize per note; input snapshots are unchanged.
Notes created while disabled are projected from their branch links on re-enable.

## Bounded work and phase limits

- At most 64 projected folders, 4096 selected seed IDs per creation, 80 name
  characters, and 24 hull support directions per territory. Traversal is iterative
  and handles deep branches/cycles. Projection costs O(F*(V+E) + F*V log V) in the
  worst case because durable weighted seeds are ordered by strength. Geometry costs
  O(24*memberships); SVG output stays at 128 paths maximum overall.
  Offscreen territories are culled. Camera frames only transform
  existing paths; there are no timers, physics providers or SVG blur filters.
- Hulls are rounded convex envelopes. Distant islands can share one large territory;
  there are no density contours, holes or concave subdivisions in this phase.
- Definitions live on their owner note. Deleting that note removes its folder
  definition; no independent registry/re-homing is implemented. Undoing that deletion
  restores it through the existing atom recovery behavior.
- Draft-inherited weights are durable associations and remain after branch detach.
  Branch projection is recomputed dynamically, but this phase has no membership
  editing, folder rename/remove UI, automatic pruning or detached-member cleanup.
- Controller focus uses the latest public atom coordinates. If animated positions
  differ, the host may frame live bounds instead for an exact animation-time fit.
- The 4096-seed cap is an upper bound. Core's existing 100 KB property limit may
  reject a particularly large definition; that public update fails without a partial
  folder write. The naming form displays the error.
- Concurrent folder creates through this controller are rejected. External atom
  edits use revision conflicts rather than overwriting unseen property changes.

## Validation

`npm test -- tests/folders.test.ts tests/folders-plugin.test.ts`: 18 tests pass,
covering public-runtime persistence/lifecycle, draft rollback, selection handoff,
overlap, directed branches, cycles, 5000-depth traversal, bounded paths, and camera
convention. The two Svelte components also compile independently. An isolated browser
preview rendered the strip and territories; click interaction verification was
inconclusive because the browser tool timed out waiting for stable geometry.
No integrated app build or end-to-end deployment claim is made by this phase.
