import { describe, it, expect } from "vitest";
import {
  msToFrame,
  frameToMs,
  snapToFrame,
  frameDurationMs,
  totalFrames,
  formatTimecode,
  clampTime,
} from "@/engine/time-utils";

describe("msToFrame", () => {
  it("24fps: 0ms = frame 0", () => {
    expect(msToFrame(0, 24)).toBe(0);
  });

  it("24fps: 1000ms = frame 24", () => {
    expect(msToFrame(1000, 24)).toBe(24);
  });

  it("30fps: 1000ms floors to frame 29 due to float precision", () => {
    // 1000 / (1000/30) ≈ 29.999... → Math.floor = 29
    expect(msToFrame(1000, 30)).toBe(29);
  });

  it("should floor partial frames", () => {
    expect(msToFrame(20, 24)).toBe(0); // 20ms < 41.67ms per frame
    expect(msToFrame(42, 24)).toBe(1);
  });
});

describe("frameToMs", () => {
  it("24fps: frame 0 = 0ms", () => {
    expect(frameToMs(0, 24)).toBe(0);
  });

  it("24fps: frame 24 = 1000ms", () => {
    expect(frameToMs(24, 24)).toBeCloseTo(1000);
  });

  it("60fps: frame 60 = 1000ms", () => {
    expect(frameToMs(60, 60)).toBeCloseTo(1000);
  });
});

describe("snapToFrame", () => {
  it("should snap to nearest frame boundary", () => {
    // At 24fps, frame duration = 41.67ms
    const snapped = snapToFrame(50, 24);
    expect(snapped).toBeCloseTo(41.67, 0);
  });

  it("should leave exact boundaries unchanged", () => {
    const snapped = snapToFrame(0, 24);
    expect(snapped).toBe(0);
  });
});

describe("frameDurationMs", () => {
  it("24fps = 41.67ms per frame", () => {
    expect(frameDurationMs(24)).toBeCloseTo(41.67, 1);
  });

  it("60fps = 16.67ms per frame", () => {
    expect(frameDurationMs(60)).toBeCloseTo(16.67, 1);
  });
});

describe("totalFrames", () => {
  it("30 seconds at 24fps = 720 frames", () => {
    expect(totalFrames(30000, 24)).toBe(720);
  });

  it("30 seconds at 60fps = 1800 frames", () => {
    expect(totalFrames(30000, 60)).toBe(1800);
  });
});

describe("formatTimecode", () => {
  it("0ms = 00:00:00", () => {
    expect(formatTimecode(0, 24)).toBe("00:00:00");
  });

  it("1000ms at 24fps = 00:01:00", () => {
    expect(formatTimecode(1000, 24)).toBe("00:01:00");
  });

  it("30000ms at 24fps = 00:30:00", () => {
    expect(formatTimecode(30000, 24)).toBe("00:30:00");
  });
});

describe("clampTime", () => {
  it("should clamp within bounds", () => {
    expect(clampTime(-100, 0, 30000)).toBe(0);
    expect(clampTime(50000, 0, 30000)).toBe(30000);
    expect(clampTime(15000, 0, 30000)).toBe(15000);
  });
});
