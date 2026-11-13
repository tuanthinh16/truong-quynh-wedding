import { getWeddingData } from "@/lib/wedding-server";
import { wedding } from "@/config/wedding";
import { WeddingContentProvider } from "./wedding-content";
import { WeddingAudioProvider } from "./wedding-audio";

export default async function WeddingLive({ children, audio = false }: { children: React.ReactNode; audio?: boolean }) {
  const data = audio ? await getWeddingData().catch(() => wedding) : await getWeddingData();
  return <WeddingContentProvider value={data} preview={false}>{audio ? <WeddingAudioProvider>{children}</WeddingAudioProvider> : children}</WeddingContentProvider>;
}
