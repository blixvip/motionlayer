import { cp, mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { createRenderJob, executeRenderJob } from "@hyperframes/producer";
import type { MotionMoment } from "./motion-plan";
import type { StoredProject } from "./project-store";
import { resolveLocalObjectKey } from "./storage";

function html(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function statLabel(headline: string, value: string) {
  if (!value) return headline;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withoutValue = headline.replace(new RegExp(escaped, "gi"), "").replace(/\s+([.,!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
  return withoutValue || "Key result";
}

function cardMarkup(moment: MotionMoment, index: number, assetFiles: Record<string, string>) {
  const statValue = moment.type === "stat-card" ? moment.content.data[0] ?? "" : "";
  const data = moment.type === "stat-card" ? "" : moment.content.data.slice(0, 3).map((item, itemIndex) => `<div class="datum"><b>0${itemIndex + 1}</b><span>${html(item)}</span></div>`).join("");
  const stat = moment.type === "stat-card" ? `<em>${html(statValue)}</em>` : "";
  const headline = moment.type === "stat-card" ? statLabel(moment.content.headline, statValue) : moment.content.headline;
  const assetFile = assetFiles[moment.id];
  const asset = assetFile ? `<div class="asset-visual"><img src="assets/${assetFile}" alt="${html(moment.asset?.entity ?? "visual asset")}"></div>`
    : moment.asset?.kind === "map" ? `<div class="generated-visual map-visual"><svg viewBox="0 0 320 150"><path d="M18 112 C76 24 134 142 204 52 S286 48 304 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="112" r="8"/><circle cx="304" cy="24" r="8"/></svg><span>${html(moment.asset.entity)}</span></div>`
    : moment.asset?.kind === "webpage" ? `<div class="generated-visual web-visual"><i></i><i></i><i></i><div></div><b>${html(moment.asset.entity)}</b></div>` : "";
  return `<section id="motion-${index}" class="motion-card clip" data-start="${moment.startSeconds}" data-duration="${moment.endSeconds - moment.startSeconds}" data-track-index="${2 + index % 3}"><div id="card-${index}" class="card type-${moment.type} kind-${moment.asset?.kind ?? "text"} region-${moment.layout.preferredRegion.replace(/[^a-z]+/gi, "-").toLowerCase()}"><small>${html(moment.asset?.kind ?? moment.accentWord ?? moment.type.replace(/-/g, " "))}</small>${asset}${stat}<h2>${html(headline).replace(/\n/g, " ")}</h2>${moment.content.supportingText ? `<p>${html(moment.content.supportingText)}</p>` : ""}${data}</div></section>`;
}

function animationMarkup(moment: MotionMoment, index: number) {
  const start = moment.startSeconds;
  const duration = moment.endSeconds - moment.startSeconds;
  const exit = Math.max(start + .65, moment.endSeconds - .3);
  return `tl.fromTo("#card-${index}", {opacity:0,y:28,scale:.96,filter:"blur(12px)"}, {opacity:1,y:0,scale:1,filter:"blur(0px)",duration:.55,ease:"expo.out",immediateRender:false}, ${start});
  tl.fromTo("#card-${index} > *", {opacity:0,y:16}, {opacity:1,y:0,duration:.42,ease:"power3.out",stagger:.075,immediateRender:false}, ${start + .12});
  tl.to("#card-${index}", {x:5,duration:${Math.max(.4, duration - .75)},ease:"sine.out"}, ${start + .55});
  tl.to("#card-${index}", {opacity:0,y:-18,filter:"blur(7px)",duration:.3,ease:"power2.in"}, ${exit});`;
}

function composition(project: StoredProject, includeSource: boolean, assetFiles: Record<string, string>) {
  const plan = project.motionPlan!;
  const approvedMoments = plan.moments.filter((moment) => moment.status === "accepted" || moment.status === "ready");
  const cards = approvedMoments.map((moment, index) => cardMarkup(moment, index, assetFiles)).join("\n");
  const animations = approvedMoments.map(animationMarkup).join("\n");
  const source = includeSource ? `<video id="source-video" class="clip" src="assets/input-video${project.mime === "video/quicktime" ? ".mov" : ".mp4"}" muted playsinline data-start="0" data-duration="${project.duration}" data-track-index="0"></video><audio id="source-audio" src="assets/input-video${project.mime === "video/quicktime" ? ".mov" : ".mp4"}" data-start="0" data-duration="${project.duration}" data-track-index="9" data-volume="1"></audio>` : "";
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=${project.width},height=${project.height}"><style>
  @font-face{font-family:Inter;src:url("fonts/Inter-400-latin.woff2") format("woff2");font-weight:400;font-display:block}@font-face{font-family:Inter;src:url("fonts/Inter-700-latin.woff2") format("woff2");font-weight:700;font-display:block}
  *{box-sizing:border-box}html,body{margin:0;width:${project.width}px;height:${project.height}px;overflow:hidden;background:${includeSource ? "#090b0a" : "transparent"};font-family:Inter,sans-serif}#stage{position:relative;width:100%;height:100%;overflow:hidden}#source-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.motion-card{position:absolute;inset:0;pointer-events:none;color:#f6f8f2}.motion-card:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 25% 10%,rgba(200,255,61,.06),transparent 32%),linear-gradient(115deg,transparent,rgba(255,255,255,.025),transparent);mix-blend-mode:screen}.card{position:absolute;width:min(42%,620px);padding:28px 30px;border:1px solid rgba(232,238,230,.2);border-radius:20px;background:linear-gradient(145deg,rgba(13,18,15,.94),rgba(24,29,25,.86));box-shadow:0 30px 80px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.08);overflow:hidden}.card:after{content:"";position:absolute;inset:0;opacity:.08;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E")}.card small{display:block;color:#c8ff3d;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.card h2{position:relative;margin:14px 0 0;font-size:clamp(34px,4.8vw,72px);line-height:.94;letter-spacing:-.05em}.card p{position:relative;margin:14px 0 0;color:#c8cec6;font-size:18px}.card em{display:block;color:#c8ff3d;font:700 clamp(70px,9vw,130px)/.86 Inter;margin-top:16px;font-style:normal}.datum{position:relative;display:flex;gap:18px;align-items:center;min-height:54px;border-top:1px solid rgba(255,255,255,.14);font-size:20px}.datum:first-of-type{margin-top:20px}.datum b{color:#c8ff3d;font-size:12px}.asset-visual{position:relative;display:grid;place-items:center;width:120px;height:120px;margin:18px 0 8px;border-radius:22px;background:#f7f8f4;box-shadow:0 18px 36px rgba(0,0,0,.26)}.asset-visual img{display:block;width:88px;height:88px;object-fit:contain}.generated-visual{position:relative;margin:18px 0;color:#c8ff3d}.map-visual svg{display:block;width:100%;height:130px}.map-visual span,.web-visual b{color:#f6f8f2;font-size:16px}.web-visual{height:126px;padding:38px 14px 12px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#0a0d0b}.web-visual>i{position:absolute;top:13px;width:7px;height:7px;border-radius:50%;background:#c8ff3d}.web-visual>i:nth-child(1){left:14px}.web-visual>i:nth-child(2){left:28px;opacity:.6}.web-visual>i:nth-child(3){left:42px;opacity:.3}.web-visual>div{height:8px;width:72%;margin:8px 0;background:rgba(255,255,255,.12);box-shadow:0 18px rgba(255,255,255,.08),0 36px rgba(255,255,255,.05)}.region-upper-left{left:6%;top:9%}.region-upper-right{right:6%;top:9%}.region-right-center{right:6%;top:25%}.region-lower-left{left:6%;bottom:10%}.region-lower-right{right:6%;bottom:10%}.type-lower-third{width:min(48%,650px);bottom:10%;top:auto}.type-pull-quote{width:min(46%,680px)}
  </style></head><body><div id="stage" data-composition-id="motionlayer-project" data-start="0" data-duration="${project.duration}" data-fps="${Math.round(project.fps)}" data-width="${project.width}" data-height="${project.height}">${source}${cards}</div><script src="vendor/gsap.min.js"></script><script>const tl=gsap.timeline({paused:true});${animations}window.__timelines["motionlayer-project"]=tl;</script></body></html>`;
}

function rationalFps(fps: number) {
  if (Math.abs(fps - 23.976) < 0.01) return { num: 24_000, den: 1_001 };
  if (Math.abs(fps - 29.97) < 0.01) return { num: 30_000, den: 1_001 };
  if (Math.abs(fps - 59.94) < 0.01) return { num: 60_000, den: 1_001 };
  if (Number.isInteger(fps)) return { num: fps, den: 1 };
  return { num: Math.round(fps * 1_000), den: 1_000 };
}

export async function renderStoredProject(project: StoredProject, format: "mp4" | "mov", quality: "draft" | "standard" | "high") {
  if (!project.motionPlan) throw new Error("MOTION_PLAN_MISSING");
  const workspace = resolve(process.cwd(), "data", "projects", project.id, `render-${format}`);
  const assets = join(workspace, "assets");
  const fonts = join(workspace, "fonts");
  const vendor = join(workspace, "vendor");
  const outputDir = resolve(process.cwd(), "data", "projects", project.id, "renders");
  const output = join(outputDir, format === "mp4" ? "motionlayer-final.mp4" : "motionlayer-overlay.mov");
  await Promise.all([mkdir(assets, { recursive: true }), mkdir(fonts, { recursive: true }), mkdir(vendor, { recursive: true }), mkdir(outputDir, { recursive: true })]);
  const extension = project.mime === "video/quicktime" ? ".mov" : ".mp4";
  const assetFiles: Record<string, string> = {};
  const projectRoot = resolve(process.cwd(), "data", "projects", project.id);
  const mediaRoot = resolve(projectRoot, ".media");
  for (const moment of project.motionPlan.moments) {
    if (moment.asset?.status !== "resolved" || moment.asset.usageStatus !== "approved" || !moment.asset.localPath) continue;
    const sourcePath = resolve(projectRoot, moment.asset.localPath);
    if (!sourcePath.startsWith(`${mediaRoot}${sep}`)) continue;
    const extension = extname(sourcePath).toLowerCase() || ".bin";
    const filename = `${moment.id}${extension}`;
    await cp(sourcePath, join(assets, filename));
    assetFiles[moment.id] = filename;
  }
  await Promise.all([
    cp(resolveLocalObjectKey(project.assetKey), join(assets, `input-video${extension}`)),
    cp(resolve(process.cwd(), "fixtures", "hyperframes", "demo", "fonts", "Inter-400-latin.woff2"), join(fonts, "Inter-400-latin.woff2")),
    cp(resolve(process.cwd(), "fixtures", "hyperframes", "demo", "fonts", "Inter-700-latin.woff2"), join(fonts, "Inter-700-latin.woff2")),
    cp(resolve(process.cwd(), "fixtures", "hyperframes", "demo", "vendor", "gsap.min.js"), join(vendor, "gsap.min.js")),
  ]);
  await writeFile(join(workspace, "hyperframes.json"), JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { blocks: "compositions", components: "compositions/components", assets: "assets" }, media: { autoProxy: true } }, null, 2));
  await writeFile(join(workspace, "index.html"), composition(project, format === "mp4", assetFiles), "utf8");
  const job = createRenderJob({
    fps: rationalFps(project.fps),
    quality,
    format,
    workers: 1,
    strictness: "strict",
    entryFile: "index.html",
    hdrMode: format === "mov" ? "force-sdr" : "auto",
  });
  await executeRenderJob(job, workspace, output);
  return output;
}
