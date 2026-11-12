import type { Content } from "./types.ts";

const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");
const list = (v: unknown, max = 400) =>
  Array.isArray(v) ? v.map((x) => str(x, max).trim()).filter(Boolean).slice(0, 60) : [];
const arr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object").slice(0, 200) : [];
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** Seuls les liens http(s) sont acceptés : évite les URL javascript: saisies par erreur. */
const url = (v: unknown) => {
  const s = str(v, 500).trim();
  return /^https?:\/\//i.test(s) ? s : "";
};
const slug = (v: unknown, fallback: string) =>
  str(v, 80).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
const EVIDENCE = ["practiced", "academic", "training", "declared"] as const;

/**
 * Normalise n'importe quelle entrée (fichier JSON, formulaire d'administration)
 * vers la forme `Content` : champs manquants remplis, types forcés, tailles bornées.
 */
export function validateContent(input: unknown): Content {
  const c = obj(input);
  const p = obj(c.profile);
  if (!str(p.name).trim()) throw new Error("profile.name est requis");
  return {
    profile: {
      name: str(p.name, 120).trim(),
      legalName: str(p.legalName, 200),
      title: str(p.title, 200),
      tagline: str(p.tagline, 300),
      intro: str(p.intro, 600),
      summary: str(p.summary, 3000),
      location: str(p.location, 200),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(p.email).trim()) ? str(p.email, 200).trim() : "",
      linkedin: url(p.linkedin),
      github: url(p.github),
      cvFile: str(p.cvFile, 140),
      avatarFile: str(p.avatarFile, 140),
      domains: list(p.domains),
      softSkills: list(p.softSkills),
      languages: list(p.languages),
      associations: list(p.associations),
    },
    education: arr(c.education).map((e) => ({
      title: str(e.title, 300),
      school: str(e.school, 300),
      year: str(e.year, 40),
      detail: str(e.detail, 1000),
    })),
    experience: arr(c.experience).map((e) => ({
      role: str(e.role, 200),
      company: str(e.company, 200),
      period: str(e.period, 100),
      summary: str(e.summary, 1000),
      bullets: list(e.bullets, 1000),
    })),
    skills: arr(c.skills).map((s) => ({
      category: str(s.category, 100),
      items: arr(s.items).map((i) => ({
        name: str(i.name, 100),
        icon: str(i.icon, 60).toLowerCase(),
        description: str(i.description, 500),
        evidence: EVIDENCE.includes(i.evidence as never) ? (i.evidence as (typeof EVIDENCE)[number]) : "declared",
      })),
    })),
    otherSkills: list(c.otherSkills),
    projects: arr(c.projects).map((x, n) => ({
      id: slug(x.id, `projet-${n + 1}`),
      name: str(x.name, 200),
      category: str(x.category, 200),
      period: str(x.period, 100),
      description: str(x.description, 3000),
      stack: list(x.stack, 80),
      architecture: list(x.architecture, 120),
      application: str(x.application, 2000),
      // « features » : ancien nom du champ, encore accepté à la lecture.
      contribution: list(x.contribution ?? x.features, 500),
      pipeline: list(x.pipeline, 300),
      screenshots: list(x.screenshots, 140),
      github: url(x.github),
      featured: x.featured === true,
      missing: list(x.missing, 200),
    })),
    certifications: arr(c.certifications).map((x, n) => ({
      id: slug(x.id, `certificat-${n + 1}`),
      title: str(x.title, 400),
      issuer: str(x.issuer, 200),
      icon: str(x.icon, 60).toLowerCase(),
      date: str(x.date, 60),
      kind: str(x.kind, 120),
      credentialId: str(x.credentialId, 120),
      skills: list(x.skills, 120),
      file: str(x.file, 140),
    })),
    documents: arr(c.documents).map((x, n) => ({
      id: slug(x.id, `doc-${n + 1}`),
      title: str(x.title, 300),
      file: str(x.file, 140),
      text: str(x.text, 60000),
    })),
    notes: arr(c.notes).map((x, n) => ({
      id: slug(x.id, `note-${n + 1}`),
      title: str(x.title, 300),
      text: str(x.text, 20000),
    })),
  };
}
