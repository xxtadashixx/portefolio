import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateContent } from "../lib/validate.ts";
import { buildIndex, retrieve, search, tokenize } from "../lib/rag.ts";

const content = validateContent(JSON.parse(readFileSync("content/seed/content.json", "utf8")));
const index = buildIndex(content);
const ids = (q: string) => retrieve(index, q).map((c) => c.id);

test("tokenize retire accents, mots vides et pluriels", () => {
  assert.deepEqual(tokenize("Quelles sont ses compétences en sécurité ?"), ["competence", "securite"]);
});

test("la fiche profil est toujours fournie", () => {
  assert.equal(ids("météo à Paris")[0], "profil");
});

test("questions types des recruteurs", () => {
  assert.ok(ids("Quels outils CI/CD maîtrise-t-il ?").includes("competences-CI/CD"));
  assert.ok(ids("A-t-il travaillé avec Docker et Ansible ?").includes("experience-0"));
  assert.ok(ids("Quelles certifications possède-t-il ?").includes("certifications"));
  assert.ok(ids("How can I contact him?").includes("contact"));
  assert.ok(ids("Does he have experience with AWS?").some((id) => id === "competences-Cloud" || id.startsWith("doc-kk-ecs")));
  assert.ok(ids("Where did he study?").includes("education"));
  assert.ok(ids("Connaît-il k8s ?").some((id) => id.startsWith("doc-kk-k8s")));
});

test("une question sans rapport ne remonte aucun passage", () => {
  assert.equal(search(index, "recette de gâteau au chocolat").length, 0);
});

test("la validation écarte les liens non http", () => {
  const c = validateContent({ profile: { name: "X", github: "javascript:alert(1)" } });
  assert.equal(c.profile.github, "");
});
