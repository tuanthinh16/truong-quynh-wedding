import { notFound } from "next/navigation";
import WeddingInvitation from "@/components/wedding-invitation";
import WeddingLive from "@/components/wedding-live";
import { Suspense } from "react";

export { getWeddingMetadata as generateMetadata } from "@/lib/wedding-server";

export function generateStaticParams() {
  return [{ side: "nha-trai" }, { side: "nha-gai" }];
}

export default async function SideInvitation({ params }: { params: Promise<{ side: string }> }) {
  const { side } = await params;
  if (side !== "nha-trai" && side !== "nha-gai") notFound();
  return <Suspense fallback={null}><WeddingLive><WeddingInvitation side={side === "nha-trai" ? "groom" : "bride"} /></WeddingLive></Suspense>;
}
