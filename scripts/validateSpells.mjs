import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/data/spells.ts", import.meta.url), "utf8");
const start = source.indexOf("const rawSpells");
const end = source.indexOf("function normalizeSpell");
if (start < 0 || end < 0) {
  console.error("❌ Não foi possível localizar rawSpells em src/data/spells.ts");
  process.exit(1);
}

const snippet = source
  .slice(start, end)
  .replace("const rawSpells: SpellData[] =", "const rawSpells =")
  .concat("\nrawSpells;");

/** @type {any[]} */
const spells = vm.runInNewContext(snippet, {});

const errors = [];
const idCounts = new Map();
const nameCounts = new Map();

for (const [index, spell] of spells.entries()) {
  const pos = `#${index + 1} (${spell?.id ?? "sem-id"})`;
  idCounts.set(spell?.id, (idCounts.get(spell?.id) ?? 0) + 1);
  const normalizedName = (spell?.name ?? "").toLocaleLowerCase("pt-BR");
  nameCounts.set(normalizedName, (nameCounts.get(normalizedName) ?? 0) + 1);

  if (!spell?.id || typeof spell.id !== "string") errors.push(`${pos}: id ausente ou inválido`);
  if (!spell?.name || typeof spell.name !== "string") errors.push(`${pos}: name ausente ou inválido`);
  if (typeof spell?.level !== "number" || Number.isNaN(spell.level)) errors.push(`${pos}: level ausente ou inválido`);
  if (typeof spell?.description !== "string" || spell.description.trim().length === 0) errors.push(`${pos}: description vazia`);
  if (!Array.isArray(spell?.classes)) errors.push(`${pos}: classes deve ser array`);
}

for (const [id, count] of idCounts.entries()) if (id && count > 1) errors.push(`ID duplicado: ${id} (${count} ocorrências)`);
for (const [name, count] of nameCounts.entries()) if (name && count > 1) errors.push(`Nome duplicado: ${name} (${count} ocorrências)`);

if (errors.length) {
  console.error("❌ validate:spells falhou:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`✅ validate:spells OK (${spells.length} magias)`);
