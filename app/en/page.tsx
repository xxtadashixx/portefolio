import type { Metadata } from "next";
import { Home } from "@/components/Home";
import { UI } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: UI.en.meta.title },
  description: UI.en.meta.description,
  alternates: { canonical: "/en", languages: { fr: "/", en: "/en" } },
  openGraph: { locale: "en_US", url: "/en", title: UI.en.meta.title, description: UI.en.meta.description },
};

export default function Page() {
  return <Home lang="en" />;
}
