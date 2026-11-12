import type { Content } from "./types.ts";
import { EVIDENCE_LABEL } from "./types.ts";

/** Moteur du terminal interactif : chaque commande produit des lignes à afficher. */

export interface Seg {
  t: string;
  /** Couleur : k = clé, a = accent, v = violet, ok = vert, w = avertissement, m = atténué */
  c?: "k" | "a" | "v" | "ok" | "w" | "m";
  href?: string;
}
export type Line = Seg[];
export interface Result {
  lines: Line[];
  neofetch?: { art: string[]; info: Line[] };
  action?: { type: "clear" } | { type: "download"; href: string } | { type: "ask"; question: string };
}

const l = (...segs: (Seg | string)[]): Line => segs.map((s) => (typeof s === "string" ? { t: s } : s));
const k = (t: string): Seg => ({ t, c: "k" });
const a = (t: string): Seg => ({ t, c: "a" });
const m = (t: string): Seg => ({ t, c: "m" });
const link = (t: string, href: string): Seg => ({ t, href, c: "a" });
const blank: Line = [];

export const COMMANDS: Record<string, string> = {
  help: "affiche les commandes disponibles",
  about: "présente mon profil",
  skills: "affiche mes compétences techniques",
  projects: "affiche mes projets",
  certifications: "affiche mes certificats",
  experience: "affiche mon expérience",
  education: "affiche ma formation",
  contact: "affiche mes coordonnées",
  resume: "télécharge mon CV",
  neofetch: "résumé système de mon profil",
  ask: "pose une question à TADASHI AI — ask <question>",
  ls: "liste les fichiers du dossier",
  cat: "affiche un fichier — cat about.md",
  whoami: "qui êtes-vous ?",
  history: "historique des commandes",
  clear: "nettoie le terminal",
};

const FILES: Record<string, string> = {
  "about.md": "about",
  "skills.yml": "skills",
  "projects.json": "projects",
  "certifications.txt": "certifications",
  "experience.log": "experience",
  "education.log": "education",
  "contact.txt": "contact",
};

const ART = ["    ____  ______", "   / __ \\/_  __/", "  / /_/ / / /   ", " / _, _/ / /    ", "/_/ |_| /_/     "];

export const fileUrl = (name: string, download = false) => `/api/files/${encodeURIComponent(name)}${download ? "?download" : ""}`;

export function complete(input: string): string[] {
  const [cmd, ...rest] = input.trimStart().split(/\s+/);
  if (rest.length === 0) return Object.keys(COMMANDS).filter((c) => c.startsWith(cmd.toLowerCase()));
  if (cmd === "cat" && rest.length === 1) {
    return Object.keys(FILES).filter((f) => f.startsWith(rest[0])).map((f) => `cat ${f}`);
  }
  return [];
}

