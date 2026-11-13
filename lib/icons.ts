import "server-only";
import * as si from "simple-icons";

export interface BrandIcon {
  path: string;
  color: string;
  title: string;
}

/** Marques absentes de simple-icons : on affiche un monogramme plutôt qu'un logo approximatif. */
const MONOGRAMS: Record<string, string> = {
  aws: "AWS",
  azure: "Az",
  windows: "Win",
  kodekloud: "KK",
  secnum: "SNA",
};

const ALIASES: Record<string, string> = {
  gcp: "googlecloud",
  traefik: "traefikproxy",
  k8s: "kubernetes",
  css3: "css",
};

function readable(hex: string): string {
  const n = parseInt(hex, 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  // Les couleurs de marque trop sombres seraient illisibles sur fond nuit.
  return lum < 0.35 ? "#dbe4f3" : `#${hex}`;
}

export function getIcon(slug: string): BrandIcon | null {
  const key = ALIASES[slug] ?? slug;
  const name = `si${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  const icon = (si as unknown as Record<string, { path: string; hex: string; title: string } | undefined>)[name];
  return icon ? { path: icon.path, color: readable(icon.hex), title: icon.title } : null;
}

export function getMonogram(slug: string, fallbackName: string): string {
  return MONOGRAMS[slug] ?? fallbackName.replace(/[^A-Za-z0-9 ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}
