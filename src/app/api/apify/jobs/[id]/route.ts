import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapingJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/api-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const jobs = await db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.id, id));

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: "Scraping job not found" },
        { status: 404 }
      );
    }

    const job = jobs[0];

    // If the job is still running and has a runId, check status from Apify
    if (job.status === "running" && job.runId) {
      const apiToken = process.env.APIFY_API_TOKEN;

      if (apiToken) {
        try {
          const apifyResponse = await fetch(
            `https://api.apify.com/v2/actor-runs/${job.runId}?token=${apiToken}`
          );

          if (apifyResponse.ok) {
            const apifyData = await apifyResponse.json();
            const runStatus = apifyData.data?.status;

            let newStatus = job.status;
            let resultsCount = job.resultsCount;
            let completedAt = job.completedAt;

            if (runStatus === "SUCCEEDED") {
              newStatus = "completed";
              completedAt = new Date();

              // Fetch results count from the dataset
              const datasetId = apifyData.data?.defaultDatasetId;
              if (datasetId) {
                const datasetResponse = await fetch(
                  `https://api.apify.com/v2/datasets/${datasetId}?token=${apiToken}`
                );
                if (datasetResponse.ok) {
                  const datasetData = await datasetResponse.json();
                  resultsCount = datasetData.data?.itemCount || 0;
                }
              }
            } else if (runStatus === "FAILED" || runStatus === "ABORTED" || runStatus === "TIMED-OUT") {
              newStatus = "failed";
              completedAt = new Date();
            }

            // Update local status if changed
            if (newStatus !== job.status) {
              await db
                .update(scrapingJobs)
                .set({
                  status: newStatus,
                  resultsCount,
                  completedAt,
                })
                .where(eq(scrapingJobs.id, id));

              return NextResponse.json({
                job: {
                  ...job,
                  status: newStatus,
                  resultsCount,
                  completedAt,
                },
              });
            }
          }
        } catch (apifyError) {
          console.error("Error checking Apify status:", apifyError);
          // Continue with local data if Apify check fails
        }
      }
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error fetching scraping job:", error);
    return NextResponse.json(
      { error: "Failed to fetch scraping job" },
      { status: 500 }
    );
  }
}
