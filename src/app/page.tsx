import WeddingEntrance from "@/components/wedding-entrance";
import WeddingLive from "@/components/wedding-live";
import { Suspense } from "react";

export { getWeddingMetadata as generateMetadata } from "@/lib/wedding-server";

export default function Home() {
  return <Suspense fallback={null}><WeddingLive><WeddingEntrance /></WeddingLive></Suspense>;
}
