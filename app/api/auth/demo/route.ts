import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const response = NextResponse.redirect(new URL("/dashboard", `${protocol}://${host}`), 303);
  response.cookies.set("motionlayer_session", "demo-workspace", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}
