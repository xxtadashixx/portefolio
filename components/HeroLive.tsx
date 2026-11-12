"use client";

import { useEffect, useState } from "react";

export interface InfraNode {
  label: string;
  path: string;
}

type Step = { kind: "cmd" | "out"; text: string; stage: number; cls?: string };

/** Séquence jouée dans le terminal du hero ; `stage` = nombre de nœuds allumés dans le schéma. */
const SCRIPT: Step[] = [
  { kind: "cmd", text: "git push origin main", stage: 1 },
  { kind: "out", text: "→ pipeline déclenché · parent/child", stage: 2, cls: "c-m" },
  { kind: "out", text: "  ✓ provision  ✓ build  ✓ scan  ✓ deploy", stage: 2, cls: "c-ok" },
  { kind: "cmd", text: "docker compose up -d", stage: 3 },
  { kind: "out", text: "  ✓ traefik  ✓ app  ✓ prometheus  ✓ grafana", stage: 4, cls: "c-ok" },
  { kind: "cmd", text: "curl -sI https://app | head -1", stage: 4 },
  { kind: "out", text: "HTTP/2 200", stage: 5, cls: "c-a" },
  { kind: "out", text: "# monitoring : toutes les cibles sont UP", stage: 5, cls: "c-m" },
];

export function HeroLive({ nodes }: { nodes: InfraNode[] }) {
  const [lines, setLines] = useState<Step[]>([]);
  const [typing, setTyping] = useState("");
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLines(SCRIPT);
      setStage(nodes.length);
      return;
    }
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (!cancelled) {
        setLines([]);
        setStage(0);
        await wait(700);
        for (const step of SCRIPT) {
          if (cancelled) return;
          if (step.kind === "cmd") {
            for (let i = 1; i <= step.text.length; i++) {
              if (cancelled) return;
              setTyping(step.text.slice(0, i));
              await wait(34 + Math.random() * 40);
            }
            await wait(280);
            setTyping("");
          } else {
            await wait(420);
          }
          setLines((prev) => [...prev, step]);
          setStage(step.stage);
        }
        await wait(6000);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nodes.length]);

  return (
    <div>
      <div className="win" aria-hidden="true">
        <div className="win-bar">
          <i />
          <i />
          <i />
          <span>rynah@cloud: ~/deploy</span>
          <span className="right">bash</span>
        </div>
        <div className="demo-body">
          {lines.map((line, i) => (
            <p key={i} className={line.cls}>
              {line.kind === "cmd" && <span className="c-p">$ </span>}
              {line.text}
            </p>
          ))}
          <p>
            <span className="c-p">$ </span>
            {typing}
            <span className="caret" />
          </p>
        </div>
      </div>

      <div className="card infra" role="img" aria-label={`Chaîne de déploiement : ${nodes.map((n) => n.label).join(", puis ")}`}>
        <div className="infra-flow">
          {nodes.map((node, i) => (
            <div key={node.label} style={{ display: "contents" }}>
              {i > 0 && <span className={`infra-link${stage > i ? " on" : ""}`} />}
              <div className={`infra-node${stage > i ? " on" : ""}`}>
                <span className="ico">
                  <svg viewBox="0 0 24 24">
                    <path d={node.path} />
                  </svg>
                </span>
                {node.label}
              </div>
            </div>
          ))}
        </div>
        <div className="infra-cap">
          <span>
            {stage >= nodes.length ? <b>● déployé et supervisé</b> : stage > 0 ? "● déploiement en cours…" : "○ en attente d'un push"}
          </span>
          <span>code → pipeline → conteneurs → HTTPS → métriques</span>
        </div>
      </div>
    </div>
  );
}
