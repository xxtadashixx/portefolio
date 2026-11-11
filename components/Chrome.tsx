"use client";

import { useEffect, useState } from "react";

export const STAGES = [
  { id: "about", label: "about" },
  { id: "stack", label: "stack" },
  { id: "projects", label: "projects" },
  { id: "certifications", label: "certs" },
  { id: "terminal", label: "terminal" },
  { id: "contact", label: "contact" },
];

/**
 * Habillage du site : navigation, rail « pipeline » qui suit le défilement,
 * barre d'état, et déclenchement des apparitions au scroll.
 */
export function Chrome({ cvHref }: { cvHref: string | null }) {
  const [active, setActive] = useState(-1);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("fx");
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            reveal.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        const line = window.innerHeight * 0.4;
        let current = -1;
        STAGES.forEach((s, i) => {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= line) current = i;
        });
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      reveal.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const done = active === STAGES.length - 1;

  return (
    <>
      <header className={`nav${scrolled || open ? " scrolled" : ""}`}>
        <div className="wrap nav-in">
          <a href="#top" className="brand" aria-label="Rynah Tadashi — accueil">
            <span className="brand-mark">&gt;_</span>
            <span>
              rynah<em>@</em>cloud
            </span>
          </a>
          <button
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="nav-links"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav id="nav-links" className={`nav-links${open ? " open" : ""}`} aria-label="Navigation principale">
            {STAGES.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} aria-current={active === i ? "true" : undefined} onClick={() => setOpen(false)}>
                {s.label}
              </a>
            ))}
            {cvHref && (
              <a href={cvHref} onClick={() => setOpen(false)} style={{ color: "var(--cyan)" }}>
                cv.pdf ↓
              </a>
            )}
          </nav>
        </div>
      </header>

      <nav className="rail" aria-label="Progression dans la page">
        <p className="rail-title">pipeline</p>
        <ol>
          {STAGES.map((s, i) => (
            <li key={s.id} className={i < active ? "passed" : i === active ? "running" : ""}>
              <a href={`#${s.id}`}>{s.label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="status" aria-hidden="true">
        <div>
          <span className="seg-accent">⎇ main</span>
          {active < 0 ? (
            <span>○ pipeline : en attente</span>
          ) : done ? (
            <span className="ok">✓ pipeline : passed</span>
          ) : (
            <span className="run">● stage : {STAGES[active].label}</span>
          )}
          <span>
            {Math.max(0, active + 1)}/{STAGES.length} stages
          </span>
        </div>
        <div>
          <span>UTF-8</span>
          <span>LF</span>
          <span>rynah@cloud</span>
        </div>
      </div>
    </>
  );
}
