import { NextResponse } from "next/server";

async function disabled() {
  return NextResponse.json(
    { error: "NextAuth endpoint disabled. Use Clerk auth routes (/sign-in, /sign-up)." },
    { status: 410 }
  );
}

export const GET = disabled;
export const POST = disabled;
