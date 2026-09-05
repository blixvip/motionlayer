# Contextual motion graphics

The graphics planner now interprets subjects and actions before choosing an illustration. A public figure can lead to a sourced portrait and a statement composition; agent communication draws a network with moving message packets; a sandbox passage stages a boundary crossing or a blocked connection. Named products use real marks, and process passages become animated sequences of devices, icons, and labels.

The local Codex or Claude director receives the complete script and returns a validated visual description. Literal source mentions and evidence substrings ground subjects and steps. Unnamed groups remain concepts rather than portrait searches. Questions, negation, and uncertainty stay in the visual direction; model versions do not become statistics. A deterministic contextual planner remains available when the local model is unavailable.

The inspector exposes visual kind, action, diagram labels, and a person/brand lookup. Existing content locks protect these fields. Asset lookup results are applied only to the scene that requested them. Script-backed headlines are editable, and source text and timing remain intact.

## Assets and exports

`lib/graphics/entity-assets.ts` resolves exact Wikipedia/Wikidata identities, checks that portrait subjects are humans, checks reusable Commons licenses, and freezes bounded PNG downloads locally. Bundled OpenAI, Claude, Grok, Twitter, and Bernie Sanders assets have source receipts in `public/motion-assets/entities/catalog.json`. Missing or ambiguous images retain a labeled symbol.

Compiled previews and exports include local images, fonts, TSX, CSS, and `assets/entities/credits.json`. Portrait credits remain visible. The code inspector and editable ZIP include `Explainer.tsx` and `explainer.css`; the rebuild script copies both CSS files. No asset search or network call occurs during rendering.

All motion is calculated from composition time. The network packets follow their actual quadratic connection paths. Vertical compositions use their own diagram geometry. Background planes, portraits, signals, nodes, and devices enter in stages before the depicted action occurs.

## Verification

- 101 tests pass, including source timing, named people, anonymous groups, model-version handling, negation, locks, asset path containment, reusable-license checks, and the strict local-model response schema.
- Production build passes.
- The user's complete 150-second script was interpreted by the real local Codex provider into 33 cues, including 27 explanatory scenes, and saved as `gp_user_semantic_story_v3`.
- A five-scene 1080 × 1920 reel was rendered through the editor and durable worker: H.264, 30 fps, 750 frames, 25 seconds. The portrait composition passed layout, contrast, and runtime validation without findings.
- Manual browser checks exercised subject lookup, draft/discard behavior, scene selection, and rendering.
- All 33 full-script cue samples passed layout, contrast, and runtime checks without findings. The landscape portrait was separately rechecked after reserving a grid row for its credit.
- The 43-file source ZIP was extracted and rebuilt successfully against the installed dependencies. The final production page was opened and playback verified at port 3010.

Visual review: the portrait remains identifiable, actual brand marks are distinct, messages follow their drawn connections, and the sandbox agent travels toward a separate internet target. Decorative geometry no longer shrinks the headings. The six new explanation types are ready for use; additional scene types can extend this vocabulary later.

Repeatable examples are in `scripts/semantic-story-demo.ts`; the local verification reel is `data/semantic-story/semantic-story.mp4`. `scripts/semantic-full-script.ts` processes the preserved local input in `data/semantic-story/original-script.txt`.

This expands the available visual language to six editable explanation types. It does not synthesize arbitrary animated scenes or guarantee an image for every named subject.

## Actual asGenerator source integration

The motion renderer now imports the user's real asGenerator factory and its generated profile/card/alert components. Material surfaces follow the depicted objects. Verified local imagery is available in the initial preview, repair and replacement controls are explicit, and missing requested subject images block export. Repeated mentions retain their individually chosen photos. See `docs/asgenerator-integration.md` and `data/as-generator-verification` for the current source chain and verification evidence; they supersede the earlier integration counts above.
