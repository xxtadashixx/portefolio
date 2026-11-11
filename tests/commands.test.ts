import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateContent } from "../lib/validate.ts";
import { COMMANDS, complete, run } from "../lib/commands.ts";

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
