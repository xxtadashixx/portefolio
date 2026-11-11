"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContactMessage, Content } from "@/lib/types";
import { EVIDENCE_LABEL } from "@/lib/types";

/* ---------------------------------------------------------------------------
   Éditeur générique : il parcourt le contenu et affiche le bon champ selon la
   forme de chaque valeur. Ajouter une propriété au modèle suffit à la rendre
   éditable ici.
--------------------------------------------------------------------------- */

const LABELS: Record<string, string> = {
  name: "Nom",
  legalName: "Nom complet (état civil)",
  title: "Titre",
  tagline: "Accroche (séparée par |)",
  intro: "Phrase d'introduction",
  summary: "Résumé",
  location: "Localisation",
  email: "Email",
  linkedin: "LinkedIn (URL)",
  github: "GitHub (URL)",
  cvFile: "Fichier du CV",
  domains: "Domaines",
  softSkills: "Compétences personnelles",
  languages: "Langues",
  associations: "Vie associative",
  school: "Établissement",
  year: "Année",
  detail: "Détail",
  role: "Poste",
  company: "Entreprise",
  period: "Période",
  bullets: "Réalisations",
  category: "Catégorie",
  items: "Technologies",
  icon: "Logo (identifiant simple-icons, ex. docker)",
  description: "Description",
  evidence: "Origine de la compétence",
  stack: "Technologies",
  architecture: "Architecture (étapes dans l'ordre)",
  features: "Fonctionnalités",
  screenshots: "Captures d'écran (fichiers)",
  featured: "Projet mis en avant",
  missing: "Informations encore manquantes (affichées « à compléter »)",
  issuer: "Organisme émetteur",
  date: "Date d'obtention",
  kind: "Type de document",
  credentialId: "Identifiant",
  skills: "Compétences associées",
  file: "Fichier original",
  text: "Texte utilisé par l'assistant",
  id: "Identifiant technique",
};
const LONG = new Set(["summary", "description", "text", "intro", "detail"]);
const FILE_KEYS = new Set(["file", "cvFile"]);

const TEMPLATES: Record<string, object> = {
  education: { title: "", school: "", year: "", detail: "" },
  experience: { role: "", company: "", period: "", summary: "", bullets: [] },
  skills: { category: "", items: [] },
  items: { name: "", icon: "", description: "", evidence: "declared" },
  projects: { id: "", name: "", category: "", period: "", description: "", stack: [], architecture: [], features: [], screenshots: [], github: "", featured: false, missing: [] },
  certifications: { id: "", title: "", issuer: "", icon: "", date: "", kind: "", credentialId: "", skills: [], file: "" },
  documents: { id: "", title: "", file: "", text: "" },
  notes: { id: "", title: "", text: "" },
};

async function upload(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Import impossible");
  return data.file;
}

async function extract(file: string): Promise<string> {
  const res = await fetch("/api/admin/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Extraction impossible");
  return data.text;
}

function FilePicker({ onFile, label = "Importer…" }: { onFile: (name: string) => void; label?: string }) {
  const [state, setState] = useState("");
  return (
    <>
      <label className="mini" style={{ display: "inline-flex", alignItems: "center" }}>
        {state === "…" ? "Import…" : label}
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setState("…");
            try {
              onFile(await upload(f));
              setState("");
            } catch (err) {
              setState(err instanceof Error ? err.message : "Erreur");
            }
          }}
        />
      </label>
      {state && state !== "…" && <span style={{ color: "var(--red)", fontSize: 13 }}>{state}</span>}
    </>
  );
}

type Json = string | boolean | Json[] | { [k: string]: Json };

const TOP_LABELS: Record<string, string> = {
  profile: "Profil",
  experience: "Expériences",
  education: "Formation",
  skills: "Compétences techniques",
  otherSkills: "Autres compétences",
  projects: "Projets",
  certifications: "Certificats",
  documents: "Documents",
  notes: "Notes libres",
};

