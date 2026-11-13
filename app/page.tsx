import { getContent } from "@/lib/store";
import { getIcon } from "@/lib/icons";
import { llmConfigured } from "@/lib/llm";
import { EVIDENCE_LABEL, type Evidence } from "@/lib/types";
import { fileUrl } from "@/lib/commands";
import { Chrome } from "@/components/Chrome";
import { Avatar } from "@/components/Avatar";
import { Particles } from "@/components/Particles";
import { HeroLive } from "@/components/HeroLive";
import { Logo } from "@/components/Logo";
import { Projects } from "@/components/Projects";
import { LogoRain, type RainLogo } from "@/components/LogoRain";
import { Terminal } from "@/components/Terminal";
import { ContactForm } from "@/components/ContactForm";
import { Assistant } from "@/components/Assistant";

// Le contenu est modifiable depuis /admin : la page est rendue à chaque requête.
export const dynamic = "force-dynamic";

const INFRA = [
  { label: "code", icon: "git" },
  { label: "gitlab ci", icon: "gitlab" },
  { label: "docker", icon: "docker" },
  { label: "traefik", icon: "traefikproxy" },
  { label: "grafana", icon: "grafana" },
];

function SectionHead({ cmd, title, accent, sub }: { cmd: string; title: string; accent: string; sub?: string }) {
  return (
    <header className="sec-head" data-reveal>
      <p className="sec-cmd">
        <b>~/rynah</b>
        <span>$</span>
        <i>{cmd}</i>
      </p>
      <h2>
        {title} <span>{accent}</span>
      </h2>
      {sub && <p className="sec-sub">{sub}</p>}
    </header>
  );
}

