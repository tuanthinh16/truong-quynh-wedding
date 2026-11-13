import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = { title: "Quản trị thiệp cưới", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
