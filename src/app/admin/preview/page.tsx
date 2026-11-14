import { WeddingPreview } from "@/components/admin/preview";
import { requireOnlineAdmin } from "@/lib/editor-session";
import { Suspense } from "react";

async function PreviewContent() {
  await requireOnlineAdmin();
  return <WeddingPreview />;
}

export default function PreviewPage() {
  return <Suspense fallback={<p role="status">Đang mở bản xem trước…</p>}><PreviewContent /></Suspense>;
}