export default async function Home() {
  const content = await getContent();
  const { profile: p, experience, education, skills, projects, certifications } = content;
  const [first, ...rest] = p.name.split(" ");
  const cvHref = p.cvFile ? fileUrl(p.cvFile, true) : null;
  const avatarSrc = p.avatarFile ? fileUrl(p.avatarFile) : null;
  const evidences = [...new Set(skills.flatMap((s) => s.items.map((i) => i.evidence)))] as Evidence[];

  // Un logo par marque (Docker, Grafana… apparaissent plusieurs fois dans la stack).
  const rainLogos: RainLogo[] = [];
  for (const item of skills.flatMap((s) => s.items)) {
    const icon = getIcon(item.icon);
    if (icon && !rainLogos.some((l) => l.path === icon.path)) rainLogos.push({ name: icon.title, path: icon.path, color: icon.color });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    alternateName: p.legalName,
    jobTitle: p.title,
    description: p.intro,
    email: p.email ? `mailto:${p.email}` : undefined,
    sameAs: [p.linkedin, p.github].filter(Boolean),
    knowsAbout: skills.flatMap((s) => s.items.map((i) => i.name)),
    alumniOf: education[0]?.school,
  };

  return (
    <>
      <a href="#about" className="skip">
        Aller au contenu
      </a>
      <Chrome cvHref={cvHref} name={p.name} avatarSrc={avatarSrc} />

      <main id="top">
        {/* ---------------------------------------------------------------- Hero */}
        <section className="hero" aria-label="Présentation">
          <Particles />
          <div className="wrap hero-grid">
            <div>
              <p className="eyebrow">~/portfolio · branch main · {p.location || "online"}</p>
              <div className="hero-id">
                {avatarSrc && <Avatar src={avatarSrc} name={p.name} className="avatar-xl" />}
                <h1>
                  <span>{first}</span>
                  <span>{rest.join(" ")}</span>
                </h1>
              </div>
              <p className="hero-role">{p.title}</p>
              <ul className="hero-tags" aria-label="Spécialités">
                {p.tagline.split("|").map((t) => (
                  <li key={t}>{t.trim()}</li>
                ))}
              </ul>
              <p className="hero-intro">« {p.intro} »</p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#about">
                  Explorer mon portfolio <span aria-hidden="true">↓</span>
                </a>
                {cvHref && (
                  <a className="btn" href={cvHref} download>
                    Télécharger mon CV
                  </a>
                )}
              </div>
              <p className="hero-hint">
                Envie d&apos;aller plus vite ? Ouvrez le <a href="#terminal" style={{ color: "var(--cyan)" }}>terminal</a> et tapez <kbd>help</kbd>.
              </p>
            </div>
            <HeroLive nodes={INFRA.map((n) => ({ label: n.label, path: getIcon(n.icon)?.path ?? "" }))} />
          </div>
        </section>

        {/* ------------------------------------------------------------- À propos */}
        <section id="about">
          <div className="wrap">
            <SectionHead cmd="cat about.md" title="Mon" accent="parcours" />
            <div className="about-grid">
              <div className="card about-card" data-reveal>
                <p>{p.summary}</p>
                <h3>domaines</h3>
                <ul className="chips">
                  {p.domains.map((d) => (
                    <li key={d} className="chip">
                      {d}
                    </li>
                  ))}
                </ul>
                <dl className="kv">
                  <div>
                    <dt>langues</dt>
                    <dd>{p.languages.join(" · ")}</dd>
                  </div>
                  <div>
                    <dt>atouts</dt>
                    <dd>{p.softSkills.join(" · ")}</dd>
                  </div>
                  {p.associations.length > 0 && (
                    <div>
                      <dt>vie associative</dt>
                      <dd>{p.associations.join(" · ")}</dd>
                    </div>
                  )}
                  {p.legalName && (
                    <div>
                      <dt>nom complet</dt>
                      <dd>{p.legalName}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <ol className="log" aria-label="Expérience et formation">
                {experience.map((e, i) => (
                  <li key={e.role + e.company} className="card work" data-reveal style={{ "--i": i } as React.CSSProperties}>
                    <p className="log-meta">
                      <b>expérience</b>
                      <span>{e.period}</span>
                    </p>
                    <h3>{e.role}</h3>
                    <p className="where">{e.company}</p>
                    <ul>
                      {e.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </li>
                ))}
                {education.map((e, i) => (
                  <li key={e.title} className="card" data-reveal style={{ "--i": i + 1 } as React.CSSProperties}>
                    <p className="log-meta">
                      <b>formation</b>
                      <span>{e.year}</span>
                    </p>
                    <h3>{e.title}</h3>
                    <p className="where">{e.school}</p>
                    {e.detail && <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 14.5 }}>{e.detail}</p>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- Stack */}
        <section id="stack">
          <div className="wrap">
            <SectionHead
              cmd="ls stack/"
              title="Tech"
              accent="stack"
              sub="Pas de jauges ni de pourcentages : chaque outil indique simplement d'où vient la compétence."
            />
            {rainLogos.length > 0 && <LogoRain logos={rainLogos} />}
            <div className="legend" data-reveal>
              {evidences.map((ev) => (
                <span key={ev}>
                  <span className={`tag tag-${ev}`}>{EVIDENCE_LABEL[ev]}</span>
                  {ev === "practiced" && "mis en œuvre dans le projet de déploiement"}
                  {ev === "academic" && "utilisé pendant la licence"}
                  {ev === "training" && "cours certifié suivi"}
                  {ev === "declared" && "sans projet documenté ici pour l'instant"}
                </span>
              ))}
            </div>
            <div className="stack-grid">
              {skills.map((cat, i) => (
                <article key={cat.category} className="card stack-cat" data-reveal style={{ "--i": i % 3 } as React.CSSProperties}>
                  <header>
                    <h3>{cat.category}</h3>
                    <span>{String(cat.items.length).padStart(2, "0")}</span>
                  </header>
                  {cat.items.map((s) => (
                    <div key={s.name} className="tech">
                      <Logo slug={s.icon} name={s.name} />
                      <div>
                        <div className="tech-name">
                          {s.name}
                          <span className={`tag tag-${s.evidence}`}>{EVIDENCE_LABEL[s.evidence]}</span>
                        </div>
                        <p>{s.description}</p>
                      </div>
                    </div>
                  ))}
                </article>
              ))}
            </div>
            {content.otherSkills.length > 0 && (
              <div className="card other-skills" data-reveal>
                <p className="block-title">également mentionné dans mon CV</p>
                <ul className="chips">
                  {content.otherSkills.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* -------------------------------------------------------------- Projets */}
        <section id="projects">
          <div className="wrap">
            <SectionHead
              cmd="git log --projects"
              title="Mes réalisations"
              accent="DevOps"
              sub="Chaque fiche sépare l'application concernée de ce que j'ai réalisé moi-même."
            />
            <Projects projects={projects} />
          </div>
        </section>

        {/* -------------------------------------------------------- Certifications */}
        <section id="certifications">
          <div className="wrap">
            <SectionHead cmd="ls -l certs/" title="Certificats &" accent="formations" />
            <div className="cert-grid">
              {certifications.map((c, i) => (
                <article key={c.id} className="card card-hover cert" data-reveal style={{ "--i": i % 3 } as React.CSSProperties}>
                  <div className="cert-top">
                    <Logo slug={c.icon} name={c.issuer} />
                    <div>
                      <p className="cert-issuer">{c.issuer}</p>
                      <p className="cert-kind">{c.kind}</p>
                    </div>
                  </div>
                  <h3>{c.title}</h3>
                  <p className="cert-meta">
                    <b>✓ {c.date || "date non précisée"}</b>
                    {c.credentialId && <span>ID {c.credentialId}</span>}
                  </p>
                  {c.skills.length > 0 && (
                    <ul className="chips">
                      {c.skills.map((s) => (
                        <li key={s} className="chip">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.file ? (
                    <a className="btn btn-sm" href={fileUrl(c.file)} target="_blank" rel="noopener noreferrer">
                      Voir le certificat <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <div className="todo">
                      <b>À COMPLÉTER</b>Document original
                    </div>
                  )}
                </article>
              ))}
            </div>
            <p className="cert-note" data-reveal>
              Ces documents attestent de formations suivies et réussies ; chacun est consultable dans sa version originale.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- Terminal */}
        <section id="terminal">
          <div className="wrap">
            <SectionHead
              cmd="ssh visitor@rynah-cloud"
              title="Terminal"
              accent="interactif"
              sub="Tout le portfolio en ligne de commande. Essayez neofetch, skills, ou ask suivi d'une question."
            />
            <Terminal content={{ ...content, documents: [], notes: [] }} />
          </div>
        </section>

        {/* -------------------------------------------------------------- Contact */}
        <section id="contact">
          <div className="wrap">
            <SectionHead cmd="./contact.sh" title="Travaillons" accent="ensemble" sub="Une opportunité, un projet, une question ? Écrivez-moi." />
            <div className="contact-grid">
              <div className="links">
                {p.email && (
                  <a className="card card-hover link-row" href={`mailto:${p.email}`} data-reveal>
                    <span className="logo mono">@</span>
                    <span>
                      <small>email</small>
                      <strong>{p.email}</strong>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                {p.linkedin && (
                  <a className="card card-hover link-row" href={p.linkedin} target="_blank" rel="noopener noreferrer" data-reveal>
                    <span className="logo mono">in</span>
                    <span>
                      <small>linkedin</small>
                      <strong>{p.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com/, "")}</strong>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                {p.github && (
                  <a className="card card-hover link-row" href={p.github} target="_blank" rel="noopener noreferrer" data-reveal>
                    <Logo slug="github" name="GitHub" />
                    <span>
                      <small>github</small>
                      <strong>{p.github.replace(/^https?:\/\/github\.com\//, "@")}</strong>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </a>
                )}
                {cvHref && (
                  <a className="card card-hover link-row" href={cvHref} download data-reveal>
                    <span className="logo mono">CV</span>
                    <span>
                      <small>curriculum vitae</small>
                      <strong>Télécharger le PDF</strong>
                    </span>
                    <span aria-hidden="true">↓</span>
                  </a>
                )}
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <span>
            © {new Date().getFullYear()} {p.name} — <b>● all systems operational</b>
          </span>
          <span>build : next.js · docker · rag</span>
        </div>
      </footer>

      <Assistant enabled={llmConfigured()} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
