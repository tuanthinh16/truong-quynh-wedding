import { WeddingEditor } from "@/components/admin/editor";
import { getEditorMedia } from "@/lib/wedding-server";
import { requireOnlineAdmin } from "@/lib/editor-session";
import { Suspense } from "react";

async function AdminContent() {
  await requireOnlineAdmin();
  const deployment = process.env.NODE_ENV === "production";
  return <WeddingEditor deployment={deployment} initialAssets={deployment ? await getEditorMedia() : []} />;
}

export default function AdminPage() {
  return <Suspense fallback={<p role="status">Đang mở trang quản trị…</p>}><AdminContent /></Suspense>;
}
