import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Rynah Tadashi — DevOps & Cloud Engineer", template: "%s · Rynah Tadashi" },
  description:
    "Portfolio de Rynah Tadashi, DevOps & Cloud Engineer : automatisation CI/CD, conteneurs Docker, infrastructure cloud, sécurité et monitoring. Terminal interactif et assistant IA.",
  keywords: ["DevOps", "Cloud", "CI/CD", "GitLab CI", "Docker", "Ansible", "Terraform", "Prometheus", "Grafana", "Madagascar", "Rynah Tadashi"],
  authors: [{ name: "Rynah Tadashi" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    locale: "fr_FR",
    title: "Rynah Tadashi — DevOps & Cloud Engineer",
    description: "I build, automate and secure modern infrastructure to turn complex ideas into reliable solutions.",
    url: "/",
    siteName: "Rynah Tadashi",
  },
  twitter: { card: "summary_large_image", title: "Rynah Tadashi — DevOps & Cloud Engineer" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#04060c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
