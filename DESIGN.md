---
name: MotionLayer
description: An indigo-charcoal editing suite for reference-led, dimensional motion graphics.
colors:
  studio-ground: "#141418"
  studio-panel: "#1b1b21"
  studio-line: "#303039"
  studio-text: "#ececf1"
  studio-muted: "#9898a7"
  studio-focus: "#c6c6e4"
  build-action: "#dddded"
  build-action-hover: "#ededf8"
  build-ink: "#1d1d2b"
  graphics-ground: "#19191f"
  graphics-panel: "#202028"
  graphics-control: "#24242d"
  graphics-control-hover: "#32323e"
  graphics-line: "#3c3c49"
  graphics-field: "#18181e"
  graphics-text: "#ececf2"
  graphics-muted: "#a6a6b8"
  graphics-action: "#d4d4e8"
  graphics-action-hover: "#e8e8f4"
  graphics-action-ink: "#20202c"
  selected-panel: "#30303d"
  reference-sample: "#4a4a8f"
  frame-ground: "#111122"
  frame-ink: "#efeff3"
  frame-accent: "#8f8fd6"
  frame-secondary: "#212159"
  legacy-ink: "#090b0d"
  legacy-panel: "#101316"
  legacy-line: "#2a3035"
  legacy-text: "#eef1eb"
  legacy-muted: "#929a98"
  legacy-registration: "#c8ff3d"
  legacy-danger: "#ff6b66"
  legacy-accepted: "#6da9ff"
  legacy-suggested: "#d9a858"
typography:
  display:
    fontFamily: "Studio Condensed, Barlow Condensed, sans-serif"
    fontSize: "clamp(40px, 4.4vw, 68px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  frame-display:
    fontFamily: "Motion Display, Barlow Condensed, sans-serif"
    fontSize: "calc(12cqw * var(--mg-type))"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.025em"
  frame-accent:
    fontFamily: "Motion Accent, Instrument Serif, serif"
    fontSize: "1.14em"
    fontWeight: 400
    letterSpacing: "-0.03em"
  script:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "15px"
    lineHeight: 1.75
  body:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "13px"
    lineHeight: 1.5
  label:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "12px"
  legacy-display:
    fontFamily: "Space Grotesk Variable, sans-serif"
    fontSize: "clamp(42px, 5vw, 68px)"
    fontWeight: 570
    lineHeight: 0.96
    letterSpacing: "-0.045em"
rounded:
  field: "3px"
  control: "5px"
  format: "6px"
  panel: "10px"
  specimen: "12px"
spacing:
  small: "8px"
  control: "12px"
  panel: "20px"
  stage: "24px"
  section: "32px"
  column: "40px"
components:
  button-build:
    backgroundColor: "{colors.build-action}"
    textColor: "{colors.build-ink}"
    rounded: "{rounded.format}"
    height: "48px"
  button-build-hover:
    backgroundColor: "{colors.build-action-hover}"
  button-primary:
    backgroundColor: "{colors.graphics-action}"
    textColor: "{colors.graphics-action-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.graphics-action-hover}"
  button-secondary:
    backgroundColor: "{colors.graphics-control}"
    textColor: "{colors.graphics-text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
    height: "36px"
  field-script:
    backgroundColor: "transparent"
    textColor: "#e4e4ed"
    typography: "{typography.script}"
    padding: "18px 20px"
  field-inspector:
    backgroundColor: "{colors.graphics-field}"
    textColor: "#e4e4ee"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "8px"
  chip-profile:
    backgroundColor: "{colors.studio-panel}"
    textColor: "{colors.studio-text}"
    rounded: "{rounded.control}"
    padding: "10px 8px"
    height: "38px"
  card-storyboard:
    backgroundColor: "transparent"
    textColor: "{colors.graphics-text}"
    padding: "18px 10px"
  card-storyboard-selected:
    backgroundColor: "{colors.selected-panel}"
    rounded: "{rounded.control}"
  reference-upload:
    backgroundColor: "transparent"
    textColor: "#c6c6d5"
    rounded: "{rounded.format}"
    padding: "13px"
---

# Design System: MotionLayer

## Overview

**Creative North Star: "The Indigo Motion Atelier"**

MotionLayer pairs a quiet indigo-charcoal editing suite with expressive authored frames. Hairline divisions, pale actions, and compact workhorse typography support script writing and scene revision. The moving artifact carries the atmosphere: a reference-derived hue, tinted texture, asymmetric depth, and a large serif-italic accent within condensed display type.

