/**
 * CatalogGate — full-screen blocker when catalog validation fails.
 * Blocks the entire wizard and shows diagnostic with copy button.
 */
import { useState } from "react";
import { AlertTriangle, Copy, CheckCircle2 } from "lucide-react";
import type { CatalogIssue } from "@/utils/validateCatalog";

interface CatalogGateProps {
  issues: CatalogIssue[];
  children: React.ReactNode;
}

const DATASET_LABELS: Record<string, string> = {
  classes: "Classes (12)",
  backgrounds: "Antecedentes (16)",
  races: "Raças (10)",
};

export function CatalogGate({ issues, children }: CatalogGateProps) {
  const [copied, setCopied] = useState(false);

  if (issues.length === 0) return <>{children}</>;

  const diagnostic = {
    timestamp: new Date().toISOString(),
    status: "CATALOG_INVALID",
    issues: issues.map((i) => ({
      dataset: i.dataset,
      missing: i.missing,
      extra: i.extra,
    })),
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostic, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = JSON.stringify(diagnostic, null, 2);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-xl w-full rounded-xl border-2 border-destructive/40 bg-card p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-destructive">Catálogo Inválido</h1>
            <p className="text-sm text-muted-foreground">
              Os dados do PHB 2024 estão incompletos. O criador de personagens está bloqueado.
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {issues.map((issue) => (
            <div key={issue.dataset} className="rounded-lg border border-destructive/20 bg-secondary/30 p-4">
              <p className="text-sm font-semibold mb-2">
                {DATASET_LABELS[issue.dataset] ?? issue.dataset}
              </p>
              {issue.missing.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-destructive mb-1">Faltando ({issue.missing.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {issue.missing.map((id) => (
                      <span key={id} className="rounded bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-xs font-mono text-destructive">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {issue.extra.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-warning mb-1">Extras ({issue.extra.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {issue.extra.map((id) => (
                      <span key={id} className="rounded bg-warning/10 border border-warning/20 px-2 py-0.5 text-xs font-mono text-warning">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md border bg-secondary px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar diagnóstico
              </>
            )}
          </button>
          <span className="text-[10px] text-muted-foreground">
            Corrija os arquivos em src/data/ e recarregue.
          </span>
        </div>

        <p className="mt-4 text-[10px] text-muted-foreground">
          IDs esperados definidos em src/data/catalogExpectations.ts
        </p>
      </div>
    </div>
  );
}
