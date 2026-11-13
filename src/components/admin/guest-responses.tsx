"use client";

import { useEffect, useState } from "react";
import { InPageDialog } from "./in-page-dialog";

interface GuestResponse {
  id: string; name: string; email: string; side: "groom" | "bride"; attending: "yes" | "no";
  guests: number; message: string; submittedAt: string; emailStatus: string;
}
interface ResponseList { responses: GuestResponse[]; total: number; mail: { configured: boolean; enabled: boolean } }
const statusLabels: Record<string, string> = { sent: "Đã gửi tới SMTP", skipped: "Không yêu cầu email", unconfigured: "Chưa cấu hình SMTP", disabled: "Đã tắt gửi thư", failed: "Gửi thư thất bại", "rate-limited": "Đạt giới hạn gửi thư", pending: "Đang xử lý / chưa xác nhận" };

export function GuestResponses({ request, onClose }: { request: (url: string) => Promise<ResponseList>; onClose: () => void }) {
  const [result, setResult] = useState<ResponseList | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    request("rsvps").then(data => { if (active) { setResult(data); setError(""); } }).catch(() => { if (active) setError("Không tải được danh sách hồi đáp."); });
    return () => { active = false; };
  }, [request, refresh]);
  return <InPageDialog className="ed-dialog ed-responses" label="Danh sách hồi đáp" onClose={onClose}>
    <header><div><p className="ed-eyebrow">Dữ liệu đã gửi từ thiệp thật</p><h2>Danh sách hồi đáp</h2></div><button aria-label="Đóng danh sách hồi đáp" onClick={onClose}>×</button></header>
    <div className="ed-dialog-body">{error && <p role="alert">{error}</p>}{!result && !error && <p role="status">Đang tải hồi đáp…</p>}
      {result && <><p className="ed-mail-health">Email hướng dẫn: {result.mail.enabled ? result.mail.configured ? "SMTP đã cấu hình" : "Cần điền SMTP trong .env.local và khởi động lại server" : "Đang tắt trong Nội dung → Email hướng dẫn"}.</p><p>{result.total} hồi đáp · hiển thị {result.responses.length} bản mới nhất.</p><p>Địa chỉ và email dùng nội dung đã lưu, không dùng bản nháp trong preview.</p>
        <div className="ed-response-list">{result.responses.map(reply => <article key={reply.id}><div className="ed-response-heading"><strong>{reply.name}</strong><span>{reply.side === "groom" ? "Nhà trai" : "Nhà gái"} · {reply.attending === "yes" ? `${reply.guests} người tham dự` : "Không tham dự"}</span></div>{reply.email && <p>{reply.email}</p>}{reply.message && <p className="ed-response-message">{reply.message}</p>}<small>{new Date(reply.submittedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {statusLabels[reply.emailStatus] || reply.emailStatus}</small></article>)}{!result.responses.length && <p>Chưa có hồi đáp nào.</p>}</div>
      </>}
    </div><footer><span>Thông tin khách được lưu riêng ngoài public; không đưa email cá nhân vào JSON nội dung thiệp.</span><button onClick={() => setRefresh(value => value + 1)}>Làm mới</button><button onClick={onClose}>Đóng</button></footer>
  </InPageDialog>;
}
