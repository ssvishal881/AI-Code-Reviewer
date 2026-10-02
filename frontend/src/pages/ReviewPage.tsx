import { useState } from "react";
import CodeEditor from "../components/CodeEditor";
import ReviewResult from "../components/ReviewResult";
import type { ReviewResult as ReviewResultType } from "../types/review";

function ReviewPage() {
  const [review, setReview] = useState<ReviewResultType | null>(null);

  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      <div className="border-b border-[#3b494b] bg-[#0c1324]">
        <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />

                <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#00dbe9] md:text-sm lg:text-base">
                  AST NEURAL PIPELINE
                </span>

                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-base">
                  /
                </span>

                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-base">
                  NODE L-09
                </span>
              </div>

              <h1 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.02em] text-[#dce1fb] sm:text-3xl lg:text-4xl">
                AI Code Reviewer
              </h1>

              <p className="mt-1 max-w-2xl font-['Geist'] text-base text-[#b9cacb] md:text-lg lg:text-xl">
                Automated code analysis, security intelligence and multi-engine
                review.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#65f2b5] md:text-xs lg:text-sm">
                  ENGINE ONLINE
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[#00dbe9]/20 bg-[#00dbe9]/5 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9] shadow-[0_0_8px_#00dbe9]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#00dbe9] md:text-xs lg:text-sm">
                  AI ACTIVE
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                STATIC ANALYSIS
              </p>
              <p className="mt-1 font-mono text-xs text-[#65f2b5] md:text-sm lg:text-base">
                READY
              </p>
            </div>

            <div className="rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                SECURITY
              </p>
              <p className="mt-1 font-mono text-xs text-[#65f2b5] md:text-sm lg:text-base">
                ENABLED
              </p>
            </div>

            <div className="rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                BUG DETECTION
              </p>
              <p className="mt-1 font-mono text-xs text-[#65f2b5] md:text-sm lg:text-base">
                ENABLED
              </p>
            </div>

            <div className="rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                AI ENGINE
              </p>
              <p className="mt-1 font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
                QWEN 2.5
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
              ANALYSIS WORKSPACE
            </p>

            <p className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
              {review ? "Review Results" : "Source Review"}
            </p>
          </div>

          {review && (
            <button
              type="button"
              onClick={() => setReview(null)}
              className="rounded-md border border-[#3b494b] bg-[#151b2d] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb] transition hover:border-[#00dbe9]/50 hover:text-[#00dbe9] md:text-xs lg:text-sm"
            >
              New Review
            </button>
          )}
        </div>

        <div
          className={
            review
              ? "grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]"
              : "mx-auto max-w-6xl"
          }
        >
          <div className="min-w-0">
            <CodeEditor onReviewComplete={setReview} />
          </div>

          {review && (
            <div className="min-w-0">
              <ReviewResult review={review} />
            </div>
          )}
        </div>

        {!review && (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                  ENGINE 01
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
              </div>

              <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                Security Analysis
              </h3>

              <p className="mt-1 font-['Geist'] text-sm leading-6 text-[#b9cacb] md:text-base lg:text-lg">
                Detect insecure patterns, exposed secrets and common security
                issues.
              </p>
            </div>

            <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                  ENGINE 02
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
              </div>

              <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                Static Analysis
              </h3>

              <p className="mt-1 font-['Geist'] text-sm leading-6 text-[#b9cacb] md:text-base lg:text-lg">
                Analyze source code for bugs, quality problems and risky
                patterns.
              </p>
            </div>

            <div className="rounded-lg border border-[#3b494b] bg-[#151b2d] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                  ENGINE 03
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
              </div>

              <h3 className="font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                AI Intelligence
              </h3>

              <p className="mt-1 font-['Geist'] text-sm leading-6 text-[#b9cacb] md:text-base lg:text-lg">
                Qwen analyzes the code and provides explanations and actionable
                suggestions.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReviewPage;
