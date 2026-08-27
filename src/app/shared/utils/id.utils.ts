let nextId = 0;

/**
 * Generates a unique, stable ID for a component instance.
 * @param prefix The prefix to use for the ID.
 * @returns A unique ID string.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}
