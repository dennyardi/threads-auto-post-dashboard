"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  clearCurrentSession,
  createDemoSession,
  createUserSession,
  isDemoLoginEnabled,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signInAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid-input");
  }

  if (
    isDemoLoginEnabled() &&
    parsed.data.email.toLowerCase() === "demo@example.com" &&
    parsed.data.password === "password123"
  ) {
    await createDemoSession();
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email.toLowerCase(),
    },
  });

  if (!user) {
    redirect("/login?error=invalid-email-or-password");
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    redirect("/login?error=invalid-email-or-password");
  }

  await createUserSession(user.id);
  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid-input");
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    redirect("/register?error=email-already-registered");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          email,
        },
      },
    },
  });

  await createUserSession(user.id);
  redirect("/dashboard");
}

export async function signOutAction() {
  await clearCurrentSession();
  redirect("/login");
}
