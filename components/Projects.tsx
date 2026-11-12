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

/** Pipeline façon GitLab : une colonne par étape, une pastille par job. */
function PipelineGraph({ stages }: { stages: string[] }) {
  const parsed = stages.map((line) => {
    const [name, jobs = ""] = line.split("|");
    return { name: name.trim(), jobs: jobs.split(",").map((j) => j.trim()).filter(Boolean) };
  });
  if (!parsed.length) return null;
  return (
    <div className="pipe" role="img" aria-label={`Pipeline : ${parsed.map((s) => `${s.name} (${s.jobs.join(", ")})`).join(", puis ")}`}>
      {parsed.map((stage, i) => (
        <div key={stage.name + i} className="pipe-stage" style={{ "--n": i } as React.CSSProperties}>
          <p className="pipe-name">
            <span>{String(i + 1).padStart(2, "0")}</span>
            {stage.name}
          </p>
          <ul>
            {stage.jobs.map((job) => (
              <li key={job}>
                <i aria-hidden="true">✓</i>
                {job}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Architecture : chaîne de composants reliés par des flèches. */
function ArchFlow({ steps, compact }: { steps: string[]; compact?: boolean }) {
  if (!steps.length) return null;
  return (
    <ol className={`flow${compact ? " flow-sm" : ""}`} aria-label="Architecture">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function TwoParts({ project }: { project: Project }) {
  return (
    <div className="parts">
      <div className="part part-app">
        <p className="part-title">Application / Solution</p>
        {project.application ? <p>{project.application}</p> : <Todo items={["Présentation de l'application"]} />}
      </div>
      <div className="part part-me">
        <p className="part-title">My DevOps Contribution</p>
        {project.contribution.length ? (
          <ul className="feat">
            {project.contribution.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <Todo items={["Tâches réalisées"]} />
        )}
      </div>
    </div>
  );
}

function Stack({ items }: { items: string[] }) {
  return (
    <ul className="chips">
      {items.map((s) => (
        <li key={s} className="chip">
          {s}
        </li>
      ))}
    </ul>
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
      <p className="role-note" data-reveal>
        <b>Mon rôle</b>
        Je n&apos;ai pas développé les applications présentées ici. J&apos;ai conçu ce qui les fait tourner : environnements,
        pipelines, conteneurs, cloud, sécurité et supervision.
      </p>

      {featured && (
        <article className="card proj-featured" data-reveal>
          <p className="proj-kicker">
            ★ {featured.category}
            {featured.period && ` · ${featured.period}`}
          </p>
          <h3>{featured.name}</h3>
          <p className="proj-lead">{featured.description}</p>
          {featured.pipeline.length > 0 && (
            <>
              <p className="block-title">pipeline ci/cd</p>
              <PipelineGraph stages={featured.pipeline} />
            </>
          )}
          <TwoParts project={featured} />
          {featured.architecture.length > 0 && (
            <>
              <p className="block-title">architecture</p>
              <ArchFlow steps={featured.architecture} />
            </>
          )}
          <p className="block-title">technologies</p>
          <Stack items={featured.stack} />
          {featured.github && (
            <a className="btn btn-sm" href={featured.github} target="_blank" rel="noopener noreferrer" style={{ marginTop: 22 }}>
              Voir le dépôt ↗
            </a>
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
            <ArchFlow steps={(p.architecture.length ? p.architecture : p.pipeline.map((l) => l.split("|")[0].trim())).slice(0, 4)} compact />
            <span className="proj-count">
              <b>{p.contribution.length}</b> contributions DevOps
            </span>
            <span className="more">Application &amp; contribution</span>
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
              {current.description && <p className="proj-lead">{current.description}</p>}
              <TwoParts project={current} />
              {current.pipeline.length > 0 && (
                <div>
                  <p className="block-title">pipeline ci/cd</p>
                  <PipelineGraph stages={current.pipeline} />
                </div>
              )}
              {current.architecture.length > 0 && (
                <div>
                  <p className="block-title">architecture</p>
                  <ArchFlow steps={current.architecture} />
                </div>
              )}
              {current.stack.length > 0 && (
                <div>
                  <p className="block-title">technologies</p>
                  <Stack items={current.stack} />
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
                  Voir le dépôt ↗
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
