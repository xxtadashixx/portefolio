import { addMessage } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limit = rateLimit(`contact:${clientIp(req)}`, 5, 3_600_000);
  if (!limit.ok) return Response.json({ error: "Trop de messages envoyés. Réessayez plus tard." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  // Champ piège invisible : seuls les robots le remplissent.
  if (body.website) return Response.json({ ok: true });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = String(body.message ?? "").trim();
  const errors: Record<string, string> = {};
  if (name.length < 2 || name.length > 100) errors.name = "Indiquez votre nom.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) errors.email = "Adresse email invalide.";
  if (message.length < 10 || message.length > 4000) errors.message = "Votre message doit contenir entre 10 et 4000 caractères.";
  if (Object.keys(errors).length) return Response.json({ error: "Formulaire invalide.", errors }, { status: 422 });

  const saved = await addMessage({ name, email, message });
  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (hook) {
    fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saved) }).catch(
      (e) => console.error("[contact] webhook", e?.message),
    );
  }
  return Response.json({ ok: true });
}
