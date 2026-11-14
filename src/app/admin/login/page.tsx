import { AdminLogin } from "@/components/admin/login";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { adminCookieName, createOnlineAdminAuth } from "@/lib/editor-online-auth.mjs";

async function LoginContent() {
  if (process.env.NODE_ENV === "production" && createOnlineAdminAuth().session((await cookies()).get(adminCookieName)?.value)) redirect("/admin");
  return <AdminLogin />;
}

export default function LoginPage() {
  return <Suspense fallback={<p role="status">Đang mở đăng nhập…</p>}><LoginContent /></Suspense>;
}
