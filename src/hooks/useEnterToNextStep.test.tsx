import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useEnterToNextStep } from "@/hooks/useEnterToNextStep";

interface HarnessProps {
  canGoNext?: boolean;
  goNext?: () => void;
}

function Harness({ canGoNext = true, goNext = vi.fn() }: HarnessProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEnterToNextStep({ canGoNext, goNext, containerRef });

  return (
    <>
      <div ref={containerRef} data-testid="step-container">
        <div data-testid="plain" tabIndex={0}>
          Conteúdo
        </div>
        <button type="button">Botão</button>
        <div role="menuitem" tabIndex={0}>
          Item de menu
        </div>
        <div data-prevent-enter-next tabIndex={0}>
          Bloqueado
        </div>
      </div>
      <div data-testid="outside" tabIndex={0}>
        Outside
      </div>
    </>
  );
}

describe("useEnterToNextStep", () => {
  it("avança com Enter em elemento comum dentro do container ativo", () => {
    const goNext = vi.fn();
    render(<Harness goNext={goNext} />);

    fireEvent.keyDown(screen.getByTestId("plain"), { key: "Enter" });

    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it("não avança com Enter em controles interativos", () => {
    const goNext = vi.fn();
    render(<Harness goNext={goNext} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Botão" }), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Item de menu" }), { key: "Enter" });
    fireEvent.keyDown(screen.getByText("Bloqueado"), { key: "Enter" });

    expect(goNext).not.toHaveBeenCalled();
  });

  it("não avança com Enter fora do container da etapa ativa", () => {
    const goNext = vi.fn();
    render(<Harness goNext={goNext} />);

    fireEvent.keyDown(screen.getByTestId("outside"), { key: "Enter" });

    expect(goNext).not.toHaveBeenCalled();
  });
});
