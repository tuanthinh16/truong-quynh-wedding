import { notFound } from "next/navigation";
import WeddingInvitation from "@/components/wedding-invitation";

export function generateStaticParams() {
  return [{ side: "nha-trai" }, { side: "nha-gai" }];
}

export default async function SideInvitation({ params }: { params: Promise<{ side: string }> }) {
  const { side } = await params;
  if (side !== "nha-trai" && side !== "nha-gai") notFound();
  return <WeddingInvitation side={side === "nha-trai" ? "groom" : "bride"} />;
}
