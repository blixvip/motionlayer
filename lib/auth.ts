import { cookies } from "next/headers";

export async function requireSession() {
  const store = await cookies();
  const session = store.get("motionlayer_session")?.value;
  if (!session) throw new Error("UNAUTHORIZED");
  return { userId: "usr_demo", workspaceId: "ws_demo", session };
}
