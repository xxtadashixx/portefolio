import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Content, ContactMessage } from "./types.ts";
import { validateContent } from "./validate.ts";
import type { Lang } from "./i18n.ts";

const SEED_DIR = path.join(process.cwd(), "content", "seed");
// Sur Vercel, seul /tmp est inscriptible (et il est vidé entre deux exécutions).
export const DATA_DIR = path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || (process.env.VERCEL ? "/tmp/portfolio-data" : "./data"));
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

const contentName = (lang: Lang) => (lang === "en" ? "content.en.json" : "content.json");
const cache = new Map<Lang, { mtimeMs: number; file: string; content: Content }>();

async function stat(file: string) {
  try {
    return await fs.stat(file);
  } catch {
    return null;
  }
}

/** Version courante du contenu : sert de clé de cache à l'index RAG. */
export function contentVersion(): string {
  const c = cache.get("fr");
  return c ? `${c.file}:${c.mtimeMs}` : "none";
}

/**
 * Contenu du site dans une langue. Le français fait référence : c'est lui qui
 * alimente l'assistant. L'anglais est une traduction d'affichage, stockée à part.
 */
export async function getContent(lang: Lang = "fr"): Promise<Content> {
  const liveFile = path.join(DATA_DIR, contentName(lang));
  const live = await stat(liveFile);
  const file = live ? liveFile : path.join(SEED_DIR, contentName(lang));
  const st = live ?? (await fs.stat(file));
  const hit = cache.get(lang);
  if (hit && hit.file === file && hit.mtimeMs === st.mtimeMs) return hit.content;
  const content = validateContent(JSON.parse(await fs.readFile(file, "utf8")));
  cache.set(lang, { mtimeMs: st.mtimeMs, file, content });
  return content;
}

async function writeAtomic(file: string, data: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(tmp, data, "utf8");
  await fs.rename(tmp, file);
}

export async function saveContent(input: unknown, lang: Lang = "fr"): Promise<Content> {
  const content = validateContent(input);
  await writeAtomic(path.join(DATA_DIR, contentName(lang)), JSON.stringify(content, null, 2));
  cache.delete(lang);
  return content;
}

// --- Fichiers (CV, certificats, captures) ---------------------------------

const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,120}$/;
export const ALLOWED_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export function mimeFor(name: string): string | null {
  return ALLOWED_TYPES[path.extname(name).toLowerCase()] ?? null;
}

/** Retourne le chemin d'un fichier public, ou null si le nom n'est pas sûr. */
export async function resolveFile(name: string): Promise<string | null> {
  if (!SAFE_NAME.test(name) || name.includes("..") || !mimeFor(name)) return null;
  for (const dir of [UPLOAD_DIR, path.join(SEED_DIR, "files")]) {
    const file = path.join(/* turbopackIgnore: true */ dir, name);
    if (await stat(file)) return file;
  }
  return null;
}

export function sanitizeFileName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path
    .basename(original, path.extname(original))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "fichier"}-${crypto.randomBytes(3).toString("hex")}${ext}`;
}

export async function saveUpload(original: string, data: Buffer): Promise<string> {
  const name = sanitizeFileName(original);
  if (!mimeFor(name)) throw new Error("Type de fichier non autorisé");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), data);
  return name;
}

// --- Messages du formulaire de contact -------------------------------------

export async function getMessages(): Promise<ContactMessage[]> {
  try {
    return JSON.parse(await fs.readFile(MESSAGES_FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function addMessage(m: Omit<ContactMessage, "id" | "at">): Promise<ContactMessage> {
  const all = await getMessages();
  const msg = { id: crypto.randomUUID(), at: new Date().toISOString(), ...m };
  await writeAtomic(MESSAGES_FILE, JSON.stringify([msg, ...all].slice(0, 500), null, 2));
  return msg;
}

export async function deleteMessage(id: string) {
  const all = await getMessages();
  await writeAtomic(MESSAGES_FILE, JSON.stringify(all.filter((m) => m.id !== id), null, 2));
}
