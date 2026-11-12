"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

const SUGGESTIONS = [
  "Qui est Rynah Tadashi ?",
  "Quels outils CI/CD maîtrise-t-il ?",
  "A-t-il de l'expérience avec AWS ?",
  "Quelles certifications possède-t-il ?",
  "Why should I hire him?",
];

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

export function Assistant({ enabled, avatarSrc }: { enabled: boolean; avatarSrc: string | null }) {
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
      const patch = (fn: (last: Msg) => Msg) => setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);
      const fail = (error: string) => patch((last) => ({ ...last, content: last.content ? `${last.content}\n\n${error}` : error, error: true }));
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          fail(data?.error || "L'assistant est indisponible pour le moment.");
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
            if (event.t) patch((last) => ({ ...last, content: last.content + event.t }));
            if (event.error) fail(event.error);
          }
        }
      } catch {
        fail("Connexion interrompue. Vérifiez votre réseau puis réessayez.");
      } finally {
        setBusy(false);
      }
    },
    [enabled],
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
    input.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fab.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  if (!open) {
    return (
      <button ref={fab} className="ai-fab" onClick={() => setOpen(true)} aria-label="Ouvrir l'assistant TADASHI AI">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="fab-face" src={avatarSrc} alt="" width={30} height={30} />
        ) : (
          <span className="orb" />
        )}
        <span className="lbl">TADASHI AI</span>
      </button>
    );
  }

  return (
    <aside className="ai-panel" role="dialog" aria-label="Assistant TADASHI AI">
      <div className="ai-head">
        {avatarSrc ? (
          <span className="avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarSrc} alt="" width={36} height={36} />
          </span>
        ) : (
          <span className="orb">AI</span>
        )}
        <div>
          <strong>TADASHI AI</strong>
          <small>{enabled ? "Répond à partir du CV et des certificats" : "Hors ligne"}</small>
        </div>
        <button className="x" onClick={() => setOpen(false)} aria-label="Fermer l'assistant">
          ×
        </button>
      </div>

      <div className="ai-log" ref={log} aria-live="polite">
        <div className="msg bot">
          <p>
            Bonjour 👋 Je suis l&apos;assistant de Rynah. Posez-moi une question sur son parcours, ses compétences, ses projets ou
            ses certificats — en français ou en anglais.
          </p>
        </div>
        {!enabled && (
          <div className="msg bot err">
            <p>L&apos;assistant n&apos;est pas encore activé sur ce serveur (clé API non configurée). Le terminal et le formulaire de contact restent disponibles.</p>
          </div>
        )}
        {enabled && messages.length === 0 && (
          <div className="ai-sugg">
            {SUGGESTIONS.map((s) => (
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
              <span className="dots" role="status" aria-label="TADASHI AI rédige une réponse">
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
          placeholder={enabled ? "Votre question…" : "Assistant indisponible"}
          aria-label="Votre question"
          disabled={!enabled}
        />
        <button type="submit" disabled={!enabled || busy || !value.trim()} aria-label="Envoyer">
          ↑
        </button>
      </form>
      <p className="ai-note">Réponses générées par IA à partir des documents de Rynah. Vérifiez les points importants avec lui.</p>
    </aside>
  );
}
