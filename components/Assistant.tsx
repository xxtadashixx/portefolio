"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Robot, type Mood } from "./Robot";
import { UI, type Lang } from "@/lib/i18n";

interface Msg {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

/** Rendu minimal et sûr (aucun HTML injecté) : gras, listes à puces, liens. */
function inline(text: string, key: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+)/g);
  return parts.map((part, i) => {
    if (/^\*\*.+\*\*$/.test(part)) return <strong key={key + i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) {
      const url = part.replace(/[.,;:!?]+$/, "");
      return (
        <a key={key + i} href={url} target="_blank" rel="noopener noreferrer">
          {url.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
      );
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) {
      const mail = part.replace(/\.+$/, "");
      return (
        <a key={key + i} href={`mailto:${mail}`}>
          {mail}
        </a>
      );
    }
    return part;
  });
}

function Rich({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={`u${blocks.length}`}>
          {items.map((item, i) => (
            <li key={i}>{inline(item, `l${i}-`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) list.push(bullet[1]);
    else {
      flush();
      if (line) blocks.push(<p key={`p${blocks.length}`}>{inline(line.replace(/^#+\s*/, ""), "p")}</p>);
    }
  }
  flush();
  return <>{blocks}</>;
}

/** Réponse où l'assistant signale une information absente : le robot prend l'air perplexe. */
const UNSURE = /pas disponible|ne figure pas|n'est pas (mentionn|précis|document)|not available|no information|don't have|isn't (mentioned|documented)/i;

export function Assistant({ enabled, lang }: { enabled: boolean; lang: Lang }) {
  const t = UI[lang].ai;
  const [mood, setMoodState] = useState<Mood>(enabled ? "happy" : "sad");
  const [hover, setHover] = useState(false);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rest: Mood = enabled ? "happy" : "sad";
  /** Change d'humeur ; avec `ms`, revient à l'humeur de repos après ce délai. */
  const setMood = useCallback(
    (next: Mood, ms?: number) => {
      clearTimeout(moodTimer.current);
      setMoodState(next);
      if (ms) moodTimer.current = setTimeout(() => setMoodState(rest), ms);
    },
    [rest],
  );
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const state = useRef({ messages, busy });
  state.current = { messages, busy };

  const send = useCallback(
    async (question: string) => {
      const text = question.trim().slice(0, 800);
      if (!text || state.current.busy || !enabled) return;
      const history = [...state.current.messages.filter((m) => !m.error), { role: "user" as const, content: text }];
      setMessages([...state.current.messages, { role: "user", content: text }, { role: "assistant", content: "" }]);
      setBusy(true);
      setMood("thinking");
      let answer = "";
      let failed: Mood | null = null;
      const patch = (fn: (last: Msg) => Msg) => setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);
      const fail = (error: string) => patch((last) => ({ ...last, content: last.content ? `${last.content}\n\n${error}` : error, error: true }));
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, lang }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          failed = res.status === 429 ? "angry" : "error";
          fail(data?.error || t.errDown);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line) continue;
            const event = JSON.parse(line) as { t?: string; error?: string };
            if (event.t) {
              if (!answer) setMood("grin");
              answer += event.t;
              patch((last) => ({ ...last, content: last.content + event.t }));
            }
            if (event.error) {
              failed = "error";
              fail(event.error);
            }
          }
        }
      } catch {
        failed = "error";
        fail(t.errNetwork);
      } finally {
        setBusy(false);
        if (failed) setMood(failed, 5000);
        else if (UNSURE.test(answer)) setMood("confused", 4500);
        else setMood("wink", 2600);
      }
    },
    [enabled, setMood, lang, t],
  );

  useEffect(() => {
    const onAsk = (e: Event) => {
      setOpen(true);
      void send((e as CustomEvent<string>).detail);
    };
    window.addEventListener("tadashi:ask", onAsk);
    return () => window.removeEventListener("tadashi:ask", onAsk);
  }, [send]);

  useEffect(() => {
    if (!open) return;
    if (enabled && !state.current.busy) setMood("surprised", 900);
    input.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fab.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, enabled, setMood]);

  // Au repos, le robot fait un clin d'œil de temps en temps.
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      setMoodState((current) => {
        if (current !== "happy") return current;
        moodTimer.current = setTimeout(() => setMoodState((m) => (m === "wink" ? "happy" : m)), 900);
        return "wink";
      });
    }, 9000);
    return () => {
      clearInterval(timer);
      clearTimeout(moodTimer.current);
    };
  }, [enabled]);

  // Le regard du robot suit le curseur, par pas de pixels entiers.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        for (const el of document.querySelectorAll<HTMLElement>(".fab-bot, .ai-bot")) {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const step = (v: number) => Math.max(-3, Math.min(3, Math.round(v / 140) * 1.5));
          el.style.setProperty("--ex", `${step(dx)}px`);
          el.style.setProperty("--ey", `${step(dy)}px`);
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  if (!open) {
    return (
      <button
        ref={fab}
        className="ai-fab"
        onClick={() => setOpen(true)}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        aria-label={t.open}
      >
        <span className="fab-bot">
          <Robot mood={hover && enabled ? "grin" : mood} size={40} label="" />
        </span>
        <span className="lbl">TADASHI AI</span>
      </button>
    );
  }

  return (
    <aside className="ai-panel" role="dialog" aria-label={t.title}>
      <div className="ai-head">
        <span className="ai-bot">
          <Robot mood={mood} size={52} label={`TADASHI AI — ${t.moods[mood]}`} />
        </span>
        <div>
          <strong>TADASHI AI</strong>
          <small>
            <i className={`ai-dot ai-dot-${mood}`} />
            {t.moods[mood]}
          </small>
        </div>
        <button className="x" onClick={() => setOpen(false)} aria-label={t.closeLabel}>
          ×
        </button>
      </div>

      <div className="ai-log" ref={log} aria-live="polite">
        <div className="msg bot">
          <p>
            {t.hello}
          </p>
        </div>
        {!enabled && (
          <div className="msg bot err">
            <p>{t.disabled}</p>
          </div>
        )}
        {enabled && messages.length === 0 && (
          <div className="ai-sugg">
            {t.suggestions.map((s) => (
              <button key={s} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "user" : "bot"}${m.error ? " err" : ""}`}>
            {m.role === "user" ? (
              <p>{m.content}</p>
            ) : m.content ? (
              <Rich text={m.content} />
            ) : (
              <span className="dots" role="status" aria-label={t.thinking}>
                <i />
                <i />
                <i />
              </span>
            )}
          </div>
        ))}
      </div>

      <form
        className="ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send(value);
          setValue("");
        }}
      >
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={800}
          placeholder={enabled ? t.placeholder : t.unavailable}
          aria-label={t.question}
          disabled={!enabled}
        />
        <button type="submit" disabled={!enabled || busy || !value.trim()} aria-label={t.send}>
          ↑
        </button>
      </form>
      <p className="ai-note">{t.note}</p>
    </aside>
  );
}
