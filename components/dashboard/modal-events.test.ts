import { describe, expect, it } from "vitest";
import { isBackdropTarget } from "./modal-events";

describe("isBackdropTarget", () => {
  it("identifies clicks directly on the popup backdrop", () => {
    const backdrop = {};

    expect(isBackdropTarget(backdrop, backdrop)).toBe(true);
  });

  it("does not identify clicks inside the popup as backdrop clicks", () => {
    const backdrop = {};
    const dialogContent = {};

    expect(isBackdropTarget(dialogContent, backdrop)).toBe(false);
  });
});
