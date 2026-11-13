"use client";

import { useState, type FormEvent } from "react";
import { generateInvitationLinks } from "@/lib/guest-invitation";
import { InPageDialog } from "./in-page-dialog";

export function InvitationLinks({ initialPath, onClose }: { initialPath: string; onClose: () => void }) {
  const [website, setWebsite] = useState(() => window.location.origin);
  const [path, setPath] = useState(initialPath);
  const [names, setNames] = useState("");
  const [links, setLinks] = useState<{ name: string; url: string }[]>([]);
  const [feedback, setFeedback] = useState({ text: "", error: false });

  function reset() { setLinks([]); setFeedback({ text: "", error: false }); }
  function generate(event: FormEvent) {
    event.preventDefault();
    try {
      const result = generateInvitationLinks(website, path, names);
      setLinks(result);
      setFeedback({ text: `Đã tạo ${result.length} link mời. Dòng trống và tên trùng được bỏ qua.`, error: false });
    } catch (error) { setLinks([]); setFeedback({ text: error instanceof Error ? error.message : "Không thể tạo link.", error: true }); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setFeedback({ text: "Đã sao chép link mời.", error: false }); }
    catch { setFeedback({ text: "Không thể sao chép tự động. Bạn có thể chọn và sao chép link trong danh sách.", error: true }); }
  }
  const exportText = links.map(link => `${link.name}\n${link.url}`).join("\n\n");
  function download() {
    const url = URL.createObjectURL(new Blob([exportText], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "danh-sach-link-moi.txt";
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <InPageDialog className="ed-dialog ed-invitation-links" label="Tạo link mời" onClose={onClose}>
    <header><div><p className="ed-eyebrow">Một lời mời dành riêng</p><h2>Tạo link mời</h2></div><button aria-label="Đóng tạo link mời" onClick={onClose}>×</button></header>
    <div className="ed-dialog-body">
      <form onSubmit={generate} className="ed-invite-form">
        <label htmlFor="invite-website">Địa chỉ website đã deploy</label>
        <input id="invite-website" type="url" required value={website} onChange={event => { setWebsite(event.target.value); reset(); }} aria-describedby="invite-website-help" />
        <p id="invite-website-help" className="ed-config-help">Nếu đang chạy local, thay địa chỉ localhost bằng domain Vercel hoặc domain chính thức trước khi gửi khách.</p>
        <label htmlFor="invite-path">Trang mở khi nhận lời mời</label>
        <select id="invite-path" value={path} onChange={event => { setPath(event.target.value); reset(); }}><option value="/">Mở đầu · chọn nhà trai / nhà gái</option><option value="/nha-trai">Thiệp nhà trai</option><option value="/nha-gai">Thiệp nhà gái</option></select>
        <label htmlFor="invite-names">Danh sách người được mời · mỗi tên một dòng</label>
        <textarea id="invite-names" rows={7} required value={names} onChange={event => { setNames(event.target.value); reset(); }} placeholder={"Tuấn Thịnh + người yêu\nAnh Minh + chị Lan\nGia đình bạn An"} aria-describedby="invite-names-help" />
        <p id="invite-names-help" className="ed-config-help">Có thể nhập A+B hoặc A + người yêu trên cùng một dòng để mời chung. Dấu + và tên có dấu được giữ nguyên trong link, tối đa 120 ký tự mỗi tên. Danh sách chỉ xử lý trong trình duyệt, không lưu lên server.</p>
        <button type="submit" className="ed-save">Tạo link mời</button>
      </form>
      {feedback.text && <p className={feedback.error ? "ed-dialog-error" : "ed-config-help"} role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}
      {links.length > 0 && <ol className="ed-invite-results">{links.map(link => <li key={link.url}><div><strong>{link.name}</strong><a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></div><button aria-label={`Sao chép link của ${link.name}`} onClick={() => void copy(link.url)}>Sao chép</button></li>)}</ol>}
    </div>
    <footer>{links.length > 0 && <><button onClick={download}>Tải danh sách .txt</button><button className="ed-save" onClick={() => void copy(exportText)}>Sao chép tất cả</button></>}<button onClick={onClose}>Đóng</button></footer>
  </InPageDialog>;
}
