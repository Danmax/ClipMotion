import { CharacterBuilder } from "@/components/character-builder/character-builder";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function NewCharacterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <CharacterBuilder />;
}
