import { auth } from "@/lib/auth";

export type AppRole = "admin" | "procurement_manager" | "field_agent";

export interface SessionUser {
  id: string;
  role: AppRole;
  name?: string | null;
  email?: string | null;
  operatingState?: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.role) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    operatingState: user.operatingState ?? null,
  };
}

export function isProcurementUser(
  user: Pick<SessionUser, "role"> | null | undefined
): boolean {
  return !!user && (user.role === "admin" || user.role === "procurement_manager");
}
