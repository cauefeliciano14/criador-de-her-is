import { useEffect } from "react";
import type { RefObject } from "react";

interface UseEnterToNextStepProps {
  canGoNext: boolean;
  goNext: () => void;
  containerRef: RefObject<HTMLElement>;
}

const ENTER_GUARD_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "[role='button']",
  "[role='menuitem']",
  "[role='link']",
  "[contenteditable='true']",
  "[data-prevent-enter-next]",
].join(", ");

export function useEnterToNextStep({ canGoNext, goNext, containerRef }: UseEnterToNextStepProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      // Check if focus is in an input element that should prevent advancement
      const target = e.target as HTMLElement;
      if (target && target.closest(ENTER_GUARD_SELECTOR)) {
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

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [canGoNext, goNext, containerRef]);
}
