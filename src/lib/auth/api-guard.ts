import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Checks if the request has a valid session.
 * Returns null if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  return null;
}
