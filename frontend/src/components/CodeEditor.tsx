import { useState } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { reviewCode } from "../services/api";
import type { ReviewResult } from "../types/review";
import { useGlobalLoader } from "../context/LoaderContext";

type Props = {
  onReviewComplete: (review: ReviewResult) => void;
};

function CodeEditor({ onReviewComplete }: Props) {
  const [fileName, setFileName] = useState("example.js");
  const { showLoader, hideLoader } = useGlobalLoader();

  const [code, setCode] = useState(
    "const password = '12345';\nconsole.log(password);",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;

      if (typeof content === "string") {
        setCode(content);
      }
    };

    reader.readAsText(file);
  };

  const handleReview = async () => {
    setLoading(true);
    setError("");
    showLoader("Analyzing source code...");

    try {
      const result = await reviewCode(fileName, code);
      onReviewComplete(result);
    } catch {
      setError("Something went wrong while reviewing the code.");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <section className="overflow-hidden rounded-lg border border-[#3b494b] bg-[#191f31]">
      <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
              CODE INGESTION
            </p>

            <p className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
              Source Code Studio
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />

            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#65f2b5] md:text-xs lg:text-sm">
              EDITOR READY
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <label
          htmlFor="code-file-upload"
          className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#849495]/40 bg-[#070d1f] px-5 py-7 text-center transition hover:border-[#00dbe9]/60 hover:bg-[#00dbe9]/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#00dbe9]/20 bg-[#00dbe9]/5 text-[#00dbe9]">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </div>

          <p className="mt-3 font-['Geist'] text-base font-medium text-[#dce1fb] md:text-lg lg:text-xl">
            Drop source file here
          </p>

          <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
            JS · JSX · TS · TSX · PY · JAVA · C++ · C · GO · PHP · RB · RS ·
            HTML · CSS
          </p>

          <span className="mt-4 rounded-md border border-[#3b494b] bg-[#23293c] px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb] transition group-hover:border-[#00dbe9]/40 group-hover:text-[#00dbe9] md:text-xs lg:text-sm">
            Select File
          </span>

          <input
            id="code-file-upload"
            type="file"
            accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.go,.php,.rb,.rs,.html,.css"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label
              htmlFor="file-name"
              className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm"
            >
              FILE NAME
            </label>

            <input
              id="file-name"
              type="text"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              className="w-full rounded-md border border-[#3b494b] bg-[#070d1f] px-3 py-2.5 font-mono text-xs text-[#dce1fb] outline-none transition placeholder:text-[#849495] focus:border-[#00dbe9]/60 focus:ring-1 focus:ring-[#00dbe9]/20 md:text-sm lg:text-base"
            />
          </div>

          <div className="sm:min-w-40">
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
              LANGUAGE
            </label>

            <div className="flex h-[39px] items-center rounded-md border border-[#3b494b] bg-[#070d1f] px-3">
              <span className="font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
                {fileName.includes(".")
                  ? fileName.split(".").pop()?.toUpperCase()
                  : "TEXT"}
              </span>

              <span className="ml-2 text-[11px] text-[#849495] md:text-xs lg:text-sm">
                SOURCE
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-[#3b494b] bg-[#070d1f]">
          <div className="flex items-center justify-between border-b border-[#3b494b] bg-[#151b2d] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ffb4ab]" />
              <span className="h-2 w-2 rounded-full bg-[#d0bcff]" />
              <span className="h-2 w-2 rounded-full bg-[#65f2b5]" />
            </div>

            <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
              {lineCount} LINES
            </span>
          </div>

          <div className="flex min-h-[390px]">
            <div className="select-none border-r border-[#3b494b] bg-[#070d1f] px-3 py-3 text-right font-mono text-xs leading-6 text-[#849495] md:text-sm md:leading-7 lg:text-base lg:leading-8">
              {Array.from({ length: Math.max(lineCount, 1) }, (_, index) => (
                <div key={index}>{String(index + 1).padStart(2, "0")}</div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              className="min-h-[390px] w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-6 text-[#dce1fb] outline-none md:text-base md:leading-7 lg:text-lg lg:leading-8"
              placeholder="Paste your source code here..."
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-sm border border-[#3b494b] bg-[#23293c] px-2 py-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
              UTF-8
            </span>

            <span className="rounded-sm border border-[#3b494b] bg-[#23293c] px-2 py-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
              SOURCE ANALYSIS
            </span>

            <span className="rounded-sm border border-[#3b494b] bg-[#23293c] px-2 py-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
              AI ENABLED
            </span>
          </div>

          <button
            onClick={handleReview}
            disabled={loading}
            className="rounded-md bg-[#00f0ff] px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#00363a] shadow-[0_0_20px_rgba(0,240,255,0.15)] transition hover:bg-[#7df4ff] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm lg:text-base"
          >
            {loading ? (
              "ANALYZING SOURCE..."
            ) : (
              <>
                RUN MULTI-ENGINE REVIEW
                <ArrowRight
                  className="ml-1 inline h-4 w-4"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-[#93000a]/40 bg-[#93000a]/10 px-4 py-3">
            <p className="font-mono text-xs text-[#ffb4ab] md:text-sm lg:text-base">
              {error}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default CodeEditor;
