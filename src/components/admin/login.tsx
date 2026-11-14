"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function AdminLogin() {
  const [availability, setAvailability] = useState<"loading" | "ready" | "unconfigured" | "unavailable">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function connect() {
      try {
        const response = await fetch("/__editor/auth/session", { cache: "no-store", signal: controller.signal });
        const session = await response.json();
        if (!response.ok) throw new Error(session.error || "Dịch vụ đăng nhập chưa sẵn sàng.");
        if (session.authenticated) { window.location.replace("/admin"); return; }
        setAvailability(session.configured ? "ready" : "unconfigured");
      } catch (failure) { if (!controller.signal.aborted) { setAvailability("unavailable"); setError(failure instanceof Error ? failure.message : "Không thể kết nối API đăng nhập."); } }
    }
    void connect();
    return () => controller.abort();
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || availability !== "ready") return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch("/__editor/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: data.get("username"), password: data.get("password") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể đăng nhập.");
      window.location.replace("/admin");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Không thể kết nối. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }

  return <main className="ed-root ed-login"><section className="ed-login-card" aria-labelledby="login-title">
    <p className="ed-eyebrow">Thiệp cưới · Quản trị nội dung</p><h1 id="login-title">Đăng nhập admin</h1><p>Đăng nhập để chỉnh sửa nội dung và hình ảnh website.</p>
    {availability === "loading" && <p role="status">Đang kết nối…</p>}
    {availability === "unconfigured" && <p role="alert" className="ed-login-notice">Cấu hình <code>ADMIN_USERNAME</code> và <code>ADMIN_PASSWORD</code> (ít nhất 12 ký tự) trong biến môi trường server/Vercel. Không có tài khoản mặc định.</p>}
    {availability === "unavailable" && <p role="alert" className="ed-login-notice">Không thể kết nối dịch vụ đăng nhập. Kiểm tra server rồi tải lại trang.</p>}
    <form onSubmit={event => void submit(event)} aria-busy={busy}>
      <label htmlFor="admin-username">Tên đăng nhập</label><input id="admin-username" name="username" autoComplete="username" required maxLength={256} disabled={busy || availability !== "ready"} />
      <label htmlFor="admin-password">Mật khẩu</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required maxLength={1024} disabled={busy || availability !== "ready"} aria-describedby={error ? "login-error" : undefined} />
      {error && <p id="login-error" role="alert" className="ed-login-error">{error}</p>}
      <button type="submit" className="ed-save" disabled={busy || availability !== "ready"}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
    </form><Link href="/">Về website</Link>
  </section></main>;
}
