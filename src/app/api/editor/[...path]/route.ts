import { cloudEditor } from "@/lib/cloud-runtime";

export const maxDuration = 60;

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return cloudEditor.handle(request, path.join("/"));
}

export { handle as GET, handle as POST, handle as PUT };
