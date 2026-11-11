import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";
const TTL_MS = 8 * 60 * 60 * 1000;

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

function key(): Buffer {
  return crypto
    .createHash("sha256")
    .update(`${process.env.SESSION_SECRET || ""}:${process.env.ADMIN_PASSWORD || ""}`)
    .digest();
}

const sign = (payload: string) => crypto.createHmac("sha256", key()).update(payload).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string): boolean {
  return adminEnabled() && safeEqual(candidate, process.env.ADMIN_PASSWORD!);
}

export async function startSession() {
  const exp = String(Date.now() + TTL_MS);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

/** Refuse les requêtes modifiantes venant d'une autre origine (défense CSRF). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") || req.headers.get("host"));
  } catch {
    return false;
  }
}

/** Garde commune des routes d'administration. Retourne une réponse d'erreur, ou null si autorisé. */
export async function guardAdmin(req: Request): Promise<Response | null> {
  if (!sameOrigin(req)) return Response.json({ error: "Origine refusée" }, { status: 403 });
  if (!(await isAdmin())) return Response.json({ error: "Non authentifié" }, { status: 401 });
  return null;
}
