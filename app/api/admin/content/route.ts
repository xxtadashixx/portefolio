import { guardAdmin } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return (await guardAdmin(req)) ?? Response.json(await getContent());
}

export async function PUT(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  try {
    return Response.json(await saveContent(await req.json()));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Contenu invalide" }, { status: 422 });
  }
}
