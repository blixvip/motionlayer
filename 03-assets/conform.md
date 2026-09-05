# Idea flight asset conform

Final: `public/motion-assets/idea-flight.png` — 1254 × 1254, 8-bit RGBA PNG, sRGB.

The supplied generated RGB image contained a painted checkerboard. Deterministic, border-connected neutral-color segmentation removed that background while preserving enclosed silver highlights, the original folds, silhouette, texture, and lighting. A narrow edge matte uses nearby foreground/background colors to remove pale contamination. No new image was generated during conform.

Alpha verification: 958,019 fully transparent pixels; 609,584 fully opaque pixels; 4,913 partially transparent edge pixels. Nontransparent bounds: x 39–1215, y 90–1148. All exterior background pixels have real zero alpha. Inspected composites on white and `#101018` backgrounds; no checkerboard remains.

The original generation and subsequent background-extraction prompts are preserved in `03-assets/idea-flight.prompt.txt` and embedded in the final PNG as `impeccable:prompt` using Impeccable's embed-prompt helper. Original generation used built-in image_gen; final conform used Sharp contour/color processing.

Recoverable original: `C:/Users/kaiha/.codex/cache/idea-flight-original.png`. Reproduction script and inspection composites are in the same cache directory (`conform-idea-flight.cjs`, `idea-flight-preview-101018.png`, `idea-flight-preview-ffffff.png`).
