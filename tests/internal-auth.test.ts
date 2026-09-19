import { describe, expect, it } from "vitest";
import { bearerOk } from "../src/lib/internal-auth";
describe("bearerOk", () => {
  const secret = "0123456789abcdef0123456789abcdef";
  it("accepts the right token", () => expect(bearerOk(`Bearer ${secret}`, secret)).toBe(true));
  it("rejects wrong/missing/short secrets", () => {
    expect(bearerOk("Bearer nope", secret)).toBe(false);
    expect(bearerOk(null, secret)).toBe(false);
    expect(bearerOk("Bearer short", "short")).toBe(false);
    expect(bearerOk(`Bearer ${secret}`, undefined)).toBe(false);
  });
});
