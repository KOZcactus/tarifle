"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";

interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const rawEmail = (formData.get("email") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const kvkkAccepted = formData.get("kvkkAccepted") === "on";

  if (!name || !rawEmail || !password) {
    return { success: false, error: "Tüm alanlar zorunludur." };
  }

  if (name.length < 2 || name.length > 100) {
    return { success: false, error: "Ad 2–100 karakter olmalıdır." };
  }

  if (password.length < 6) {
    return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
  }

  if (!kvkkAccepted) {
    return { success: false, error: "KVKK aydınlatma metnini kabul etmelisiniz." };
  }

  const email = normalizeEmail(rawEmail);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "Bu e-posta adresi zaten kayıtlı." };
  }

  const baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  const uniqueSuffix = Math.random().toString(36).slice(2, 7);
  const username = `${baseUsername}${uniqueSuffix}`;

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      username,
      passwordHash,
      kvkkAccepted: true,
      kvkkVersion: "1.0",
      kvkkDate: new Date(),
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });

  return { success: true };
}
