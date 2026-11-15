"use client";

import { useState } from "react";
import { UI, type Dict, type Lang } from "@/lib/i18n";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

function validate(data: Record<string, string>, f: Dict["form"]): Errors {
  const errors: Errors = {};
  if (data.name.trim().length < 2) errors.name = f.errName;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) errors.email = f.errEmail;
  if (data.message.trim().length < 10) errors.message = f.errMessage;
  return errors;
}

export function ContactForm({ lang }: { lang: Lang }) {
  const f = UI[lang].form;
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ kind: "idle" | "sending" | "ok" | "ko"; text?: string }>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const found = validate(data, f);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, lang }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Les erreurs de champ renvoyées par le serveur sont réaffichées dans la langue de la page.
        setErrors(Object.fromEntries(Object.keys(body.errors ?? {}).map((k) => [k, k === "name" ? f.errName : k === "email" ? f.errEmail : f.errMessage])));
        setStatus({ kind: "ko", text: f.failed });
        return;
      }
      form.reset();
      setStatus({ kind: "ok", text: f.sent });
    } catch {
      setStatus({ kind: "ko", text: f.offline });
    }
  };

  const field = (name: keyof Errors) => ({
    id: `c-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `c-${name}-err` : undefined,
  });
  const error = (name: keyof Errors) =>
    errors[name] && (
      <p className="err" id={`c-${name}-err`}>
        {errors[name]}
      </p>
    );

  return (
    <form className="card form" onSubmit={onSubmit} noValidate data-reveal>
      <div className="form-row">
        <div className="field">
          <label htmlFor="c-name">{f.name}</label>
          <input {...field("name")} autoComplete="name" maxLength={100} required />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor="c-email">{f.email}</label>
          <input {...field("email")} type="email" autoComplete="email" maxLength={200} required />
          {error("email")}
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-message">{f.message}</label>
        <textarea {...field("message")} maxLength={4000} required />
        {error("message")}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="c-website">{f.honeypot}</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-foot">
        <button className="btn btn-primary" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? (
            <>
              <span className="spin" /> {f.sending}
            </>
          ) : (
            f.send
          )}
        </button>
        <p className={`form-msg ${status.kind}`} role="status">
          {status.text}
        </p>
      </div>
    </form>
  );
}