export function run(input: string, c: Content, history: string[] = []): Result {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };
  const [rawCmd, ...args] = trimmed.split(/\s+/);
  const cmd = rawCmd.toLowerCase();
  const p = c.profile;

  switch (cmd) {
    case "help":
      return {
        lines: [
          l("Commandes disponibles :"),
          blank,
          ...Object.entries(COMMANDS).map(([name, desc]) => l("  ", k(name.padEnd(16)), m(desc))),
          blank,
          l(m("Astuces : Tab pour compléter, ↑ ↓ pour l'historique, Ctrl+L pour nettoyer.")),
        ],
      };

    case "about":
      return {
        lines: [
          l(a(p.name), m(`  (${p.legalName})`)),
          l(p.title),
          blank,
          l(p.summary),
          blank,
          l(k("Domaines  "), p.domains.join(" · ")),
          l(k("Langues   "), p.languages.join(" · ")),
          l(k("Atouts    "), p.softSkills.join(" · ")),
        ],
      };

    case "skills":
      return {
        lines: [
          ...c.skills.flatMap((cat) => [
            l(a(`▸ ${cat.category}`)),
            ...cat.items.map((s) => l("    ", s.name.padEnd(26), m(EVIDENCE_LABEL[s.evidence]))),
          ]),
          blank,
          l(m("Aucun pourcentage ici : chaque compétence indique seulement d'où elle vient.")),
        ],
      };

    case "projects":
      return {
        lines: [
          l(m("Mon rôle sur ces projets : l'infrastructure et le déploiement, pas le code des applications.")),
          blank,
          ...c.projects.flatMap((x, i) => [
          l(a(`[${String(i + 1).padStart(2, "0")}] ${x.name}`)),
          l("     ", m(x.category || "—")),
          x.description ? l("     ", x.description) : l("     ", { t: "fiche à compléter", c: "w" }),
          ...x.contribution.slice(0, 4).map((t) => l("     ", { t: "+ ", c: "ok" }, t)),
          x.contribution.length > 4 ? l("     ", m(`… et ${x.contribution.length - 4} autres contributions`)) : blank,
          x.stack.length ? l("     ", k("stack "), x.stack.join(", ")) : blank,
          x.github ? l("     ", k("repo  "), link(x.github, x.github)) : blank,
          blank,
        ]),
        ],
      };

    case "certifications":
    case "certs":
      return {
        lines: [
          ...c.certifications.flatMap((x) => [
            l({ t: "✓ ", c: "ok" }, a(x.title)),
            l("  ", `${x.issuer}`, m(`  ·  ${x.date || "date non précisée"}  ·  ${x.kind}`)),
            x.file ? l("  ", link("ouvrir le document original ↗", fileUrl(x.file))) : blank,
            blank,
          ]),
          l(m("Ce sont des attestations de formation, pas des certifications professionnelles à examen.")),
        ],
      };

    case "experience":
      return {
        lines: c.experience.flatMap((e) => [
          l(a(e.role), " @ ", k(e.company), m(`  ${e.period}`)),
          l(e.summary),
          ...e.bullets.map((b) => l("  • ", b)),
          blank,
        ]),
      };

    case "education":
      return { lines: c.education.map((e) => l(k(e.year.padEnd(6)), e.title, m(`  — ${e.school}`))) };

    case "contact":
      return {
        lines: [
          p.email ? l(k("email     "), link(p.email, `mailto:${p.email}`)) : l(k("email     "), m("à compléter")),
          p.linkedin ? l(k("linkedin  "), link(p.linkedin.replace(/^https?:\/\/(www\.)?/, ""), p.linkedin)) : l(k("linkedin  "), m("à compléter")),
          p.github ? l(k("github    "), link(p.github.replace(/^https?:\/\//, ""), p.github)) : l(k("github    "), m("à compléter")),
          blank,
          l(m("Tapez "), k("resume"), m(" pour télécharger mon CV.")),
        ],
      };

    case "resume":
    case "cv":
      if (!p.cvFile) return { lines: [l({ t: "CV non disponible pour le moment.", c: "w" })] };
      return {
        lines: [
          l({ t: "✓ ", c: "ok" }, `Téléchargement de ${p.cvFile}…`),
          l(m("Si rien ne se passe : "), link("ouvrir le CV ↗", fileUrl(p.cvFile))),
        ],
        action: { type: "download", href: fileUrl(p.cvFile, true) },
      };

    case "neofetch": {
      const practiced = c.skills.flatMap((s) => s.items).filter((s) => s.evidence === "practiced").map((s) => s.name);
      const exp = c.experience[0];
      return {
        lines: [],
        neofetch: {
          art: ART,
          info: [
            l(a("rynah"), "@", a("cloud")),
            l(m("-----------")),
            l(k("Name      "), p.name),
            l(k("Role      "), p.title),
            l(k("Location  "), p.location || "—"),
            l(k("Degree    "), c.education[0] ? `${c.education[0].title} (${c.education[0].year})` : "—"),
            l(k("Uptime    "), exp ? `${exp.role} @ ${exp.company}, ${exp.period}` : "—"),
            l(k("Shell     "), "bash · Linux"),
            l(k("Packages  "), `${c.skills.reduce((n, s) => n + s.items.length, 0)} outils · ${c.certifications.length} certificats · ${c.projects.length} projets`),
            l(k("Stack     "), practiced.slice(0, 6).join(", ")),
            l(k("Languages "), p.languages.map((x) => x.split(" — ")[0]).join(", ")),
            blank,
            l({ t: "███", c: "a" }, { t: "███", c: "k" }, { t: "███", c: "v" }, { t: "███", c: "ok" }, { t: "███", c: "w" }),
          ],
        },
      };
    }

    case "ask": {
      const question = args.join(" ");
      if (!question) return { lines: [l("usage : ", k("ask"), " <votre question>")] };
      return { lines: [l(m("→ question transmise à TADASHI AI…"))], action: { type: "ask", question } };
    }

    case "ls":
      return { lines: [l(...Object.keys(FILES).flatMap((f) => [a(f), "  "]), p.cvFile ? m("cv.pdf") : "")] };

    case "cat": {
      if (!args[0]) return { lines: [l("usage : ", k("cat"), " <fichier>")] };
      if (args[0] === "cv.pdf") return run("resume", c, history);
      const target = FILES[args[0]];
      return target ? run(target, c, history) : { lines: [l({ t: `cat: ${args[0]}: fichier introuvable`, c: "w" })] };
    }

    case "whoami":
      return { lines: [l("visitor"), l(m("Vous cherchez plutôt à savoir qui je suis ? Tapez "), k("about"), m("."))] };

    case "history":
      return { lines: history.map((h, i) => l(m(String(i + 1).padStart(4) + "  "), h)) };

    case "clear":
      return { lines: [], action: { type: "clear" } };

    case "sudo":
      return { lines: [l({ t: "visitor n'est pas dans le fichier sudoers. Cet incident sera signalé. 😉", c: "w" })] };

    case "exit":
      return { lines: [l(m("Cette session reste ouverte — le portfolio aussi."))] };

    default:
      return {
        lines: [
          l({ t: `bash: ${rawCmd.slice(0, 40)}: commande introuvable`, c: "w" }),
          l(m("Tapez "), k("help"), m(" pour voir les commandes disponibles.")),
        ],
      };
  }
}
