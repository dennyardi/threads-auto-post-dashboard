import { z } from "zod";

const publicEnvSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
});

const serverEnvSchema = publicEnvSchema.extend({
  DATABASE_URL: z.string().min(1),
  META_APP_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_REDIRECT_URI: z.string().url(),
  THREADS_OAUTH_AUTHORIZE_URL: z.string().url(),
  THREADS_OAUTH_TOKEN_URL: z.string().url(),
  THREADS_API_BASE_URL: z.string().url(),
  THREADS_OAUTH_SCOPES: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z.string().min(1),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    APP_URL: process.env.APP_URL,
  });
}

export function getServerEnv() {
  return serverEnvSchema.parse({
    APP_URL: process.env.APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI,
    THREADS_OAUTH_AUTHORIZE_URL: process.env.THREADS_OAUTH_AUTHORIZE_URL,
    THREADS_OAUTH_TOKEN_URL: process.env.THREADS_OAUTH_TOKEN_URL,
    THREADS_API_BASE_URL: process.env.THREADS_API_BASE_URL,
    THREADS_OAUTH_SCOPES: process.env.THREADS_OAUTH_SCOPES,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
  });
}
