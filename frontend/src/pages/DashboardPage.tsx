import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleAlert,
  FileSearch,
  Gauge,
  GitBranch,
  ListChecks,
} from "lucide-react";
import { getUserReviews } from "../services/api";
import type { ReviewHistoryItem } from "../types/review";
import { useGlobalLoader } from "../context/LoaderContext";

type CurrentUser = {
  id: number;
  name: string;
  email: string;
};

type ReviewIssue = {
  category?: string;
  type?: string;
  severity?: string;
  title?: string;
};

type StoredSession = {
  user: CurrentUser | null;
  error: string;
};

function getStoredSession(): StoredSession {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return { user: null, error: "Please login to view your dashboard." };
    }

    const parsed = JSON.parse(storedUser) as Partial<CurrentUser>;

    if (typeof parsed.id !== "number") {
      return { user: null, error: "Invalid login session." };
    }

    return { user: parsed as CurrentUser, error: "" };
  } catch {
    return { user: null, error: "Invalid login session." };
  }
}

function DashboardPage() {
  const [session] = useState<StoredSession>(getStoredSession);
  const user = session.user;

  const [reviews, setReviews] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(session.user !== null);
  const [error, setError] = useState(session.error);
  const { showLoader, hideLoader } = useGlobalLoader();

  useEffect(() => {
    if (!user) {
      return;
    }

    let ignore = false;

    const loadReviews = async () => {
      showLoader("Loading your dashboard...");

      try {
        const data = await getUserReviews(user.id);

        if (!ignore) {
          setReviews(data);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load your reviews.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }

        hideLoader();
      }
    };

    loadReviews();

    return () => {
      ignore = true;
    };
  }, [user, showLoader, hideLoader]);

  const statistics = useMemo(() => {
    const totalReviews = reviews.length;

    const totalIssues = reviews.reduce(
      (total, review) => total + (review.issues?.length ?? 0),
      0,
    );

    const averageScore =
      totalReviews > 0
        ? Math.round(
            reviews.reduce((total, review) => total + review.score, 0) /
              totalReviews,
          )
        : 0;

    const githubReviews = reviews.filter((review) =>
      Boolean(review.repo_name),
    ).length;

    const getIssues = (review: ReviewHistoryItem): ReviewIssue[] => {
      return (review.issues ?? []) as ReviewIssue[];
    };

    const securityIssues = reviews.reduce((total, review) => {
      return (
        total +
        getIssues(review).filter((issue) => {
          const value =
            `${issue.category ?? ""} ${issue.type ?? ""}`.toLowerCase();
          return value.includes("security");
        }).length
      );
    }, 0);

    const bugIssues = reviews.reduce((total, review) => {
      return (
        total +
        getIssues(review).filter((issue) => {
          const value =
            `${issue.category ?? ""} ${issue.type ?? ""}`.toLowerCase();
          return value.includes("bug");
        }).length
      );
    }, 0);

    const performanceIssues = reviews.reduce((total, review) => {
      return (
        total +
        getIssues(review).filter((issue) => {
          const value =
            `${issue.category ?? ""} ${issue.type ?? ""}`.toLowerCase();
          return value.includes("performance");
        }).length
      );
    }, 0);

    const qualityIssues = reviews.reduce((total, review) => {
      return (
        total +
        getIssues(review).filter((issue) => {
          const value =
            `${issue.category ?? ""} ${issue.type ?? ""}`.toLowerCase();

          return (
            value.includes("quality") ||
            value.includes("best-practice") ||
            value.includes("best practice") ||
            value.includes("best_practice")
          );
        }).length
      );
    }, 0);

    return {
      totalReviews,
      totalIssues,
      averageScore,
      githubReviews,
      securityIssues,
      bugIssues,
      performanceIssues,
      qualityIssues,
    };
  }, [reviews]);

  const healthStatus = useMemo(() => {
    if (statistics.totalReviews === 0) {
      return {
        label: "AWAITING ANALYSIS",
        color: "text-[#00dbe9]",
        border: "border-[#00dbe9]/30",
        background: "bg-[#00dbe9]/10",
      };
    }

    if (statistics.averageScore < 50) {
      return {
        label: "HIGH RISK DETECTED",
        color: "text-[#ffb4ab]",
        border: "border-[#ffb4ab]/30",
        background: "bg-[#93000a]/20",
      };
    }

    if (statistics.averageScore < 75) {
      return {
        label: "ATTENTION REQUIRED",
        color: "text-[#d0bcff]",
        border: "border-[#d0bcff]/30",
        background: "bg-[#571bc1]/20",
      };
    }

    return {
      label: "WORKSPACE HEALTHY",
      color: "text-[#65f2b5]",
      border: "border-[#65f2b5]/30",
      background: "bg-[#65f2b5]/10",
    };
  }, [statistics]);

  const scoreColor =
    statistics.averageScore < 50
      ? "#ffb4ab"
      : statistics.averageScore < 75
        ? "#d0bcff"
        : "#65f2b5";

  const getScoreTextColor = (score: number) => {
    if (score < 50) {
      return "text-[#ffb4ab]";
    }

    if (score < 75) {
      return "text-[#d0bcff]";
    }

    return "text-[#65f2b5]";
  };

  const getScoreBorderColor = (score: number) => {
    if (score < 50) {
      return "border-[#ffb4ab]/30";
    }

    if (score < 75) {
      return "border-[#d0bcff]/30";
    }

    return "border-[#65f2b5]/30";
  };

  const getIssuePercentage = (count: number) => {
    if (!statistics.totalIssues) {
      return 0;
    }

    return Math.min((count / statistics.totalIssues) * 100, 100);
  };

  const getReviewName = (review: ReviewHistoryItem) => {
    if (review.repo_name) {
      return `${review.repo_owner ? `${review.repo_owner}/` : ""}${review.repo_name}`;
    }

    return review.summary || `Review #${review.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#0c1324] px-4 py-6 text-[#dce1fb] md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 space-y-3">
            <div className="h-3 w-56 animate-pulse rounded bg-[#23293c]" />
            <div className="h-10 w-96 animate-pulse rounded bg-[#191f31]" />
            <div className="h-5 w-[34rem] max-w-full animate-pulse rounded bg-[#191f31]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl border border-[#3b494b] bg-[#151b2d]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#0c1324] px-4 py-6 text-[#dce1fb] md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-[#93000a]/40 bg-[#191f31] p-6">
            <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#ffb4ab]">
              SYSTEM ERROR
            </div>

            <p className="text-base text-[#b9cacb]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0c1324] px-3 py-5 text-[#dce1fb] sm:px-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-xl border border-[#3b494b] bg-[#0c1324]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#00dbe9]/5 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-[#571bc1]/5 blur-3xl" />
          </div>

          <div className="relative px-5 py-7 sm:px-7 sm:py-9">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h1 className="max-w-4xl flex-1 font-['Space_Grotesk'] text-3xl md:text-4xl font-bold leading-10 tracking-[-0.02em] text-[#dce1fb] sm:text-4xl sm:leading-[3rem]">
                Automated Code Analysis &amp; Security Intelligence
              </h1>

              <span className="flex shrink-0 items-center gap-2 rounded-full border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-1.5 font-mono text-[11px] md:text-xs lg:text-sm font-semibold uppercase tracking-[0.08em] text-[#65f2b5]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />
                SYSTEM ONLINE
              </span>
            </div>

            <p className="mt-3 max-w-3xl font-['Geist'] text-base leading-[26px] text-[#b9cacb] sm:text-lg sm:leading-[30px]">
              Welcome back, {user?.name}. Monitor your code quality, security
              findings, review activity, and GitHub analysis from one
              engineering workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb]">
                  FastAPI
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb]">
                  PostgreSQL
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9] shadow-[0_0_8px_#00dbe9]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb]">
                  ESLint
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d0bcff] shadow-[0_0_8px_#d0bcff]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb]">
                  Semgrep
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9] shadow-[0_0_8px_#00dbe9]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb]">
                  Qwen LLM
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#849495]">
                  TOTAL REVIEWS
                </p>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#dce1fb]">
                  {statistics.totalReviews}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#00dbe9]/20 bg-[#00dbe9]/5 text-[#00dbe9]">
                <ListChecks className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 border-t border-[#3b494b]/60 pt-3">
              <p className="font-mono text-[11px] text-[#849495]">
                COMPLETED ANALYSIS RUNS
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#849495]">
                  AVERAGE SCORE
                </p>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#dce1fb]">
                  {statistics.averageScore}
                  <span className="font-mono text-sm text-[#849495]">
                    {" "}
                    /100
                  </span>
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 text-[#65f2b5]">
                <Gauge className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 border-t border-[#3b494b]/60 pt-3">
              <p className="font-mono text-[11px] text-[#849495]">
                WORKSPACE QUALITY INDEX
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#849495]">
                  ISSUES DETECTED
                </p>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#dce1fb]">
                  {statistics.totalIssues}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#ffb4ab]/20 bg-[#ffb4ab]/5 text-[#ffb4ab]">
                <CircleAlert className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 border-t border-[#3b494b]/60 pt-3">
              <p className="font-mono text-[11px] text-[#849495]">
                ALL REVIEW FINDINGS
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#849495]">
                  GITHUB REVIEWS
                </p>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#dce1fb]">
                  {statistics.githubReviews}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#d0bcff]/20 bg-[#d0bcff]/5 text-[#d0bcff]">
                <GitBranch className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 border-t border-[#3b494b]/60 pt-3">
              <p className="font-mono text-[11px] text-[#849495]">
                REPOSITORY / PR REVIEWS
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#3b494b] bg-[#191f31]">
          <div className="flex flex-col gap-3 border-b border-[#3b494b] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#849495]">
                STATIC AUDIT INDEX
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-2xl font-semibold leading-8 text-[#dce1fb]">
                Workspace Health
              </h2>
            </div>

            <div
              className={`w-fit rounded-md border px-3 py-1.5 ${healthStatus.border} ${healthStatus.background}`}
            >
              <span
                className={`font-mono text-[11px] font-semibold uppercase tracking-[0.04em] ${healthStatus.color}`}
              >
                {healthStatus.label}
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[250px_1fr]">
            <div className="flex items-center justify-center rounded-lg bg-[#070d1f] py-8">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <svg
                  className="absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill="none"
                    stroke="#2e3447"
                    strokeWidth="5"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${statistics.averageScore * 2.701} 270.1`}
                    style={{
                      filter: `drop-shadow(0 0 5px ${scoreColor})`,
                    }}
                  />
                </svg>

                <div className="relative flex flex-col items-center">
                  <span className="font-['Space_Grotesk'] text-4xl font-bold text-[#dce1fb]">
                    {statistics.averageScore}
                  </span>

                  <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[#849495]">
                    /100 SCORE
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between rounded-md border border-[#3b494b] bg-[#23293c] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#ffb4ab] shadow-[0_0_7px_#ffb4ab]" />

                  <span className="font-['Geist'] text-base text-[#b9cacb]">
                    Security Findings
                  </span>
                </div>

                <span className="font-mono text-base text-[#ffb4ab]">
                  {statistics.securityIssues}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md border border-[#3b494b] bg-[#23293c] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#d0bcff] shadow-[0_0_7px_#d0bcff]" />

                  <span className="font-['Geist'] text-base text-[#b9cacb]">
                    Bugs / Defects
                  </span>
                </div>

                <span className="font-mono text-base text-[#d0bcff]">
                  {statistics.bugIssues}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md border border-[#3b494b] bg-[#23293c] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#00dbe9] shadow-[0_0_7px_#00dbe9]" />

                  <span className="font-['Geist'] text-base text-[#b9cacb]">
                    Performance Findings
                  </span>
                </div>

                <span className="font-mono text-base text-[#00dbe9]">
                  {statistics.performanceIssues}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md border border-[#3b494b] bg-[#23293c] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#65f2b5] shadow-[0_0_7px_#65f2b5]" />

                  <span className="font-['Geist'] text-base text-[#b9cacb]">
                    Quality / Best Practice
                  </span>
                </div>

                <span className="font-mono text-base text-[#65f2b5]">
                  {statistics.qualityIssues}
                </span>
              </div>

              <p className="mt-2 font-['Geist'] text-sm leading-[22px] text-[#849495]">
                Health is calculated from your completed review scores. A higher
                score indicates fewer detected issues across the review
                pipeline.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="overflow-hidden rounded-lg border border-[#3b494b] bg-[#191f31]">
            <div className="flex items-center justify-between border-b border-[#3b494b] px-5 py-4">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#849495]">
                  REVIEW ACTIVITY
                </p>

                <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb]">
                  Recent Reviews
                </h2>
              </div>

              <Link
                to="/history"
                className="rounded-md border border-[#00dbe9]/30 bg-[#00dbe9]/5 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#00dbe9] transition hover:border-[#00dbe9]/60 hover:bg-[#00dbe9]/10"
              >
                View All
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#3b494b] bg-[#151b2d] text-[#00dbe9]">
                  <FileSearch className="h-6 w-6" aria-hidden="true" />
                </div>

                <p className="mt-4 font-['Geist'] text-base text-[#b9cacb]">
                  No reviews have been executed yet.
                </p>

                <Link
                  to="/review"
                  className="mt-5 inline-flex rounded-md bg-[#00f0ff] px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#00363a] shadow-[0_0_18px_rgba(0,240,255,0.18)] transition hover:bg-[#7df4ff]"
                >
                  Start First Review
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#3b494b]">
                {reviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-4 px-5 py-4 transition hover:bg-[#23293c] md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm border border-[#00dbe9]/20 bg-[#00dbe9]/5 px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.04em] text-[#00dbe9]">
                          REVIEW-{String(review.id).padStart(4, "0")}
                        </span>

                        {review.repo_name && (
                          <span className="rounded-sm border border-[#d0bcff]/20 bg-[#571bc1]/10 px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.04em] text-[#d0bcff]">
                            GITHUB
                          </span>
                        )}
                      </div>

                      <p className="mt-2 truncate font-['Geist'] text-base font-medium text-[#dce1fb]">
                        {getReviewName(review)}
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-[#849495]">
                        {review.issues?.length ?? 0} FINDINGS DETECTED
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div
                        className={`rounded-md border px-3 py-2 ${getScoreBorderColor(review.score)}`}
                      >
                        <p
                          className={`font-mono text-base font-semibold ${getScoreTextColor(review.score)}`}
                        >
                          {review.score}/100
                        </p>
                      </div>

                      <Link
                        to={`/history/${review.id}`}
                        className="rounded-md border border-[#3b494b] bg-[#23293c] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb] transition hover:border-[#00dbe9]/40 hover:text-[#00dbe9]"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#3b494b] bg-[#191f31]">
            <div className="border-b border-[#3b494b] px-5 py-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#849495]">
                DIAGNOSTIC MATRIX
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb]">
                Issue Distribution
              </h2>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-['Geist'] text-sm text-[#b9cacb]">
                    Security
                  </span>

                  <span className="font-mono text-xs text-[#ffb4ab]">
                    {statistics.securityIssues}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-[#2e3447]">
                  <div
                    className="h-full rounded-full bg-[#ffb4ab] shadow-[0_0_8px_rgba(255,180,171,0.35)]"
                    style={{
                      width: `${getIssuePercentage(statistics.securityIssues)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-['Geist'] text-sm text-[#b9cacb]">
                    Bugs
                  </span>

                  <span className="font-mono text-xs text-[#d0bcff]">
                    {statistics.bugIssues}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-[#2e3447]">
                  <div
                    className="h-full rounded-full bg-[#d0bcff] shadow-[0_0_8px_rgba(208,188,255,0.35)]"
                    style={{
                      width: `${getIssuePercentage(statistics.bugIssues)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-['Geist'] text-sm text-[#b9cacb]">
                    Performance
                  </span>

                  <span className="font-mono text-xs text-[#00dbe9]">
                    {statistics.performanceIssues}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-[#2e3447]">
                  <div
                    className="h-full rounded-full bg-[#00dbe9] shadow-[0_0_8px_rgba(0,219,233,0.35)]"
                    style={{
                      width: `${getIssuePercentage(statistics.performanceIssues)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-['Geist'] text-sm text-[#b9cacb]">
                    Quality / Best Practice
                  </span>

                  <span className="font-mono text-xs text-[#65f2b5]">
                    {statistics.qualityIssues}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-[#2e3447]">
                  <div
                    className="h-full rounded-full bg-[#65f2b5] shadow-[0_0_8px_rgba(101,242,181,0.35)]"
                    style={{
                      width: `${getIssuePercentage(statistics.qualityIssues)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mx-5 mb-5 rounded-lg border border-[#3b494b] bg-[#070d1f] p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495]">
                ACTIVE ANALYSIS ENGINES
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-['Geist'] text-sm text-[#b9cacb]">
                    ESLint Static Analysis
                  </span>

                  <span className="font-mono text-[11px] font-semibold text-[#65f2b5]">
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-['Geist'] text-sm text-[#b9cacb]">
                    Semgrep Security Engine
                  </span>

                  <span className="font-mono text-[11px] font-semibold text-[#65f2b5]">
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-['Geist'] text-sm text-[#b9cacb]">
                    Qwen AI Review Engine
                  </span>

                  <span className="font-mono text-[11px] font-semibold text-[#00dbe9]">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            to="/review"
            className="group relative overflow-hidden rounded-lg border border-[#00dbe9]/20 bg-[#151b2d] p-5 transition duration-200 hover:border-[#00dbe9]/50 hover:bg-[#191f31]"
          >
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#00dbe9]/5 blur-2xl transition group-hover:bg-[#00dbe9]/10" />

            <div className="relative flex items-center justify-between gap-5">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9]">
                  CODE ANALYSIS
                </p>

                <h3 className="mt-2 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb]">
                  Run Multi-Engine Review
                </h3>

                <p className="mt-1 font-['Geist'] text-sm leading-[22px] text-[#849495]">
                  Analyze source code with ESLint, Semgrep, and AI-powered
                  review.
                </p>
              </div>

              <span className="text-[#00dbe9] transition duration-200 group-hover:translate-x-1">
                <ArrowRight className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
          </Link>

          <Link
            to="/github-review"
            className="group relative overflow-hidden rounded-lg border border-[#d0bcff]/20 bg-[#151b2d] p-5 transition duration-200 hover:border-[#d0bcff]/50 hover:bg-[#191f31]"
          >
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#571bc1]/5 blur-2xl transition group-hover:bg-[#571bc1]/10" />

            <div className="relative flex items-center justify-between gap-5">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#d0bcff]">
                  GITHUB INTELLIGENCE
                </p>

                <h3 className="mt-2 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb]">
                  Review GitHub Pull Request
                </h3>

                <p className="mt-1 font-['Geist'] text-sm leading-[22px] text-[#849495]">
                  Select a repository and run automated AI analysis on a pull
                  request.
                </p>
              </div>

              <span className="text-[#d0bcff] transition duration-200 group-hover:translate-x-1">
                <ArrowRight className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#3b494b]/60 pt-5 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[#849495]">
            CYBERNETIC STATIC ANALYSIS // AI CODE REVIEWER
          </span>

          <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[#849495]">
            AST SYNTH v4.1 // MULTI-ENGINE ANALYSIS ACTIVE
          </span>
        </footer>
      </div>
    </div>
  );
}

export default DashboardPage;
