import { LlmError, llmConfigured, streamAnswer, type ChatTurn } from "@/lib/llm";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 12;
const MAX_CHARS = 800;
const json = (error: string, status: number, headers?: HeadersInit) => Response.json({ error }, { status, headers });

const MESSAGES = {
  fr: {
    off: "L'assistant n'est pas encore configuré sur ce serveur.",
    rate: "Trop de questions en peu de temps. Réessayez dans un instant.",
    bad: "Requête invalide.",
    refusal: "Je ne peux pas répondre à cette demande. Posez-moi une question sur le parcours de Rynah.",
    busy: "L'assistant est très sollicité. Réessayez dans une minute.",
    config: "L'assistant est mal configuré côté serveur.",
    down: "Le service d'IA est injoignable pour le moment. Réessayez plus tard.",
    error: "Une erreur est survenue. Réessayez plus tard.",
  },
  en: {
    off: "The assistant is not configured on this server yet.",
    rate: "Too many questions in a short time. Try again in a moment.",
    bad: "Invalid request.",
    refusal: "I can't answer that request. Ask me about Rynah's background.",
    busy: "The assistant is very busy. Try again in a minute.",
    config: "The assistant is misconfigured on the server.",
    down: "The AI service is unreachable right now. Try again later.",
    error: "Something went wrong. Try again later.",
  },
};

function parseTurns(body: unknown): ChatTurn[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const turns: ChatTurn[] = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return null;
    const content = m.content.trim().slice(0, m.role === "user" ? MAX_CHARS : 4000);
    if (content) turns.push({ role: m.role, content });
  }
  // La conversation envoyée au modèle doit commencer et finir par un message du visiteur.
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    /* corps invalide */
  }
  const M = MESSAGES[(body as { lang?: unknown })?.lang === "en" ? "en" : "fr"];
  if (!llmConfigured()) return json(M.off, 503);

  const ip = clientIp(req);
  const perMinute = rateLimit(`chat:m:${ip}`, Number(process.env.CHAT_RATE_PER_MINUTE) || 8, 60_000);
  const perDay = rateLimit(`chat:d:${ip}`, Number(process.env.CHAT_RATE_PER_DAY) || 60, 86_400_000);
  // Plafond global : protège le quota de l'offre gratuite, quel que soit le nombre de visiteurs.
  const global = rateLimit("chat:global", Number(process.env.CHAT_RATE_GLOBAL_PER_MINUTE) || 10, 60_000);
  const blocked = !perMinute.ok ? perMinute : !perDay.ok ? perDay : !global.ok ? global : null;
  if (blocked) {
    return json(M.rate, 429, {
      "Retry-After": String(blocked.retryAfter),
    });
  }

  const turns = parseTurns(body);
  if (!turns) return json(M.bad, 400);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        for await (const event of streamAnswer(turns, req.signal)) {
          if (event.type === "text") send({ t: event.text });
          else send({ error: M.refusal });
        }
        send({ done: true });
      } catch (err) {
        // En local (npm run dev), la cause exacte est ajoutée au message pour faciliter le diagnostic.
        const why = process.env.NODE_ENV === "production" ? "" : ` [${err instanceof Error ? err.message : String(err)}]`;
        if (req.signal.aborted) {
          /* visiteur parti */
        } else if (err instanceof LlmError && err.kind === "rate") {
          send({ error: M.busy + why });
        } else if (err instanceof LlmError && (err.kind === "auth" || err.kind === "model")) {
          console.error("[chat] clé API refusée");
          send({ error: M.config + why });
        } else if (err instanceof LlmError && err.kind === "network") {
          send({ error: M.down + why });
        } else {
          console.error("[chat]", err instanceof Error ? err.message : err);
          send({ error: M.error + why });
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
