import type { Content } from "./types.ts";

/**
 * Base de connaissances de l'assistant : le contenu du portfolio et le texte
 * extrait des documents sont découpés en passages, indexés (BM25) puis les
 * passages les plus proches de la question sont fournis au modèle.
 */

export interface Chunk {
  id: string;
  title: string;
  source: string;
  text: string;
}

export interface Index {
  chunks: Chunk[];
  docs: Map<string, number>[];
  lengths: number[];
  avgLength: number;
  df: Map<string, number>;
}

const EVIDENCE_TEXT: Record<string, string> = {
  practiced: "pratiqué en projet réel (stage)",
  academic: "pratiqué en projet académique",
  training: "connaissance issue d'une formation",
  declared: "compétence déclarée, sans projet documenté",
};

const STOPWORDS = new Set(
  (
    "le la les un une des du de d l et ou a au aux en dans sur pour par avec sans ce cet cette ces il elle ils elles on " +
    "je tu nous vous son sa ses leur leurs mon ma mes est sont etait ete etre avoir ont que qui quoi quel quelle quels " +
    "quelles dont ou comment pourquoi quand plus moins tres se ne pas y t s c n m qu " +
    "the an of to in on for with and or is are was were be been has have had do does did what which who whom how why " +
    "when where can could would should his her he she it its they them their this that these those i you we me my your " +
    "about from as at by not any some"
  ).split(" "),
);

/** Élargit la question avec des termes proches présents dans les documents. */
const EXPANSIONS: Record<string, string[]> = {
  k8s: ["kubernetes"],
  amazon: ["aws"],
  gcp: ["google", "cloud"],
  google: ["gcp"],
  diplome: ["licence", "education", "baccalaureat"],
  degree: ["licence", "education"],
  etude: ["licence", "education"],
  formation: ["licence", "education", "cours", "certificat"],
  studied: ["licence", "education"],
  study: ["licence", "education"],
  etudie: ["licence", "education"],
  universite: ["licence", "education"],
  university: ["licence", "education", "universite"],
  ecole: ["universite", "education"],
  recruter: ["profil", "competence", "experience", "stage"],
  embaucher: ["profil", "competence", "experience", "stage"],
  hire: ["profil", "competence", "experience", "stage"],
  contacter: ["contact", "email", "linkedin"],
  joindre: ["contact", "email", "linkedin"],
  reach: ["contact", "email", "linkedin"],
  mail: ["email", "contact"],
  internship: ["stage", "stagiaire", "hairun"],
  job: ["stage", "experience"],
  work: ["stage", "experience"],
  travaille: ["stage", "experience"],
  worked: ["stage", "experience"],
  certification: ["certificat", "certificate", "attestation"],
  certificat: ["certification", "certificate", "attestation"],
  certificate: ["certificat", "certification"],
  skill: ["competence"],
  outil: ["competence"],
  tool: ["competence"],
  technologie: ["competence", "stack"],
  maitrise: ["competence"],
  project: ["projet"],
  realisation: ["projet"],
  language: ["langue"],
  speak: ["langue"],
  parle: ["langue"],
  resume: ["cv"],
  developpeur: ["contribution", "role", "application"],
  developer: ["contribution", "role", "application"],
  developpe: ["contribution", "role", "application"],
  developed: ["contribution", "role", "application"],
  code: ["contribution", "role"],
  role: ["contribution"],
  sauvegarde: ["backup", "ansible"],
  backup: ["sauvegarde", "ansible"],
  vulnerabilite: ["trivy", "scan"],
  https: ["ssl", "tls", "traefik", "certificat"],
  pipeline: ["ci", "cd", "gitlab"],
  conteneur: ["docker", "containerisation"],
  container: ["docker", "containerisation"],
  supervision: ["monitoring", "prometheus", "grafana"],
  observabilite: ["monitoring", "prometheus", "grafana"],
  securite: ["security", "ssl", "tls", "traefik", "cybersecurity"],
  security: ["securite", "ssl", "tls", "traefik", "cybersecurity"],
  iac: ["terraform", "infrastructure"],
  qui: ["profil", "identite"],
  who: ["profil", "identite"],
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t));
}

function splitLong(text: string, max = 900): string[] {
  const parts: string[] = [];
  let current = "";
  for (const para of text.split(/\n+/).map((p) => p.trim()).filter(Boolean)) {
    for (const piece of para.length > max ? para.match(new RegExp(`.{1,${max}}(\\s|$)`, "gs")) ?? [para] : [para]) {
      if (current && current.length + piece.length > max) {
        parts.push(current);
        current = "";
      }
      current += (current ? "\n" : "") + piece.trim();
    }
  }
  if (current) parts.push(current);
  return parts;
}

