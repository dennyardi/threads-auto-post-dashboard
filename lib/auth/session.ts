import crypto from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

const SESSION_TTL_DAYS = 7;
const DEMO_SESSION_PREFIX = "demo.";

export const demoUser = {
  id: "demo-user",
  email: "demo@example.com",
  passwordHash: "",
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

export function isDemoLoginEnabled() {
  return process.env.DEMO_LOGIN_ENABLED === "true" && process.env.NODE_ENV !== "production";
}

export function isDemoUser(userId: string) {
  return userId === demoUser.id;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createUserSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function createDemoSession() {
  if (!isDemoLoginEnabled()) {
    throw new Error("Demo login is disabled.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, `${DEMO_SESSION_PREFIX}${crypto.randomBytes(16).toString("base64url")}`, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  if (token.startsWith(DEMO_SESSION_PREFIX)) {
    return isDemoLoginEnabled() ? demoUser : null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    if (token.startsWith(DEMO_SESSION_PREFIX)) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return;
    }

    await prisma.session.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
