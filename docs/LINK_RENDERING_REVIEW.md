# Phosphora 0.4.1: relationship rendering and drag recovery

## Cause and implementation

The retained GPU renderer still cleared and tessellated its combined Graphics path when edge width or alpha changed. Width was inversely proportional to zoom, and attention changed alpha during camera movement. Retaining atom textures did not remove this separate source of work.

Relationships now retain an indexed MeshSimple strip per stable edge ID. A quadratic is sampled at 25 points only when its control points change. Zoom adjusts the existing strip's width; opacity and theme color update the mesh independently. Each 50-vertex mesh remains eligible for Pixi batching. Shared white texture, bounded inactive cache and explicit geometry destruction avoid creating a raster texture per edge. Detail, cluster and background-cloud edges have separate identities. Canvas fallback keeps its existing drawing path.

Repeated relation captions previously covered the field at close zoom. Only the explicitly opened relationship now gets its caption; its action panel still exposes the full relation. Atom titles remain independent of this change.

## Persistence failure

If a drag commit fails, the controller restores that gesture's original positions and resistance, including a group. A subsequent drag invalidates an older recovery so a late write rejection cannot move objects out from under the hand. Camera activity alone does not cancel recovery. Errors still reach the existing visible error UI.

## Review and checks

- Curve tests check constant screen thickness across zoom, unchanged topology, finite short/vertical/reversed connections, and resampling after endpoint changes.
- Controller tests check group rollback and a delayed rejection arriving during a newer drag.
- Continuous pinch regression now uses 20 atoms **with 19 relationships**, rather than isolated atoms. Both directions record zero curve resampling, zero raster texture builds, zero input-overlay clears and zero idle draws during the measured interval.
- Renderer regressions cover theme refresh, offscreen return, software fallback, context loss and pixel stability. Relationship interaction tests cover create/reconnect/break/undo on desktop and touch.

These are correctness and eliminated-work checks. Software WebGL automation timings include CPU throttling and do not establish the frame rate on Nothing Phone 1. No device speedup percentage is claimed.
