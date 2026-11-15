import { NextResponse, type NextRequest } from "next/server";

/** Indique la langue de la page au layout racine, pour l'attribut <html lang>. */
export function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-lang", req.nextUrl.pathname === "/en" ? "en" : "fr");
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/", "/en"] };
