# MotionLayer

[![Discord](https://img.shields.io/badge/Discord-Join%20the%20community-5865F2?logo=discord&logoColor=white)](https://discord.gg/grokbot)

MotionLayer turns scripts and edited video into editable motion graphics. It recognizes people, brands, and relationships, then builds portrait scenes, statements, animated message networks, sandbox diagrams, and process sequences.

The renderer integrates the actual asGenerator source factory and its generated components with Paper Shaders. Preview and export share the same React implementation. Timestamped scripts preserve their supplied intervals and lock scene timing by default.

## Run locally

The verified runtime is Node.js 26 with npm, FFmpeg/FFprobe, and Chromium. Local Codex or Claude authentication is optional; the preset planner works without either model.

```bash
git clone https://github.com/blixvip/motionlayer.git
cd motionlayer
npm ci
cp .env.example .env
npm run fixture:media
npm run build
npm run start:local
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Configure a random `SESSION_SECRET` in the local environment file. The example contains development placeholders, not production credentials.

Open `http://127.0.0.1:3010/`. The launcher starts the production server in the background and reuses an existing instance. After application changes, rebuild and restart the server. For development, use `npm run dev`; use `npm run dev:webpack` when dependencies are linked across drives on Windows.

Windows media-tool setup is available through `npm run ffmpeg:setup`. The optional speech pipeline uses `npm run speech:setup` to prepare FFmpeg, whisper.cpp, and S1-mini. Speech configuration is documented in `.env.example`.

## Editable graphics

1. Enter a script in Script Studio and choose **Build editable graphics**.
2. Select a storyboard cue and edit its subjects, action, labels, typography, palette, or material.
3. Save the revision and render MP4, transparent MOV, or an editable source ZIP.

Use timestamp ranges such as:

```text
[00:00 - 00:05] Bernie Sanders called for a pause in AI development.
[00:05 - 00:13] AI agents exchanged messages on a shared board.
```

Supplied intervals remain intact through art direction and ordinary edits. The studio displays **Script timecodes locked**. Untimed scripts use estimated timing. Content, style, and timing locks can be managed explicitly in the inspector.

Verified local portraits and logos appear before model direction finishes. Missing media can be repaired or replaced in the inspector. Exports identify unresolved requested imagery rather than silently shipping placeholders. Image lookup cannot guarantee a match for every name.

Render jobs persist locally and survive page navigation. The source ZIP includes component source, the asGenerator factory snapshot, frozen assets, fonts, source receipts, licenses, and locked dependencies. It rebuilds without a separate asGenerator checkout.

## Verification

```bash
npm run typecheck
npm test
npm run hyperframes:lint
npm run hyperframes:check
```

Run `npm run build` first on a new checkout to generate Next.js route types. Browser tests are available through `npm run test:e2e`. Regenerate the local demo media with `npm run fixture:media`; `npm run hyperframes:render` produces the composited and transparent demo exports.

The latest local validation passed 108 tests and the production build. A full 33-cue script export was verified at 150 seconds, 4,500 frames, 1080 x 1920, and 30 fps. A separate asGenerator source export installed its locked dependencies and rebuilt outside the application directory.

## Repository contents and limits

The repository includes application source, tests, migrations, source/provenance records, required fonts and subject assets, and the built-in studio example. Local environment files, uploaded projects, private caches, generated user exports, QA screenshots, and study-only reference images are excluded. Paths under `data/` in the verification guides refer to local outputs that can be regenerated.

The default graphics workflow uses a detached local Node worker and does not require Redis or a sibling asGenerator server. `docker-compose.yml` and the deployment guide describe optional infrastructure and an unfinished container-worker scaffold; the referenced worker Dockerfile is not included. This is not a turnkey hosted deployment. Production object-store uploads, isolation, quotas, and shared persistence require additional integration.

Third-party assets and dependencies retain their existing ownership and licenses. No blanket project license is added by this publication.

- [asGenerator integration and verification](docs/asgenerator-integration.md)
- [Contextual motion graphics](docs/semantic-motion.md)
- [Deployment design notes](docs/deployment.md)
- [Locked source and render boundaries](docs/adr/0001-locked-source-and-render-boundary.md)

## Community

**Want to send a PR? Join the [blix open source Discord](https://discord.gg/grokbot) first.** It's the one server for everyone contributing to any blixvip repo: questions, ideas, PR discussion, help, and release news.

💬 [Join the Discord](https://discord.gg/grokbot) for questions, help, feedback, and updates.

<!-- discord-incentive:start -->
### 💬 Why join the Discord first

**[discord.gg/grokbot](https://discord.gg/grokbot)** is the one server for every blixvip repo, and it gets you more than a chat window:

- 🟢 **Claim an issue and it is yours.** Say which one in `#contributors` and it is assigned to you, so two people never build the same thing twice.
- 🏷️ **A contributor role** on the server the moment your first pull request is merged.
- 🗺️ **A say in what gets built.** The roadmap is argued out there before it turns into issues.
- 🙋 **A human to ask.** Stuck on setup, or unsure whether an idea is even wanted? Faster than waiting on an issue thread.
<!-- discord-incentive:end -->
