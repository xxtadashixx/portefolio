"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/types";

function Todo({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="todo">
      <b>À COMPLÉTER</b>
      {items.join(" · ")}
    </div>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  const featured = projects.find((p) => p.featured);
  const others = projects.filter((p) => p !== featured);
  const [current, setCurrent] = useState<Project | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const show = (p: Project) => {
    setCurrent(p);
    dialog.current?.showModal();
  };

  return (
    <>
      {featured && (
        <article className="card proj-featured" data-reveal>
          <div>
            <p className="proj-kicker">
              ★ {featured.category}
              {featured.period && ` · ${featured.period}`}
            </p>
            <h3>{featured.name}</h3>
            <p>{featured.description}</p>
            <ul className="chips">
              {featured.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
            <ul className="feat">
              {featured.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="hero-cta">
              <button className="btn btn-sm" onClick={() => show(featured)}>
                Voir la fiche complète
              </button>
              {featured.github && (
                <a className="btn btn-sm" href={featured.github} target="_blank" rel="noopener noreferrer">
                  GitHub ↗
                </a>
              )}
            </div>
          </div>
          {featured.architecture.length > 0 && (
            <div>
              <p className="block-title" style={{ marginTop: 0 }}>
                architecture
              </p>
              <ol className="arch">
                {featured.architecture.map((step, i) => (
                  <li key={step}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </article>
      )}

      <div className="proj-grid">
        {others.map((p, i) => (
          <button
            key={p.id}
            className={`card card-hover proj${p.description ? "" : " is-todo"}`}
            onClick={() => show(p)}
            data-reveal
            style={{ "--i": i % 3 } as React.CSSProperties}
          >
            <span className="proj-kicker">{p.category || "Projet"}</span>
            <h3>{p.name}</h3>
            {p.description ? <p>{p.description}</p> : <Todo items={["Fiche projet à renseigner"]} />}
            <span className="chips">
              {p.stack.slice(0, 5).map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </span>
            <span className="more">Détails</span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="proj-title"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        {current && (
          <>
            <div className="modal-head">
              <div>
                <p className="proj-kicker">
                  {current.category}
                  {current.period && ` · ${current.period}`}
                </p>
                <h3 id="proj-title">{current.name}</h3>
              </div>
              <button className="x" onClick={() => dialog.current?.close()} aria-label="Fermer">
                ×
              </button>
            </div>
            <div className="modal-body">
              {current.description && <p>{current.description}</p>}
              {current.stack.length > 0 && (
                <div>
                  <p className="block-title">technologies</p>
                  <ul className="chips">
                    {current.stack.map((s) => (
                      <li key={s} className="chip">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {current.architecture.length > 0 && (
                <div>
                  <p className="block-title">architecture</p>
                  <ol className="arch">
                    {current.architecture.map((step, i) => (
                      <li key={step}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {current.features.length > 0 && (
                <div>
                  <p className="block-title">fonctionnalités</p>
                  <ul className="feat">
                    {current.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {current.screenshots.length > 0 && (
                <div>
                  <p className="block-title">captures</p>
                  <div className="shots">
                    {current.screenshots.map((s) => (
                      <a key={s} href={`/api/files/${encodeURIComponent(s)}`} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/files/${encodeURIComponent(s)}`} alt={`Capture du projet ${current.name}`} loading="lazy" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {current.github && (
                <a className="btn btn-sm" href={current.github} target="_blank" rel="noopener noreferrer" style={{ justifySelf: "start" }}>
                  Voir sur GitHub ↗
                </a>
              )}
              <Todo items={current.missing} />
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
