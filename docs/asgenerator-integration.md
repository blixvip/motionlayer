# MotionLayer and asGenerator

MotionLayer executes the user's actual asGenerator factory and mounts its generated profile, card, and alert modules inside contextual motion scenes. The earlier integration carried over design ideas and shader adapters. This integration includes the generator implementation and its exported component source.

## Source chain

`scripts/sync-as-generator.mjs` reads `AS_GENERATOR_SOURCE`, or the local `as-generator` checkout. It copies the exact `src/generator.ts` into `packages/graphics/as-generator/engine.ts` and invokes its real `sourceBundle()` function. The exact SHA-256 and acquisition receipt are in `packages/graphics/as-generator/receipt.json`.

The exported modules receive typed image, material, and children slots; empty demo actions are omitted; actual subject images replace demo initials. The original catalog refers to shadcn anatomy. These are the user's sourceBundle outputs, not installed shadcn components. The original checkout stays independent and is not required by a deployed app or source export.

`bridge.ts` calls the imported `generateSpec()` and maps each scene's palette, finish, radius, copy, and material parameters. `motion.css` provides native video layout, typography, photo treatment, and spatial relationships. The unshaded foundation remains readable and complete.

## Image readiness

- Creation fills verified bundled and cached images before returning the initial preview. Known subjects do not wait for the local model.
- Stored receipts are checked against the actual file and content hash. Missing or corrupt files trigger resolution.
- Concepts do not consume lookup slots. Repeated subjects preserve different photos chosen for individual scenes.
- Exact identities resolve through Wikipedia/Wikidata and licensed Commons images. The bundled catalog includes Bernie Sanders, OpenAI/ChatGPT, Claude, Grok, Twitter, and Discord.
- Repair images checks the plan and saves a reversible revision. Add image / Replace image accepts bounded PNG, JPEG, and WebP uploads.
- Missing imagery is labeled in preview. Export identifies unresolved people and brands and requires image repair.

Automatic lookup cannot guarantee an image for every name. Source links and supplied-image controls provide an explicit recovery path.

## Shared motion and export

The editor iframe and video export use the same React implementation. A person leads into an attributed statement and response; brand marks occupy dimensional cards; messages traverse network paths; an agent crosses a sandbox boundary; process stages connect as separate devices.

Paper Shaders 0.0.80 supplies actual Gem Smoke, Neuro Noise, Pulsing Border, and Liquid Metal fragment shaders under Apache-2.0. Materials occupy the relevant component surfaces. Only the active scene owns a canvas. Paper runs at speed zero and receives seek-derived time. Selecting none provides an unshaded preview. WebGL failure is a labeled preview fallback and a failed shader export.

Editable ZIPs contain images, fonts, generated TSX, the exact factory, CSS, receipts, locked dependencies, licenses, and a rebuild script. They contain no credentials, generated executable model output, or sibling-project imports. The detached worker validates images, layout, contrast, fonts, and runtime before exporting. Correctness warnings block output; old successful exports remain available.

Revision checks, save/discard/undo, and content/style/timing locks remain enforced. Uploaded source-video bytes and timing are preserved.

## Verification

The affected plan `gp_dfaef637-9f3e-4f23-b6b8-9a803ac70552` was upgraded from revision 2 to 3 with undo history. Its source text, 33 cues, and 150-second duration are unchanged. Seven named subjects have verified local imagery.

Evidence under `data/as-generator-verification/`:

- `upgrade-report.json`: revisions, unchanged source/timing, and image files.
- `api-report.json`: all five images in the first response, repair, upload/save/undo, and successful image requests.
- `full-story-check.json`: all 33 cues checked for layout/runtime, with sampled contrast.
- `unshaded-stills/` and `final-stills/`: actual composition captures. Final captures supersede intermediate shaded captures.
- `export-report.json`: completed video and clean source rebuild results.

Tests cover offline first-preview imagery, stale receipts, subject budgeting, actual generated modules, parameter mapping, invalid uploads, and per-scene photo preservation. Existing graphics tests cover source grounding, negation, locks, timing, and export contents. `scripts/check-as-generator-api.mjs` exercises the server; `scripts/verify-as-generator.ts` recompiles saved plans without modifying revisions.

## asGenerator delivery record

Generated: profile, card, and alert compositions in MotionLayer's contextual renderer; badge source accompanies the factory.

Component source/item/license: user's local `as-generator/src/generator.ts` and actual sourceBundle outputs; preserve upstream ownership. Hash and source references are recorded.

Shader source/item/version/license: Paper Design shipped fragment shaders, 0.0.80, Apache-2.0; LICENSE and NOTICE included.

Acquisition and dependencies: exact vendored factory and generated modules; React, React DOM, Lucide, Paper, Zod, esbuild, and HyperFrames locked in each ZIP.

Editable parameters: subjects, actions, labels, headline, palette, typography, surface finish, radius, material, intensity, speed, timing, and locks.

Shader purpose and placement: profile rim, card surface, or status border belonging to the depicted object.

Fallback and safeguards: readable unshaded components, labeled unavailable media, verified local files, explicit export errors, deterministic time, one active canvas, and source receipts.

Showcase states: native 9:16 and 16:9 scenes. The user's video formats take priority over generic component gallery dimensions.

Export test: actual ZIP rebuilt in a separate installation; see the completed `export-report.json`.

Browser/build verification: live repair and material editing, portrait/logo decode, production build, unit tests, full-story checks, and encoded output inspection. Validation covers the implemented scene vocabulary rather than arbitrary custom animation generation.

Final verification on 2026-09-04: 108 tests across 21 files pass; production build succeeds; the upgraded 33-scene story has no layout/runtime/contrast findings. The actual 25-second H.264 export contains 750 frames at 1080 x 1920 / 30 fps. Its 62-file source export installed 142 locked packages offline and rebuilt in a separate temporary directory. Clean-export runtime, layout, and contrast checks pass. Repeated out-of-order 12.8-second captures are pixel-identical. Production browser checks confirmed decoded portrait/logo images, one active shader canvas, persistent outline/radius edits, and encoded video playback.

## Supplied script timing

Timestamped scripts lock their scene start/end boundaries by default. Art direction, regenerated layouts, and ordinary content/style edits preserve those intervals. The workspace labels this state as Script timecodes locked. Untimed scripts retain editable estimated timing; explicit timing unlock remains available for intentional changes.

The 25-second asGenerator reel is a condensed visual example. The full user script is 150 seconds across 33 original intervals. `scripts/lock-script-timing.ts` verifies each interval against the saved source, locks it in a reversible revision, and writes an exact frame map in `data/script-timing-verification/timing-report.json`.

Full timing verification completed: plan revision 4 exports at exactly 150 seconds, 4,500 frames, 1080 x 1920, and 30 fps. All 33 start/end intervals in the actual source ZIP match the supplied script. One-second and final-cue frames were extracted for visual review. Files: `data/script-timing-verification/full-script-150s.mp4`, `full-script-editable-source.zip`, and `export-report.json`. The production workspace exposes the completed revision 4 video and source download.
