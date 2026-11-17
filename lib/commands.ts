import type { Content } from "./types.ts";
import { UI, type Lang } from "./i18n.ts";

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

const TEXT = {
  fr: {
    commands: {
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
    },
    available: "Commandes disponibles :",
    tips: "Astuces : Tab pour compléter, ↑ ↓ pour l'historique, Ctrl+L pour nettoyer.",
    domains: "Domaines  ",
    languages: "Langues   ",
    strengths: "Atouts    ",
    noPercent: "Aucun pourcentage ici : chaque compétence indique seulement d'où elle vient.",
    role: "Mon rôle sur ces projets : l'infrastructure et le déploiement, pas le code des applications.",
    more: (n: number) => `… et ${n} autres contributions`,
    noDate: "date non précisée",
    original: "ouvrir le document original ↗",
    certNote: "Ce sont des attestations de formation, pas des certifications professionnelles à examen.",
    resumeHint: ["Tapez ", " pour télécharger mon CV."],
    noCv: "CV non disponible pour le moment.",
    downloading: (f: string) => `Téléchargement de ${f}…`,
    fallback: "Si rien ne se passe : ",
    openCv: "ouvrir le CV ↗",
    packages: (tools: number, certs: number, projects: number) => `${tools} outils · ${certs} certificats · ${projects} projets`,
    askUsage: " <votre question>",
    asked: "→ question transmise à TADASHI AI…",
    catUsage: " <fichier>",
    notFound: (f: string) => `cat: ${f}: fichier introuvable`,
    whoami: ["Vous cherchez plutôt à savoir qui je suis ? Tapez ", "."],
    sudo: "visitor n'est pas dans le fichier sudoers. Cet incident sera signalé. 😉",
    exit: "Cette session reste ouverte — le portfolio aussi.",
    unknown: (c: string) => `bash: ${c}: commande introuvable`,
    helpHint: ["Tapez ", " pour voir les commandes disponibles."],
  },
  en: {
    commands: {
      help: "list available commands",
      about: "introduce my profile",
      skills: "show my technical skills",
      projects: "show my projects",
      certifications: "show my certificates",
      experience: "show my experience",
      education: "show my education",
      contact: "show my contact details",
      resume: "download my résumé",
      neofetch: "system-style summary of my profile",
      ask: "ask TADASHI AI a question — ask <question>",
      ls: "list files in the folder",
      cat: "print a file — cat about.md",
      whoami: "who are you?",
      history: "command history",
      clear: "clear the terminal",
    },
    available: "Available commands:",
    tips: "Tips: Tab to complete, ↑ ↓ for history, Ctrl+L to clear.",
    domains: "Domains   ",
    languages: "Languages ",
    strengths: "Strengths ",
    noPercent: "No percentages here: each skill only says where it comes from.",
    role: "My role on these projects: infrastructure and deployment, not the application code.",
    more: (n: number) => `… and ${n} more contributions`,
    noDate: "date not specified",
    original: "open the original document ↗",
    certNote: "These are course completion certificates, not exam-based professional certifications.",
    resumeHint: ["Type ", " to download my résumé."],
    noCv: "Résumé not available right now.",
    downloading: (f: string) => `Downloading ${f}…`,
    fallback: "If nothing happens: ",
    openCv: "open the résumé ↗",
    packages: (tools: number, certs: number, projects: number) => `${tools} tools · ${certs} certificates · ${projects} projects`,
    askUsage: " <your question>",
    asked: "→ question sent to TADASHI AI…",
    catUsage: " <file>",
    notFound: (f: string) => `cat: ${f}: No such file`,
    whoami: ["Looking for who I am instead? Type ", "."],
    sudo: "visitor is not in the sudoers file. This incident will be reported. 😉",
    exit: "This session stays open — so does the portfolio.",
    unknown: (c: string) => `bash: ${c}: command not found`,
    helpHint: ["Type ", " to see the available commands."],
  },
};

export const COMMANDS: Record<string, string> = TEXT.fr.commands;

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

