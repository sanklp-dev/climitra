"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ALL_STATES, LEAD_CATEGORIES } from "@/lib/geo/adjacency";

const APIFY_SEARCH_KEYWORDS: Record<string, string[]> = {
  traditional_charcoal: [
    "charcoal manufacturer",
    "wood charcoal supplier",
    "charcoal kiln",
    "hardwood charcoal producer",
  ],
  maize_processing: [
    "maize processing unit",
    "corn seed processing",
    "maize cob supplier",
    "corn cob charcoal",
  ],
  artisanal_biochar: [
    "biochar producer",
    "kon-tiki kiln",
    "artisanal biochar",
    "small scale pyrolysis",
  ],
  other_charcoal_mfg: [
    "coconut shell charcoal",
    "rice husk charcoal",
    "sawmill charcoal",
    "bamboo charcoal",
  ],
  briquette_torrefied: [
    "briquette manufacturer",
    "biomass briquette",
    "torrefied briquette",
    "bio-coal briquette",
  ],
};

interface ScrapingJob {
  id: string;
  actorId: string | null;
  runId: string | null;
  status: string | null;
  searchKeywords: string | null;
  targetState: string | null;
  leadCategory: string | null;
  resultsCount: number | null;
  createdAt: string;
  completedAt: string | null;
}

const categoryLabels: Record<string, string> = {};
for (const cat of LEAD_CATEGORIES) {
  categoryLabels[cat.value] = cat.label;
}

export default function ScrapingPage() {
  // New job form state
  const [selectedState, setSelectedState] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [starting, setStarting] = useState(false);

  // Jobs list state
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Review modal state
  const [reviewJobId, setReviewJobId] = useState<string | null>(null);
  const [reviewJob, setReviewJob] = useState<ScrapingJob | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Auto-fill keywords when category changes
  useEffect(() => {
    if (selectedCategory && APIFY_SEARCH_KEYWORDS[selectedCategory]) {
      setKeywords([...APIFY_SEARCH_KEYWORDS[selectedCategory]]);
    } else {
      setKeywords([]);
    }
  }, [selectedCategory]);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/apify/jobs");
      if (!response.ok) return;
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch {
      // Silently fail on background fetch
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function addCustomKeyword() {
    const kw = customKeyword.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords((prev) => [...prev, kw]);
      setCustomKeyword("");
    }
  }

  function removeKeyword(index: number) {
    setKeywords((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleStartScraping() {
    setError(null);
    setSuccessMessage(null);

    if (!selectedState) {
      setError("Please select a target state");
      return;
    }
    if (!selectedCategory) {
      setError("Please select a lead category");
      return;
    }
    if (keywords.length === 0) {
      setError("At least one search keyword is required");
      return;
    }

    setStarting(true);

    try {
      const response = await fetch("/api/apify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: selectedState,
          leadCategory: selectedCategory,
          keywords,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start scraping job");
        return;
      }

      setSuccessMessage("Scraping job started successfully!");
      setSelectedState("");
      setSelectedCategory("");
      setKeywords([]);

      // Refresh jobs list
      fetchJobs();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  async function handleReviewJob(jobId: string) {
    setReviewJobId(jobId);
    setReviewLoading(true);

    try {
      const response = await fetch(`/api/apify/jobs/${jobId}`);
      if (!response.ok) return;
      const data = await response.json();

      setReviewJob(data.job || null);
      // Also refresh jobs list in case status changed
      fetchJobs();
    } catch {
      // use local data
      const localJob = jobs.find((j) => j.id === jobId) || null;
      setReviewJob(localJob);
    } finally {
      setReviewLoading(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string | null) {
    switch (status) {
      case "running":
        return <Badge variant="warning">Running</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Apify Scraping Manager
        </h1>
        <p className="text-muted-foreground">
          Discover new suppliers by scraping the web with Apify
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {successMessage}
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Start New Scraping Job */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start New Scraping Job</CardTitle>
          <CardDescription>
            Configure and launch a new web scraping job to discover suppliers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Target State
              </label>
              <Select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">Select state</option>
                {ALL_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Lead Category
              </label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select category</option>
                {LEAD_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Search Keywords
            </label>
            {keywords.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {keywords.map((kw, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-sm"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="Add custom keyword"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomKeyword();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomKeyword}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleStartScraping}
              disabled={starting || !selectedState || !selectedCategory || keywords.length === 0}
            >
              {starting ? "Starting..." : "Start Scraping"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scraping Jobs</CardTitle>
          <CardDescription>
            History of all scraping jobs and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading jobs...</div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-medium">No Scraping Jobs</h3>
              <p className="text-muted-foreground mt-1">
                Start a new scraping job above to discover suppliers.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{job.targetState || "N/A"}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate text-sm" title={categoryLabels[job.leadCategory || ""] || job.leadCategory || ""}>
                        {categoryLabels[job.leadCategory || ""] || job.leadCategory || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{job.resultsCount ?? 0}</TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>{formatDate(job.completedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewJob(job.id)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={reviewJobId !== null}
        onClose={() => {
          setReviewJobId(null);
          setReviewJob(null);
        }}
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>

        {reviewLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading job details...</div>
          </div>
        ) : reviewJob ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Job ID</span>
                <p className="mt-0.5 font-mono text-xs">{reviewJob.id}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Status</span>
                <div className="mt-0.5">{getStatusBadge(reviewJob.status)}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Target State</span>
                <p className="mt-0.5">{reviewJob.targetState || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Lead Category</span>
                <p className="mt-0.5">
                  {categoryLabels[reviewJob.leadCategory || ""] || reviewJob.leadCategory || "N/A"}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Results Count</span>
                <p className="mt-0.5">{reviewJob.resultsCount ?? 0}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Apify Run ID</span>
                <p className="mt-0.5 font-mono text-xs">{reviewJob.runId || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Started</span>
                <p className="mt-0.5">{formatDate(reviewJob.createdAt)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Completed</span>
                <p className="mt-0.5">{formatDate(reviewJob.completedAt)}</p>
              </div>
            </div>

            {reviewJob.searchKeywords && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Search Keywords
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {reviewJob.searchKeywords.split(", ").map((kw, i) => (
                    <Badge key={i} variant="secondary">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {reviewJob.status === "completed" && (reviewJob.resultsCount ?? 0) > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                This job has {reviewJob.resultsCount} results available. The
                scraped data can be reviewed in the Apify dashboard and imported
                as suppliers through the supplier management interface.
              </div>
            )}

            {reviewJob.status === "running" && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                This job is still running. Results will be available once the
                scraping is complete. Refresh to check for updates.
              </div>
            )}

            {reviewJob.status === "failed" && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                This job has failed. You can try starting a new scraping job with
                the same parameters.
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            Unable to load job details.
          </div>
        )}

        <DialogFooter>
          {reviewJob?.status === "running" && (
            <Button
              variant="outline"
              onClick={() => handleReviewJob(reviewJob.id)}
            >
              Refresh Status
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setReviewJobId(null);
              setReviewJob(null);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
