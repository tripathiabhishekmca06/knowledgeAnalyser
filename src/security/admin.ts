import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { prisma } from "@/db/client";

const adminCookie = "readiness_admin";

export async function verifyAdminLogin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin?.active) return false;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return false;
  const value = signAdminSession(admin.id);
  const cookieStore = await cookies();
  cookieStore.set(adminCookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return true;
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const value = cookieStore.get(adminCookie)?.value;
  const session = value ? verifyAdminSession(value) : null;
  if (!session) redirect("/admin/login");
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { id: true, active: true }
  });
  if (!admin?.active) redirect("/admin/login");
  return admin;
}

function signAdminSession(adminId: string) {
  const payload = Buffer.from(JSON.stringify({ adminId, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyAdminSession(value: string): { adminId: string } | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  if (signature !== expected) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { adminId: string; exp: number };
  if (parsed.exp <= Date.now()) return null;
  return { adminId: parsed.adminId };
}
