import { guardAdmin } from "@/lib/auth";
import { deleteMessage, getMessages } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return (await guardAdmin(req)) ?? Response.json(await getMessages());
}

export async function DELETE(req: Request) {
  const denied = await guardAdmin(req);
  if (denied) return denied;
  await deleteMessage(new URL(req.url).searchParams.get("id") ?? "");
  return Response.json({ ok: true });
}
