import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { buildThreadsOAuthUrl } from "@/lib/threads/oauth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.APP_URL ?? "http://localhost:3000"));
  }

  const state = crypto.randomBytes(32).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("threads_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(buildThreadsOAuthUrl({ state }));
}
