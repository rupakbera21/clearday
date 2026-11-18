import { stableStringify, computeCanonicalHash } from "../hash";

describe("domain/hash", () => {
  it("produces identical hashes regardless of object key order", () => {
    const objA = { b: 2, a: 1, nested: { y: 20, x: 10 } };
    const objB = { a: 1, nested: { x: 10, y: 20 }, b: 2 };

    expect(stableStringify(objA)).toBe(stableStringify(objB));
    expect(computeCanonicalHash(objA)).toBe(computeCanonicalHash(objB));
  });

  it("produces deterministic hashes for primitive values and arrays", () => {
    expect(computeCanonicalHash("Delhi")).toBe(computeCanonicalHash("Delhi"));
    expect(computeCanonicalHash([1, 2, 3])).toBe(computeCanonicalHash([1, 2, 3]));
    expect(computeCanonicalHash(null)).toBe(computeCanonicalHash(null));
  });
});
