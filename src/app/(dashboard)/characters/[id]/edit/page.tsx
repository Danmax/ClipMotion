import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { CharacterBuilder } from "@/components/character-builder/character-builder";
import type { FaceProps, ShapeProps, LimbProps } from "@/engine/types";
import { applyPreset } from "@/engine/face-presets";

interface EditCharacterPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCharacterPage({ params }: EditCharacterPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
      initialLimbs = JSON.parse(character.limbsData) as LimbProps;
    } catch {
      // ignore
    }
  }

  return (
    <CharacterBuilder
      editId={character.id}
      initialName={character.name}
      initialShape={initialShape}
      initialFace={initialFace}
      initialLimbs={initialLimbs}
    />
  );
}
