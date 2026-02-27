/**
 * Convert a PT-BR name to a camelCase ASCII id.
 * "Mãos Flamejantes" → "maosFlamejantes"
 * "Espada Longa" → "espadaLonga"
 */
export function slugifyId(name: string): string {
  // Remove accents
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Split into words
  const words = normalized
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  // camelCase: first word lowercase, rest capitalized
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}
