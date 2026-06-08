import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  try {
    await prisma.threadsAccount.updateMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      data: {
        isActive: false,
        disconnectedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    return NextResponse.redirect(
      new URL(`/settings/threads?error=${encodeURIComponent(message)}`, appUrl),
    );
  }

  return NextResponse.redirect(new URL("/settings/threads?disconnected=1", appUrl));
}
