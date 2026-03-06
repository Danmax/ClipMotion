import { applyPreset } from "@/engine/face-presets";
import { DEFAULT_LIMBS } from "@/engine/types";
import type {
  AccessoryProps,
  ExpressionPreset,
  FaceProps,
  LimbProps,
  ShapeProps,
  ShapeType,
  ShapePattern,
} from "@/engine/types";

export interface DigitizeDrawingInput {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  removeBackground?: boolean;
}

interface ImageFeatures {
  format: "png" | "jpeg" | "webp" | "svg" | "unknown";
  width?: number;
  height?: number;
  svgText?: string;
}

interface PartConfidence {
  body: number;
  arms: number;
  legs: number;
  face: number;
  accessories: number;
}

export interface DigitizeDrawingResult {
  shape: ShapeProps;
  face: FaceProps;
  limbs: LimbProps;
  accessories: AccessoryProps[];
  confidence: number;
  warnings: string[];
  meta: {
    modelVersion: string;
    detectedParts: {
      body: boolean;
      arms: boolean;
      legs: boolean;
      face: boolean;
      accessories: boolean;
    };
    partConfidence: PartConfidence;
    image: {
      format: ImageFeatures["format"];
      width?: number;
      height?: number;
      aspectRatio?: number;
    };
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function hashBytes(bytes: Uint8Array): number {
  let hash = 2166136261;
  const limit = Math.min(bytes.length, 4096);
  for (let i = 0; i < limit; i += 1) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const huePrime = h / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (huePrime >= 0 && huePrime < 1) {
    r1 = chroma;
    g1 = x;
  } else if (huePrime < 2) {
    r1 = x;
    g1 = chroma;
  } else if (huePrime < 3) {
    g1 = chroma;
    b1 = x;
  } else if (huePrime < 4) {
    g1 = x;
    b1 = chroma;
  } else if (huePrime < 5) {
    r1 = x;
    b1 = chroma;
  } else {
    r1 = chroma;
    b1 = x;
  }

  const m = light - chroma / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function readUInt16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function readUInt24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function parsePngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < sig.length; i += 1) {
    if (bytes[i] !== sig[i]) return null;
  }
  if (bytes.length < 24) return null;
  const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunkType !== "IHDR") return null;
  const width = readUInt32BE(bytes, 16);
  const height = readUInt32BE(bytes, 20);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

function parseJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;

    if (offset + 2 > bytes.length) break;
    const length = readUInt16BE(bytes, offset);
    if (length < 2 || offset + length > bytes.length) break;

    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof && length >= 7) {
      const height = readUInt16BE(bytes, offset + 3);
      const width = readUInt16BE(bytes, offset + 5);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    offset += length;
  }
  return null;
}

function parseWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30) return null;
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff !== "RIFF" || webp !== "WEBP") return null;

  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

  if (chunk === "VP8X" && bytes.length >= 30) {
    const widthMinus1 = readUInt24LE(bytes, 24);
    const heightMinus1 = readUInt24LE(bytes, 27);
    return { width: widthMinus1 + 1, height: heightMinus1 + 1 };
  }

  if (chunk === "VP8 " && bytes.length >= 30) {
    const width = bytes[26] | ((bytes[27] & 0x3f) << 8);
    const height = bytes[28] | ((bytes[29] & 0x3f) << 8);
    if (width > 0 && height > 0) return { width, height };
  }

  if (chunk === "VP8L" && bytes.length >= 25) {
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    if (width > 0 && height > 0) return { width, height };
  }

  return null;
}

