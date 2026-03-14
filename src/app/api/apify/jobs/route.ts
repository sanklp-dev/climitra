import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapingJobs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/api-guard";

export async function GET() {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const jobs = await db
      .select()
      .from(scrapingJobs)
      .orderBy(desc(scrapingJobs.createdAt));

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching scraping jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch scraping jobs" },
      { status: 500 }
    );
  }
}
