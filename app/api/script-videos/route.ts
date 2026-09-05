import { NextResponse } from "next/server";
import { z } from "zod";
import { renderScriptVideo } from "@/lib/script-video";
import { styleDirectionSchema } from "@/lib/style-director";

export const runtime = "nodejs";
const schema = z.object({
  script: z.string().trim().min(12, "Add a little more to your script.").max(5000, "Keep the script under 5,000 characters."),
  format: z.enum(["landscape", "short-form"]).default("landscape"),
  direction: styleDirectionSchema.default({ profileId: "editorial-proof", density: "sparse", motion: "restrained", referenceNotes: "" }),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const video = await renderScriptVideo(input.script, input.format, input.direction);
    return NextResponse.json({ id: video.id, scenes: video.scenes, duration: video.duration, format: video.format, dimensions: video.dimensions, wordCheck: video.wordCheck, skillsUsed: video.skillsUsed, renderProfile: video.renderProfile, directionReceipt: video.directionReceipt, videoUrl: `/api/script-videos/${video.id}/file`, downloadUrl: `/api/script-videos/${video.id}/file?download=1` });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Check your script and try again." }, { status: 400 });
    console.error("Script video render failed", error);
    return NextResponse.json({ error: "The video could not be rendered.", recovery: "Your script is still here. Try Generate again." }, { status: 500 });
  }
}
