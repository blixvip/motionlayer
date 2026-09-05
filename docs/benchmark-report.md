# Fixture benchmark report

Date: 2026-08-29  
Host: Windows x64, Node 26.7.0, HyperFrames 0.8.19, Chromium 152.0.7977.30, FFmpeg 9.0.1, Intel UHD 630 hardware browser path, one render worker.

## Measured end-to-end fixture

The checked-in fixture is 18.000 seconds, 1280 × 720, 30 fps, and 540 frames. Fresh strict draft renders produced:

| Output | Result | Artifact | Verification |
|---|---:|---:|---|
| Composited MP4 | completed | 3,516,342 bytes | H.264 `yuv420p` + AAC, 540 frames, 18.000 s |
| Transparent MOV | 42.8 s | 54,247,455 bytes | ProRes `yuva444p12le`, 540 frames, 18.000 s, no audio |

The MOV path reused 311 of 540 deterministically identical frames. Snapshot capture at 1.2, 4.5, 9, 13, 16.5, and 17.46 seconds passed visual inspection. HyperFrames check reported zero runtime errors, zero layout issues across nine samples, zero motion errors, and 17/17 WCAG AA text checks.

SHA-256:

- MP4: `beea31460a1bbee4f17ab8f40c97ab5234de832d8412f11ed21b7cc5fc9545be`
- MOV: `d0882c9722712bd81aa7a4dd361c5ebc35de61ab31d16bedda3b46af9a90e637`

## Scale fixtures

No 30-second, 5-minute, or 20-minute source fixtures are checked into this workspace, so no p50/p95 values are claimed for those durations. `npm run benchmark:render -- <project-dir> <output>` is the repeatable Producer-backed harness for those fixtures when supplied. It records elapsed time, artifact bytes, peak process RSS, Producer performance data, and warnings. Service objectives should be set only after repeated runs on the deployment worker class.
