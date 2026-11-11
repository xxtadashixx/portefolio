import Anthropic from "@anthropic-ai/sdk";
import { llmConfigured, streamAnswer, type ChatTurn } from "@/lib/llm";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 12;
const MAX_CHARS = 800;
const json = (error: string, status: number, headers?: HeadersInit) => Response.json({ error }, { status, headers });

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
  if (!llmConfigured()) return json("L'assistant n'est pas encore configuré sur ce serveur.", 503);

  const ip = clientIp(req);
  const perMinute = rateLimit(`chat:m:${ip}`, Number(process.env.CHAT_RATE_PER_MINUTE) || 8, 60_000);
  const perDay = rateLimit(`chat:d:${ip}`, Number(process.env.CHAT_RATE_PER_DAY) || 60, 86_400_000);
  const blocked = !perMinute.ok ? perMinute : !perDay.ok ? perDay : null;
  if (blocked) {
    return json("Trop de questions en peu de temps. Réessayez dans un instant.", 429, {
      "Retry-After": String(blocked.retryAfter),
    });
  }

  let turns: ChatTurn[] | null = null;
  try {
    turns = parseTurns(await req.json());
  } catch {
    /* corps invalide */
  }
  if (!turns) return json("Requête invalide.", 400);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        for await (const event of streamAnswer(turns, req.signal)) {
          if (event.type === "text") send({ t: event.text });
          else send({ error: "Je ne peux pas répondre à cette demande. Posez-moi une question sur le parcours de Rynah." });
        }
        send({ done: true });
      } catch (err) {
        if (err instanceof Anthropic.APIUserAbortError) {
          /* visiteur parti */
        } else if (err instanceof Anthropic.RateLimitError) {
          send({ error: "L'assistant est très sollicité. Réessayez dans une minute." });
        } else if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          console.error("[chat] clé API refusée");
          send({ error: "L'assistant est mal configuré côté serveur." });
        } else if (err instanceof Anthropic.APIConnectionError) {
          send({ error: "Le service d'IA est injoignable pour le moment. Réessayez plus tard." });
        } else {
          console.error("[chat]", err instanceof Error ? err.message : err);
          send({ error: "Une erreur est survenue. Réessayez plus tard." });
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
