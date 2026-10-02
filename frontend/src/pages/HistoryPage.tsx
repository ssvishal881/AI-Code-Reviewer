import ReviewHistory from "../components/ReviewHistory";

function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      <div className="border-b border-[#3b494b] bg-[#0c1324]">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />

                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#00dbe9]">
                  AST NEURAL PIPELINE
                </span>

                <span className="font-mono text-[10px] text-[#849495]">/</span>

                <span className="font-mono text-[10px] text-[#849495]">
                  REVIEW ARCHIVE
                </span>
              </div>

              <h1 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.02em] text-[#dce1fb] sm:text-3xl">
                Review History
              </h1>

              <p className="mt-1 max-w-2xl font-['Geist'] text-sm text-[#b9cacb]">
                View previous code reviews, analysis results, and review
                statistics.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-2 lg:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />

              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-[#65f2b5]">
                ARCHIVE ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#3b494b]" />

          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-[#849495]">
            ANALYSIS ARCHIVE
          </span>

          <div className="h-px flex-1 bg-[#3b494b]" />
        </div>

        <ReviewHistory />
      </main>
    </div>
  );
}

export default HistoryPage;
