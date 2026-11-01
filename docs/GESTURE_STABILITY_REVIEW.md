# Posphorea 0.3.0: gesture and structure repair

## Reproduced causes

- The reveal effect read the reactive camera through revealCamera(). A persistent request to show a newly created atom could replay on every camera change, fighting manual zoom/pan. Track only the explicit request; read the camera/data with untrack. The existing far-zoom integration test exposed this failure and now passes.
- The old defaults migration disabled lasso even though the gesture was documented. A one-time lasso-default-v2 setting repairs that default. Subsequent explicit disabling stays disabled. The tool remains registered through Plugin API.
- Pointer tracking depended on the buttons bitmask rather than captured pointer identity. Active touch now uses the pointer registry. Native Chromium touch and desktop Firefox synthetic zero-buttons events are separate tests; neither is a physical Android measurement.
- Selection centroids were reconstructed from potentially stale persisted coordinates. beginDrag returns the current body centroid; direct manipulation uses that frozen origin, including group selections. Cluster selection highlights/membership resolve through member IDs.
- Painted atoms and curves could use different presentation coordinates. Map curves now use the same painted node positions; semantic endpoints no longer add a second positional interpolation. Relationship hit testing/editor uses the same bounded edge geometry.
- Model changes used weak persistent physics targets. They now apply the structural provider's validated coordinates in a bounded 380 ms transition (immediate with reduced motion), persist the final positions and rest. A gesture interrupts at the current presentation position and saves it; no later snap-back. Pins remain fixed.
- Restored maps could wake physics on startup, and enabling a non-motion plugin could wake it again. Initial snapshots rest; only content/structure changes request motion. Captured rest lengths are actually used for later local relaxation.

- Wheel anchors are rebased to the current presentation when the cursor moves. Distant fit/focus flights interpolate viewport centers and zoom together, with bounded animated steps; live finger tracking bypasses these animation bounds. Release uses a quieter cadence rather than inheriting stream acceleration. Opening a transient surface halts the camera, so closing it cannot restore an older camera over a still-running background flight.

## Interface

Removed drag state-drop zones. State changes stay in the atom/selection menu. Connection handles appear only after the explicit Connect action, and disappear during map gestures. Header, footer, notices and detail previews yield during drag/lasso. The hold gives one progress ring/haptic acknowledgement instead of looping waves and instruction text.

Map footer has the three lenses; Kanban is in the main menu, with Field as its return action. Full text previews are limited to the selected atom and open the text directly when tapped. State captions are limited to explicit selection. Advanced importance controls are behind a disclosure, and a group has one pause/resume action instead of contradictory repeated actions. View bounds are fitted once after an explicit model change when needed; touching the map cancels that pending fit. Saved startup camera positions are retained.

Hit regions are built lazily once per presented frame rather than once per pointer event. GPU texture and overlay work-count regressions remain in place; no rendering-quality switch is tied to a gesture.

## Verification

164 unit tests, Svelte checks and production build. Browser coverage includes native one-finger hold/trace, shift lasso, selected-group movement/actions, pinch interruption, workspace deletion, explicit relationship creation/reconnection/undo, camera navigation, renderer/context loss, retained texture counts, default migration, offline persistence, editor checkpoints and real Service Worker activation. A model-cycle test repeatedly switches Constellations/Molecule/Branches, verifies stable positions/link identities and exact stored coordinates after reload. Zero-buttons touch fixtures also capture the quiet selection/drag states. The stress recorder measures the projected displacement of the prior viewport center, not raw camera translation (which changes under anchored zoom). Its driver stays camera-only; dedicated native-touch tests verify intentional atom/group moves. The coast regression now uses measured incoming velocity and includes the first release frame. LOD checks explicitly cross the zoom band and assert the correct 35-tree fixture overview (280 topology groups), rather than reusing the smaller 17-tree fixture bound.

The tests use local isolated origins. Existing user storage paths, SQL schema and Plugin API contracts are unchanged. No physical Nothing Phone 1 is connected; real-device keyboard, compositor and frame pacing still require device confirmation. No claim of Apple-equivalent polish or universally perfect frame rate is made from desktop tests.
