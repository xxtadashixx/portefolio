import { promises as fs } from "node:fs";
import { mimeFor, resolveFile } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const file = await resolveFile(name);
  if (!file) return new Response("Fichier introuvable", { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(await fs.readFile(file)), {
    headers: {
      "Content-Type": mimeFor(name)!,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
