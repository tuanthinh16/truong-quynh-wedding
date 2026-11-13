import { WeddingEditor } from "@/components/admin/editor";

export default function AdminPage() { return <WeddingEditor readOnly={process.env.NODE_ENV === "production"} />; }
