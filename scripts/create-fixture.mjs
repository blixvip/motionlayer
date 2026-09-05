import { cpSync, existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicDir = join(root, "public", "demo");
const assetDir = join(root, "fixtures", "hyperframes", "demo", "assets");
mkdirSync(publicDir, { recursive: true });
mkdirSync(assetDir, { recursive: true });

const master = join(publicDir, "master.mp4");
const poster = join(publicDir, "poster.jpg");

const run = (args) => {
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (!existsSync(master)) {
  run([
    "-y", "-f", "lavfi", "-i", "gradients=size=1280x720:rate=30:c0=0x17202a:c1=0x657268:x0=0:y0=0:x1=1280:y1=720:d=18",
    "-f", "lavfi", "-i", "sine=frequency=178:sample_rate=48000:duration=18",
    "-vf", "drawbox=x='760+35*sin(t*.7)':y=82:w=340:h=556:color=0x0a0e12@0.55:t=fill,drawbox=x=816:y=160:w=210:h=210:color=0xbac2b7@0.46:t=fill,drawbox=x=798:y=388:w=246:h=214:color=0x20292d@0.86:t=fill,drawbox=x=72:y=74:w=4:h=572:color=0xc8ff3d@0.72:t=fill,drawbox=x=96:y=590:w=470:h=2:color=white@0.32:t=fill,noise=alls=4:allf=t",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-g", "30", "-keyint_min", "30", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-af", "volume=0.025", "-shortest", "-movflags", "+faststart", master,
  ]);
}

run(["-y", "-ss", "8.7", "-i", master, "-frames:v", "1", "-q:v", "2", poster]);
cpSync(master, join(assetDir, "input-video.mp4"), { force: true });
console.log(`Fixture ready: ${master}`);
