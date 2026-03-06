import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { CharacterBuilder } from "@/components/character-builder/character-builder";
import { DEFAULT_LIMBS } from "@/engine/types";
import type { FaceProps, ShapeProps, LimbProps, AccessoryProps } from "@/engine/types";
import { applyPreset } from "@/engine/face-presets";

interface EditCharacterPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCharacterPage({ params }: EditCharacterPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const character = await db.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) notFound();

  let initialShape: ShapeProps = {
    shapeType: "ellipse",
    width: 120,
    height: 120,
    fill: "#44aaff",
  };
  let initialFace: FaceProps = applyPreset("happy");
  let initialLimbs: LimbProps | undefined;
  let initialAccessories: AccessoryProps[] | undefined;
  let initialDigitizationMeta:
    | {
        confidence?: number;
        warnings?: string[];
        modelVersion?: string;
        partConfidence?: {
          body?: number;
          arms?: number;
          legs?: number;
          face?: number;
          accessories?: number;
        };
        image?: {
          format?: string;
          width?: number;
          height?: number;
          aspectRatio?: number;
        };
      }
    | null = null;

  try {
    initialShape = JSON.parse(character.shapeData) as ShapeProps;
  } catch {
    // fallback keeps page usable even with malformed legacy data
  }
  try {
    initialFace = JSON.parse(character.faceData) as FaceProps;
  } catch {
    // fallback keeps page usable even with malformed legacy data
  }
  if (character.limbsData) {
    try {
      const parsed = JSON.parse(character.limbsData) as Omit<Partial<LimbProps>, "handStyle"> & {
        handStyle?: unknown;
      };
      const rawHandStyle = typeof parsed.handStyle === "string" ? parsed.handStyle : undefined;
      const handStyle =
        rawHandStyle === "yes"
          ? "thumbs-up"
          : rawHandStyle === "no"
            ? "thumbs-down"
            : rawHandStyle;
      initialLimbs = {
        ...DEFAULT_LIMBS,
        ...parsed,
        handStyle: (handStyle as LimbProps["handStyle"]) ?? DEFAULT_LIMBS.handStyle,
      };
    } catch {
      // ignore
    }
  }
  if (character.accessoriesData) {
    try {
      initialAccessories = JSON.parse(character.accessoriesData) as AccessoryProps[];
    } catch {
      initialAccessories = undefined;
    }
  }
  if (character.digitizationMeta) {
    try {
      initialDigitizationMeta = JSON.parse(character.digitizationMeta) as {
        confidence?: number;
        warnings?: string[];
        modelVersion?: string;
        partConfidence?: {
          body?: number;
          arms?: number;
          legs?: number;
          face?: number;
          accessories?: number;
        };
        image?: {
          format?: string;
          width?: number;
          height?: number;
          aspectRatio?: number;
        };
      };
    } catch {
      initialDigitizationMeta = null;
    }
  }

  return (
    <CharacterBuilder
      editId={character.id}
      initialName={character.name}
      initialShape={initialShape}
      initialFace={initialFace}
      initialLimbs={initialLimbs}
      initialAccessories={initialAccessories}
      initialDigitizationMeta={initialDigitizationMeta}
    />
  );
}
