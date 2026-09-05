# ADR 0001: Locked source, motion plans, and render artifacts

Status: accepted

## Decision

MotionLayer treats an uploaded master as immutable content-addressed input. A project points to one preserved source asset and derived proxy/audio/thumbnail assets; no timeline operation writes back to the source.

Video understanding and motion planning are separate records. A `MotionPlan` is validated JSON tied to a settings and prompt version. Each approved moment becomes a `MotionGraphic` with a stable key and immutable `GraphicVersion` records containing source evidence, generation instructions, HyperFrames source files, dependencies, and validation output.

The browser never performs production rendering. An isolated worker materializes approved assets in a project-scoped directory, invokes the pinned typed HyperFrames Producer API, and writes immutable `RenderArtifact` records with manifests. Composited and alpha outputs are separate artifacts produced from the same approved graphic versions.

## HyperFrames boundary

- Current verified packages: `hyperframes@0.8.19`, `@hyperframes/core@0.8.19`, and `@hyperframes/producer@0.8.19`; Node 26.7.0 and FFmpeg/FFprobe 9.0.1.
- Authoring contract: sized HTML composition root, timed clips via `data-start` + `data-duration`, one paused seek-safe GSAP timeline keyed to the composition ID, local assets, no clocks/random/network state.
- Gate: `hyperframes check` before render.
- Production execution: `createRenderJob(...)` followed by `executeRenderJob(...)` with rational FPS, strict mode, progress callbacks, and cancellation.
- Professional alpha output is a separate SDR ProRes 4444 MOV composition whose HTML, body, and root remain unpainted.

## Consequences

Local revisions regenerate only the selected graphic version and affected preview range. Failed jobs cannot erase accepted plans or prior artifacts. Cache keys include source hash, settings version, prompt version, composition version, format, and quality.
