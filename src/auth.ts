import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type AppSession = {
  user: {
    id: string;
    clerkId: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

function deriveEmail(clerkUserId: string, clerkUser: Awaited<ReturnType<typeof currentUser>>): string {
  const primary =
    clerkUser?.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
  return primary ?? `${clerkUserId}@clerk.local`;
}

function deriveName(clerkUser: Awaited<ReturnType<typeof currentUser>>, email: string): string | null {
  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.username ||
    null;
  return fullName ?? email.split("@")[0] ?? null;
}

async function ensureDbUser(clerkUserId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = deriveEmail(clerkUserId, clerkUser);
  const name = deriveName(clerkUser, email);
  const image = clerkUser.imageUrl ?? null;

  const existing = await db.user.findFirst({
    where: {
      OR: [{ clerkUserId }, { email }],
    },
  });

  if (existing) {
    if (
      existing.clerkUserId !== clerkUserId ||
      existing.name !== name ||
      existing.image !== image ||
      existing.email !== email
    ) {
      return db.user.update({
        where: { id: existing.id },
        data: {
          clerkUserId,
          email,
          name,
          image,
        },
      });
    }
    return existing;
  }

  return db.user.create({
    data: {
      clerkUserId,
      email,
      name,
      image,
    },
  });
}

export async function auth(): Promise<AppSession | null> {
  const { userId } = await clerkAuth();
  if (!userId) return null;

  const user = await ensureDbUser(userId);
  if (!user) return null;

  return {
    user: {
      id: user.id,
      clerkId: userId,
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
    },
  };
}
