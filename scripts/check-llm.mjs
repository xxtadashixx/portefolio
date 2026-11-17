// Diagnostic de l'assistant : teste la clé Gemini et chaque modèle configuré, et affiche la réponse exacte de Google.
//   npm run check:llm        (lit le fichier .env)
// La clé n'est jamais affichée.
const key = process.env.GEMINI_API_KEY ?? "";
const base = (process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
const models = [...new Set([process.env.LLM_MODEL, process.env.GEMINI_MODELS, process.env.GEMINI_MODEL].flatMap((v) => (v ?? "").split(",")).map((m) => m.trim().replace(/^models\//, "")).filter(Boolean))];
if (!models.length) models.push("gemini-2.5-flash");

const ok = (t) => console.log(`  ✓ ${t}`);
const ko = (t) => console.log(`  ✗ ${t}`);
const short = (t) => String(t).replace(/\s+/g, " ").slice(0, 260);

console.log("\n1. Clé");
if (!key) {
  ko("GEMINI_API_KEY est vide ou absente (le fichier .env est-il à la racine du projet ?)");
  process.exit(1);
}
console.log(`  longueur : ${key.length} caractères, commence par « ${key.slice(0, 4)} »`);
if (/^AIza[0-9A-Za-z_-]{30,}$/.test(key)) ok("le format ressemble à une clé Google");
else ko("le format ne ressemble pas à une clé Google (elle commence par AIza et fait ~39 caractères). Placeholder, guillemets ou espace en trop ?");

console.log("\n2. Modèles disponibles pour cette clé");
let available = [];
try {
  const res = await fetch(`${base}/v1beta/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) ko(`HTTP ${res.status} ${short(JSON.stringify(body))}`);
  else {
    available = (body.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, ""));
    ok(`${available.length} modèles acceptent generateContent. Ceux de la famille « flash » :`);
    console.log("   " + (available.filter((m) => /flash/.test(m)).join("\n   ") || "(aucun)"));
  }
} catch (e) {
  ko(`réseau : ${e.message}`);
}

console.log("\n3. Test de chaque modèle configuré (dans l'ordre d'essai du site)");
let working = 0;
for (const model of models) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Réponds seulement : OK" }] }], generationConfig: { maxOutputTokens: 256 } }),
    });
    const body = await res.json().catch(() => ({}));
    const ms = Date.now() - t0;
    if (res.ok) {
      const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      ok(`${model} — répond en ${ms} ms : « ${short(text)} »`);
      working++;
    } else {
      ko(`${model} — HTTP ${res.status} : ${short(body.error?.message ?? JSON.stringify(body))}`);
      if (res.status === 404 && available.length) console.log(`    → ce modèle n'existe pas pour votre clé ; essayez par exemple LLM_MODEL=${available.find((m) => /flash/.test(m)) ?? available[0]}`);
      if (res.status === 429) console.log("    → quota atteint pour ce modèle (par minute ou par jour) ; ajoutez un autre modèle à LLM_MODEL");
      if (res.status === 400 && /location/i.test(body.error?.message ?? "")) console.log("    → l'API Gemini n'est pas disponible depuis votre pays/hébergeur pour cette offre");
    }
  } catch (e) {
    ko(`${model} — réseau : ${e.message}`);
  }
}
console.log(working ? `\nRésultat : ${working} modèle(s) fonctionnent. L'assistant doit répondre.\n` : "\nRésultat : aucun modèle ne répond. Corrigez la cause indiquée ci-dessus.\n");
process.exit(working ? 0 : 1);