function Field({ k, value, onChange, parent, top }: { k: string; value: Json; onChange: (v: Json) => void; parent?: Record<string, Json>; top?: boolean }) {
  const label = top ? TOP_LABELS[k] : (LABELS[k] ?? k);
  // Seules les listes de premier niveau et « items » contiennent des objets.
  const template = top || k === "items" ? TEMPLATES[k] : undefined;
  const id = `f-${k}-${Math.abs(hash(JSON.stringify(parent ?? "")))}`;
  const [note, setNote] = useState("");

  if (typeof value === "boolean") {
    return (
      <div className="field">
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} style={{ width: "auto" }} /> {label}
        </label>
      </div>
    );
  }

  if (typeof value === "string") {
    if (k === "evidence") {
      return (
        <div className="field">
          <label htmlFor={id}>{label}</label>
          <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
            {Object.entries(EVIDENCE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        {LONG.has(k) ? (
          <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} style={k === "text" ? { minHeight: 200 } : undefined} />
        ) : FILE_KEYS.has(k) ? (
          <div className="inline">
            <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="aucun fichier" />
            <FilePicker onFile={onChange} />
            {value && (
              <a className="mini" style={{ display: "inline-flex", alignItems: "center" }} href={`/api/files/${encodeURIComponent(value)}`} target="_blank" rel="noopener noreferrer">
                Voir
              </a>
            )}
          </div>
        ) : (
          <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
        )}
        {k === "text" && parent && typeof parent.file === "string" && parent.file && (
          <p className="hint inline">
            <button
              type="button"
              className="mini"
              onClick={async () => {
                setNote("Extraction en cours…");
                try {
                  onChange(await extract(parent.file as string));
                  setNote("Texte extrait : relisez-le avant d'enregistrer.");
                } catch (err) {
                  setNote(err instanceof Error ? err.message : "Erreur");
                }
              }}
            >
              Extraire le texte du fichier
            </button>
            {note}
          </p>
        )}
      </div>
    );
  }

  if (Array.isArray(value) && (value.length === 0 ? !template : typeof value[0] === "string")) {
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <textarea id={id} value={(value as string[]).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />
        <p className="hint inline">
          Un élément par ligne.
          {k === "screenshots" && <FilePicker label="Ajouter une capture…" onFile={(name) => onChange([...(value as string[]).filter(Boolean), name])} />}
        </p>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const list = value as Record<string, Json>[];
    const move = (i: number, d: number) => {
      const next = [...list];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      onChange(next);
    };
    return (
      <fieldset>
        <legend>{label}</legend>
        {list.map((item, i) => (
          <details key={i}>
            <summary>
              {String(item.name || item.title || item.role || item.category || `Élément ${i + 1}`)}
              <span className="acts">
                {i > 0 && (
                  <button type="button" className="mini" onClick={(e) => (e.preventDefault(), move(i, -1))} aria-label="Monter">
                    ↑
                  </button>
                )}
                {i < list.length - 1 && (
                  <button type="button" className="mini" onClick={(e) => (e.preventDefault(), move(i, 1))} aria-label="Descendre">
                    ↓
                  </button>
                )}
                <button
                  type="button"
                  className="mini danger"
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("Supprimer cet élément ?")) onChange(list.filter((_, n) => n !== i));
                  }}
                >
                  Supprimer
                </button>
              </span>
            </summary>
            <div className="inner">
              <ObjectFields value={item} onChange={(v) => onChange(list.map((x, n) => (n === i ? v : x)))} />
            </div>
          </details>
        ))}
        <button type="button" className="mini" onClick={() => onChange([...list, structuredClone(template ?? {}) as Record<string, Json>])}>
          + Ajouter
        </button>
      </fieldset>
    );
  }

  return (
    <fieldset>
      <legend>{label}</legend>
      <ObjectFields value={value as Record<string, Json>} onChange={onChange} />
    </fieldset>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function ObjectFields({ value, onChange }: { value: Record<string, Json>; onChange: (v: Record<string, Json>) => void }) {
  return (
    <>
      {Object.keys(value).map((k) => (
        <Field key={k} k={k} value={value[k]} parent={value} onChange={(v) => onChange({ ...value, [k]: v })} />
      ))}
    </>
  );
}

const TABS: { id: string; label: string; keys: (keyof Content)[]; help: string }[] = [
  { id: "profil", label: "Profil", keys: ["profile"], help: "Identité, accroche, coordonnées et CV affichés sur le site." },
  { id: "parcours", label: "Parcours", keys: ["experience", "education"], help: "Expériences professionnelles et formation." },
  { id: "stack", label: "Compétences", keys: ["skills", "otherSkills"], help: "Technologies par catégorie. « Origine » précise d'où vient la compétence ; aucun niveau n'est affiché." },
  { id: "projets", label: "Projets", keys: ["projects"], help: "Fiches projets. Videz « informations manquantes » quand une fiche est complète." },
  { id: "certifs", label: "Certificats", keys: ["certifications"], help: "N'ajoutez un certificat que si vous disposez du document qui le confirme." },
  { id: "ia", label: "Base de l'assistant", keys: ["documents", "notes"], help: "Documents et notes lus par TADASHI AI, en plus du contenu du site. Importez un PDF ou une image, extrayez son texte, relisez, enregistrez." },
];

export function Admin() {
  const [auth, setAuth] = useState<{ enabled: boolean; authenticated: boolean; llm: boolean } | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [tab, setTab] = useState("profil");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [loginError, setLoginError] = useState("");

  const load = useCallback(async () => {
    const state = await (await fetch("/api/admin/login")).json();
    setAuth(state);
    if (state.authenticated) {
      setContent(await (await fetch("/api/admin/content")).json());
      setMessages(await (await fetch("/api/admin/messages")).json());
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!auth) return <main className="adm">Chargement…</main>;

  if (!auth.enabled) {
    return (
      <main className="adm">
        <div className="card adm-login">
          <h1>Administration désactivée</h1>
          <p>
            Définissez les variables d&apos;environnement <code>ADMIN_PASSWORD</code> et <code>SESSION_SECRET</code> sur le serveur, puis redémarrez-le.
          </p>
        </div>
      </main>
    );
  }

  if (!auth.authenticated) {
    return (
      <main className="adm">
        <form
          className="card adm-login"
          onSubmit={async (e) => {
            e.preventDefault();
            const password = new FormData(e.currentTarget).get("password");
            const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
            if (res.ok) void load();
            else setLoginError((await res.json()).error);
          }}
        >
          <h1>Administration</h1>
          <p>Espace privé du portfolio.</p>
          <div className="field">
            <label htmlFor="pw">mot de passe</label>
            <input id="pw" name="password" type="password" autoComplete="current-password" required autoFocus />
            {loginError && <p className="err">{loginError}</p>}
          </div>
          <button className="btn btn-primary">Se connecter</button>
        </form>
      </main>
    );
  }

  if (!content) return <main className="adm">Chargement…</main>;

  const save = async () => {
    setStatus("Enregistrement…");
    const res = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
    const data = await res.json();
    if (res.ok) {
      setContent(data);
      setDirty(false);
      setStatus("Enregistré. Le site et l'assistant sont à jour.");
    } else setStatus(`Erreur : ${data.error}`);
  };

  const current = TABS.find((t) => t.id === tab);

  return (
    <main className="adm">
      <div className="adm-top">
        <h1>Administration du portfolio</h1>
        <div className="inline">
          <a className="mini" style={{ display: "inline-flex", alignItems: "center" }} href="/" target="_blank">
            Voir le site ↗
          </a>
          <button
            className="mini"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              setContent(null);
              void load();
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>
      {!auth.llm && <p className="todo" style={{ marginBottom: 18 }}>Assistant IA inactif : ANTHROPIC_API_KEY n&apos;est pas définie sur le serveur.</p>}

      <div className="adm-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <button role="tab" aria-selected={tab === "messages"} onClick={() => setTab("messages")}>
          Messages ({messages.length})
        </button>
      </div>

      {current && (
        <>
          <p className="adm-help">{current.help}</p>
          {current.keys.map((key) => (
            <Field
              key={key}
              k={key}
              top
              value={content[key] as unknown as Json}
              onChange={(v) => {
                setContent({ ...content, [key]: v } as Content);
                setDirty(true);
                setStatus("");
              }}
            />
          ))}
        </>
      )}

      {tab === "messages" &&
        (messages.length === 0 ? (
          <p className="adm-help">Aucun message reçu via le formulaire de contact.</p>
        ) : (
          messages.map((m) => (
            <article key={m.id} className="card adm-msg">
              <header>
                <span>
                  {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a>
                </span>
                <span>
                  {new Date(m.at).toLocaleString("fr-FR")}{" "}
                  <button
                    className="mini danger"
                    onClick={async () => {
                      await fetch(`/api/admin/messages?id=${m.id}`, { method: "DELETE" });
                      setMessages(messages.filter((x) => x.id !== m.id));
                    }}
                  >
                    Supprimer
                  </button>
                </span>
              </header>
              <p>{m.message}</p>
            </article>
          ))
        ))}

      {tab !== "messages" && (
        <div className="adm-save">
          <span role="status">{status || (dirty ? "Modifications non enregistrées" : "Aucune modification")}</span>
          <button className="btn btn-primary btn-sm" disabled={!dirty} onClick={save}>
            Enregistrer
          </button>
        </div>
      )}
    </main>
  );
}
