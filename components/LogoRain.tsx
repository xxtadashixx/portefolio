"use client";

import { useEffect, useRef, useState } from "react";
import { UI, type Lang } from "@/lib/i18n";

export interface RainLogo {
  name: string;
  path: string;
  color: string;
}

interface Drop {
  key: number;
  logo: RainLogo;
  left: number;
  duration: number;
  delay: number;
  size: number;
  popped: boolean;
}

let serial = 0;
const spawn = (logo: RainLogo, fresh = false): Drop => ({
  key: serial++,
  logo,
  left: 3 + Math.random() * 90,
  duration: 7 + Math.random() * 7,
  // Délai négatif : au chargement, les logos sont déjà répartis sur toute la hauteur.
  delay: fresh ? 0 : -Math.random() * 14,
  size: 34 + Math.round(Math.random() * 14),
  popped: false,
});

/**
 * Pluie de logos de la stack. Un clic fait éclater le logo, puis amène à la
 * carte de la technologie correspondante, mise en évidence quelques instants.
 */
export function LogoRain({ logos, lang }: { logos: RainLogo[]; lang: Lang }) {
  const t = UI[lang];
  const [drops, setDrops] = useState<Drop[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [last, setLast] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Positions aléatoires : générées côté navigateur uniquement, pour ne pas diverger du rendu serveur.
    setDrops(logos.map((logo) => spawn(logo)));
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => el.classList.toggle("paused", !entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [logos]);

  const goTo = (name: string) => {
    const cards = [...document.querySelectorAll<HTMLElement>(".tech")].filter((el) => el.dataset.brand === name);
    if (!cards.length) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cards[0].scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
    for (const card of cards) {
      card.classList.remove("flash");
      // Relecture forcée du style : relance l'animation si la carte est déjà surlignée.
      void card.offsetWidth;
      card.classList.add("flash");
      setTimeout(() => card.classList.remove("flash"), 2600);
    }
  };

  const pop = (drop: Drop) => {
    if (drop.popped) return;
    setDrops((all) => all.map((d) => (d.key === drop.key ? { ...d, popped: true } : d)));
    setSeen((names) => (names.includes(drop.logo.name) ? names : [...names, drop.logo.name]));
    setLast(drop.logo.name);
    setTimeout(() => goTo(drop.logo.name), 320);
    setTimeout(() => setDrops((all) => all.map((d) => (d.key === drop.key ? spawn(drop.logo, true) : d))), 650);
  };

  const complete = seen.length === logos.length && logos.length > 0;

  return (
    <div className="rain card" ref={box} data-reveal>
      <p className="rain-hud" aria-live="polite">
        <span>{complete ? t.rainDone : t.rainHint}</span>
        <b>
          {String(seen.length).padStart(2, "0")}/{String(logos.length).padStart(2, "0")}
        </b>
        {last && !complete && <em key={last}>→ {last}</em>}
      </p>
      {drops.map((d) => (
        <button
          key={d.key}
          type="button"
          className={`drop${d.popped ? " pop" : ""}${seen.includes(d.logo.name) ? " seen" : ""}`}
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            color: d.logo.color,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
          onClick={() => pop(d)}
          aria-label={t.rainGo(d.logo.name)}
          title={d.logo.name}
        >
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={d.logo.path} />
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
}
