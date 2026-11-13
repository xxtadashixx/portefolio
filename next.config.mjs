/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

export default {
  // Image Docker : sortie autonome. Render et Vercel utilisent la sortie standard.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Le contenu initial est lu sur disque à l'exécution : il doit suivre les fonctions serveur.
  outputFileTracingIncludes: { "/**": ["./content/seed/**/*"] },
  poweredByHeader: false,
  serverExternalPackages: ["pdf-parse"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
