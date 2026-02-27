/** PHB 2024 proficiency bonus by level */
export function calcProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}
