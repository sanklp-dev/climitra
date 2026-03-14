import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapingJobs } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/api-guard";
import { getSessionUser, isProcurementUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const sessionUser = await getSessionUser();
    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.state) {
      return NextResponse.json(
        { error: "Target state is required" },
        { status: 400 }
      );
    }

    if (!body.leadCategory) {
      return NextResponse.json(
        { error: "Lead category is required" },
        { status: 400 }
      );
    }

    if (!body.keywords || !Array.isArray(body.keywords) || body.keywords.length === 0) {
      return NextResponse.json(
        { error: "Search keywords are required" },
        { status: 400 }
      );
    }

    const apiToken = process.env.APIFY_API_TOKEN;

    if (!apiToken) {
      return NextResponse.json(
        { error: "Apify API token is not configured" },
        { status: 500 }
      );
    }

    // Build the search queries combining keywords with state
    const searchQueries = body.keywords.map(
      (kw: string) => `${kw} in ${body.state}, India`
    );

    // Start an Apify web scraper run
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~web-scraper/runs?token=${apiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: searchQueries.map((q: string) => ({
            url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
          })),
          pageFunction: `async function pageFunction(context) {
            const { request, log, jQuery } = context;
            const $ = jQuery;
            const results = [];
            $('div.g').each((i, el) => {
              const title = $(el).find('h3').text();
              const link = $(el).find('a').attr('href');
              const snippet = $(el).find('.VwiC3b').text();
              if (title) {
                results.push({ title, link, snippet });
              }
            });
            return results;
          }`,
          proxyConfiguration: { useApifyProxy: true },
          maxPagesPerCrawl: 10,
        }),
      }
    );

    if (!apifyResponse.ok) {
      const errorData = await apifyResponse.text();
      console.error("Apify API error:", errorData);
      return NextResponse.json(
        { error: "Failed to start Apify scraping job" },
        { status: 502 }
      );
    }

    const apifyData = await apifyResponse.json();
    const runId = apifyData.data?.id;
    const actorId = apifyData.data?.actId;

    // Store the job in the database
    const job = await db
      .insert(scrapingJobs)
      .values({
        actorId: actorId || "apify~web-scraper",
        runId: runId || null,
        status: "running",
        searchKeywords: body.keywords.join(", "),
        targetState: body.state,
        leadCategory: body.leadCategory,
        resultsCount: 0,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Scraping job started successfully",
        job: job[0],
        apifyRunId: runId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error starting scraping job:", error);
    return NextResponse.json(
      { error: "Failed to start scraping job" },
      { status: 500 }
    );
  }
}
