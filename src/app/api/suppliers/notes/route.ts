import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supplierNotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { requireAuth } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (!supplierId) {
      return NextResponse.json(
        { error: "supplierId is required" },
        { status: 400 }
      );
    }

    const notes = await db
      .select()
      .from(supplierNotes)
      .where(eq(supplierNotes.supplierId, supplierId))
      .orderBy(desc(supplierNotes.createdAt));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching supplier notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!body.supplierId || !content) {
      return NextResponse.json(
        { error: "supplierId and content are required" },
        { status: 400 }
      );
    }

    const newNote = await db
      .insert(supplierNotes)
      .values({
        supplierId: body.supplierId,
        content,
        type: body.type || "general",
        createdBy: sessionUser.id,
      })
      .returning();

    return NextResponse.json({ note: newNote[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