export function buildChunks(c: Content): Chunk[] {
  const p = c.profile;
  const chunks: Chunk[] = [];
  const add = (id: string, title: string, source: string, text: string) => {
    if (text.trim()) chunks.push({ id, title, source, text: text.trim() });
  };

  add(
    "profil",
    `Profil et identité — ${p.name}`,
    "Portfolio",
    [
      `Nom d'usage : ${p.name}. Nom complet : ${p.legalName}.`,
      `Titre : ${p.title}. ${p.tagline}`,
      p.summary,
      p.location && `Localisation : ${p.location}.`,
      p.domains.length && `Domaines : ${p.domains.join(", ")}.`,
      p.softSkills.length && `Compétences personnelles : ${p.softSkills.join(", ")}.`,
      p.languages.length && `Langues : ${p.languages.join(" ; ")}.`,
      p.associations.length && `Vie associative : ${p.associations.join(", ")}.`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  add(
    "contact",
    "Contact — email, LinkedIn, GitHub, CV",
    "Portfolio",
    [
      p.email && `Email : ${p.email}`,
      p.linkedin && `LinkedIn : ${p.linkedin}`,
      p.github && `GitHub : ${p.github}`,
      p.cvFile && "Le CV est téléchargeable depuis le portfolio (bouton « Télécharger mon CV » ou commande resume du terminal).",
      "Un formulaire de contact est disponible en bas du portfolio.",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  add(
    "education",
    "Formation et diplômes (éducation)",
    "CV",
    c.education.map((e) => `${e.year} — ${e.title}, ${e.school}. ${e.detail}`.trim()).join("\n"),
  );

  c.experience.forEach((e, i) =>
    add(
      `experience-${i}`,
      `Expérience professionnelle — ${e.role}, ${e.company}`,
      "CV",
      `${e.role} chez ${e.company} (${e.period}). ${e.summary}\n${e.bullets.map((b) => `- ${b}`).join("\n")}`,
    ),
  );

  for (const cat of c.skills) {
    add(
      `competences-${cat.category}`,
      `Compétences techniques — ${cat.category}`,
      "Portfolio",
      cat.items.map((s) => `${s.name} : ${s.description} [${EVIDENCE_TEXT[s.evidence]}]`).join("\n"),
    );
  }
  if (c.otherSkills.length) {
    add("competences-autres", "Autres compétences mentionnées dans le CV", "CV", c.otherSkills.join(" ; "));
  }

  for (const x of c.projects) {
    const documented = Boolean(x.description.trim());
    add(
      `projet-${x.id}`,
      `Projet — ${x.name}`,
      "Portfolio",
      [
        `${x.name} (${[x.category, x.period].filter(Boolean).join(", ")}).`,
        documented ? x.description : "Ce projet est annoncé mais sa description n'est pas encore documentée.",
        x.stack.length && `Technologies : ${x.stack.join(", ")}.`,
        x.architecture.length && `Architecture : ${x.architecture.join(" → ")}.`,
        x.application && `Application ou solution concernée : ${x.application}`,
        x.contribution.length && `Contribution DevOps de Rynah : ${x.contribution.join(" ; ")}.`,
        x.pipeline.length && `Pipeline : ${x.pipeline.map((s) => s.replace("|", ":")).join(" → ")}.`,
        x.github && `GitHub : ${x.github}`,
        x.missing.length && `Informations non disponibles : ${x.missing.join(", ")}.`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (c.certifications.length) {
    add(
      "certifications",
      "Liste des certificats et attestations de formation obtenus",
      "Certificats",
      c.certifications
        .map(
          (x) =>
            `- ${x.title} — ${x.issuer}, ${x.date || "date non précisée"} (${x.kind})` +
            (x.skills.length ? `. Thèmes : ${x.skills.join(", ")}` : ""),
        )
        .join("\n"),
    );
  }

  for (const d of c.documents) {
    splitLong(d.text).forEach((part, i) => add(`${d.id}-${i}`, d.title, "Document importé", part));
  }
  for (const n of c.notes) {
    splitLong(n.text).forEach((part, i) => add(`${n.id}-${i}`, n.title, "Note", part));
  }
  return chunks;
}

export function buildIndex(content: Content): Index {
  const chunks = buildChunks(content);
  const df = new Map<string, number>();
  const docs = chunks.map((ch) => {
    // Le titre compte double : il résume le passage.
    const tf = new Map<string, number>();
    for (const t of [...tokenize(ch.title), ...tokenize(ch.title), ...tokenize(ch.text)]) {
      tf.set(t, (tf.get(t) ?? 0) + 1);
    }
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return tf;
  });
  const lengths = docs.map((tf) => [...tf.values()].reduce((a, b) => a + b, 0));
  const avgLength = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  return { chunks, docs, lengths, avgLength, df };
}

export function search(index: Index, query: string, k = 6): { chunk: Chunk; score: number }[] {
  const base = tokenize(query);
  const terms = new Map<string, number>();
  for (const t of base) {
    terms.set(t, 1);
    for (const extra of (EXPANSIONS[t] ?? []).flatMap(tokenize)) if (!terms.has(extra)) terms.set(extra, 0.5);
  }
  const N = index.chunks.length;
  const K1 = 1.4;
  const B = 0.75;
  return index.docs
    .map((tf, i) => {
      let score = 0;
      for (const [term, weight] of terms) {
        const f = tf.get(term);
        if (!f) continue;
        const n = index.df.get(term) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += weight * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * index.lengths[i]) / index.avgLength)));
      }
      return { chunk: index.chunks[i], score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Passages fournis au modèle : la fiche profil (toujours), puis les meilleurs
 * résultats pour la question, enrichie de la question précédente pour les relances
 * du type « et avec Docker ? ».
 */
export function retrieve(index: Index, question: string, previousQuestion = "", k = 7): Chunk[] {
  const picked = new Map<string, Chunk>();
  const pinned = index.chunks.find((c) => c.id === "profil");
  if (pinned) picked.set(pinned.id, pinned);
  for (const r of search(index, question, k)) picked.set(r.chunk.id, r.chunk);
  if (previousQuestion) {
    for (const r of search(index, `${previousQuestion} ${question}`, 3)) picked.set(r.chunk.id, r.chunk);
  }
  return [...picked.values()].slice(0, k + 3);
}

export function formatContext(chunks: Chunk[]): string {
  return chunks
    .map((c, i) => `<document index="${i + 1}" source="${c.source}" titre="${c.title.replace(/"/g, "'")}">\n${c.text}\n</document>`)
    .join("\n");
}
