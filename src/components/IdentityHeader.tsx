import { useCharacterStore } from "@/state/characterStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function IdentityHeader() {
  const name = useCharacterStore((s) => s.name);
  const level = useCharacterStore((s) => s.level);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);

  const handleNameChange = (value: string) => {
    patchCharacter({ name: value });
  };

  const handleLevelChange = (value: string) => {
    const newLevel = parseInt(value);
    if (newLevel === 1 || newLevel === 2) {
      // Limpar escolhas de nível 2 se reduzindo
      const currentLevel = level;
      if (currentLevel === 2 && newLevel === 1) {
        patchCharacter({
          level: newLevel,
          leveling: {
            pending: false,
            fromLevel: 1,
            toLevel: 1,
            hpMethod: null,
            hpRolls: {},
            choices: { subclassId: null, asiOrFeat: {} },
            changesSummary: [],
          },
          // Limpar outras escolhas de nível 2 se necessário
        });
      } else {
        patchCharacter({ level: newLevel });
      }
    }
  };

  return (
    <div className="border-b bg-card px-6 py-4">
      <div className="max-w-md">
        <h3 className="text-sm font-semibold mb-3">Identidade do Personagem</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="character-name" className="text-xs">Nome</Label>
            <Input
              id="character-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Nome do personagem"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="character-level" className="text-xs">Nível Inicial</Label>
            <Select value={level.toString()} onValueChange={handleLevelChange}>
              <SelectTrigger id="character-level" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nível 1</SelectItem>
                <SelectItem value="2">Nível 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}