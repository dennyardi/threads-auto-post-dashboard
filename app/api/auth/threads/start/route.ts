import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { threadsOAuthLog } from "@/lib/threads/logging";
import { buildThreadsOAuthUrl } from "@/lib/threads/oauth";

export async function GET() {
  const requestId = crypto.randomUUID();
  const user = await getCurrentUser();

  if (!user) {
    threadsOAuthLog("warn", "start_unauthenticated", requestId);
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

  const authorizeUrl = buildThreadsOAuthUrl({ state });
  const parsedAuthorizeUrl = new URL(authorizeUrl);
  threadsOAuthLog("info", "start_redirect", requestId, {
    userId: user.id,
    authorizeHost: parsedAuthorizeUrl.host,
    redirectUri: parsedAuthorizeUrl.searchParams.get("redirect_uri"),
    scopes: parsedAuthorizeUrl.searchParams.get("scope"),
  });

  return NextResponse.redirect(authorizeUrl);
}
