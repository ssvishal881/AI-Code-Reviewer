import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import { getReview } from "../services/api";
import type { ReviewDetails } from "../types/review";
import { getStoredUser, loadSetting } from "../storage";
import { useGlobalLoader } from "../context/LoaderContext";

type ReviewDisplay = {
  showSeverity: boolean;
  showSource: boolean;
  showDescription: boolean;
  showSuggestions: boolean;
};

type ReviewPreferences = {
  security: boolean;
  bugs: boolean;
  performance: boolean;
  quality: boolean;
  bestPractice: boolean;
};

const defaultDisplay: ReviewDisplay = {
  showSeverity: true,
  showSource: true,
  showDescription: true,
  showSuggestions: true,
};

const defaultPreferences: ReviewPreferences = {
  security: true,
  bugs: true,
  performance: true,
  quality: true,
  bestPractice: true,
};

function ReviewDetailsPage() {
  const { id } = useParams();

  const [display] = useState<ReviewDisplay>(() => {
    const user = getStoredUser();
    return user
      ? loadSetting(`reviewDisplay_${user.id}`, defaultDisplay)
      : defaultDisplay;
  });

  const [preferences] = useState<ReviewPreferences>(() => {
    const user = getStoredUser();
    return user
      ? loadSetting(`reviewPreferences_${user.id}`, defaultPreferences)
      : defaultPreferences;
  });

  const [review, setReview] = useState<ReviewDetails | null>(null);
  const isValidReviewId =
    Boolean(id) && Number.isFinite(Number(id)) && Number(id) > 0;

  const [loading, setLoading] = useState(isValidReviewId);
  const [fetchError, setFetchError] = useState("");
  const { showLoader, hideLoader } = useGlobalLoader();

  useEffect(() => {
    if (!isValidReviewId) {
      return;
    }

    let cancelled = false;

    async function loadReview() {
      showLoader("Loading review details...");

      try {
        setLoading(true);
        setFetchError("");

        const data = await getReview(Number(id));

        if (!cancelled) {
          setReview(data);
        }
      } catch {
        if (!cancelled) {
          setFetchError("Failed to load review. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
        hideLoader();
      }
    }

    loadReview();

    return () => {
      cancelled = true;
    };
  }, [id, isValidReviewId, showLoader, hideLoader]);

  const error = !isValidReviewId
    ? "A valid review ID is required."
    : fetchError;

  const visibleIssues = (review?.issues ?? []).filter((issue) => {
    const category = issue.category.toLowerCase().trim();

    if (category === "security") return preferences.security;
    if (category === "bug" || category === "bugs") return preferences.bugs;
    if (category === "performance") return preferences.performance;
    if (category === "quality" || category === "code quality") {
      return preferences.quality;
    }
    if (
      category === "best-practice" ||
      category === "best practice" ||
      category === "best_practice"
    ) {
      return preferences.bestPractice;
    }

    return true;
  });

  const statusStyle =
    review?.status === "completed"
      ? "border-[#65f2b5]/30 bg-[#65f2b5]/5 text-[#65f2b5]"
      : review?.status === "failed"
        ? "border-[#ffb4ab]/30 bg-[#ffb4ab]/5 text-[#ffb4ab]"
        : "border-[#d0bcff]/30 bg-[#d0bcff]/5 text-[#d0bcff]";

  const scoreColor =
    (review?.score ?? 0) >= 80
      ? "#65f2b5"
      : (review?.score ?? 0) >= 60
        ? "#00dbe9"
        : "#ffb4ab";

  function getSeverityStyle(severity: string) {
    switch (severity.toLowerCase()) {
      case "critical":
        return "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]";
      case "high":
        return "border-[#ffb4ab]/25 bg-[#ffb4ab]/5 text-[#ffb4ab]";
      case "medium":
        return "border-[#d0bcff]/30 bg-[#d0bcff]/5 text-[#d0bcff]";
      case "low":
        return "border-[#65f2b5]/25 bg-[#65f2b5]/5 text-[#65f2b5]";
      default:
        return "border-[#3b494b] bg-[#151b2d] text-[#b9cacb]";
    }
  }

  function getCategoryStyle(category: string) {
    switch (category.toLowerCase().trim()) {
      case "security":
        return "border-[#ffb4ab]/30 bg-[#ffb4ab]/5 text-[#ffb4ab]";
      case "bug":
      case "bugs":
        return "border-[#d0bcff]/30 bg-[#d0bcff]/5 text-[#d0bcff]";
      case "performance":
        return "border-[#00dbe9]/30 bg-[#00dbe9]/5 text-[#00dbe9]";
      case "quality":
      case "code quality":
      case "best-practice":
      case "best practice":
      case "best_practice":
        return "border-[#65f2b5]/25 bg-[#65f2b5]/5 text-[#65f2b5]";
      default:
        return "border-[#3b494b] bg-[#151b2d] text-[#b9cacb]";
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0c1324] px-4 py-10 text-[#dce1fb] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="border border-[#3b494b] bg-[#101729] p-8 sm:p-12">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00dbe9]" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#00dbe9] md:text-sm lg:text-base">
                Retrieving Analysis
              </span>
            </div>
            <div className="h-7 w-56 animate-pulse bg-[#23293c]" />
            <div className="mt-4 h-4 w-80 max-w-full animate-pulse bg-[#191f31]" />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse border border-[#3b494b] bg-[#151b2d]"
                />
              ))}
            </div>
            <p className="mt-8 font-mono text-xs text-[#849495] md:text-sm lg:text-base">
              QUERYING REVIEW DATABASE...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0c1324] px-4 py-10 text-[#dce1fb] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="border border-[#3b494b] bg-[#101729] p-8 sm:p-12">
            <div className="mb-5 flex h-12 w-12 items-center justify-center border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 text-[#ffb4ab]">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#ffb4ab] md:text-sm lg:text-base">
              Review Retrieval Error
            </p>
            <h1 className="font-['Space_Grotesk'] text-2xl font-bold md:text-3xl lg:text-4xl">
              {error ? "Unable to load review" : "Review not found"}
            </h1>
            <p className="mt-3 text-base leading-6 text-[#849495] md:text-lg md:leading-7 lg:text-xl">
              {error || "The requested review could not be found."}
            </p>
            <Link
              to="/history"
              className="mt-7 inline-flex items-center gap-3 border border-[#00dbe9] bg-[#00dbe9] px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#002022] transition hover:bg-[#00f0ff] md:text-sm lg:text-base"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Review History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0c1324] px-4 py-8 text-[#dce1fb] sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#849495] transition hover:text-[#00dbe9] md:text-sm lg:text-base"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Review History
          </Link>

          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
            Historical Analysis
          </div>
        </div>

        <section className="relative overflow-hidden border border-[#3b494b] bg-[#101729] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#00dbe9]/10" />
          <div className="pointer-events-none absolute -right-6 -top-14 h-44 w-44 rounded-full border border-[#00dbe9]/10" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#00dbe9] md:text-sm lg:text-base">
                  // Review Intelligence
                </span>
                <span className="h-px w-10 bg-[#00dbe9]/40" />
              </div>

              <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Review Details<span className="text-[#00dbe9]">.</span>
              </h1>

              <p className="mt-3 font-mono text-sm text-[#849495] md:text-base lg:text-lg">
                REVIEW ID /{" "}
                <span className="text-[#b9cacb]">
                  {String(review.id).padStart(4, "0")}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider md:text-sm lg:text-base ${statusStyle}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {review.status}
              </span>
              <div className="border border-[#3b494b] bg-[#151b2d] px-4 py-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
                  Analysis Engine
                </p>
                <p className="mt-1 font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
                  AI / ESLINT / SEMGREP
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-[#849495] md:text-sm lg:text-base">
                Review Score
              </p>
              <span className="font-mono text-sm text-[#00dbe9] md:text-base lg:text-lg">
                SC-01
              </span>
            </div>
            <div className="mt-5 flex items-end gap-2">
              <p
                className="font-['Space_Grotesk'] text-4xl font-bold"
                style={{ color: scoreColor }}
              >
                {review.score}
              </p>
              <p className="mb-1 font-mono text-sm text-[#849495] md:text-base lg:text-lg">
                / 100
              </p>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden bg-[#070d1f]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, review.score))}%`,
                  backgroundColor: scoreColor,
                }}
              />
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
              Overall quality score
            </p>
          </div>

          <div className="border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-[#849495] md:text-sm lg:text-base">
                Detected Issues
              </p>
              <span className="font-mono text-sm text-[#d0bcff] md:text-base lg:text-lg">
                IS-02
              </span>
            </div>
            <p className="mt-5 font-['Space_Grotesk'] text-4xl font-bold">
              {visibleIssues.length}
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
              Based on your saved filters
            </p>
          </div>

          <div className="border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-[#849495] md:text-sm lg:text-base">
                Review Status
              </p>
              <span className="font-mono text-sm text-[#65f2b5] md:text-base lg:text-lg">
                ST-03
              </span>
            </div>
            <p className="mt-5 break-words font-['Space_Grotesk'] text-2xl font-bold capitalize md:text-3xl lg:text-4xl">
              {review.status}
            </p>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
              Processing state
            </p>
          </div>

          <div className="border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-[#849495] md:text-sm lg:text-base">
                Source
              </p>
              <span className="font-mono text-sm text-[#00dbe9] md:text-base lg:text-lg">
                SR-04
              </span>
            </div>
            <p className="mt-5 font-['Space_Grotesk'] text-2xl font-bold md:text-3xl lg:text-4xl">
              {review.repo_name ? "GitHub PR" : "Code Review"}
            </p>
            <p className="mt-5 truncate font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
              {review.repo_name || "Local source analysis"}
            </p>
          </div>
        </section>

        {(review.repo_name ||
          review.pull_number ||
          review.commit_sha ||
          review.created_at) && (
          <section className="border border-[#3b494b] bg-[#101729] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
                01 /
              </span>
              <h2 className="font-['Space_Grotesk'] text-xl font-semibold md:text-2xl lg:text-3xl">
                Review Information
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {review.repo_name && (
                <div className="border border-[#3b494b] bg-[#151b2d] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
                    Repository
                  </p>
                  <p className="mt-3 break-all text-base font-medium text-[#dce1fb] md:text-lg lg:text-xl">
                    {review.repo_owner
                      ? `${review.repo_owner}/${review.repo_name}`
                      : review.repo_name}
                  </p>
                </div>
              )}

              {review.pull_number && (
                <div className="border border-[#3b494b] bg-[#151b2d] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
                    Pull Request
                  </p>
                  <p className="mt-3 font-mono text-base text-[#00dbe9] md:text-lg lg:text-xl">
                    #{review.pull_number}
                  </p>
                </div>
              )}

              {review.commit_sha && (
                <div className="border border-[#3b494b] bg-[#151b2d] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
                    Commit SHA
                  </p>
                  <p className="mt-3 break-all font-mono text-sm text-[#b9cacb] md:text-base lg:text-lg">
                    {review.commit_sha}
                  </p>
                </div>
              )}

              {review.created_at && (
                <div className="border border-[#3b494b] bg-[#151b2d] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
                    Reviewed At
                  </p>
                  <p className="mt-3 text-base text-[#dce1fb] md:text-lg lg:text-xl">
                    {new Date(review.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="border border-[#3b494b] bg-[#101729] p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
              02 /
            </span>
            <h2 className="font-['Space_Grotesk'] text-xl font-semibold md:text-2xl lg:text-3xl">
              Executive Summary
            </h2>
          </div>
          <div className="border-l-2 border-[#00dbe9] bg-[#151b2d] p-5 sm:p-6">
            <p className="whitespace-pre-wrap text-base leading-7 text-[#b9cacb] md:text-lg md:leading-8 lg:text-xl lg:leading-9">
              {review.summary || "No summary is available for this review."}
            </p>
          </div>
        </section>

        <section className="border border-[#3b494b] bg-[#101729] p-6 sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
                  03 /
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
                  Findings Database
                </span>
              </div>
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold md:text-3xl lg:text-4xl">
                Review Issues
              </h2>
              <p className="mt-2 text-sm text-[#849495] md:text-base lg:text-lg">
                Issues shown according to your saved review preferences.
              </p>
            </div>

            <div className="flex items-center gap-3 border border-[#3b494b] bg-[#151b2d] px-4 py-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#849495] md:text-xs lg:text-sm">
                Visible Findings
              </span>
              <span className="font-mono text-base font-bold text-[#00dbe9] md:text-lg lg:text-xl">
                {String(visibleIssues.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          {visibleIssues.length === 0 ? (
            <div className="border border-[#65f2b5]/25 bg-[#65f2b5]/5 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#65f2b5]/30 text-[#65f2b5]">
                <CircleCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-['Space_Grotesk'] text-lg font-semibold md:text-xl lg:text-2xl">
                No visible issues
              </h3>
              <p className="mt-2 text-base text-[#849495] md:text-lg lg:text-xl">
                No issues were found for the enabled categories in your saved
                preferences.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleIssues.map((issue, index) => (
                <article
                  key={`${issue.file}-${issue.line}-${index}`}
                  className="overflow-hidden border border-[#3b494b] bg-[#151b2d]"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-[#3b494b] p-5 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#3b494b] bg-[#070d1f] font-mono text-sm text-[#849495] md:text-base lg:text-lg">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-['Space_Grotesk'] text-lg font-semibold leading-6 md:text-xl md:leading-7 lg:text-2xl lg:leading-8">
                          {issue.title}
                        </h3>
                        <p className="mt-2 break-all font-mono text-xs leading-5 text-[#849495] md:text-sm md:leading-6 lg:text-base lg:leading-7">
                          {issue.file} : LINE {issue.line}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      <span
                        className={`border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider md:text-xs lg:text-sm ${getCategoryStyle(issue.category)}`}
                      >
                        {issue.category}
                      </span>
                      {display.showSeverity && (
                        <span
                          className={`border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider md:text-xs lg:text-sm ${getSeverityStyle(issue.severity)}`}
                        >
                          {issue.severity}
                        </span>
                      )}
                      {display.showSource && issue.source && (
                        <span className="border border-[#3b494b] bg-[#070d1f] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[#b9cacb] md:text-xs lg:text-sm">
                          {issue.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5 p-5 sm:p-6">
                    {display.showDescription && (
                      <div>
                        <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#849495] md:text-xs lg:text-sm">
                          Issue Description
                        </p>
                        <p className="whitespace-pre-wrap text-base leading-7 text-[#b9cacb] md:text-lg md:leading-8 lg:text-xl lg:leading-9">
                          {issue.description || "No description available."}
                        </p>
                      </div>
                    )}

                    {display.showSuggestions && issue.suggestion && (
                      <div className="border-l-2 border-[#65f2b5] bg-[#070d1f] p-4 sm:p-5">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-[#65f2b5]">
                            <ArrowRight
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </span>
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#65f2b5] md:text-xs lg:text-sm">
                            Recommended Fix
                          </p>
                        </div>
                        <p className="whitespace-pre-wrap text-base leading-7 text-[#b9cacb] md:text-lg md:leading-8 lg:text-xl lg:leading-9">
                          {issue.suggestion}
                        </p>
                      </div>
                    )}

                    {issue.code_snippet && (
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#849495] md:text-xs lg:text-sm">
                            Code Reference
                          </p>
                          <span className="font-mono text-[11px] text-[#53636a] md:text-xs lg:text-sm">
                            {issue.file}:{issue.line}
                          </span>
                        </div>
                        <pre className="overflow-x-auto border border-[#3b494b] bg-[#070d1f] p-4 text-sm leading-6 text-[#b9cacb] md:text-base md:leading-7 lg:text-lg lg:leading-8">
                          <code>{issue.code_snippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col justify-between gap-4 border-t border-[#3b494b] py-5 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#53636a] md:text-xs lg:text-sm">
            Review ID: {review.id} // Analysis Record
          </p>
          <Link
            to="/history"
            className="inline-flex w-fit items-center gap-3 border border-[#3b494b] bg-[#151b2d] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#b9cacb] transition hover:border-[#00dbe9]/50 hover:text-[#00dbe9] md:text-sm lg:text-base"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to History
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ReviewDetailsPage;
