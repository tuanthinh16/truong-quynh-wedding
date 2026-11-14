import { notFound } from "next/navigation";
import WeddingInvitation from "@/components/wedding-invitation";
import WeddingLive from "@/components/wedding-live";
import { Suspense } from "react";

export { getWeddingMetadata as generateMetadata } from "@/lib/wedding-server";

export function generateStaticParams() {
  return [{ side: "nha-trai" }, { side: "nha-gai" }];
}

async function SideInvitationContent({ params }: { params: Promise<{ side: string }> }) {
  const { side } = await params;
  if (side !== "nha-trai" && side !== "nha-gai") notFound();
  return <WeddingLive><WeddingInvitation side={side === "nha-trai" ? "groom" : "bride"} /></WeddingLive>;
}

export default function SideInvitation({ params }: { params: Promise<{ side: string }> }) {
  return <Suspense fallback={<main className="invitation-page" aria-busy="true"><p role="status">Đang mở thiệp mời…</p></main>}><SideInvitationContent params={params} /></Suspense>;
}