This is the explicit replacement identity for Script Studio, Graphics Studio, and newly authored motion graphics under direction seed `3ee87bc2`. It supersedes the old lime studio, centered one-field composer, and global three-template frame doctrine. The unrelated locked-video editor, dashboard, authentication, and Creator Style Library keep their incumbent registered-acetate behavior and visual guidance below; their legacy tokens are scoped compatibility values, not the identity for new studio surfaces. Existing projects and source footage are preserved.

**Key Characteristics:**

- Indigo-charcoal chrome with pale actions and precise, visible focus.
- A large playable artifact beside script authoring on desktop.
- Reference-derived frame color with textured gradients and off-center depth.
- Condensed display type with one large colored serif-italic accent word.
- Real, locally bundled assets and editable semantic text.
- Native portrait composition and deterministic preview/export motion.

The scan authority is `components/script/studio-redesign.css`, `components/graphics/graphics-workspace.css`, and `packages/graphics/{Graphic.tsx,graphics.css,design.ts,runtime.tsx}`, with the surface contract in `.impeccable/briefs/motion-design-rebuild.md`. Later scoped overrides take precedence over older declarations. This document records the implementation and approved direction; it does not assert a final visual-review pass.

## Colors

The suite is neutral with an indigo cast; authored frames have visibly stronger chroma, derived from a real reference.

### Primary

- **Pale Studio Focus** (`colors.studio-focus`) connects active navigation, keyboard focus, selected text, and quiet utility actions.
- **Build Action** and **Graphics Action** are separate observed pale fills for the composer and scene editor. Their hover tokens increase exposure.
- **Sampled Indigo** (`colors.reference-sample`) is the archived reference sample, not a fill to apply indiscriminately. `paletteFromAccent` derives the four default frame roles in the frontmatter.

### Secondary

- **Frame Accent** carries the serif-italic word, baselines, and authored emphasis. **Frame Secondary** gives the ground its colored shadow side.
- Legacy accepted blue, suggested amber, and rejection red retain evidence-state meaning in the locked-video editor.

### Neutral

- **Studio Ground / Panel / Line** establish the composer hierarchy; **Studio Text / Muted** separate authored input from support.
- **Graphics Ground / Panel / Control / Field** distinguish storyboard, proof, inspector, and editable wells. Use the observed graphics tokens inside that workspace.
- **Frame Ground / Ink** are hue-related render colors. They are independent of application chrome.
- Every `legacy-*` token is limited to existing editor, library, dashboard, and authentication surfaces.

**The Reference Hue Rule.** Script keywords never select a hue. New work uses the archived sample or a sampled user reference; the inspector may explicitly revise the palette.

The image picker accepts PNG, JPG, or WebP up to 3 MB. It shows sampled swatches and a removal action; ambiguous sampling reports the studio-reference fallback. Sampling is heuristic, not a claim of perfect color analysis. New plans carry one palette through the edit; manual scene edits are deliberate exceptions. The light mode is computed by the same palette function, not a separate keyword palette.

## Typography

**Display Font:** Barlow Condensed SemiBold, locally named Studio Condensed in the app and Motion Display in graphics.  
**Accent Font:** Instrument Serif Italic, locally named Motion Accent.  
**Body Font:** Manrope Variable; Motion Humanist in exported graphics.  
**Legacy Display / Readouts:** Space Grotesk Variable; Motion Grotesk in exported metadata.

The display voice is tall and compact; a colored italic word opens the rhythm and gives each frame a focal point. Controls remain plain and readable. Font files and OFL licenses are recorded in `03-assets/NOTES.md` and `03-assets/brand/`; use actual glyphs rather than rasterized text.

### Hierarchy

- **Display** defines the studio introduction; the mobile heading uses its observed 46px override.
- **Frame Display** scales with the composition container and the authored type scale. Headline variants change size for title, statistic, comparison, steps, quote, and product families.
- **Frame Accent** is italic in addition to its frontmatter properties. The last displayed word receives this treatment.
- **Script** is spacious reading copy within the editor field.
- **Body / Label** keep the graphics inspector compact; source context permits up to 65ch.
- **Legacy Display** remains available for existing authentication/dashboard identity moments. Space Grotesk readouts and Manrope evidence retain their established roles.

**The Accent Word Rule.** Keep the colored serif-italic accent inside a short, readable display phrase; preserve real word boundaries when the phrase wraps.

The renderer uses source-backed excerpts, usually up to eight words. The full source remains inspectable. Statistic rendering removes a repeated source value from the surrounding headline/detail and avoids duplicating identical supporting copy; it never invents a replacement statistic.

## Layout

