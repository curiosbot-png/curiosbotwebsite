import { describe, expect, it } from "vitest";
import { canTransition } from "../src/lib/workflow";

describe("publishing workflow", () => {
  it("never lets marketing publish or approve", () => {
    expect(canTransition("approved", "published", "marketing")).toBe(false);
    expect(canTransition("in_review", "approved", "marketing")).toBe(false);
  });
  it("cannot skip approval", () => {
    expect(canTransition("draft", "published", "admin")).toBe(false);
    expect(canTransition("in_review", "published", "admin")).toBe(false);
  });
  it("allows the normal path", () => {
    expect(canTransition("draft", "in_review", "marketing")).toBe(true);
    expect(canTransition("in_review", "approved", "admin")).toBe(true);
    expect(canTransition("approved", "published", "admin")).toBe(true);
  });
});
