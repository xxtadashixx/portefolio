export type Evidence = "practiced" | "academic" | "training" | "declared";

export interface Profile {
  name: string;
  legalName: string;
  title: string;
  tagline: string;
  intro: string;
  summary: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  cvFile: string;
  avatarFile: string;
  domains: string[];
  softSkills: string[];
  languages: string[];
  associations: string[];
}

export interface Education {
  title: string;
  school: string;
  year: string;
  detail: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  summary: string;
  bullets: string[];
}

export interface SkillItem {
  name: string;
  icon: string;
  description: string;
  evidence: Evidence;
}

export interface SkillCategory {
  category: string;
  items: SkillItem[];
}

export interface Project {
  id: string;
  name: string;
  category: string;
  period: string;
  /** Résumé en une phrase */
  description: string;
  /** L'application ou la solution concernée (souvent développée par d'autres) */
  application: string;
  /** Ce que Rynah a réalisé lui-même */
  contribution: string[];
  stack: string[];
  /** Étapes du pipeline, une par ligne : « étape | job, job » */
  pipeline: string[];
  architecture: string[];
  screenshots: string[];
  github: string;
  featured: boolean;
  missing: string[];
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  icon: string;
  date: string;
  kind: string;
  credentialId: string;
  skills: string[];
  file: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  file: string;
  text: string;
}

export interface Note {
  id: string;
  title: string;
  text: string;
}

export interface Content {
  profile: Profile;
  education: Education[];
  experience: Experience[];
  skills: SkillCategory[];
  otherSkills: string[];
  projects: Project[];
  certifications: Certification[];
  documents: KnowledgeDocument[];
  notes: Note[];
}

export interface ContactMessage {
  id: string;
  at: string;
  name: string;
  email: string;
  message: string;
}

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  practiced: "Pratiqué en projet",
  academic: "Projet académique",
  training: "Formation suivie",
  declared: "Déclaré",
};
