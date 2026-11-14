import { WeddingEditor } from "@/components/admin/editor";
import { getEditorMedia, getWeddingData } from "@/lib/wedding-server";

export default async function AdminPage() {
  const deployment = process.env.NODE_ENV === "production";
  return <WeddingEditor initialData={await getWeddingData()} deployment={deployment} initialAssets={deployment ? await getEditorMedia() : []} />;
}
