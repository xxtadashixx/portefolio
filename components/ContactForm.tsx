"use client";

import { useState } from "react";

type Errors = Partial<Record<"name" | "email" | "message", string>>;

function validate(data: Record<string, string>): Errors {
  const errors: Errors = {};
  if (data.name.trim().length < 2) errors.name = "Indiquez votre nom.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) errors.email = "Adresse email invalide.";
  if (data.message.trim().length < 10) errors.message = "Votre message doit contenir au moins 10 caractères.";
  return errors;
}

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ kind: "idle" | "sending" | "ok" | "ko"; text?: string }>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const found = validate(data);
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
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.errors ?? {});
        setStatus({ kind: "ko", text: body.error || "L'envoi a échoué. Réessayez ou écrivez-moi directement par email." });
        return;
      }
      form.reset();
      setStatus({ kind: "ok", text: "Message envoyé. Merci, je vous réponds rapidement." });
    } catch {
      setStatus({ kind: "ko", text: "Connexion impossible. Réessayez ou écrivez-moi directement par email." });
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
          <label htmlFor="c-name">nom</label>
          <input {...field("name")} autoComplete="name" maxLength={100} required />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor="c-email">email</label>
          <input {...field("email")} type="email" autoComplete="email" maxLength={200} required />
          {error("email")}
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-message">message</label>
        <textarea {...field("message")} maxLength={4000} required />
        {error("message")}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="c-website">Ne pas remplir</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-foot">
        <button className="btn btn-primary" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? (
            <>
              <span className="spin" /> Envoi…
            </>
          ) : (
            "Envoyer le message"
          )}
        </button>
        <p className={`form-msg ${status.kind}`} role="status">
          {status.text}
        </p>
      </div>
    </form>
  );
}
