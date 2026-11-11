import { guardAdmin } from "@/lib/auth";
import { mimeFor, saveUpload } from "@/lib/store";

export const runtime = "nodejs";
const MAX_BYTES = 8 * 1024 * 1024;

/** Vérifie que le contenu correspond bien à l'extension annoncée. */
function signatureMatches(buf: Buffer, mime: string): boolean {
  const head = buf.subarray(0, 12);
  if (mime === "application/pdf") return head.subarray(0, 5).toString() === "%PDF-";
  if (mime === "image/png") return head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (mime === "image/jpeg") return head[0] === 0xff && head[1] === 0xd8;
  if (mime === "image/webp") return head.subarray(0, 4).toString() === "RIFF" && head.subarray(8, 12).toString() === "WEBP";
  return false;
}

export async function POST(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Aucun fichier reçu." }, { status: 400 });
  const mime = mimeFor(file.name);
  if (!mime) return Response.json({ error: "Formats acceptés : PDF, PNG, JPG, WEBP." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Fichier trop volumineux (8 Mo maximum)." }, { status: 413 });
  const data = Buffer.from(await file.arrayBuffer());
  if (!signatureMatches(data, mime)) return Response.json({ error: "Le contenu ne correspond pas à l'extension du fichier." }, { status: 415 });
  return Response.json({ file: await saveUpload(file.name, data) });
}
