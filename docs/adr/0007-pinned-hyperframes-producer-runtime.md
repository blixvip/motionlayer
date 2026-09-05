# ADR 0007: Pinned HyperFrames Producer runtime

Status: accepted

Production renders use the typed `@hyperframes/producer` API in a network-disabled worker image. Core, CLI, Producer, Node, Chromium, FFmpeg, and fonts are pinned and recorded in manifests. The CLI remains the development validation surface for doctor, skills check, lint, check, snapshots, and diagnosis. Package upgrades require fixture MP4/MOV renders, probes, and snapshot comparison before worker rollout.
