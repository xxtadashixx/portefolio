"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Content } from "@/lib/types";
import { complete, run, type Line } from "@/lib/commands";

type Entry =
  | { id: number; kind: "cmd"; text: string }
  | { id: number; kind: "line"; line: Line }
  | { id: number; kind: "neo"; art: string[]; info: Line[] };

const PROMPT = (
  <>
    <span className="c-p">visitor@rynah-cloud</span>:<span className="c-k">~</span>$
  </>
);
const QUICK = ["help", "about", "skills", "projects", "certifications", "neofetch", "clear"];
const seg = (t: string, c?: Line[number]["c"]) => ({ t, c });
const BANNER: Line[] = [
  [seg("rynah-cloud 1.0 LTS", "a"), seg("  (GNU/Linux · bash)", "m")],
  [seg("Ce terminal est réel : tapez une commande, ou "), seg("help", "k"), seg(" pour la liste.")],
  [],
];

let nextId = 1;

function Segments({ line }: { line: Line }) {
  return (
    <>
      {line.map((s, i) =>
        s.href ? (
          <a key={i} href={s.href} className={s.c ? `c-${s.c}` : undefined} target={s.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer">
            {s.t}
          </a>
        ) : (
          <span key={i} className={s.c ? `c-${s.c}` : undefined}>
            {s.t}
          </span>
        ),
      )}
    </>
  );
}

export function Terminal({ content }: { content: Content }) {
  const [entries, setEntries] = useState<Entry[]>(() => BANNER.map((line) => ({ id: nextId++, kind: "line", line })));
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const body = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    try {
      history.current = JSON.parse(sessionStorage.getItem("term-history") || "[]");
    } catch {
      /* stockage indisponible */
    }
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight });
  }, [entries, busy]);

  const execute = useCallback(
    (raw: string) => {
      const text = raw.trim();
      const out: Entry[] = [{ id: nextId++, kind: "cmd", text: raw }];
      if (!text) {
        setEntries((e) => [...e, ...out]);
        return;
      }
      history.current = [...history.current.filter((h) => h !== text), text].slice(-50);
      cursor.current = -1;
      try {
        sessionStorage.setItem("term-history", JSON.stringify(history.current));
      } catch {
        /* stockage indisponible */
      }

      const result = run(text, content, history.current);
      if (result.action?.type === "clear") {
        setEntries([]);
        return;
      }
      setEntries((e) => [...e, ...out]);

      const printed: Entry[] = [
        ...(result.neofetch ? [{ id: nextId++, kind: "neo" as const, ...result.neofetch }] : []),
        ...result.lines.map((line) => ({ id: nextId++, kind: "line" as const, line })),
        { id: nextId++, kind: "line", line: [] },
      ];
      // Les lignes s'affichent une à une, comme une vraie sortie de commande.
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const delay = still ? 0 : printed.length > 30 ? 10 : 24;
      setBusy(true);
      printed.forEach((entry, i) => {
        timers.current.push(
          setTimeout(() => {
            setEntries((e) => [...e, entry]);
            if (i === printed.length - 1) {
              setBusy(false);
              const action = result.action;
              if (action?.type === "download") {
                const link = document.createElement("a");
                link.href = action.href;
                link.download = "";
                link.click();
              } else if (action?.type === "ask") {
                window.dispatchEvent(new CustomEvent("tadashi:ask", { detail: action.question }));
              }
            }
          }, delay * (i + 1)),
        );
      });
    },
    [content],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const h = history.current;
    if (e.key === "Enter") {
      e.preventDefault();
      if (busy) return;
      execute(value);
      setValue("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!h.length) return;
      cursor.current = cursor.current < 0 ? h.length - 1 : Math.max(0, cursor.current - 1);
      setValue(h[cursor.current]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor.current < 0) return;
      cursor.current += 1;
      if (cursor.current >= h.length) {
        cursor.current = -1;
        setValue("");
      } else setValue(h[cursor.current]);
    } else if (e.key === "Tab" && value.trim()) {
      e.preventDefault();
      const matches = complete(value);
      if (matches.length === 1) setValue(matches[0] + " ");
      else if (matches.length > 1) {
        setEntries((en) => [
          ...en,
          { id: nextId++, kind: "cmd", text: value },
          { id: nextId++, kind: "line", line: [seg(matches.join("   "), "m")] },
        ]);
      }
    } else if (e.key.toLowerCase() === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    } else if (e.key.toLowerCase() === "c" && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      setEntries((en) => [...en, { id: nextId++, kind: "cmd", text: value + "^C" }]);
      setValue("");
    }
  };

  return (
    <div className="win term" data-reveal>
      <div className="win-bar">
        <i />
        <i />
        <i />
        <span>visitor@rynah-cloud: ~</span>
        <span className="right">bash — interactif</span>
      </div>
      <div
        ref={body}
        className="term-body"
        onClick={() => !window.getSelection()?.toString() && input.current?.focus({ preventScroll: true })}
      >
        <div role="log" aria-live="polite" aria-label="Sortie du terminal">
          {entries.map((entry) =>
            entry.kind === "cmd" ? (
              <p key={entry.id}>
                {PROMPT} {entry.text}
              </p>
            ) : entry.kind === "neo" ? (
              <div key={entry.id} className="neo term-line">
                <pre aria-hidden="true">{entry.art.join("\n")}</pre>
                <div>
                  {entry.info.map((line, i) => (
                    <p key={i}>
                      <Segments line={line} />
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p key={entry.id} className="term-line">
                <Segments line={entry.line} />
              </p>
            ),
          )}
        </div>
        <div className="term-input" style={busy ? { visibility: "hidden" } : undefined}>
          <label htmlFor="term-input">{PROMPT}</label>
          <input
            id="term-input"
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, 200))}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-label="Saisir une commande. Tapez help pour la liste."
          />
        </div>
      </div>
      <div className="term-keys" aria-label="Commandes rapides">
        {QUICK.map((cmd) => (
          <button key={cmd} type="button" disabled={busy} onClick={() => execute(cmd)}>
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
