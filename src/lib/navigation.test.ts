import { describe, expect, it } from "vitest";
import {
  controllerProfileKey,
  findSlideIndex,
  getNewlyPressedButtons,
  moveSlide,
} from "./navigation";

describe("Deck navigation", () => {
  it("resolves a valid hash and falls back to the first Slide", () => {
    const slugs = ["intro", "demo", "finish"];

    expect(findSlideIndex(slugs, "#demo")).toBe(1);
    expect(findSlideIndex(slugs, "#missing")).toBe(0);
    expect(findSlideIndex(slugs, "")).toBe(0);
  });

  it("clamps movement at the first and final Slides", () => {
    expect(moveSlide(0, -1, 3)).toBe(0);
    expect(moveSlide(1, 1, 3)).toBe(2);
    expect(moveSlide(2, 1, 3)).toBe(2);
  });
});

describe("controller input", () => {
  it("reports a held button only on its rising edge", () => {
    expect(getNewlyPressedButtons([false, true], [false, false])).toEqual([1]);
    expect(getNewlyPressedButtons([false, true], [false, true])).toEqual([]);
  });

  it("builds a stable profile key from observable controller identity", () => {
    expect(
      controllerProfileKey({
        id: "Joy-Con (L)",
        mapping: "",
        buttons: 16,
        axes: 2,
      }),
    ).toBe("Joy-Con (L)::raw::16::2");
  });
});
