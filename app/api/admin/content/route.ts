import { guardAdmin } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/store";
import { isLang, type Lang } from "@/lib/i18n";

const langOf = (req: Request): Lang => {
  const lang = new URL(req.url).searchParams.get("lang");
  return isLang(lang) ? lang : "fr";
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return (await guardAdmin(req)) ?? Response.json(await getContent(langOf(req)));
}

export async function PUT(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  try {
    return Response.json(await saveContent(await req.json(), langOf(req)));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Contenu invalide" }, { status: 422 });
  }
}
