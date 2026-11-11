import { adminEnabled, checkPassword, isAdmin, sameOrigin, startSession } from "@/lib/auth";
import { llmConfigured } from "@/lib/llm";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ enabled: adminEnabled(), authenticated: await isAdmin(), llm: llmConfigured() });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Origine refusée" }, { status: 403 });
  if (!adminEnabled()) return Response.json({ error: "Administration désactivée : définissez ADMIN_PASSWORD." }, { status: 503 });
  if (!rateLimit(`login:${clientIp(req)}`, 5, 15 * 60_000).ok) {
    return Response.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !checkPassword(password)) {
    return Response.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  await startSession();
  return Response.json({ ok: true });
}