export function run(input: string, c: Content, history: string[] = [], lang: Lang = "fr"): Result {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };
  const [rawCmd, ...args] = trimmed.split(/\s+/);
  const cmd = rawCmd.toLowerCase();
  const p = c.profile;
  const T = TEXT[lang];

  switch (cmd) {
    case "help":
      return {
        lines: [
          l(T.available),
          blank,
          ...Object.entries(T.commands).map(([name, desc]) => l("  ", k(name.padEnd(16)), m(desc))),
          blank,
          l(m(T.tips)),
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
          l(k(T.domains), p.domains.join(" · ")),
          l(k(T.languages), p.languages.join(" · ")),
          l(k(T.strengths), p.softSkills.join(" · ")),
        ],
      };

    case "skills":
      return {
        lines: [
          ...c.skills.flatMap((cat) => [
            l(a(`▸ ${cat.category}`)),
            ...cat.items.map((s) => l("    ", s.name.padEnd(26), m(UI[lang].evidence[s.evidence]))),
          ]),
          blank,
          l(m(T.noPercent)),
        ],
      };

    case "projects":
      return {
        lines: [
          l(m(T.role)),
          blank,
          ...c.projects.flatMap((x, i) => [
            l(a(`[${String(i + 1).padStart(2, "0")}] ${x.name}`)),
            l("     ", m(x.category || "—")),
            x.description ? l("     ", x.description) : blank,
            ...x.contribution.slice(0, 4).map((t) => l("     ", { t: "+ ", c: "ok" }, t)),
            x.contribution.length > 4 ? l("     ", m(T.more(x.contribution.length - 4))) : blank,
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
            l("  ", `${x.issuer}`, m(`  ·  ${x.date || T.noDate}  ·  ${x.kind}`)),
            x.file ? l("  ", link(T.original, fileUrl(x.file))) : blank,
            blank,
          ]),
          l(m(T.certNote)),
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
          p.email ? l(k("email     "), link(p.email, `mailto:${p.email}`)) : blank,
          p.linkedin ? l(k("linkedin  "), link(p.linkedin.replace(/^https?:\/\/(www\.)?/, ""), p.linkedin)) : blank,
          p.github ? l(k("github    "), link(p.github.replace(/^https?:\/\//, ""), p.github)) : blank,
          blank,
          l(m(T.resumeHint[0]), k("resume"), m(T.resumeHint[1])),
        ],
      };

    case "resume":
    case "cv":
      if (!p.cvFile) return { lines: [l({ t: T.noCv, c: "w" })] };
      return {
        lines: [l({ t: "✓ ", c: "ok" }, T.downloading(p.cvFile)), l(m(T.fallback), link(T.openCv, fileUrl(p.cvFile)))],
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
            l(k("Packages  "), T.packages(c.skills.reduce((n, s) => n + s.items.length, 0), c.certifications.length, c.projects.length)),
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
      if (!question) return { lines: [l("usage : ", k("ask"), T.askUsage)] };
      return { lines: [l(m(T.asked))], action: { type: "ask", question } };
    }

    case "ls":
      return { lines: [l(...Object.keys(FILES).flatMap((f) => [a(f), "  "]), p.cvFile ? m("cv.pdf") : "")] };

    case "cat": {
      if (!args[0]) return { lines: [l("usage : ", k("cat"), T.catUsage)] };
      if (args[0] === "cv.pdf") return run("resume", c, history, lang);
      const target = FILES[args[0]];
      return target ? run(target, c, history, lang) : { lines: [l({ t: T.notFound(args[0]), c: "w" })] };
    }

    case "whoami":
      return { lines: [l("visitor"), l(m(T.whoami[0]), k("about"), m(T.whoami[1]))] };

    case "history":
      return { lines: history.map((h, i) => l(m(String(i + 1).padStart(4) + "  "), h)) };

    case "clear":
      return { lines: [], action: { type: "clear" } };

    case "sudo":
      return { lines: [l({ t: T.sudo, c: "w" })] };

    case "exit":
      return { lines: [l(m(T.exit))] };

    default:
      return { lines: [l({ t: T.unknown(rawCmd.slice(0, 40)), c: "w" }), l(m(T.helpHint[0]), k("help"), m(T.helpHint[1]))] };
  }
}