Script Studio uses a 1600px maximum workspace with 4vw side gutters. Desktop columns are `minmax(340px,.78fr) minmax(0,1.22fr)` with a 40px gap. The script and immediate Build editable graphics action occupy the left; art direction follows them. A large, sticky playable specimen occupies the right. This first-surface composition belongs to the linked brief, not every MotionLayer page.

At 1000px the gap contracts and columns balance. At 760px the composer stacks: script, build action, example specimen, then art direction. The specimen becomes static and keeps an explicit Example render label. The specimen wrapper changes from 16:10 to 16:11 on wide desktops and 16:9 on mobile; the video always contains its actual frame without cropping.

Graphics Studio uses a 190px storyboard, fluid proof, and 285px inspector. At 1100px side columns contract to 140px and 250px; at 820px the storyboard becomes a horizontally scrollable strip above proof and inspector. The native frame scales uniformly. Portrait width is capped by available space and the smaller of 420px or 75vh multiplied by the native aspect ratio.

The motion world reorganizes at a container aspect ratio of 1:1: title copy occupies the upper region, the conformed hero shifts below/right, and comparison, steps, statistics, and product compositions stack with their own hierarchy. It is a native portrait layout, not a cropped landscape frame. Runtime measures settled content once per edited scene and reduces the type scale only when needed to fit.

### Preserved legacy surfaces

The locked-video editor retains its 50px top bar, 256px timeline, and desktop 58px tool rail / 250px source panel / fluid canvas / 300px inspector. Below 1080px the fixed rails contract; below 820px source transcript hides, canvas and inspector stack, the 48px tool rail persists, and the timeline scrolls at its 760px minimum width. Selection, evidence, bounds, and timing remain synchronized.

The dashboard retains its centered 1220px column and row-based project list. Creator Style Library retains its 1120px column, identity-led ruled profiles, three-column trait band, collapsible prompts, and one-column mobile layout below 760px. Its real source-backed profiles, empty state, and manual-copy recovery remain authoritative.

## Elevation & Depth

Chrome uses adjacent tones and hairline divisions. The specimen and proof receive restrained projection shadows; ordinary controls and panels do not become floating cards. Authored graphics intentionally use more depth: tinted gradient ground, deterministic grain, cast shadow, an off-center conformed object when semantically relevant, legible foreground copy, cropped edge material, and vignette.

### Shadow Vocabulary

- **Specimen projection** (`0 26px 65px #08080c55`) separates the playable work from the composer.
- **Graphics proof** (`0 18px 42px #08080e44`) seats the native composition in its preview bay.
- **Legacy source plate** (`0 16px 42px #000`) and **legacy login plate** (`0 32px 80px rgba(0,0,0,.48)`) remain scoped to existing surfaces.
- **Legacy action proof** (`0 6px 18px rgba(135,179,28,.14)`) and **transient lift** (`0 12px 30px #0009`) remain legacy exceptions.

**The Shared Light Rule.** Conform authored assets to the scene palette and one left/top light direction; preserve source footage unchanged.

The layered ground uses a reference-tinted radial light at 80% / 20% over a diagonal secondary-to-ground gradient, plus deterministic noise. The original paper airplane is used only for semantically relevant idea/share/send/flight beats. Its alpha, original prompt, and conform record are in `03-assets/conform.md`; reference images are study-only and never shipped as footage.

All frame motion is seek-driven: eased entrance, staggered words/objects, restrained camera drift, and authored holds share the preview/export clock. The layer entrance uses quartic ease-out; word entrances are staggered by 65ms. Shader materials remain inside the authored frame and product demonstrations. Reduced-motion preferences disable studio UI animation and transitions; they do not rewrite the user's exported motion composition.

## Shapes

The new suite has softly squared control corners, larger bounded script panels, and a slightly rounder specimen frame. Use the frontmatter radius roles. Dashed borders identify reference upload, not generic decoration. Selected storyboard entries combine tonal fill and an inset outline; selection is not communicated by color alone.

Authored frames use scale-relative curved panels, cropped objects, and blurred edge forms when the content needs them. These expressive frame forms do not prescribe the shape of editor chrome. Legacy registered plates, rails, safe guides, protected regions, and timeline cues keep their squared, low-radius geometry.

## Components

### Buttons

Build editable graphics is the immediate, full-width action beneath the script. It is unavailable for fewer than 12 trimmed characters, while a reference is sampling, or while a storyboard is building. The disabled state stays in place with a muted fill; hover uses a one-pixel lift and the observed pale hover color. Load example script remains a small utility in the script footer.

