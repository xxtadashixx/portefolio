import { getIcon, getMonogram } from "@/lib/icons";

/** Logo officiel de la marque quand il est disponible, sinon un monogramme. */
export function Logo({ slug, name }: { slug: string; name: string }) {
  const icon = getIcon(slug);
  return (
    <span className="logo" style={icon ? { color: icon.color } : undefined} aria-hidden="true">
      {icon ? (
        <svg viewBox="0 0 24 24">
          <path d={icon.path} />
        </svg>
      ) : (
        getMonogram(slug, name)
      )}
    </span>
  );
}
