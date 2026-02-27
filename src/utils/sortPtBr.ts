/**
 * Sort an array of objects alphabetically by a string key, using PT-BR locale.
 */
export function sortPtBr<T>(arr: T[], key: keyof T): T[] {
  return [...arr].sort((a, b) =>
    String(a[key]).localeCompare(String(b[key]), "pt-BR")
  );
}

/**
 * Sort strings alphabetically using PT-BR locale.
 */
export function sortStringsPtBr(arr: string[]): string[] {
  return [...arr].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
