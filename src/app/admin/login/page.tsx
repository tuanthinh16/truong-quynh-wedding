import { AdminLogin } from "@/components/admin/login";
import { WeddingEditor } from "@/components/admin/editor";

export default function LoginPage() { return process.env.NODE_ENV === "production" ? <WeddingEditor readOnly /> : <AdminLogin />; }
