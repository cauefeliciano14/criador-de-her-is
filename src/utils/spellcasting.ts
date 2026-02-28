import { classes } from "@/data/classes";

export function isSpellcasterClass(classId: string | null | undefined): boolean {
  if (!classId) return false;
  return classes.some((cls) => cls.id === classId && cls.spellcasting !== null);
}
