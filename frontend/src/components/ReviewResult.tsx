import { useState } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import type { ReviewResult as ReviewResultType } from "../types/review";

type Props = {
  review: ReviewResultType;
};

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

function getStoredReviewSettings<T extends object>(
  keyPrefix: string,
  defaults: T,
): T {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return defaults;
    }

    const user = JSON.parse(storedUser) as { id?: number };

    if (typeof user.id !== "number") {
      return defaults;
    }

    const storedSettings = localStorage.getItem(`${keyPrefix}_${user.id}`);

    if (!storedSettings) {
      return defaults;
    }

    const parsed = JSON.parse(storedSettings);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return defaults;
    }

    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function ReviewResult({ review }: Props) {
  const [display] = useState<ReviewDisplay>(() =>
    getStoredReviewSettings("reviewDisplay", defaultDisplay),
  );

  const [preferences] = useState<ReviewPreferences>(() =>
    getStoredReviewSettings("reviewPreferences", defaultPreferences),
  );

  const visibleIssues = review.issues.filter((issue) => {
    const category = issue.category.toLowerCase().trim();

    if (category === "security") {
      return preferences.security;
    }

    if (category === "bug" || category === "bugs") {
      return preferences.bugs;
    }

    if (category === "performance") {
      return preferences.performance;
    }

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

  const issueCount = visibleIssues.length;

  const highCount = visibleIssues.filter(
    (issue) =>
      issue.severity.toLowerCase() === "high" ||
      issue.severity.toLowerCase() === "critical",
  ).length;

  const mediumCount = visibleIssues.filter(
    (issue) => issue.severity.toLowerCase() === "medium",
  ).length;

  const lowCount = visibleIssues.filter(
    (issue) =>
      issue.severity.toLowerCase() === "low" ||
      issue.severity.toLowerCase() === "info" ||
      issue.severity.toLowerCase() === "informational",
  ).length;

  const securityCount = visibleIssues.filter(
    (issue) => issue.category.toLowerCase() === "security",
  ).length;

  const bugCount = visibleIssues.filter(
    (issue) =>
      issue.category.toLowerCase() === "bug" ||
      issue.category.toLowerCase() === "bugs",
  ).length;

  const performanceCount = visibleIssues.filter(
    (issue) => issue.category.toLowerCase() === "performance",
  ).length;

  const qualityCount = visibleIssues.filter(
    (issue) =>
      issue.category.toLowerCase() === "quality" ||
      issue.category.toLowerCase() === "code quality",
  ).length;

  const bestPracticeCount = visibleIssues.filter((issue) => {
    const category = issue.category.toLowerCase().trim();

    return (
      category === "best-practice" ||
      category === "best practice" ||
      category === "best_practice"
    );
  }).length;

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Needs Improvement";
    return "Poor";
  };

  const getScoreTheme = (score: number) => {
    if (score >= 90) {
      return {
        text: "text-[#65f2b5]",
        stroke: "#65f2b5",
        border: "border-[#65f2b5]/30",
        bg: "bg-[#65f2b5]/5",
        glow: "shadow-[0_0_30px_rgba(101,242,181,0.08)]",
      };
    }

    if (score >= 75) {
      return {
        text: "text-[#00dbe9]",
        stroke: "#00dbe9",
        border: "border-[#00dbe9]/30",
        bg: "bg-[#00dbe9]/5",
        glow: "shadow-[0_0_30px_rgba(0,219,233,0.08)]",
      };
    }

    if (score >= 60) {
      return {
        text: "text-[#d0bcff]",
        stroke: "#d0bcff",
        border: "border-[#d0bcff]/30",
        bg: "bg-[#d0bcff]/5",
        glow: "shadow-[0_0_30px_rgba(208,188,255,0.08)]",
      };
    }

    return {
      text: "text-[#ffb4ab]",
      stroke: "#ffb4ab",
      border: "border-[#ffb4ab]/30",
      bg: "bg-[#ffb4ab]/5",
      glow: "shadow-[0_0_30px_rgba(255,180,171,0.08)]",
    };
  };

  const getSeverityStyle = (severity: string) => {
    const value = severity.toLowerCase();

    if (value === "critical" || value === "high") {
      return {
        badge: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
        dot: "bg-[#ffb4ab] shadow-[0_0_7px_#ffb4ab]",
      };
    }

    if (value === "medium") {
      return {
        badge: "border-[#d0bcff]/30 bg-[#d0bcff]/10 text-[#d0bcff]",
        dot: "bg-[#d0bcff] shadow-[0_0_7px_#d0bcff]",
      };
    }

    if (value === "low" || value === "info" || value === "informational") {
      return {
        badge: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#00dbe9]",
        dot: "bg-[#00dbe9] shadow-[0_0_7px_#00dbe9]",
      };
    }

    return {
      badge: "border-[#3b494b] bg-[#23293c] text-[#b9cacb]",
      dot: "bg-[#849495]",
    };
  };

  const getCategoryStyle = (category: string) => {
    const value = category.toLowerCase().trim();

    if (value === "security") {
      return "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]";
    }

    if (value === "bug" || value === "bugs") {
      return "border-[#d0bcff]/30 bg-[#d0bcff]/10 text-[#d0bcff]";
    }

    if (value === "performance") {
      return "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#00dbe9]";
    }

    if (value === "quality" || value === "code quality") {
      return "border-[#7df4ff]/30 bg-[#7df4ff]/10 text-[#7df4ff]";
    }

    if (
      value === "best-practice" ||
      value === "best practice" ||
      value === "best_practice"
    ) {
      return "border-[#65f2b5]/30 bg-[#65f2b5]/10 text-[#65f2b5]";
    }

    return "border-[#3b494b] bg-[#23293c] text-[#b9cacb]";
  };

  const scoreTheme = getScoreTheme(review.score);

  const scoreRadius = 42;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreOffset =
    scoreCircumference - (review.score / 100) * scoreCircumference;

  const severityTotal = highCount + mediumCount + lowCount;

  const highWidth = severityTotal > 0 ? (highCount / severityTotal) * 100 : 0;

  const mediumWidth =
    severityTotal > 0 ? (mediumCount / severityTotal) * 100 : 0;

  const lowWidth = severityTotal > 0 ? (lowCount / severityTotal) * 100 : 0;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[#3b494b] bg-[#191f31]">
        <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />

                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-[#65f2b5]">
                  STATIC AUDIT COMPLETE
                </span>
              </div>

              <h2 className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb]">
                Review Intelligence
              </h2>
            </div>

            <div className="rounded-md border border-[#3b494b] bg-[#070d1f] px-3 py-2">
              <p className="font-mono text-[8px] uppercase tracking-[0.05em] text-[#849495]">
                ANALYSIS STATUS
              </p>

              <p className="mt-0.5 font-mono text-[10px] font-semibold text-[#65f2b5]">
                COMPLETE
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div
              className={`rounded-lg border p-4 ${scoreTheme.border} ${scoreTheme.bg} ${scoreTheme.glow}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-[#849495]">
                    OVERALL SCORE
                  </p>

                  <p
                    className={`mt-2 font-['Space_Grotesk'] text-xl font-semibold ${scoreTheme.text}`}
                  >
                    {getScoreLabel(review.score)}
                  </p>

                  <p className="mt-1 font-mono text-[9px] text-[#849495]">
                    SYSTEM QUALITY INDEX
                  </p>
                </div>

                <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
                  <svg
                    className="h-full w-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r={scoreRadius}
                      fill="none"
                      stroke="#3b494b"
                      strokeWidth="8"
                    />

                    <circle
                      cx="50"
                      cy="50"
                      r={scoreRadius}
                      fill="none"
                      stroke={scoreTheme.stroke}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={scoreCircumference}
                      strokeDashoffset={scoreOffset}
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={`font-mono text-lg font-semibold ${scoreTheme.text}`}
                    >
                      {review.score}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-4">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-[#849495]">
                VISIBLE ISSUES
              </p>

              <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-[#dce1fb]">
                {issueCount}
              </p>

              <p className="mt-1 font-mono text-[9px] text-[#849495]">
                {issueCount === 1 ? "ISSUE DETECTED" : "ISSUES DETECTED"}
              </p>

              <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-[#2e3447]">
                {highCount > 0 && (
                  <div
                    className="bg-[#ffb4ab]"
                    style={{ width: `${highWidth}%` }}
                  />
                )}

                {mediumCount > 0 && (
                  <div
                    className="bg-[#d0bcff]"
                    style={{ width: `${mediumWidth}%` }}
                  />
                )}

                {lowCount > 0 && (
                  <div
                    className="bg-[#00dbe9]"
                    style={{ width: `${lowWidth}%` }}
                  />
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-4">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-[#849495]">
                SEVERITY BREAKDOWN
              </p>

              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[9px] text-[#b9cacb]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffb4ab]" />
                    HIGH / CRITICAL
                  </span>

                  <span className="font-mono text-[10px] font-semibold text-[#ffb4ab]">
                    {highCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[9px] text-[#b9cacb]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d0bcff]" />
                    MEDIUM
                  </span>

                  <span className="font-mono text-[10px] font-semibold text-[#d0bcff]">
                    {mediumCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[9px] text-[#b9cacb]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
                    LOW / INFO
                  </span>

                  <span className="font-mono text-[10px] font-semibold text-[#00dbe9]">
                    {lowCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[#3b494b] bg-[#070d1f] p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-[#00dbe9]">
                AI SUMMARY
              </span>

              <span className="h-px flex-1 bg-[#3b494b]" />
            </div>

            <p className="mt-3 font-['Geist'] text-sm leading-6 text-[#b9cacb]">
              {review.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#3b494b] bg-[#191f31]">
        <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-[#849495]">
                ISSUE CLASSIFICATION
              </p>

              <h3 className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb]">
                Issue Categories
              </h3>
            </div>

            <span className="rounded-md border border-[#3b494b] bg-[#070d1f] px-2.5 py-1.5 font-mono text-[9px] text-[#849495]">
              {issueCount} TOTAL
            </span>
          </div>
        </div>

        <div className="grid gap-px bg-[#3b494b] sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-[#191f31] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.04em] text-[#ffb4ab]">
              SECURITY
            </p>

            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-[#dce1fb]">
              {securityCount}
            </p>

            <p className="mt-1 font-mono text-[8px] text-[#849495]">
              SECURITY ISSUES
            </p>
          </div>

          <div className="bg-[#191f31] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.04em] text-[#d0bcff]">
              BUGS
            </p>

            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-[#dce1fb]">
              {bugCount}
            </p>

            <p className="mt-1 font-mono text-[8px] text-[#849495]">
              FUNCTIONAL ISSUES
            </p>
          </div>

          <div className="bg-[#191f31] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.04em] text-[#00dbe9]">
              PERFORMANCE
            </p>

            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-[#dce1fb]">
              {performanceCount}
            </p>

            <p className="mt-1 font-mono text-[8px] text-[#849495]">
              PERFORMANCE ISSUES
            </p>
          </div>

          <div className="bg-[#191f31] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.04em] text-[#7df4ff]">
              QUALITY
            </p>

            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-[#dce1fb]">
              {qualityCount}
            </p>

            <p className="mt-1 font-mono text-[8px] text-[#849495]">
              CODE QUALITY
            </p>
          </div>

          <div className="bg-[#191f31] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.04em] text-[#65f2b5]">
              BEST PRACTICE
            </p>

            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-[#dce1fb]">
              {bestPracticeCount}
            </p>

            <p className="mt-1 font-mono text-[8px] text-[#849495]">
              RECOMMENDATIONS
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-[#849495]">
              FINDINGS
            </p>

            <h3 className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb]">
              Detected Issues
            </h3>

            <p className="mt-1 font-['Geist'] text-xs text-[#849495]">
              Problems and improvement suggestions identified by the analysis
              engines.
            </p>
          </div>

          <span className="w-fit rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-1.5 font-mono text-[9px] font-semibold text-[#b9cacb]">
            {issueCount} {issueCount === 1 ? "ISSUE" : "ISSUES"}
          </span>
        </div>

        {issueCount === 0 ? (
          <div className="rounded-lg border border-[#65f2b5]/30 bg-[#65f2b5]/5 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#65f2b5]/30 bg-[#65f2b5]/10 text-[#65f2b5]">
              <CircleCheck className="h-6 w-6" aria-hidden="true" />
            </div>

            <h4 className="mt-4 font-['Space_Grotesk'] text-lg font-semibold text-[#65f2b5]">
              No Issues Detected
            </h4>

            <p className="mx-auto mt-2 max-w-lg font-['Geist'] text-xs leading-5 text-[#b9cacb]">
              No issues match your current Review Preferences.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleIssues.map((issue, index) => {
              const severityStyle = getSeverityStyle(issue.severity);
              const categoryStyle = getCategoryStyle(issue.category);

              return (
                <article
                  key={`${issue.file}-${issue.line}-${issue.title}-${index}`}
                  className="overflow-hidden rounded-lg border border-[#3b494b] bg-[#191f31]"
                >
                  <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {display.showSeverity && (
                        <span
                          className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.04em] ${severityStyle.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${severityStyle.dot}`}
                          />

                          {issue.severity}
                        </span>
                      )}

                      <span
                        className={`rounded-md border px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.04em] ${categoryStyle}`}
                      >
                        {issue.category}
                      </span>

                      {display.showSource && (
                        <span className="rounded-md border border-[#3b494b] bg-[#070d1f] px-2 py-1 font-mono text-[8px] text-[#849495]">
                          {issue.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h4 className="font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb]">
                          {issue.title}
                        </h4>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-sm border border-[#3b494b] bg-[#070d1f] px-2 py-1 font-mono text-[8px] text-[#849495]">
                            FILE:{" "}
                            <span className="text-[#b9cacb]">{issue.file}</span>
                          </span>

                          <span className="rounded-sm border border-[#3b494b] bg-[#070d1f] px-2 py-1 font-mono text-[8px] text-[#849495]">
                            LINE:{" "}
                            <span className="text-[#00dbe9]">{issue.line}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {display.showDescription && (
                      <div className="mt-4">
                        <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.05em] text-[#849495]">
                          DESCRIPTION
                        </p>

                        <p className="mt-2 font-['Geist'] text-xs leading-5 text-[#b9cacb]">
                          {issue.description}
                        </p>
                      </div>
                    )}

                    {display.showSuggestions && (
                      <div className="mt-4 rounded-md border border-[#00dbe9]/20 bg-[#00dbe9]/5 p-3">
                        <div className="flex gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#00dbe9]/20 bg-[#00dbe9]/10 text-[#00dbe9]">
                            <ArrowRight
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </div>

                          <div>
                            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-[#00dbe9]">
                              SUGGESTED FIX
                            </p>

                            <p className="mt-1 font-['Geist'] text-xs leading-5 text-[#b9cacb]">
                              {issue.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {issue.code_snippet && (
                      <div className="mt-4 overflow-hidden rounded-md border border-[#3b494b]">
                        <div className="flex items-center justify-between border-b border-[#3b494b] bg-[#151b2d] px-3 py-2">
                          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.05em] text-[#849495]">
                            SOURCE SNIPPET
                          </span>

                          <span className="font-mono text-[8px] text-[#849495]">
                            L{issue.line}
                          </span>
                        </div>

                        <div className="overflow-x-auto bg-[#070d1f] p-3">
                          <pre className="font-mono text-[10px] leading-5 text-[#dce1fb]">
                            <code>{issue.code_snippet}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ReviewResult;
