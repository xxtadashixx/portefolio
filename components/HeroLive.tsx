"use client";

import { useEffect, useState } from "react";
import { UI, type Lang } from "@/lib/i18n";

export interface PipelineStage {
  label: string;
  tool: string;
  path: string;
}

type Line = { kind: "cmd" | "out"; text: string; cls?: string };

/**
 * Terminal du hero : un push déclenche le pipeline, et chaque étape terminée
 * allume le nœud correspondant du schéma (provision → build → scan → deploy).
 */
export function HeroLive({ stages, lang }: { stages: PipelineStage[]; lang: Lang }) {
  const t = UI[lang];
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  /** -1 : rien n'a démarré ; n : n étapes terminées, l'étape n est en cours. */
  const [done, setDone] = useState(-1);

  useEffect(() => {
    const push: Line = { kind: "cmd", text: "git push origin main" };
    const triggered: Line = { kind: "out", text: t.heroTriggered, cls: "c-m" };
    const stageLine = (i: number): Line => ({ kind: "out", text: `  ✓ ${t.heroStages[i]}`, cls: "c-ok" });
    const curl: Line = { kind: "cmd", text: "curl -sI https://app | head -1" };
    const ok: Line = { kind: "out", text: "HTTP/2 200", cls: "c-a" };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLines([push, triggered, ...stages.map((_, i) => stageLine(i)), curl, ok]);
      setDone(stages.length);
      return;
    }
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const type = async (line: Line) => {
      for (let i = 1; i <= line.text.length; i++) {
        if (cancelled) return;
        setTyping(line.text.slice(0, i));
        await wait(34 + Math.random() * 40);
      }
      await wait(280);
      setTyping("");
      setLines((prev) => [...prev, line]);
    };
    (async () => {
      while (!cancelled) {
        setLines([]);
        setDone(-1);
        await wait(700);
        await type(push);
        if (cancelled) return;
        await wait(350);
        setLines((prev) => [...prev, triggered]);
        setDone(0);
        for (let i = 0; i < stages.length; i++) {
          await wait(1100);
          if (cancelled) return;
          setLines((prev) => [...prev, stageLine(i)]);
          setDone(i + 1);
        }
        await wait(500);
        await type(curl);
        if (cancelled) return;
        await wait(350);
        setLines((prev) => [...prev, ok]);
        await wait(6500);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stages, t]);

  const state = (i: number) => (done > i ? "passed" : done === i ? "running" : "");

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

      <div className="card infra" role="img" aria-label={t.heroAria}>
        <div className="infra-flow">
          {stages.map((stage, i) => (
            <div key={stage.label} style={{ display: "contents" }}>
              {i > 0 && <span className={`infra-link ${state(i - 1) === "passed" ? "on" : ""}`} />}
              <div className={`infra-node ${state(i)}`}>
                <span className="ico">
                  <svg viewBox="0 0 24 24">
                    <path d={stage.path} />
                  </svg>
                </span>
                <b>{stage.label}</b>
                {stage.tool}
              </div>
            </div>
          ))}
        </div>
        <div className="infra-cap">
          <span>{done >= stages.length ? <b>{t.heroDone}</b> : done >= 0 ? t.heroRunning : t.heroIdle}</span>
          <span>{t.heroCaption}</span>
        </div>
      </div>
    </div>
  );
}
