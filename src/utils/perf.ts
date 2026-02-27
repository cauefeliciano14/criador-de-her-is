/**
 * Lightweight performance instrumentation (DEV only).
 * All calls are no-ops in production builds.
 */

const IS_DEV = import.meta.env.DEV;
const THRESHOLDS: Record<string, number> = {
  recalcAll: 15,
  filterSpells: 10,
  filterItems: 10,
};

/** Mark a named timestamp */
export function perfMark(name: string): void {
  if (!IS_DEV) return;
  performance.mark(name);
}

/** Measure between two marks and log if above threshold */
export function perfMeasure(label: string, startMark: string, endMark?: string): number {
  if (!IS_DEV) return 0;
  const end = endMark ?? `${startMark}-end`;
  if (!endMark) performance.mark(end);
  try {
    const measure = performance.measure(label, startMark, end);
    const ms = measure.duration;
    const threshold = THRESHOLDS[label] ?? 50;
    if (ms > threshold) {
      console.warn(`⚡ [Perf] ${label}: ${ms.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
    performance.clearMarks(startMark);
    performance.clearMarks(end);
    performance.clearMeasures(label);
    return ms;
  } catch {
    return 0;
  }
}

/** Time a synchronous function */
export function perfTime<T>(label: string, fn: () => T): T {
  if (!IS_DEV) return fn();
  const start = performance.now();
  const result = fn();
  const elapsed = performance.now() - start;
  const threshold = THRESHOLDS[label] ?? 50;
  if (elapsed > threshold) {
    console.warn(`⚡ [Perf] ${label}: ${elapsed.toFixed(2)}ms (threshold: ${threshold}ms)`);
  }
  return result;
}

/** Track render counts in DEV */
const renderCounts: Record<string, number> = {};

export function trackRender(componentName: string): void {
  if (!IS_DEV) return;
  renderCounts[componentName] = (renderCounts[componentName] ?? 0) + 1;
  if (renderCounts[componentName] % 20 === 0) {
    console.debug(`🔄 [Render] ${componentName}: ${renderCounts[componentName]} renders`);
  }
}

export function getRenderCounts(): Record<string, number> {
  return { ...renderCounts };
}
