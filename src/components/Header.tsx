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
import { Button } from "@/components/ui/button";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";

const RESET_CONFIRMATION_TEXT = "REINICIAR";

export function Header() {
  const [confirmationText, setConfirmationText] = useState("");
  const resetCharacter = useCharacterStore((s) => s.resetCharacter);
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

  return (
    <header className="sticky top-0 z-50 flex h-auto min-h-14 items-center justify-between border-b bg-card px-4 py-2 md:px-6">
      <h1 className="text-sm font-bold tracking-wide md:text-lg">
        <span className="sm:hidden">⚔️ D&D 2024 Builder</span>
        <span className="hidden sm:inline">⚔️ D&D 2024 Character Builder (PT-BR)</span>
      </h1>
      <div className="flex items-center gap-2">
        <AlertDialog onOpenChange={handleDialogOpenChange}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px] gap-1.5 px-2 text-muted-foreground hover:text-foreground sm:px-3"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sm:hidden">Reset</span>
              <span className="hidden sm:inline">Reiniciar</span>
            </Button>
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