Graphics Studio uses the primary variant for Save scene and Render graphics; Back, Discard changes, Undo, and alternatives are secondary. Buttons have a 36px minimum height. Keyboard focus is a 2px pale outline with 3px offset in graphics, preserving a distinction from selected-scene outlines.

### Chips / Choices

The three existing visual-grammar choices use compact rectangular buttons with `aria-pressed`. The selected choice receives a tonal fill and stronger border. These controls retain their names and planning roles; they do not override the Reference Hue Rule. Format choices expose 16:9 and 9:16 with labels, icons, and selection indicators.

### Cards / Containers

The script panel has a visible label, timing basis, resizable textarea, character count, and example-loading action. Storyboard cards are stacked, ruled scene buttons with a scene number, time range, headline, family, and layout; selection adds the dedicated panel tone and inset outline.

The example specimen is a real locally rendered video with native playback controls. Its caption identifies it as an example render even on mobile. It is not represented as the output of an unsubmitted script.

### Inputs / Fields

The script permits 5,000 characters. Art direction keeps density, motion energy, and a 280-character creative note alongside the reference picker. Reference upload uses a real file input and a visible focus-within boundary; fallback/error messages remain local.

Inspector fields expose source content, family, layout, real material/type controls, palette, timing, and protected placement. Content, style, and timing locks disable corresponding controls. Native disclosures group advanced material, timing, source/spec, implementation, and provenance content.

### Navigation

Script Studio keeps a compact brand header and direct Script studio / Creator styles links. Active navigation has a pale one-pixel underline. The desktop header is 78px; at 760px it becomes 64px with reduced label sizes and hidden navigation icons. Existing library and locked-editor navigation retain their established route and registration behavior.

### Editable Graphics Studio

Preview updates immediately with unsaved edits. Scene switching and rendering require a save or discard; Discard changes restores the saved scene, clears its browser draft, and announces the restoration. Preview and export share the authored React modules and native dimensions. Implementation code reveals those actual modules; the source ZIP includes editable TSX, local assets, and licenses.

Contextual scenes stage a subject, relationship, and visible action: sourced portrait and public statement, brand stations, message networks, restricted boundaries, or a sequence of devices. Text labels explain the action. The established indigo and charcoal palette remains shared across a script. Portrait output uses native vertical layouts; large portraits retain readable credit space. The inspector exposes editable subjects, actions, and labels, with source links for verified imagery.

### Preserved legacy patterns

Creator profiles keep real linked YouTube identity, transcript counts, source-backed summaries, traits, complete skills, and independently copyable prompt modules. Copy full skill remains the legacy primary action. Never fabricate identities to fill an empty library or merge creators' evidence. Clipboard failure exposes the exact requested text in a read-only, focus-to-select field with local recovery feedback.

Locked-video transcript rows keep fixed timecodes and a selected registration bar. Timeline cues retain suggested/accepted/ready/rejected state colors underneath their selection outline. Prompt revision preserves scope, source evidence, copy, timing, protected regions, and explicit interpretation before Apply revision. These behaviors remain binding outside the replacement studio world.

## Do's and Don'ts

### Do:

- **Do** derive frame hue from a real reference and keep one coherent palette across new work.
- **Do** give the playable artifact room while keeping script input and its build action adjacent.
- **Do** use short semantic display text, one colored italic accent word, and intact word boundaries.
- **Do** conform original or licensed local assets to the frame's palette, lighting, grain, and crop.
- **Do** compose portrait output natively and preserve deterministic preview/export timing.
- **Do** retain source evidence, protected footage, keyboard focus, and reversible scene edits.
- **Do** preserve unrelated legacy editor and creator-library behavior in its existing scope.

### Don't:

- **Don't** reintroduce the rejected lime identity into Script Studio, Graphics Studio, or new motion frames.
- **Don't** choose colors from script keywords or treat archived reference pixels as shipping assets.
- **Don't** flatten authored depth into a full-sentence template or put motion atmosphere into every control.
- **Don't** present an example render as the user's output or duplicate a statistic in its adjacent copy.
- **Don't** crop landscape into portrait, rasterize editable copy, or overwrite locked source footage.
- **Don't** invent controls, source claims, licenses, customer identities, or a final-review verdict.

### asGenerator component and image integration

Contextual scenes use the actual local asGenerator factory and generated profile, card, and alert modules. Portraits combine a full image with a restrained attribution gradient. Statement cards connect to a separate action. Shader materials belong to the relevant object while retaining a readable unshaded foundation. Image readiness appears beside the preview, with repair and replacement controls; unresolved requested imagery blocks export with a repair path.
