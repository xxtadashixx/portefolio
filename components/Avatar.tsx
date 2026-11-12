/** Avatar pixel art dans son cadre : la signature visuelle du site. */
export function Avatar({ src, name, className = "" }: { src: string; name: string; className?: string }) {
  return (
    <span className={`avatar ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Avatar pixel art de ${name}`} width={72} height={72} decoding="async" />
    </span>
  );
}
