import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { threadsOAuthLog } from "@/lib/threads/logging";

const profileResponseSchema = z
  .object({
    id: z.string(),
    username: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    threads_profile_picture_url: z.string().nullable().optional(),
  })
  .passthrough();

export type ThreadsProfile = {
  threads_user_id: string;
  username: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
};

export async function getThreadsProfile(accessToken: string): Promise<ThreadsProfile> {
  const env = getServerEnv();
  const baseUrl = env.THREADS_API_BASE_URL.replace(/\/$/, "");
  const url = new URL(`${baseUrl}/me`);
  url.searchParams.set("fields", "id,username,name,threads_profile_picture_url");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    threadsOAuthLog("error", "profile_provider_error", "helper", {
      status: response.status,
      response: errorText,
    });
    throw new Error(`Threads profile fetch failed: ${response.status} ${errorText}`);
  }

  const profile = profileResponseSchema.parse(await response.json());

  return {
    threads_user_id: profile.id,
    username: profile.username ?? null,
    // TODO: Confirm the official field name available to the approved Threads app permissions.
    display_name: profile.display_name ?? profile.name ?? null,
    profile_picture_url: profile.threads_profile_picture_url ?? null,
  };
}
