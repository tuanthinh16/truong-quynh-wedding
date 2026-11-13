import { WeddingEditor } from "@/components/admin/editor";
import { getWeddingData } from "@/lib/wedding-server";

export default async function AdminPage() {
  return <WeddingEditor initialData={await getWeddingData()} readOnly={process.env.NODE_ENV === "production"} />;
}
