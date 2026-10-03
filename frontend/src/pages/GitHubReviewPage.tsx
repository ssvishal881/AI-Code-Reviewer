import { AlertCircle, Play } from "lucide-react";
import { useGlobalLoader } from "../context/LoaderContext";
import { useState, useEffect } from "react";

import {
  reviewPullRequest,
  getGitHubRepositories,
  getGitHubPullRequests,
} from "../services/api";

import type { GitHubRepository, GitHubPullRequest } from "../services/api";
import type { GitHubReviewResponse } from "../types/review";

function GitHubReviewPage() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [pullNumber, setPullNumber] = useState("");

  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(true);
  const [repositoryError, setRepositoryError] = useState("");

  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [pullRequestsLoading, setPullRequestsLoading] = useState(false);
  const [pullRequestError, setPullRequestError] = useState("");

  const [result, setResult] = useState<GitHubReviewResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showLoader, hideLoader } = useGlobalLoader();

  useEffect(() => {
    async function loadRepositories() {
      showLoader("Loading GitHub repositories...");

      try {
        setRepositoriesLoading(true);
        setRepositoryError("");

        const data = await getGitHubRepositories();
        setRepositories(data);
      } catch {
        setRepositoryError("Failed to load GitHub repositories.");
      } finally {
        setRepositoriesLoading(false);
        hideLoader();
      }
    }

    loadRepositories();
  }, [showLoader, hideLoader]);

  const clearPullRequestSelection = () => {
    setPullRequests([]);
    setPullNumber("");
    setPullRequestsLoading(false);
    setPullRequestError("");
  };

  useEffect(() => {
    if (!owner || !repo) {
      return;
    }

    let cancelled = false;

    async function loadPullRequests() {
      showLoader("Loading GitHub pull requests...");
      setPullRequestsLoading(true);
      setPullRequestError("");

      try {
        const data = await getGitHubPullRequests(owner, repo);

        if (!cancelled) {
          setPullRequests(data);
        }
      } catch {
        if (!cancelled) {
          setPullRequests([]);
          setPullRequestError("Failed to load Pull Requests.");
        }
      } finally {
        if (!cancelled) {
          setPullRequestsLoading(false);
        }

        hideLoader();
      }
    }

    loadPullRequests();

    return () => {
      cancelled = true;
    };
  }, [owner, repo, showLoader, hideLoader]);

  async function handleReview() {
    if (!owner || !repo || !pullNumber) {
      setError("Please select a repository and Pull Request.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    showLoader("Reviewing GitHub pull request...");

    try {
      const data = await reviewPullRequest(owner, repo, Number(pullNumber));
      setResult(data);
    } catch (error) {
      console.error("HANDLE REVIEW ERROR:", error);
      setError("Failed to review Pull Request.");
    } finally {
      setLoading(false);
      hideLoader();
    }
  }

  const getScoreStyle = (score: number) => {
    if (score >= 90) {
      return {
        text: "text-[#65f2b5]",
        bg: "bg-[#65f2b5]/5",
        border: "border-[#65f2b5]/30",
        label: "EXCELLENT",
      };
    }

    if (score >= 75) {
      return {
        text: "text-[#00dbe9]",
        bg: "bg-[#00dbe9]/5",
        border: "border-[#00dbe9]/30",
        label: "GOOD",
      };
    }

    if (score >= 60) {
      return {
        text: "text-[#d0bcff]",
        bg: "bg-[#d0bcff]/5",
        border: "border-[#d0bcff]/30",
        label: "NEEDS IMPROVEMENT",
      };
    }

    return {
      text: "text-[#ffb4ab]",
      bg: "bg-[#ffb4ab]/5",
      border: "border-[#ffb4ab]/30",
      label: "CRITICAL",
    };
  };

  const getSeverityStyle = (severity: string) => {
    const value = severity.toLowerCase();

    if (value === "critical" || value === "high") {
      return {
        badge: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
        dot: "bg-[#ffb4ab]",
      };
    }

    if (value === "medium") {
      return {
        badge: "border-[#d0bcff]/30 bg-[#d0bcff]/10 text-[#d0bcff]",
        dot: "bg-[#d0bcff]",
      };
    }

    if (value === "low" || value === "info" || value === "informational") {
      return {
        badge: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#00dbe9]",
        dot: "bg-[#00dbe9]",
      };
    }

    return {
      badge: "border-[#849495]/30 bg-[#849495]/10 text-[#b9cacb]",
      dot: "bg-[#849495]",
    };
  };

  const highIssues =
    result?.review.issues.filter((issue) => {
      const severity = issue.severity.toLowerCase();
      return severity === "high" || severity === "critical";
    }).length ?? 0;

  const mediumIssues =
    result?.review.issues.filter(
      (issue) => issue.severity.toLowerCase() === "medium",
    ).length ?? 0;

  const lowIssues =
    result?.review.issues.filter((issue) => {
      const severity = issue.severity.toLowerCase();

      return (
        severity === "low" ||
        severity === "info" ||
        severity === "informational"
      );
    }).length ?? 0;

  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      <div className="border-b border-[#3b494b] bg-[#0c1324]">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#00dbe9] md:text-sm lg:text-md">
                  AST NEURAL PIPELINE
                </span>
                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-md">
                  /
                </span>
                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-md">
                  GITHUB ANALYSIS
                </span>
              </div>

              <h1 className="mt-2 font-['Space_Grotesk'] text-xl font-semibold tracking-[-0.02em] text-[#dce1fb] sm:text-2xl lg:text-3xl">
                GitHub Pull Request Review
              </h1>

              <p className="mt-1 font-['Geist'] text-sm text-[#b9cacb] md:text-base lg:text-lg">
                Analyze GitHub Pull Requests using AI-powered static analysis,
                security checks, and code quality detection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#65f2b5] md:text-xs lg:text-sm">
                  GITHUB LINKED
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[#00dbe9]/20 bg-[#00dbe9]/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#00dbe9] md:text-xs lg:text-sm">
                  AI ENGINE READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#3b494b]" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
            PULL REQUEST ANALYSIS
          </span>
          <div className="h-px flex-1 bg-[#3b494b]" />
        </div>

        <section className="overflow-hidden rounded-lg border border-[#3b494b] bg-[#151b2d]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#3b494b] px-5 py-4 sm:px-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                  NODE G-04
                </span>
                <span className="h-1 w-1 rounded-full bg-[#849495]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                  REPOSITORY SELECTOR
                </span>
              </div>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                Pull Request Details
              </h2>

              <p className="mt-1 font-['Geist'] text-base text-[#b9cacb] md:text-lg lg:text-xl">
                Select a repository and an open Pull Request to start analysis.
              </p>
            </div>

            <div className="rounded-md border border-[#3b494b] bg-[#070d1f] px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
                PIPELINE
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-[#00dbe9] md:text-sm lg:text-base">
                GITHUB → DIFF → AI → REPORT
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#b9cacb] md:text-xs lg:text-sm">
                  <span>Repository</span>
                  <span className="text-[#849495]">
                    {repositories.length} AVAILABLE
                  </span>
                </label>

                <select
                  value={owner && repo ? `${owner}/${repo}` : ""}
                  onChange={(event) => {
                    const selectedRepository = repositories.find(
                      (repository) =>
                        repository.full_name === event.target.value,
                    );

                    if (!selectedRepository) {
                      setOwner("");
                      setRepo("");
                      clearPullRequestSelection();
                      return;
                    }

                    setOwner(selectedRepository.owner);
                    setRepo(selectedRepository.name);
                  }}
                  disabled={repositoriesLoading}
                  className="h-11 w-full rounded-md border border-[#3b494b] bg-[#070d1f] px-3 font-mono text-sm text-[#dce1fb] outline-none transition placeholder:text-[#849495] focus:border-[#00dbe9] focus:ring-1 focus:ring-[#00dbe9]/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-base lg:text-lg"
                >
                  <option value="" className="bg-[#070d1f]">
                    {repositoriesLoading
                      ? "Loading repositories..."
                      : "Select repository"}
                  </option>

                  {repositories.map((repository) => (
                    <option
                      key={repository.id}
                      value={repository.full_name}
                      className="bg-[#070d1f]"
                    >
                      {repository.full_name}
                      {repository.private ? " (Private)" : ""}
                    </option>
                  ))}
                </select>

                {repositoryError && (
                  <div className="mt-2 border-l-2 border-[#ffb4ab] bg-[#ffb4ab]/5 px-3 py-2">
                    <p className="font-mono text-xs text-[#ffb4ab] md:text-sm lg:text-base">
                      {repositoryError}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#b9cacb] md:text-xs lg:text-sm">
                  <span>Pull Request</span>
                  <span className="text-[#849495]">
                    {pullRequests.length} OPEN
                  </span>
                </label>

                <select
                  value={pullNumber}
                  onChange={(event) => setPullNumber(event.target.value)}
                  disabled={
                    !owner ||
                    !repo ||
                    pullRequestsLoading ||
                    pullRequests.length === 0
                  }
                  className="h-11 w-full rounded-md border border-[#3b494b] bg-[#070d1f] px-3 font-mono text-sm text-[#dce1fb] outline-none transition focus:border-[#00dbe9] focus:ring-1 focus:ring-[#00dbe9]/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-base lg:text-lg"
                >
                  <option value="" className="bg-[#070d1f]">
                    {!owner || !repo
                      ? "Select repository first"
                      : pullRequestsLoading
                        ? "Loading Pull Requests..."
                        : pullRequests.length === 0
                          ? "No open Pull Requests found"
                          : "Select Pull Request"}
                  </option>

                  {pullRequests.map((pullRequest) => (
                    <option
                      key={pullRequest.id}
                      value={String(pullRequest.number)}
                      className="bg-[#070d1f]"
                    >
                      #{pullRequest.number} - {pullRequest.title}
                      {pullRequest.draft ? " (Draft)" : ""}
                    </option>
                  ))}
                </select>

                {pullRequestError && (
                  <div className="mt-2 border-l-2 border-[#ffb4ab] bg-[#ffb4ab]/5 px-3 py-2">
                    <p className="font-mono text-xs text-[#ffb4ab] md:text-sm lg:text-base">
                      {pullRequestError}
                    </p>
                  </div>
                )}

                {!pullRequestsLoading &&
                  !pullRequestError &&
                  owner &&
                  repo &&
                  pullRequests.length === 0 && (
                    <p className="mt-2 font-mono text-xs text-[#849495] md:text-sm lg:text-base">
                      NO OPEN PULL REQUESTS DETECTED
                    </p>
                  )}
              </div>
            </div>

            {owner && repo && pullNumber && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded border border-[#3b494b] bg-[#070d1f] px-3 py-2">
                  <span className="font-mono text-[11px] uppercase text-[#849495] md:text-xs lg:text-sm">
                    TARGET
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#dce1fb] md:text-sm lg:text-base">
                    {owner}/{repo}
                  </span>
                  <span className="font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
                    #{pullNumber}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={handleReview}
                disabled={loading || !owner || !repo || !pullNumber}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#00dbe9] bg-[#00dbe9] px-5 font-mono text-xs font-semibold uppercase tracking-[0.05em] text-[#002022] transition hover:bg-[#00f0ff] disabled:cursor-not-allowed disabled:border-[#3b494b] disabled:bg-[#23293c] disabled:text-[#849495] md:text-sm lg:text-base"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#002022] border-t-transparent" />
                    Running Analysis
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Run PR Review
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
                AI + ESLINT + SEMGREP
              </div>
            </div>

            {error && (
              <div className="mt-5 border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-[#ffb4ab]">
                    <AlertCircle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#ffb4ab] md:text-xs lg:text-sm">
                      Analysis Error
                    </p>
                    <p className="mt-1 font-['Geist'] text-base text-[#b9cacb] md:text-lg lg:text-xl">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {!result && !loading && (
          <section className="mt-5 grid gap-px overflow-hidden border border-[#3b494b] bg-[#3b494b] md:grid-cols-3">
            {[
              {
                code: "ENG-01",
                title: "AI CODE REVIEW",
                description:
                  "Analyzes changed code and identifies potential quality issues.",
                color: "#00dbe9",
              },
              {
                code: "ENG-02",
                title: "SECURITY SCAN",
                description:
                  "Detects security risks and suspicious coding patterns.",
                color: "#ffb4ab",
              },
              {
                code: "ENG-03",
                title: "STATIC ANALYSIS",
                description:
                  "Runs ESLint and Semgrep against the Pull Request changes.",
                color: "#65f2b5",
              },
            ].map((engine) => (
              <div
                key={engine.code}
                className="bg-[#151b2d] p-5 transition hover:bg-[#191f31]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[11px] font-semibold uppercase md:text-xs lg:text-sm"
                    style={{ color: engine.color }}
                  >
                    {engine.code}
                  </span>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: engine.color,
                      boxShadow: `0 0 8px ${engine.color}`,
                    }}
                  />
                </div>

                <h3 className="mt-4 font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                  {engine.title}
                </h3>

                <p className="mt-2 font-['Geist'] text-sm leading-6 text-[#849495] md:text-base lg:text-lg">
                  {engine.description}
                </p>
              </div>
            ))}
          </section>
        )}

        {loading && (
          <section className="mt-5 border border-[#3b494b] bg-[#151b2d] p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#00dbe9]/30">
                <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-[#00f0ff]" />
                <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_14px_#00f0ff]" />
              </div>

              <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#00dbe9] md:text-sm lg:text-base">
                ANALYSIS IN PROGRESS
              </p>

              <h2 className="mt-2 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                Reviewing Pull Request
              </h2>

              <p className="mt-2 max-w-lg font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                Fetching changed files, running static analysis, and generating
                AI review findings.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["FETCH DIFF", "STATIC ANALYSIS", "AI REVIEW", "SCORING"].map(
                  (step) => (
                    <span
                      key={step}
                      className="border border-[#3b494b] bg-[#070d1f] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm"
                    >
                      {step}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

        {result && (
          <div className="mt-5 space-y-5">
            <section className="border border-[#3b494b] bg-[#151b2d]">
              <div className="flex flex-col justify-between gap-5 border-b border-[#3b494b] px-5 py-5 sm:px-6 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                      REVIEW COMPLETE
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#849495]" />
                    <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                      REVIEW ID #{result.review_id}
                    </span>
                  </div>

                  <h2 className="mt-2 break-all font-mono text-lg font-semibold text-[#dce1fb] sm:text-xl md:text-2xl lg:text-3xl">
                    {owner}/{repo}
                    <span className="text-[#849495]"> #{pullNumber}</span>
                  </h2>

                  <p className="mt-1 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                    Pull Request analyzed successfully by the review pipeline.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-[#65f2b5] shadow-[0_0_10px_#65f2b5]" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#65f2b5] md:text-xs lg:text-sm">
                    ANALYSIS COMPLETE
                  </span>
                </div>
              </div>
            </section>

            <section className="border border-[#3b494b] bg-[#151b2d]">
              <div className="border-b border-[#3b494b] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                    NODE G-05
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#849495]" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                    REVIEW OVERVIEW
                  </span>
                </div>

                <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                  Analysis Overview
                </h2>
              </div>

              <div className="grid gap-px bg-[#3b494b] md:grid-cols-3">
                {(() => {
                  const scoreStyle = getScoreStyle(result.review.score);

                  return (
                    <div className="bg-[#191f31] p-5">
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                        Overall Score
                      </p>

                      <div className="mt-3 flex items-end gap-2">
                        <span
                          className={`font-['Space_Grotesk'] text-5xl font-semibold ${scoreStyle.text}`}
                        >
                          {result.review.score}
                        </span>
                        <span className="mb-2 font-mono text-sm text-[#849495] md:text-base lg:text-lg">
                          /100
                        </span>
                      </div>

                      <div
                        className={`mt-3 inline-flex border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.06em] ${scoreStyle.bg} ${scoreStyle.border} ${scoreStyle.text} md:text-xs lg:text-sm`}
                      >
                        {scoreStyle.label}
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-[#191f31] p-5">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                    Changed Files
                  </p>

                  <p className="mt-3 font-['Space_Grotesk'] text-5xl font-semibold text-[#dce1fb]">
                    {result.review.files.length}
                  </p>

                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                    Files Analyzed
                  </p>
                </div>

                <div className="bg-[#191f31] p-5">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                    Total Issues
                  </p>

                  <p className="mt-3 font-['Space_Grotesk'] text-5xl font-semibold text-[#dce1fb]">
                    {result.review.issues.length}
                  </p>

                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                    Findings Detected
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-[#3b494b] bg-[#151b2d]">
              <div className="border-b border-[#3b494b] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                    SEVERITY MATRIX
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#849495]" />
                  <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    {result.review.issues.length} TOTAL FINDINGS
                  </span>
                </div>

                <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                  Issue Breakdown
                </h2>
              </div>

              <div className="grid gap-px bg-[#3b494b] sm:grid-cols-3">
                <div className="bg-[#191f31] p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#ffb4ab] md:text-xs lg:text-sm">
                      HIGH / CRITICAL
                    </span>
                    <span className="h-2 w-2 rounded-full bg-[#ffb4ab] shadow-[0_0_8px_#ffb4ab]" />
                  </div>

                  <p className="mt-3 font-['Space_Grotesk'] text-4xl font-semibold text-[#ffb4ab]">
                    {highIssues}
                  </p>

                  <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    PRIORITY FINDINGS
                  </p>
                </div>

                <div className="bg-[#191f31] p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#d0bcff] md:text-xs lg:text-sm">
                      MEDIUM
                    </span>
                    <span className="h-2 w-2 rounded-full bg-[#d0bcff] shadow-[0_0_8px_#d0bcff]" />
                  </div>

                  <p className="mt-3 font-['Space_Grotesk'] text-4xl font-semibold text-[#d0bcff]">
                    {mediumIssues}
                  </p>

                  <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    REVIEW FINDINGS
                  </p>
                </div>

                <div className="bg-[#191f31] p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                      LOW / INFO
                    </span>
                    <span className="h-2 w-2 rounded-full bg-[#00dbe9] shadow-[0_0_8px_#00dbe9]" />
                  </div>

                  <p className="mt-3 font-['Space_Grotesk'] text-4xl font-semibold text-[#00dbe9]">
                    {lowIssues}
                  </p>

                  <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    INFORMATIONAL FINDINGS
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                      FILE ANALYSIS
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#849495]" />
                    <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                      {result.review.files.length} FILES
                    </span>
                  </div>

                  <h2 className="mt-1 font-['Space_Grotesk'] text-2xl font-semibold text-[#dce1fb] md:text-3xl lg:text-4xl">
                    Changed Files
                  </h2>

                  <p className="mt-1 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                    Detailed analysis of files changed in this Pull Request.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {result.review.files.map((file) => {
                  const fileScoreStyle = getScoreStyle(file.score);

                  return (
                    <article
                      key={file.file}
                      className="overflow-hidden border border-[#3b494b] bg-[#151b2d]"
                    >
                      <div className="border-b border-[#3b494b] bg-[#191f31] px-5 py-4">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
                              <h3 className="break-all font-mono text-sm font-semibold text-[#dce1fb] md:text-base lg:text-lg">
                                {file.file}
                              </h3>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="border border-[#3b494b] bg-[#070d1f] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[#b9cacb] md:text-xs lg:text-sm">
                                {file.status}
                              </span>

                              <span className="border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-2.5 py-1 font-mono text-[11px] text-[#65f2b5] md:text-xs lg:text-sm">
                                +{file.additions}
                              </span>

                              <span className="border border-[#ffb4ab]/20 bg-[#ffb4ab]/5 px-2.5 py-1 font-mono text-[11px] text-[#ffb4ab] md:text-xs lg:text-sm">
                                -{file.deletions}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`min-w-[120px] border px-4 py-3 text-center ${fileScoreStyle.bg} ${fileScoreStyle.border}`}
                          >
                            <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                              FILE SCORE
                            </p>

                            <p
                              className={`mt-1 font-['Space_Grotesk'] text-2xl font-semibold ${fileScoreStyle.text}`}
                            >
                              {file.score}
                              <span className="ml-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                                /100
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div>
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
                            FILE SUMMARY
                          </p>

                          <p className="mt-2 font-['Geist'] text-base leading-6 text-[#b9cacb] md:text-lg md:leading-7 lg:text-xl lg:leading-8">
                            {file.summary}
                          </p>
                        </div>

                        {file.issues.length > 0 ? (
                          <div className="mt-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                                  ISSUE STREAM
                                </p>

                                <h4 className="mt-1 font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                                  Issues in this file
                                </h4>
                              </div>

                              <span className="border border-[#3b494b] bg-[#070d1f] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                                {file.issues.length}{" "}
                                {file.issues.length === 1 ? "ISSUE" : "ISSUES"}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {file.issues.map((issue, index) => {
                                const severityStyle = getSeverityStyle(
                                  issue.severity,
                                );

                                return (
                                  <div
                                    key={index}
                                    className="overflow-hidden border border-[#3b494b] bg-[#070d1f]"
                                  >
                                    <div className="border-b border-[#3b494b] bg-[#191f31] px-4 py-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span
                                          className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] ${severityStyle.badge} md:text-xs lg:text-sm`}
                                        >
                                          <span
                                            className={`h-1.5 w-1.5 rounded-full ${severityStyle.dot}`}
                                          />
                                          {issue.severity}
                                        </span>

                                        <span className="border border-[#3b494b] bg-[#151b2d] px-2.5 py-1 font-mono text-[11px] text-[#dce1fb] md:text-xs lg:text-sm">
                                          {issue.title}
                                        </span>

                                        <span className="border border-[#3b494b] bg-[#151b2d] px-2.5 py-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                                          LINE {issue.line}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-4">
                                      <p className="font-['Geist'] text-base leading-6 text-[#b9cacb] md:text-lg md:leading-7 lg:text-xl lg:leading-8">
                                        {issue.description}
                                      </p>

                                      <div className="mt-4 border border-[#00dbe9]/20 bg-[#00dbe9]/5 p-4">
                                        <div className="flex items-center gap-2">
                                          <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
                                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                                            Suggested Fix
                                          </p>
                                        </div>

                                        <p className="mt-2 font-['Geist'] text-base leading-6 text-[#b9cacb] md:text-lg md:leading-7 lg:text-xl lg:leading-8">
                                          {issue.suggestion}
                                        </p>
                                      </div>

                                      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                                        SOURCE: {issue.source}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 border border-[#65f2b5]/20 bg-[#65f2b5]/5 p-4">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />
                              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#65f2b5] md:text-xs lg:text-sm">
                                NO ISSUES DETECTED
                              </p>
                            </div>

                            <p className="mt-2 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                              The AI reviewer did not identify any problems in
                              this file.
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default GitHubReviewPage;
