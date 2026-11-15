import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateContent } from "../lib/validate.ts";
import { COMMANDS, complete, run } from "../lib/commands.ts";
import { UI } from "../lib/i18n.ts";

const content = validateContent(JSON.parse(readFileSync("content/seed/content.json", "utf8")));
const text = (cmd: string) => {
  const r = run(cmd, content, ["help"]);
  return [...r.lines, ...(r.neofetch?.info ?? [])].map((line) => line.map((s) => s.t).join("")).join("\n");
};

test("toutes les commandes documentées répondent", () => {
  for (const name of Object.keys(COMMANDS)) {
    assert.ok(!text(name).includes("commande introuvable"), name);
  }
});

test("les réponses reflètent les documents", () => {
  assert.match(text("experience"), /HaiRun Technology/);
  assert.match(text("certifications"), /Introduction to Cybersecurity/);
  assert.match(text("contact"), /linkedin\.com/);
  assert.match(text("neofetch"), /Rynah Tadashi/);
  assert.match(text("cat about.md"), /Licence en DevOps/);
});

test("commande inconnue, clear, resume et complétion", () => {
  assert.match(text("kubectl get pods"), /commande introuvable/);
  assert.deepEqual(run("clear", content).action, { type: "clear" });
  assert.equal(run("resume", content).action?.type, "download");
  assert.deepEqual(complete("ce"), ["certifications"]);
  assert.deepEqual(complete("cat ab"), ["cat about.md"]);
});

test("version anglaise : contenu traduit et aligné sur le français", () => {
  const en = validateContent(JSON.parse(readFileSync("content/seed/content.en.json", "utf8")));
  assert.deepEqual(en.projects.map((p) => p.id), content.projects.map((p) => p.id));
  assert.deepEqual(en.certifications.map((c) => c.id), content.certifications.map((c) => c.id));
  assert.deepEqual(en.skills.map((s) => s.items.map((i) => i.name)), content.skills.map((s) => s.items.map((i) => i.name)));
  const out = run("kubectl", en, [], "en").lines.map((line) => line.map((s) => s.t).join("")).join("\n");
  assert.match(out, /command not found/);
  assert.match(run("skills", en, [], "en").lines.map((line) => line.map((s) => s.t).join("")).join("\n"), /Used in a project/);
  // Les deux dictionnaires d'interface ont exactement les mêmes clés.
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
  assert.deepEqual(keys(UI.en), keys(UI.fr));
});

test("les volets du projet principal pointent vers un projet existant", () => {
  const ids = new Set(content.projects.map((p) => p.id));
  for (const p of content.projects) if (p.parentId) assert.ok(ids.has(p.parentId) && p.tab, p.id);
});
