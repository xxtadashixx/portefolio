"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { UI, type Dict, type Lang } from "@/lib/i18n";

/** Pipeline façon GitLab : une colonne par étape, une pastille par job. */
function PipelineGraph({ stages }: { stages: string[] }) {
  const parsed = stages.map((line) => {
    const [name, jobs = ""] = line.split("|");
    return { name: name.trim(), jobs: jobs.split(",").map((j) => j.trim()).filter(Boolean) };
  });
  if (!parsed.length) return null;
  return (
    <div className="pipe" role="img" aria-label={`Pipeline: ${parsed.map((s) => `${s.name} (${s.jobs.join(", ")})`).join(" → ")}`}>
      {parsed.map((stage, i) => (
        <div key={stage.name + i} className="pipe-stage">
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

/** Corps d'une fiche : les deux parties, puis les schémas et la stack. */
function Sheet({ project, t }: { project: Project; t: Dict }) {
  return (
    <>
      {project.description && <p className="proj-lead">{project.description}</p>}
      {project.pipeline.length > 0 && (
        <div>
          <p className="block-title">{t.pipeline}</p>
          <PipelineGraph stages={project.pipeline} />
        </div>
      )}
      {(project.application || project.contribution.length > 0) && (
        <div className={`parts${project.application && project.contribution.length ? "" : " parts-one"}`}>
          {project.application && (
            <div className="part part-app">
              <p className="part-title">Application / Solution</p>
              <p>{project.application}</p>
            </div>
          )}
          {project.contribution.length > 0 && (
            <div className="part part-me">
              <p className="part-title">My DevOps Contribution</p>
              <ul className="feat">
                {project.contribution.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {project.architecture.length > 0 && (
        <div>
          <p className="block-title">{t.architecture}</p>
          <ArchFlow steps={project.architecture} />
        </div>
      )}
      {project.stack.length > 0 && (
        <div>
          <p className="block-title">{t.technologies}</p>
          <ul className="chips">
            {project.stack.map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {project.screenshots.length > 0 && (
        <div>
          <p className="block-title">{t.screenshots}</p>
          <div className="shots">
            {project.screenshots.map((s) => (
              <a key={s} href={`/api/files/${encodeURIComponent(s)}`} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${encodeURIComponent(s)}`} alt={t.shotAlt(project.name)} loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      )}
      {project.github && (
        <a className="btn btn-sm" href={project.github} target="_blank" rel="noopener noreferrer" style={{ justifySelf: "start" }}>
          {t.repo} ↗
        </a>
      )}
    </>
  );
}

/** Projet principal : ses volets (pipeline, conteneurs, cloud…) sont des onglets. */
function Featured({ project, parts, t }: { project: Project; parts: Project[]; t: Dict }) {
  const tabs = [project, ...parts];
  const [index, setIndex] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = tabs[index];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    setIndex(next);
    refs.current[next]?.focus();
  };

  return (
    <article className="card proj-featured" data-reveal>
      <p className="proj-kicker">
        ★ {project.category}
        {project.period && ` · ${project.period}`}
      </p>
      <h3>{project.name}</h3>
      {parts.length > 0 && (
        <div className="tabs" role="tablist" aria-label={t.projectTabs} onKeyDown={onKeyDown}>
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={i === index}
              aria-controls="proj-panel"
              tabIndex={i === index ? 0 : -1}
              onClick={() => setIndex(i)}
            >
              {i === 0 ? t.overview : tab.tab || tab.name}
            </button>
          ))}
        </div>
      )}
      {/* key : le panneau est remonté à chaque onglet, ce qui rejoue l'animation d'entrée */}
      <div key={current.id} className="tab-panel" role="tabpanel" id="proj-panel" aria-labelledby={`tab-${current.id}`}>
        {index > 0 && <h4>{current.name}</h4>}
        <Sheet project={current} t={t} />
      </div>
    </article>
  );
}

export function Projects({ projects, lang }: { projects: Project[]; lang: Lang }) {
  const t = UI[lang];
  const ids = new Set(projects.map((p) => p.id));
  const featured = projects.find((p) => p.featured);
  const parts = featured ? projects.filter((p) => p.parentId === featured.id) : [];
  // Un volet dont le projet parent n'existe plus redevient une fiche autonome.
  const others = projects.filter((p) => p !== featured && !parts.includes(p) && (!p.parentId || !ids.has(p.parentId) || p.parentId !== featured?.id));
  const [current, setCurrent] = useState<Project | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const show = (p: Project) => {
    setCurrent(p);
    dialog.current?.showModal();
  };

  return (
    <>
      <p className="role-note" data-reveal>
        <b>{t.roleTitle}</b>
        {t.roleNote}
      </p>

      {featured && <Featured project={featured} parts={parts} t={t} />}

      <div className={`proj-grid${others.length === 1 ? " proj-grid-one" : ""}`}>
        {others.map((p, i) => (
          <button
            key={p.id}
            className="card card-hover proj"
            onClick={() => show(p)}
            data-reveal
            style={{ "--i": i % 3 } as React.CSSProperties}
          >
            <span className="proj-kicker">{p.category || t.project}</span>
            <h3>{p.name}</h3>
            {p.description && <p>{p.description}</p>}
            <ArchFlow steps={(p.architecture.length ? p.architecture : p.pipeline.map((l) => l.split("|")[0].trim())).slice(0, 4)} compact />
            <span className="proj-count">
              <b>{p.contribution.length}</b> {t.contributions}
            </span>
            <span className="more">{t.details}</span>
          </button>
        ))}
      </div>

      <dialog ref={dialog} className="modal" aria-labelledby="proj-title" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
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
              <button className="x" onClick={() => dialog.current?.close()} aria-label={t.close}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <Sheet project={current} t={t} />
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
