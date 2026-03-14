import type { DefaultSession } from "next-auth";

type AppRole = "admin" | "procurement_manager" | "field_agent";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      operatingState?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    operatingState?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    operatingState?: string | null;
  }
}
