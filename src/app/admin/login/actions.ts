"use server";

import { redirect } from "next/navigation";
import { verifyAdminLogin } from "@/security/admin";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await verifyAdminLogin(email, password);
  if (!ok) redirect("/admin/login?error=1");
  redirect("/admin");
}
