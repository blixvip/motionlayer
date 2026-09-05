import { ScriptStudio } from "@/components/script/ScriptStudio";
import { analyzeScriptCopy } from "@/lib/script-understanding";
import { SCRIPT_RENDER_POLICY } from "@/lib/script-render-policy";

const script = `[00:00 - 00:03] Invidia is giving away Kimmy3 for free with

[00:03 - 00:06] Limits to actually replace your daily coding agent.

[00:06 - 00:07] So essentially what's?

[00:07 - 00:17] If you check it out on their build-vodkaia site, they usually post a bunch of different models that they're giving up for free, and you can see that just a day ago they posted Kimmy K3 as one of their official models for a free endpoint.

[00:17 - 00:21] If you're not familiar with Kimmy K3, this competes with Fable 5 levels.

[00:21 - 00:24] ChadGPT 5.6 soul. It's basically one of the top-tier models.

[00:24 - 00:30] To get the key, it's super easy. All you do is just make an account and you get around 60 requests per day, which is more than enough.

[00:30 - 00:34] Replace your whole codex.

[00:34 - 00:34] or

[00:34 - 00:36] Cloud Code Subscription, Right?

[00:36 - 00:47] You fully log in. You could check back here, and your new API key should spawn in, and you can use that to put into your ENV file, and then control something like OpenCode or another seali agent like Oh My Pie and

[00:47 - 00:48] Get it to do the same things.

[00:48 - 00:50] Link is in bio.`;

export default function NvidiaKimiDraftPage() {
  return <ScriptStudio initialScript={script} initialResult={{
    videoUrl: "/api/script-videos/vid_0e1e1be8c8934f08b0997f870815d7d3/file",
    downloadUrl: "/api/script-videos/vid_0e1e1be8c8934f08b0997f870815d7d3/file?download=1",
    duration: 50,
    scenes: 7,
    format: "short-form",
    dimensions: { width: 1080, height: 1920 },
    wordCheck: analyzeScriptCopy(script).suggestions,
    skillsUsed: [...SCRIPT_RENDER_POLICY.skills],
    renderProfile: SCRIPT_RENDER_POLICY,
  }} />;
}
