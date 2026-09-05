import { cpSync, mkdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const project = join(root, "fixtures", "hyperframes", "demo");
const renders = join(project, "renders");
const publicDir = join(root, "public", "demo");
mkdirSync(renders, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const run = (args) => {
  const result = spawnSync("npx", ["hyperframes", ...args], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const mp4 = join(renders, "motionlayer-demo.mp4");
const mov = join(renders, "motionlayer-overlay.mov");
run(["render", project, "--quality", "draft", "--workers", "1", "--strict", "--output", mp4]);
run(["render", project, "--composition", "compositions/overlay.html", "--format", "mov", "--quality", "draft", "--workers", "1", "--strict", "--output", mov]);
cpSync(mp4, join(publicDir, "motionlayer-demo.mp4"), { force: true });
cpSync(mov, join(publicDir, "motionlayer-overlay.mov"), { force: true });
console.log(JSON.stringify({ mp4Bytes: statSync(mp4).size, movBytes: statSync(mov).size }, null, 2));
