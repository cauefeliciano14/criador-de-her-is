import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";

const RESET_CONFIRMATION_TEXT = "REINICIAR";

export function Header() {
  const [confirmationText, setConfirmationText] = useState("");
  const resetCharacter = useCharacterStore((s) => s.resetCharacter);
  const lastSavedAt = useCharacterStore((s) => s.lastSavedAt);
  const persistError = useCharacterStore((s) => s.persistError);
  const resetBuilder = useBuilderStore((s) => s.resetBuilder);

  const handleReset = () => {
    resetCharacter();
    resetBuilder();
    setConfirmationText("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText("");
    }
  };

  const isResetDisabled = confirmationText.trim().toUpperCase() !== RESET_CONFIRMATION_TEXT;
  const savedAtLabel = lastSavedAt
    ? `Salvo automaticamente às ${new Date(lastSavedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : "";

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-lg font-bold tracking-wide">⚔️ D&D 2024 Character Builder (PT-BR)</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          {savedAtLabel && <p className="text-xs text-muted-foreground">{savedAtLabel}</p>}
          {persistError && <p className="text-xs text-destructive">{persistError}</p>}
        </div>
        <AlertDialog onOpenChange={handleDialogOpenChange}>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza que deseja reiniciar?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso apagará escolhas e progresso das etapas.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Para confirmar, digite <strong>{RESET_CONFIRMATION_TEXT}</strong> abaixo.
              </p>
              <input
                type="text"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Digite REINICIAR para confirmar"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                disabled={isResetDisabled}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reiniciar mesmo assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
