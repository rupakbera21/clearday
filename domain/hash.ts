/**
 * @file hash.ts
 * @description Canonical hashing utility for caching and deterministic keys across client and server.
 * Addresses problem-statement: Canonical cache keys, efficiency.
 */

/**
 * Deterministically stringifies any object with sorted keys.
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    .join(",")}}`;
}

/**
 * Computes a fast, deterministic 32-bit FNV-1a hash formatted as a hex string.
 */
export function computeCanonicalHash(input: unknown): string {
  const str = typeof input === "string" ? input : stableStringify(input);
  let hash = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
