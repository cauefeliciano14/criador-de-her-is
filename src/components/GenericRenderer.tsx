import React from "react";

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

interface GenericRendererProps {
  data: unknown;
  label?: string;
  depth?: number;
}

export function GenericRenderer({ data, label, depth = 0 }: GenericRendererProps) {
  if (data === null || data === undefined) return null;

  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return (
      <div className={`${depth > 0 ? "ml-4" : ""}`}>
        {label && (
          <span className="text-muted-foreground text-sm">{humanize(label)}: </span>
        )}
        <span className="text-sm">{String(data)}</span>
      </div>
    );
  }

  if (Array.isArray(data)) {
    // Array of primitives → inline list
    if (data.every((item) => typeof item !== "object" || item === null)) {
      return (
        <div className={`${depth > 0 ? "ml-4" : ""} mb-2`}>
          {label && (
            <p className="text-sm font-medium text-muted-foreground mb-1">{humanize(label)}</p>
          )}
          <ul className="ml-4 list-disc space-y-0.5">
            {[...data]
              .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"))
              .map((item, i) => (
                <li key={i} className="text-sm">{String(item)}</li>
              ))}
          </ul>
        </div>
      );
    }

    // Array of objects
    return (
      <div className={`${depth > 0 ? "ml-4" : ""} mb-2`}>
        {label && (
          <p className="text-sm font-semibold mb-2">{humanize(label)}</p>
        )}
        <div className="space-y-3">
          {data.map((item, i) => (
            <div key={i} className="rounded-md border bg-secondary/40 p-3">
              <GenericRenderer data={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    return (
      <div className={`${depth > 0 ? "ml-4" : ""} mb-2`}>
        {label && (
          <p className={`font-semibold mb-2 ${depth === 0 ? "text-base" : "text-sm"}`}>
            {humanize(label)}
          </p>
        )}
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <GenericRenderer key={key} data={value} label={key} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
