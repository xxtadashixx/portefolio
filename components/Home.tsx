import { getContent } from "@/lib/store";
import { getIcon } from "@/lib/icons";
import { llmConfigured } from "@/lib/llm";
import type { Evidence } from "@/lib/types";
import { UI, homePath, type Lang } from "@/lib/i18n";
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

/** Les quatre étapes réelles du pipeline, affichées dans le hero. */
const STAGES = [
  { label: "provision", tool: "terraform", icon: "terraform" },
  { label: "build", tool: "docker hub", icon: "docker" },
  { label: "scan", tool: "trivy", icon: "trivy" },
  { label: "deploy", tool: "traefik", icon: "traefikproxy" },
];
const isImage = (file: string) => /\.(png|jpe?g|webp)$/i.test(file);

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

export async function Home({ lang }: { lang: Lang }) {
  const t = UI[lang];
  const content = await getContent(lang);
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
    url: homePath(lang),
  };

  return (
    <>
      <a href="#about" className="skip">
        {t.skip}
      </a>
      <Chrome cvHref={cvHref} name={p.name} avatarSrc={avatarSrc} lang={lang} />

      <main id="top">
        {/* ---------------------------------------------------------------- Hero */}
        <section className="hero" aria-label={t.heroLabel}>
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
              <ul className="hero-tags" aria-label={t.specialties}>
                {p.tagline.split("|").map((t) => (
                  <li key={t}>{t.trim()}</li>
                ))}
              </ul>
              <p className="hero-intro">« {p.intro} »</p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#about">
                  {t.explore} <span aria-hidden="true">↓</span>
                </a>
                {cvHref && (
                  <a className="btn" href={cvHref} download>
                    {t.downloadCv}
                  </a>
                )}
              </div>
            </div>
            <HeroLive stages={STAGES.map((n) => ({ label: n.label, tool: n.tool, path: getIcon(n.icon)?.path ?? "" }))} lang={lang} />
          </div>
        </section>

        {/* ------------------------------------------------------------- À propos */}
        <section id="about">
          <div className="wrap">
            <SectionHead cmd="cat about.md" title={t.about[0]} accent={t.about[1]} />
            <div className="about-grid">
              <div className="card about-card" data-reveal>
                <p>{p.summary}</p>
                <h3>{t.domains}</h3>
                <ul className="chips">
                  {p.domains.map((d) => (
                    <li key={d} className="chip">
                      {d}
                    </li>
                  ))}
                </ul>
                <dl className="kv">
                  <div>
                    <dt>{t.languages}</dt>
                    <dd>{p.languages.join(" · ")}</dd>
                  </div>
                  <div>
                    <dt>{t.strengths}</dt>
                    <dd>{p.softSkills.join(" · ")}</dd>
                  </div>
                  {p.associations.length > 0 && (
                    <div>
                      <dt>{t.associations}</dt>
                      <dd>{p.associations.join(" · ")}</dd>
                    </div>
                  )}
                  {p.legalName && (
                    <div>
                      <dt>{t.fullName}</dt>
                      <dd>{p.legalName}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <ol className="log" aria-label={t.timeline}>
                {experience.map((e, i) => (
                  <li key={e.role + e.company} className="card work" data-reveal style={{ "--i": i } as React.CSSProperties}>
                    <p className="log-meta">
                      <b>{t.experience}</b>
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
                      <b>{t.education}</b>
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
              title={t.stack[0]}
              accent={t.stack[1]}
              sub={t.stackSub}
            />
            {rainLogos.length > 0 && <LogoRain logos={rainLogos} lang={lang} />}
            <div className="legend" data-reveal>
              {evidences.map((ev) => (
                <span key={ev}>
                  <span className={`tag tag-${ev}`}>{t.evidence[ev]}</span>
                  {t.evidenceHelp[ev]}
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
                    <div key={s.name} className="tech" data-brand={getIcon(s.icon)?.title}>
                      <Logo slug={s.icon} name={s.name} />
                      <div>
                        <div className="tech-name">
                          {s.name}
                          <span className={`tag tag-${s.evidence}`}>{t.evidence[s.evidence]}</span>
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
                <p className="block-title">{t.otherSkills}</p>
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
              title={t.projects[0]}
              accent={t.projects[1]}
              sub={t.projectsSub}
            />
            <Projects projects={projects} lang={lang} />
          </div>
        </section>

        {/* -------------------------------------------------------- Certifications */}
        <section id="certifications">
          <div className="wrap">
            <SectionHead cmd="ls -l certs/" title={t.certs[0]} accent={t.certs[1]} />
            <div className="cert-grid">
              {certifications.map((c, i) => (
                <article key={c.id} className="card card-hover cert" data-reveal style={{ "--i": i % 3 } as React.CSSProperties}>
                  {c.file && isImage(c.file) && (
                    <a className="cert-thumb" href={fileUrl(c.file)} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fileUrl(c.file)} alt="" loading="lazy" decoding="async" />
                    </a>
                  )}
                  <div className="cert-top">
                    <Logo slug={c.icon} name={c.issuer} />
                    <div>
                      <p className="cert-issuer">{c.issuer}</p>
                      <p className="cert-kind">{c.kind}</p>
                    </div>
                  </div>
                  <h3>{c.title}</h3>
                  <p className="cert-meta">
                    <b>✓ {c.date || t.noDate}</b>
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
                      {t.viewCert} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <div className="todo">
                      <b>{t.todo}</b>{t.original}
                    </div>
                  )}
                </article>
              ))}
            </div>
            <p className="cert-note" data-reveal>
              {t.certNote}
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------- Terminal */}
        <section id="terminal">
          <div className="wrap">
            <SectionHead
              cmd="ssh visitor@rynah-cloud"
              title={t.terminal[0]}
              accent={t.terminal[1]}
              sub={t.terminalSub}
            />
            <Terminal content={{ ...content, documents: [], notes: [] }} lang={lang} />
          </div>
        </section>

        {/* -------------------------------------------------------------- Contact */}
        <section id="contact">
          <div className="wrap">
            <SectionHead cmd="./contact.sh" title={t.contact[0]} accent={t.contact[1]} sub={t.contactSub} />
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
                      <strong>{t.downloadPdf}</strong>
                    </span>
                    <span aria-hidden="true">↓</span>
                  </a>
                )}
              </div>
              <ContactForm lang={lang} />
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <span>
            © {new Date().getFullYear()} {p.name} — <b>{t.footer}</b>
          </span>
          <span>build : next.js · docker · rag</span>
        </div>
      </footer>

      <Assistant enabled={llmConfigured()} lang={lang} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
