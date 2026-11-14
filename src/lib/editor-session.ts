import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieName, createOnlineAdminAuth } from "./editor-online-auth.mjs";

export async function requireOnlineAdmin() {
  if (process.env.NODE_ENV !== "production") return;
  const cookie = (await cookies()).get(adminCookieName)?.value;
  if (!createOnlineAdminAuth().session(cookie)) redirect("/admin/login");
}
