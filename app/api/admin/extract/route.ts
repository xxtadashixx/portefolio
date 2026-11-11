import { promises as fs } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { guardAdmin } from "@/lib/auth";
import { llmConfigured, transcribeDocument } from "@/lib/llm";
import { mimeFor, resolveFile } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Extrait le texte d'un fichier déjà importé, pour la base documentaire.
 * PDF textuel : extraction locale. PDF scanné ou image : transcription par le modèle.
 */
export async function POST(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const { file } = await req.json().catch(() => ({ file: "" }));
  const path = typeof file === "string" ? await resolveFile(file) : null;
  if (!path) return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  const mime = mimeFor(file)!;
  const data = await fs.readFile(path);

  if (mime === "application/pdf") {
    try {
      const text = (await pdfParse(data)).text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (text.length > 40) return Response.json({ text, method: "pdf" });
    } catch {
      /* PDF illisible localement : on tente la transcription par le modèle */
    }
  }
  if (!llmConfigured()) {
    return Response.json(
      { error: "Ce fichier ne contient pas de texte extractible. Configurez ANTHROPIC_API_KEY pour le transcrire, ou saisissez le texte à la main." },
      { status: 503 },
    );
  }
  try {
    return Response.json({ text: await transcribeDocument(data, mime), method: "llm" });
  } catch (e) {
    const message = e instanceof Anthropic.APIError ? `Service d'IA indisponible (${e.status ?? "réseau"}).` : e instanceof Error ? e.message : "Échec de l'extraction.";
    return Response.json({ error: message }, { status: 502 });
  }
}