function parseSvgDimensions(svgText: string): { width?: number; height?: number } {
  const widthMatch = svgText.match(/\bwidth\s*=\s*["']\s*([0-9.]+)/i);
  const heightMatch = svgText.match(/\bheight\s*=\s*["']\s*([0-9.]+)/i);
  const viewBoxMatch = svgText.match(/\bviewBox\s*=\s*["'][^"']*?([0-9.]+)\s+([0-9.]+)\s*["']/i);

  const widthFromAttr = widthMatch ? parseFloat(widthMatch[1]) : undefined;
  const heightFromAttr = heightMatch ? parseFloat(heightMatch[1]) : undefined;

  if (widthFromAttr && heightFromAttr) {
    return { width: widthFromAttr, height: heightFromAttr };
  }
  if (viewBoxMatch) {
    return {
      width: parseFloat(viewBoxMatch[1]),
      height: parseFloat(viewBoxMatch[2]),
    };
  }
  return {};
}

function detectImageFeatures(input: DigitizeDrawingInput): ImageFeatures {
  const mime = input.mimeType.toLowerCase();
  const lowerName = input.fileName.toLowerCase();
  if (mime === "image/png" || lowerName.endsWith(".png")) {
    const dims = parsePngDimensions(input.bytes);
    return { format: "png", width: dims?.width, height: dims?.height };
  }
  if (mime === "image/jpeg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    const dims = parseJpegDimensions(input.bytes);
    return { format: "jpeg", width: dims?.width, height: dims?.height };
  }
  if (mime === "image/webp" || lowerName.endsWith(".webp")) {
    const dims = parseWebpDimensions(input.bytes);
    return { format: "webp", width: dims?.width, height: dims?.height };
  }
  if (mime === "image/svg+xml" || lowerName.endsWith(".svg")) {
    const svgText = new TextDecoder().decode(input.bytes.slice(0, Math.min(input.bytes.length, 250_000)));
    const dims = parseSvgDimensions(svgText);
    return { format: "svg", width: dims.width, height: dims.height, svgText };
  }
  return { format: "unknown" };
}

function inferExpression(fileName: string, svgText?: string): ExpressionPreset {
  const lower = `${fileName} ${svgText ?? ""}`.toLowerCase();
  if (lower.includes("angry")) return "angry";
  if (lower.includes("sad")) return "sad";
  if (lower.includes("fear") || lower.includes("scared")) return "fear";
  if (lower.includes("sleep")) return "sleeping";
  if (lower.includes("tired")) return "tired";
  if (lower.includes("meh")) return "meh";
  if (lower.includes("happy") || lower.includes("smile") || lower.includes("joy")) return "happy";
  return "neutral";
}

function detectSvgPrimitive(svgText: string | undefined): ShapeType | null {
  if (!svgText) return null;
  const lower = svgText.toLowerCase();
  if (lower.includes("<circle") || lower.includes("<ellipse")) return "ellipse";
  if (lower.includes("<rect")) return "rectangle";
  if (lower.includes("<polygon")) return "polygon";
  if (lower.includes("<path")) return "polygon";
  return null;
}

function inferShapeType(
  seed: number,
  features: ImageFeatures,
  fileName: string
): { shapeType: ShapeType; confidence: number } {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("asym") || lowerName.includes("lopsided")) {
    return { shapeType: "asymmetric-blob", confidence: 0.78 };
  }
  if (lowerName.includes("blob")) return { shapeType: "blob", confidence: 0.76 };
  if (lowerName.includes("capsule")) return { shapeType: "capsule", confidence: 0.76 };
  if (lowerName.includes("diamond")) return { shapeType: "diamond", confidence: 0.76 };
  if (lowerName.includes("trap")) return { shapeType: "trapezoid", confidence: 0.72 };
  if (lowerName.includes("para")) return { shapeType: "parallelogram", confidence: 0.72 };

  const svgPrimitive = detectSvgPrimitive(features.svgText);
  if (svgPrimitive) {
    return { shapeType: svgPrimitive, confidence: 0.84 };
  }

  if (features.width && features.height) {
    const ratio = features.width / Math.max(1, features.height);
    if (ratio >= 1.25) return { shapeType: "rectangle", confidence: 0.72 };
    if (ratio <= 0.8) return { shapeType: "ellipse", confidence: 0.69 };
    return { shapeType: "polygon", confidence: 0.64 };
  }

  const options: ShapeType[] = ["ellipse", "rectangle", "polygon", "capsule", "blob", "asymmetric-blob"];
  return { shapeType: options[seed % options.length], confidence: 0.54 };
}

function detectPrimaryFillColor(seed: number, svgText?: string): string {
  if (svgText) {
    const fillMatch = svgText.match(/\bfill\s*=\s*["']\s*(#[0-9a-fA-F]{3,8})\s*["']/i);
    if (fillMatch) {
      const color = fillMatch[1];
      if (color.length === 4) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
      }
      if (color.length >= 7) {
        return color.slice(0, 7);
      }
    }
  }
  return hslToHex(seed % 360, 62, 58);
}

function inferPattern(fileName: string, svgText?: string): ShapePattern {
  const lower = `${fileName} ${svgText ?? ""}`.toLowerCase();
  if (lower.includes("stripe")) return "stripes";
  if (lower.includes("dot")) return "dots";
  if (lower.includes("check")) return "checker";
  if (lower.includes("hatch")) return "crosshatch";
  if (lower.includes("zig")) return "zigzag";
  return "none";
}

function inferAccessories(fileName: string, svgText?: string): { items: AccessoryProps[]; confidence: number } {
  const lower = `${fileName} ${svgText ?? ""}`.toLowerCase();
  const accessories: AccessoryProps[] = [];
  if (lower.includes("hat")) {
    accessories.push({
      id: "acc-hat",
      type: "hat",
      name: "Hat",
      x: 0,
      y: -34,
      scale: 1,
      rotation: 0,
      color: "#222222",
    });
  }
  if (lower.includes("glass")) {
    accessories.push({
      id: "acc-glasses",
      type: "glasses",
      name: "Glasses",
      x: 0,
      y: -8,
      scale: 1,
      rotation: 0,
      color: "#111111",
    });
  }
  if (lower.includes("sword") || lower.includes("staff") || lower.includes("prop")) {
    accessories.push({
      id: "acc-prop",
      type: "prop",
      name: "Hand Prop",
      x: 34,
      y: 14,
      scale: 1,
      rotation: -12,
      color: "#875f32",
    });
  }

  if (accessories.length > 0) return { items: accessories, confidence: 0.78 };
  return { items: accessories, confidence: 0.42 };
}

function inferPartConfidence(
  features: ImageFeatures,
  shapeConfidence: number,
  accessoriesConfidence: number
): PartConfidence {
  const hasDimensions = !!(features.width && features.height);
  const formatBonus =
    features.format === "svg"
      ? 0.14
      : features.format === "png" || features.format === "jpeg" || features.format === "webp"
        ? 0.08
        : 0;

  return {
    body: round(clamp(shapeConfidence + formatBonus, 0.4, 0.95)),
    arms: round(clamp(0.58 + (hasDimensions ? 0.06 : 0), 0.35, 0.9)),
    legs: round(clamp(0.6 + (hasDimensions ? 0.06 : 0), 0.35, 0.9)),
    face: round(clamp(0.62 + (features.format === "svg" ? 0.08 : 0), 0.35, 0.92)),
    accessories: round(clamp(accessoriesConfidence, 0.3, 0.9)),
  };
}

function inferDimensions(features: ImageFeatures, seed: number): { width: number; height: number } {
  if (features.width && features.height) {
    const maxBody = 190;
    const minBody = 85;
    const aspect = features.width / Math.max(1, features.height);
    const baseHeight = clamp(130 + ((seed >> 2) % 35), minBody, maxBody);
    const width = clamp(baseHeight * clamp(aspect, 0.6, 1.7), minBody, maxBody);
    const height = clamp(baseHeight, minBody, maxBody);
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  return {
    width: 120 + (seed % 50),
    height: 120 + ((seed >> 4) % 50),
  };
}

export async function parseDrawingToCharacter(
  input: DigitizeDrawingInput
): Promise<DigitizeDrawingResult> {
  if (input.bytes.length === 0) {
    throw new Error("Uploaded file is empty.");
  }

  const seed = hashBytes(input.bytes);
  const features = detectImageFeatures(input);
  const expression = inferExpression(input.fileName, features.svgText);
  const { shapeType, confidence: shapeConfidence } = inferShapeType(seed, features, input.fileName);
  const fill = detectPrimaryFillColor(seed, features.svgText);
  const dims = inferDimensions(features, seed);

  const shape: ShapeProps = {
    shapeType,
    width: dims.width,
    height: dims.height,
    fill,
    pattern: inferPattern(input.fileName, features.svgText),
    patternColor: "#ffffff",
    patternScale: 1,
    cornerRadius:
      shapeType === "rectangle"
        ? 14
        : shapeType === "capsule"
          ? Math.round(Math.min(dims.width, dims.height) / 2)
          : ["triangle", "star", "polygon", "diamond", "trapezoid", "parallelogram"].includes(shapeType)
            ? Math.round(Math.min(dims.width, dims.height) * 0.08)
            : undefined,
    points: shapeType === "polygon" ? 6 : undefined,
  };

  const face = applyPreset(expression);
  face.eyeColor = "#111111";
  face.mouthColor = "#111111";
  face.faceScale = clamp(0.95 + ((seed % 11) - 5) * 0.02, 0.85, 1.15);

  const aspect = features.width && features.height ? features.width / Math.max(1, features.height) : 1;
  const limbs: LimbProps = {
    ...DEFAULT_LIMBS,
    armStyle: "bent",
    legStyle: "straight",
    limbColor: "#111111",
    limbThickness: 3 + (seed % 2),
    armLength: clamp(0.72 + ((seed % 7) - 3) * 0.05 + (aspect > 1.2 ? 0.07 : 0), 0.5, 1.25),
    legLength: clamp(0.88 + (((seed >> 3) % 7) - 3) * 0.05 + (aspect < 0.9 ? 0.08 : 0), 0.6, 1.35),
    armSpread: clamp(0.45 + ((seed % 5) - 2) * 0.06, 0.1, 0.9),
    legSpread: clamp(0.28 + (((seed >> 2) % 5) - 2) * 0.05, 0.05, 0.8),
    feet: true,
  };

  const accessoryDetection = inferAccessories(input.fileName, features.svgText);
  const accessories = accessoryDetection.items;
  const partConfidence = inferPartConfidence(features, shapeConfidence, accessoryDetection.confidence);

  const confidence = round(
    (partConfidence.body +
      partConfidence.arms +
      partConfidence.legs +
      partConfidence.face +
      partConfidence.accessories) /
      5
  );

  const warnings = [
    "MVP digitizer generated a draft. Review body, limb pose, and expression before final save.",
  ];
  if (!features.width || !features.height) {
    warnings.push("Could not reliably read image dimensions; using fallback proportions.");
  }
  if (input.removeBackground) {
    warnings.push("Background removal is approximated in MVP mode.");
  }
  if (features.format === "svg") {
    warnings.push("SVG input was interpreted by primitive tags and style hints.");
  }
  if (accessories.length === 0) {
    warnings.push("No accessories confidently detected.");
  }

  return {
    shape,
    face,
    limbs,
    accessories,
    confidence,
    warnings,
    meta: {
      modelVersion: "digitize-mvp-v2-feature-parser",
      detectedParts: {
        body: partConfidence.body >= 0.55,
        arms: partConfidence.arms >= 0.55,
        legs: partConfidence.legs >= 0.55,
        face: partConfidence.face >= 0.55,
        accessories: accessories.length > 0 && partConfidence.accessories >= 0.55,
      },
      partConfidence,
      image: {
        format: features.format,
        width: features.width,
        height: features.height,
        aspectRatio:
          features.width && features.height
            ? round(features.width / Math.max(1, features.height))
            : undefined,
      },
    },
  };
}
