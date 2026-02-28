import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const CHUNK_ERROR_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
];

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => error.message.includes(pattern));
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
  moduleKey: string,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(`lazy-retry-${moduleKey}`);
      }
      return module;
    } catch (error) {
      const retryKey = `lazy-retry-${moduleKey}`;
      const canUseWindow = typeof window !== "undefined";
      const alreadyRetried = canUseWindow && window.sessionStorage.getItem(retryKey) === "1";

      if (canUseWindow && !alreadyRetried && isChunkLoadError(error)) {
        window.sessionStorage.setItem(retryKey, "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }

      throw error;
    }
  });
}
