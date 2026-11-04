# 0.6.0 — kinetic controls and editable tasks

The zoom control is now `builtin.zoom`, using the public settings API. It rests at 25% opacity, wakes on input/focus, offers left/right/bottom placement and optional visual/haptic feedback at ten-percent slider intervals. Camera motion remains with the existing interruptible camera rig; ticks do not quantize the camera. Vibration depends on browser/device support. Reduced motion disables pulses and vibration. Folder strips stay anchored on collapse; creation is absent while collapsed. Folder/group framing leaves more surrounding space.

`builtin.kanban` owns persisted scale (0.8–1.15) and spacing (2–16 px). Disabling it returns to the field. Navigation retains its footprint across views. Recurrence is an inline icon opening the existing focus-trapped surface system, with keyboard/back/outside dismissal. Individual task removal retains unrelated Markdown, CRLF, IDs and recurrence history. A short undo uses the post-delete revision, rejecting restoration over newer edits.

Visual task items retain the portable `#task` marker as an attribute rather than rendered text. A small flag distinguishes board tasks from ordinary checkboxes. Enter inherits that attribute; Backspace at the beginning lifts the item into ordinary text. Mobile `beforeinput` paragraph/deletion events use the same commands when cancellable and not composing. Read previews hide only a marker directly following an actual checkbox, never prose or fenced code.

Backspace at the beginning of a formatted top-level block reveals that block's Markdown locally. Unsupported blocks also offer a local source editor. Escape/blur reparses supported single blocks; unsupported or multiple-block source stays editable without interpreting HTML. Other blocks retain session-owned original source. This is scoped block editing, not a complete implementation of Obsidian Live Preview.

Touch feedback uses bounded CSS transform/opacity waves outside the graph renderer. A stationary hold no longer schedules full graph frames for its glow. Movement, pinch and cancellation remove the feedback; reduced motion keeps a static hint.

Validation includes unit tests for settings bounds and task deletion; browser tests cover task Enter/Backspace, mobile beforeinput, local source editing, settings persistence, stable navigation, deletion/undo, gestures and reduced motion. Desktop Firefox and Chromium checks do not establish performance or vibration behavior on a physical Nothing Phone 1.
