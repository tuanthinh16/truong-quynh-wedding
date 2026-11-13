import { cloudStore } from "@/lib/cloud-runtime";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/.test(filename)) return new Response(null, { status: 404 });
  try {
    const image = await cloudStore.readImage(filename);
    if (!image || image.statusCode !== 200) return new Response(null, { status: 404 });
    return new Response(image.stream, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
