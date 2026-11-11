# Rynah Tadashi — Portfolio DevOps & Cloud

Portfolio interactif : hero animé (terminal + chaîne de déploiement), terminal Linux
réellement utilisable, assistant IA **TADASHI AI** branché sur une base documentaire
(RAG), et interface d'administration privée pour tout mettre à jour sans toucher au code.

## Démarrage

```bash
cp .env.example .env      # puis renseigner les variables
npm install
npm run dev               # http://localhost:3000
```

Avec Docker :

```bash
docker compose up -d --build
```

Le conteneur écoute sur le port 3000 ; les données modifiables vivent dans le volume
`portfolio-data` (`/data`). Placez-le derrière votre reverse proxy (Traefik, etc.) pour
le HTTPS.

## Configuration

| Variable | Rôle |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clé de l'API LLM. Lue uniquement côté serveur. Sans elle, l'assistant s'affiche « hors ligne ». |
| `LLM_MODEL` | Modèle utilisé (défaut : `claude-opus-5-5`). |
| `LLM_EFFORT` | `low` (défaut), `medium` ou `high`. |
| `LLM_MAX_TOKENS` | Longueur maximale d'une réponse (défaut : 2000). |
| `ADMIN_PASSWORD` | Mot de passe de `/admin`. Sans lui, l'administration est désactivée. |
| `SESSION_SECRET` | Chaîne aléatoire qui signe les sessions (`openssl rand -hex 32`). |
| `SITE_URL` | URL publique, pour le SEO. |
| `DATA_DIR` | Dossier des données modifiables (défaut : `./data`). |
| `CONTACT_WEBHOOK_URL` | Optionnel : reçoit chaque message du formulaire en POST JSON. |
| `CHAT_RATE_PER_MINUTE`, `CHAT_RATE_PER_DAY` | Limites de l'assistant par adresse IP (défaut : 8 et 60). |

## Architecture

```
app/
  page.tsx               page unique, rendue côté serveur à partir du contenu
  admin/                 interface d'administration
  api/chat               assistant IA (RAG + flux de réponse)
  api/contact            formulaire de contact
  api/files/[name]       CV, certificats et captures
  api/admin/*            connexion, contenu, import de fichiers, extraction, messages
components/              hero, terminal, assistant, galerie de projets, formulaire…
lib/
  store.ts               lecture / écriture du contenu et des fichiers
  validate.ts            normalisation et bornage de tout contenu entrant
  rag.ts                 découpage en passages, index BM25, recherche
  llm.ts                 appel du modèle, consignes, transcription de documents
  commands.ts            moteur du terminal
  auth.ts, ratelimit.ts  session admin signée, limitation de débit
content/seed/            contenu initial + documents originaux (CV, certificats)
tests/                   tests du RAG et du terminal
```

### Contenu

Tout le site est généré depuis un seul document (`content.json`) : profil, parcours,
compétences, projets, certificats, et la base documentaire de l'assistant.
Au premier lancement, le site lit `content/seed/content.json`. Dès la première
sauvegarde dans `/admin`, il lit `DATA_DIR/content.json` ; les fichiers importés vont
dans `DATA_DIR/uploads`.

### Assistant IA

1. **Base de connaissances** — le contenu du site, le texte extrait des documents
   importés et les notes libres sont découpés en passages.
2. **Recherche** — à chaque question, un index BM25 (français / anglais, sans accents,
   avec élargissement par termes proches) sélectionne les passages pertinents.
3. **Génération** — le modèle reçoit ces passages et la question, avec pour consigne de
   ne rien affirmer qui n'y figure pas, de distinguer ce qui a été pratiqué en
   entreprise, en projet académique, appris en formation ou simplement déclaré, et de
   dire clairement quand une information manque.

Protections : clé API côté serveur uniquement, limite de débit par IP, taille et nombre
de messages bornés, balises de contexte retirées des messages des visiteurs, consignes
contre le détournement de rôle, rendu des réponses sans HTML.

### Ajouter un document

Dans `/admin` → **Base de l'assistant** → *Ajouter* → importer le PDF ou l'image →
**Extraire le texte du fichier** → relire → **Enregistrer**. Les PDF textuels sont lus
localement ; les scans et les images sont transcrits par le modèle (clé API requise).
Pour l'afficher aussi comme carte, ajoutez une entrée dans **Certificats** avec le même
fichier.

### Terminal

Commandes : `help`, `about`, `skills`, `projects`, `certifications`, `experience`,
`education`, `contact`, `resume`, `neofetch`, `ask <question>`, `ls`, `cat <fichier>`,
`whoami`, `history`, `clear`. Historique (↑ ↓), complétion (Tab), `Ctrl+L`, `Ctrl+C`.

## Vérifications

```bash
npm run typecheck
npm test
npm run build
```
