import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@/lib/security/encryption";
import { getThreadsProfile } from "@/lib/threads/api";
import { threadsOAuthLog } from "@/lib/threads/logging";
import { exchangeCodeForToken, validateOAuthState } from "@/lib/threads/oauth";

const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const user = await getCurrentUser();

  if (!user) {
    threadsOAuthLog("warn", "callback_unauthenticated", requestId);
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const oauthError = request.nextUrl.searchParams.get("error");
  const oauthErrorReason = request.nextUrl.searchParams.get("error_reason");
  const oauthErrorDescription =
    request.nextUrl.searchParams.get("error_description") ??
    request.nextUrl.searchParams.get("error_message");

  if (oauthError || oauthErrorReason || oauthErrorDescription) {
    threadsOAuthLog("error", "callback_provider_error", requestId, {
      userId: user.id,
      oauthError,
      oauthErrorReason,
      oauthErrorDescription,
    });
    return NextResponse.redirect(
      new URL(`/settings/threads?error=${encodeURIComponent(oauthErrorDescription ?? oauthError ?? "oauth-provider-error")}`, appUrl),
    );
  }

  const parsed = callbackSchema.safeParse({
    code: request.nextUrl.searchParams.get("code"),
    state: request.nextUrl.searchParams.get("state"),
  });

  if (!parsed.success) {
    threadsOAuthLog("error", "callback_missing_params", requestId, {
      userId: user.id,
      hasCode: request.nextUrl.searchParams.has("code"),
      hasState: request.nextUrl.searchParams.has("state"),
    });
    return NextResponse.redirect(new URL("/settings/threads?error=missing-code-or-state", appUrl));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("threads_oauth_state")?.value;
  cookieStore.delete("threads_oauth_state");

  if (!validateOAuthState(parsed.data.state, storedState)) {
    threadsOAuthLog("error", "callback_invalid_state", requestId, {
      userId: user.id,
      hasStoredState: Boolean(storedState),
    });
    return NextResponse.redirect(new URL("/settings/threads?error=invalid-state", appUrl));
  }

  try {
    threadsOAuthLog("info", "token_exchange_started", requestId, { userId: user.id });
    const token = await exchangeCodeForToken(parsed.data.code);
    threadsOAuthLog("info", "token_exchange_succeeded", requestId, {
      userId: user.id,
      hasExpiry: Boolean(token.expires_in),
      tokenType: token.token_type,
    });
    const profile = await getThreadsProfile(token.access_token);
    threadsOAuthLog("info", "profile_fetch_succeeded", requestId, {
      userId: user.id,
      threadsUserId: profile.threads_user_id,
      username: profile.username,
    });
    const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null;
    const scopes = token.scope ? token.scope.split(/[,\s]+/).filter(Boolean) : null;

    await prisma.threadsAccount.upsert({
      where: {
        userId_threadsUserId: {
          userId: user.id,
          threadsUserId: profile.threads_user_id,
        },
      },
      create: {
        userId: user.id,
        threadsUserId: profile.threads_user_id,
        username: profile.username,
        displayName: profile.display_name,
        profilePictureUrl: profile.profile_picture_url,
        accessTokenEncrypted: encryptSecret(token.access_token),
        tokenType: token.token_type ?? null,
        expiresAt,
        scopes: scopes ?? undefined,
        isActive: true,
        connectedAt: new Date(),
      },
      update: {
        username: profile.username,
        displayName: profile.display_name,
        profilePictureUrl: profile.profile_picture_url,
        accessTokenEncrypted: encryptSecret(token.access_token),
        tokenType: token.token_type ?? null,
        expiresAt,
        scopes: scopes ?? undefined,
        isActive: true,
        disconnectedAt: null,
        connectedAt: new Date(),
      },
    });

    threadsOAuthLog("info", "connection_saved", requestId, {
      userId: user.id,
      threadsUserId: profile.threads_user_id,
    });
    return NextResponse.redirect(new URL("/settings/threads?connected=1", appUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    threadsOAuthLog("error", "callback_failed", requestId, {
      userId: user.id,
      message,
    });
    return NextResponse.redirect(
      new URL(`/settings/threads?error=${encodeURIComponent(message)}`, appUrl),
    );
  }
}
