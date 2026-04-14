"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const kvkkAccepted = formData.get("kvkkAccepted") === "on";

  if (!name || !email || !password) {
    return { success: false, error: "Tüm alanlar zorunludur." };
  }

  if (password.length < 6) {
    return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
  }

  if (!kvkkAccepted) {
    return { success: false, error: "KVKK aydınlatma metnini kabul etmelisiniz." };
  }

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
