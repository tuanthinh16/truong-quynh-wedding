import { AdminLogin } from "@/components/admin/login";
import { WeddingEditor } from "@/components/admin/editor";
import { getWeddingData } from "@/lib/wedding-server";

export default async function LoginPage() { return process.env.NODE_ENV === "production" ? <WeddingEditor initialData={await getWeddingData()} readOnly /> : <AdminLogin />; }
