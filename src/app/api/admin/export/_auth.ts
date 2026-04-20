import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Route-handler adminGuard, route'un ilk satırında çağır. 401/403 response
 * dönerse doğrudan return et; null dönerse kullanıcı ADMIN veya MODERATOR
 * demektir ve route handler devam eder.
 */
export async function adminGuard(): Promise<Response | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Giriş gerekli.", { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    return new Response("Yetki yok.", { status: 403 });
  }
  return null;
}
