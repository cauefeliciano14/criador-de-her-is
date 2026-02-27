import { useEffect } from "react";

interface UseEnterToNextStepProps {
  canGoNext: boolean;
  goNext: () => void;
}

export function useEnterToNextStep({ canGoNext, goNext }: UseEnterToNextStepProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      // Check if focus is in an input element that should prevent advancement
      const target = e.target as HTMLElement;
      if (target && target.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }

      // Check for modifier keys (optional, but prevents accidental advances)
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }

      if (canGoNext) {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoNext, goNext]);
}