# Deployment

These are deployment design notes, not an exercised turnkey deployment. The working default is the local Next.js app with its detached Node graphics worker. The container worker scaffold in `docker-compose.yml` references `apps/worker/Dockerfile`, which is not included in this checkout.

## Web/API

Deploy the Next.js service on a Node 22+ runtime with PostgreSQL, Redis, and S3-compatible object storage. Apply `prisma/schema.prisma`, use a 32+ byte random `SESSION_SECRET`, terminate TLS before the application, and set explicit upload/project/concurrency quotas.

## Workers

Build `apps/worker/Dockerfile` and run one BullMQ worker pool per trust boundary. Mount only a project-scoped materialization volume. The sample compose network is internal-only: it can reach Redis but not the public internet. Production should add seccomp/AppArmor, an egress-deny policy, malware scanning, per-job disposable containers, CPU/memory/disk/PID limits, and signed short-lived object access.

## Media tooling

The application pins HyperFrames Core, Producer, and CLI 0.8.19. A future worker image must supply Chromium, FFmpeg/FFprobe, and fonts. Local graphics jobs call the typed Producer API; the CLI supplies development checks and snapshots. Run a fixture check and both output renders when building a container image. Preserve exact pins in generated projects and run the official upgrade check before deliberate upgrades.

## Observability

Ship JSON logs for lifecycle events, job attempts, stage duration, HyperFrames exit category, and artifact verification. Never log signed URLs, prompt secrets, or full user transcript content by default.
