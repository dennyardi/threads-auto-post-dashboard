import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { threadsOAuthLog } from "@/lib/threads/logging";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.coerce.number().optional(),
  scope: z.string().optional(),
});

type BuildThreadsOAuthUrlParams = {
  state: string;
};

export type ThreadsTokenResponse = z.infer<typeof tokenResponseSchema>;

export function buildThreadsOAuthUrl({ state }: BuildThreadsOAuthUrlParams) {
  const env = getServerEnv();
  const url = new URL(env.THREADS_OAUTH_AUTHORIZE_URL);

  url.searchParams.set("client_id", env.META_APP_ID);
  url.searchParams.set("redirect_uri", env.META_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", env.THREADS_OAUTH_SCOPES);
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<ThreadsTokenResponse> {
  const env = getServerEnv();
  const body = new URLSearchParams({
    client_id: env.META_APP_ID,
    client_secret: env.META_APP_SECRET,
    redirect_uri: env.META_REDIRECT_URI,
    code,
    grant_type: "authorization_code",
  });

  const response = await fetch(env.THREADS_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    threadsOAuthLog("error", "token_exchange_provider_error", "helper", {
      status: response.status,
      response: errorText,
    });
    throw new Error(`Threads token exchange failed: ${response.status} ${errorText}`);
  }

  const json: unknown = await response.json();
  return tokenResponseSchema.parse(json);
}

export async function refreshAccessToken(_refreshToken: string) {
  // TODO: Wire this to the official Threads refresh endpoint if the chosen token flow returns refresh tokens.
  throw new Error("Threads refresh token flow is not configured for this MVP.");
}

export function validateOAuthState(receivedState: string | null, storedState: string | undefined) {
  return Boolean(receivedState && storedState && receivedState === storedState);
}
