import { Home } from "@/components/Home";

// Le contenu est modifiable depuis /admin : la page est rendue à chaque requête.
export const dynamic = "force-dynamic";

export default function Page() {
  return <Home lang="fr" />;
}
