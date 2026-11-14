import { AdminLogin } from "@/components/admin/login";
import { WeddingEditor } from "@/components/admin/editor";
import { getEditorMedia, getWeddingData } from "@/lib/wedding-server";

export default async function LoginPage() { return process.env.NODE_ENV === "production" ? <WeddingEditor initialData={await getWeddingData()} deployment initialAssets={await getEditorMedia()} /> : <AdminLogin />; }
