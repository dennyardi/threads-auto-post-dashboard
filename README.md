# Threads Auto Post Dashboard

MVP foundation for a Threads publishing dashboard using official Meta/Threads OAuth, local MySQL/MariaDB, phpMyAdmin-friendly SQL, Prisma, and a protected Next.js dashboard.

This stage intentionally does not implement auto-publishing, scraping, browser automation, cookie login, or storage of Threads/Instagram passwords.

## Stack

- Next.js 15 App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-style local components
- Local email/password auth with bcrypt
- httpOnly cookie sessions stored in MySQL
- Prisma ORM
- MySQL/MariaDB, manageable through phpMyAdmin
- Zod validation
- Official Meta/Threads OAuth endpoints from environment variables

## Install

```bash
npm install
npx prisma generate
```

## MySQL / phpMyAdmin Setup

1. Start MySQL or MariaDB from XAMPP, Laragon, MAMP, Docker, or your preferred local stack.
2. Open phpMyAdmin.
3. Create a database named:

```text
threads_auto_post_dashboard
```

4. Import this SQL file in phpMyAdmin:

```text
database/mysql/schema.sql
```

The schema includes app users, sessions, profiles, Threads accounts, posts, post media, and publish logs. User ownership is enforced in application queries because plain MySQL does not have Supabase-style Row Level Security.

## Environment

Copy `.env.example` to `.env.local` and fill every value.

```bash
DATABASE_URL=mysql://root:password@localhost:3306/threads_auto_post_dashboard
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:3000/api/auth/threads/callback
THREADS_OAUTH_AUTHORIZE_URL=
THREADS_OAUTH_TOKEN_URL=
THREADS_API_BASE_URL=
THREADS_OAUTH_SCOPES=
TOKEN_ENCRYPTION_KEY=
APP_URL=http://localhost:3000
```

For common local phpMyAdmin stacks:

```bash
DATABASE_URL=mysql://root:@localhost:3306/threads_auto_post_dashboard
```

Use that only if your local MySQL root user has no password.

`TOKEN_ENCRYPTION_KEY` must decode to exactly 32 bytes. Use either:

```bash
openssl rand -base64 32
```

or a 64-character hex key.

## Meta Developer App

1. Create an app in Meta for Developers.
2. Configure the official Threads OAuth product/permissions available to your app.
3. Add this redirect URI:

```text
http://localhost:3000/api/auth/threads/callback
```

4. Put the official authorization URL, token URL, API base URL, app ID, app secret, redirect URI, and approved scopes into `.env.local`.

The code uses environment variables for official URLs because Meta/Threads endpoint versions and app-review permissions can vary.

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

If port 3000 is already used:

```bash
npm run dev -- --port 3001
```

## OLSPanel Deployment

After creating the MariaDB database and importing `database/mysql/schema.sql`, configure the Node.js app in OLSPanel with:

```text
App root: project folder
Startup file: server.js
Port: 3000
Environment: production
```

On the server, run:

```bash
npm install
npx prisma generate
npm run build
```

Then start the app from OLSPanel. If you run it manually:

```bash
NODE_ENV=production node server.js
```

## Auth Flow

1. User registers with app email/password.
2. Password is hashed with bcrypt before storage.
3. Login creates a random session token.
4. Only the SHA-256 hash of the session token is stored in MySQL.
5. The raw session token is stored in an httpOnly cookie.
6. Protected routes require a valid session.

This auth is only for the dashboard app. It is not Threads or Instagram login.

## OAuth Flow

1. Authenticated user opens `/settings/threads`.
2. User clicks **Connect Threads Account**.
3. `/api/auth/threads/start` checks the local app session, creates a secure random state, stores it in an httpOnly cookie, and redirects to the official Meta/Threads OAuth authorization URL.
4. User logs in and grants permission on Meta/Threads pages only.
5. Meta redirects to `/api/auth/threads/callback` with `code` and `state`.
6. The backend validates the state, exchanges the authorization code for an access token, fetches the Threads profile, encrypts the token with AES-256-GCM, and upserts `threads_accounts`.
7. The browser returns to `/settings/threads?connected=1`.
8. The frontend shows only connection metadata, never access tokens.

Disconnecting calls `/api/auth/threads/disconnect`, which marks the active account as inactive and sets `disconnected_at`. It does not delete post history.

## Security Notes

- Threads access tokens are encrypted server-side before storage.
- Tokens are never rendered in client components.
- App passwords are stored as bcrypt hashes.
- Session tokens are stored as hashes in MySQL and as httpOnly cookies in the browser.
- Official OAuth is the only Threads connection method.
- Do not request or store Threads/Instagram usernames and passwords.
- Do not use scraping, unofficial APIs, browser automation, or cookie-based login.
- Keep `DATABASE_URL`, `META_APP_SECRET`, and `TOKEN_ENCRYPTION_KEY` server-only.

## Key Paths

- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/settings/threads/page.tsx`
- `app/api/auth/threads/start/route.ts`
- `app/api/auth/threads/callback/route.ts`
- `app/api/auth/threads/disconnect/route.ts`
- `lib/auth/session.ts`
- `lib/db.ts`
- `lib/threads/oauth.ts`
- `lib/threads/api.ts`
- `lib/security/encryption.ts`
- `prisma/schema.prisma`
- `database/mysql/schema.sql`

## Next Steps

- Add the composer UI and draft creation.
- Add local or object-storage media upload.
- Add scheduler tables/jobs and publish queue processing.
- Implement official Threads publish calls after app permissions are approved.
- Add token refresh if the approved OAuth flow returns refresh tokens.
- Add integration tests around auth, OAuth callback, and user-owned data paths.
