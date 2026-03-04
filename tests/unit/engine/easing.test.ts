import { describe, it, expect } from "vitest";
import { evaluateEasing, cubicBezier, EASING_PRESETS } from "@/engine/easing";

describe("evaluateEasing", () => {
  it("should return 0 for t=0", () => {
    expect(evaluateEasing({ type: "linear" }, 0)).toBe(0);
    expect(evaluateEasing(EASING_PRESETS.easeIn, 0)).toBe(0);
  });

  it("should return 1 for t=1", () => {
    expect(evaluateEasing({ type: "linear" }, 1)).toBe(1);
    expect(evaluateEasing(EASING_PRESETS.easeOut, 1)).toBe(1);
  });

  it("linear should return t", () => {
    expect(evaluateEasing({ type: "linear" }, 0.5)).toBeCloseTo(0.5);
    expect(evaluateEasing({ type: "linear" }, 0.25)).toBeCloseTo(0.25);
    expect(evaluateEasing({ type: "linear" }, 0.75)).toBeCloseTo(0.75);
  });

  it("step should return 0 before t=1", () => {
    expect(evaluateEasing({ type: "step" }, 0)).toBe(0);
    expect(evaluateEasing({ type: "step" }, 0.5)).toBe(0);
    expect(evaluateEasing({ type: "step" }, 0.99)).toBe(0);
    expect(evaluateEasing({ type: "step" }, 1)).toBe(1);
  });

  it("easeInOut should be ~0.5 at t=0.5", () => {
    const result = evaluateEasing(EASING_PRESETS.easeInOut, 0.5);
    expect(result).toBeCloseTo(0.5, 1);
  });

  it("easeIn should be less than linear at t=0.5", () => {
    const result = evaluateEasing(EASING_PRESETS.easeIn, 0.5);
    expect(result).toBeLessThan(0.5);
  });

  it("easeOut should be greater than linear at t=0.5", () => {
    const result = evaluateEasing(EASING_PRESETS.easeOut, 0.5);
    expect(result).toBeGreaterThan(0.5);
  });

  it("should handle t < 0 by clamping", () => {
    expect(evaluateEasing(EASING_PRESETS.easeIn, -0.5)).toBe(0);
  });

  it("should handle t > 1 by clamping", () => {
    expect(evaluateEasing(EASING_PRESETS.easeIn, 1.5)).toBe(1);
  });
});

describe("cubicBezier", () => {
  it("linear bezier (0,0,1,1) should approximate linear", () => {
    for (let t = 0; t <= 1; t += 0.1) {
      expect(cubicBezier(t, 0, 0, 1, 1)).toBeCloseTo(t, 2);
    }
  });

  it("should be monotonically increasing for standard curves", () => {
    let prev = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      const value = cubicBezier(t, 0.42, 0, 0.58, 1);
      expect(value).toBeGreaterThanOrEqual(prev - 0.001); // Small tolerance
      prev = value;
    }
  });
});
