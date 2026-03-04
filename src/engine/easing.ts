import type { EasingDefinition } from "./types";

/**
 * Evaluate an easing function at parameter t (0..1).
 * Returns the eased value (0..1).
 */
export function evaluateEasing(easing: EasingDefinition, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  switch (easing.type) {
    case "linear":
      return t;
    case "step":
      return t < 1 ? 0 : 1;
    case "cubicBezier": {
      const cp = easing.controlPoints;
      if (!cp) return t;
      return cubicBezier(t, cp[0], cp[1], cp[2], cp[3]);
    }
    default:
      return t;
  }
}

/**
 * CSS cubic-bezier(x1, y1, x2, y2) implementation.
 * Given time t, solve for the y-value on the bezier curve.
 * Uses Newton's method to find the x-parameter, then evaluates y.
 */
export function cubicBezier(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  // Find the bezier parameter u such that bezierX(u) = t
  const u = solveCubicBezierX(t, x1, x2);
  // Evaluate bezierY(u)
  return bezierComponent(u, y1, y2);
}

/**
 * Evaluate one component of the cubic bezier at parameter u.
 * B(u) = 3(1-u)^2 * u * p1 + 3(1-u) * u^2 * p2 + u^3
 * (p0=0, p3=1 for CSS cubic-bezier)
 */
function bezierComponent(u: number, p1: number, p2: number): number {
  const cu = 1 - u;
  return 3 * cu * cu * u * p1 + 3 * cu * u * u * p2 + u * u * u;
}

/**
 * Derivative of bezierComponent with respect to u.
 */
function bezierComponentDerivative(u: number, p1: number, p2: number): number {
  const cu = 1 - u;
  return 3 * cu * cu * p1 + 6 * cu * u * (p2 - p1) + 3 * u * u * (1 - p2);
}

/**
 * Solve bezierX(u) = t for u using Newton's method,
 * falling back to bisection if Newton doesn't converge.
 */
function solveCubicBezierX(
  t: number,
  x1: number,
  x2: number,
  epsilon: number = 1e-6,
  maxIterations: number = 8
): number {
  // Initial guess
  let u = t;

  // Newton-Raphson
  for (let i = 0; i < maxIterations; i++) {
    const x = bezierComponent(u, x1, x2) - t;
    if (Math.abs(x) < epsilon) return u;

    const dx = bezierComponentDerivative(u, x1, x2);
    if (Math.abs(dx) < 1e-10) break; // Derivative too small, switch to bisection

    u -= x / dx;
  }

  // Fallback: bisection
  let lo = 0;
  let hi = 1;
  u = t;

  for (let i = 0; i < 20; i++) {
    const x = bezierComponent(u, x1, x2);
    if (Math.abs(x - t) < epsilon) return u;

    if (x < t) {
      lo = u;
    } else {
      hi = u;
    }
    u = (lo + hi) / 2;
  }

  return u;
}

// ─── Preset Easings ──────────────────────────────────────────

export const EASING_PRESETS = {
  linear: { type: "linear" } as EasingDefinition,
  step: { type: "step" } as EasingDefinition,
  easeIn: {
    type: "cubicBezier",
    controlPoints: [0.42, 0, 1, 1],
  } as EasingDefinition,
  easeOut: {
    type: "cubicBezier",
    controlPoints: [0, 0, 0.58, 1],
  } as EasingDefinition,
  easeInOut: {
    type: "cubicBezier",
    controlPoints: [0.42, 0, 0.58, 1],
  } as EasingDefinition,
  easeInQuad: {
    type: "cubicBezier",
    controlPoints: [0.55, 0.085, 0.68, 0.53],
  } as EasingDefinition,
  easeOutQuad: {
    type: "cubicBezier",
    controlPoints: [0.25, 0.46, 0.45, 0.94],
  } as EasingDefinition,
  easeInOutQuad: {
    type: "cubicBezier",
    controlPoints: [0.455, 0.03, 0.515, 0.955],
  } as EasingDefinition,
  easeInCubic: {
    type: "cubicBezier",
    controlPoints: [0.55, 0.055, 0.675, 0.19],
  } as EasingDefinition,
  easeOutCubic: {
    type: "cubicBezier",
    controlPoints: [0.215, 0.61, 0.355, 1],
  } as EasingDefinition,
  easeInBack: {
    type: "cubicBezier",
    controlPoints: [0.6, -0.28, 0.735, 0.045],
  } as EasingDefinition,
  easeOutBack: {
    type: "cubicBezier",
    controlPoints: [0.175, 0.885, 0.32, 1.275],
  } as EasingDefinition,
} as const;
