import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@/lib/security/encryption";
import { getThreadsProfile } from "@/lib/threads/api";
import { exchangeCodeForToken, validateOAuthState } from "@/lib/threads/oauth";

const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const parsed = callbackSchema.safeParse({
    code: request.nextUrl.searchParams.get("code"),
    state: request.nextUrl.searchParams.get("state"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/settings/threads?error=missing-code-or-state", appUrl));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("threads_oauth_state")?.value;
  cookieStore.delete("threads_oauth_state");

  if (!validateOAuthState(parsed.data.state, storedState)) {
    return NextResponse.redirect(new URL("/settings/threads?error=invalid-state", appUrl));
  }

  try {
    const token = await exchangeCodeForToken(parsed.data.code);
    const profile = await getThreadsProfile(token.access_token);
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

    return NextResponse.redirect(new URL("/settings/threads?connected=1", appUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    return NextResponse.redirect(
      new URL(`/settings/threads?error=${encodeURIComponent(message)}`, appUrl),
    );
  }
}
