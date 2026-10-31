# Graph motion review: PWA first

Reference: [Obsidian Graph View](https://obsidian.md/help/Plugins/Graph%2Bview). The public [Obsidian API repository](https://github.com/obsidianmd/obsidian-api) contains extension type definitions, not the built-in graph engine. This change implements independent improvements in Phosphora; it does not import Obsidian implementation or claim identical camera curves.

## Verified causes and changes

- The movement threshold was tested on every pointer event. Returning an already active pan/drag to its starting point fell back to hover handling, leaving the last displacement unapplied. Movement is now latched until release. Desktop and CDP touch return-to-origin scenarios exercise the regression.
- Camera publication now distinguishes the renderer's own reactive echo from external navigation. Immediate/reduced-motion targets are published even if the rig does not request an animation loop. Browser history and reduced-motion wheel zoom are covered.
- Label collision checks used a greedy all-pairs scan every frame. A spatial grid preserves the exact padding, order and acceptance decisions. A deterministic 1,000-label field changes 499,500 pair checks into 3,848 checks; randomized decisions are compared against the original algorithm. This measures algorithmic work, not phone FPS.
- GPU frames no longer build unused Canvas edge paths; Canvas frames do not build unused GPU edge records.
- Off-screen GPU sprites/textures are retained and reused when panning back. Least-recently-used off-screen entries are evicted above an estimated 64 MiB of texture pixels or 2,048 nodes. Visible entries are never evicted for the budget, so a larger visible working set can exceed those bounds. Actual graphics/Canvas overhead is additional. Context restoration and theme invalidation retain correctness.
- New atoms and their incident links fade in separately from camera-driven semantic reveal. A new link between two already visible atoms is not given a separate arrival animation in this milestone. Existing coordinates are unchanged; zoom reveal remains direct. Reduced motion displays arrivals immediately.

## Verification and limits

Typecheck and production build pass; unit coverage includes collision equivalence and semantic arrivals. Browser coverage includes GPU image consistency, fallback, context loss, cache reuse, history, pointer/touch return-to-origin and relationship editing. The image equality regression compares SHA-256 rather than printing megabytes of binary mismatch data; its exact-equality requirement is unchanged.

This is not a measured equivalence with Obsidian, nor proof of stutter-free behavior on physical phones. Hardware frame-time/input-latency comparison and further work on retained label/edge geometry remain necessary. Structural branching and existing document/plugin/storage semantics are preserved in this milestone.

Final verification: 156 unit tests; 11 browser regressions for rendering/navigation/relationships; two additional touch-emulation scenarios for 1,000-atom pinch and off-center focal-point retention. These pass on the final production build.
