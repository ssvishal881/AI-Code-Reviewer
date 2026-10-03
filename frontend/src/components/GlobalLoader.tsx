import { LoaderCircle } from "lucide-react";

type GlobalLoaderProps = {
  isLoading: boolean;
  message?: string;
};

function GlobalLoader({
  isLoading,
  message = "Analyzing source code...",
}: GlobalLoaderProps) {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070d1f]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-loader-title"
      aria-describedby="global-loader-message"
    >
      <div className="w-full max-w-sm rounded-xl border border-[#3b494b] bg-[#151b2d] p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#00dbe9]/20 bg-[#00dbe9]/5">
          <LoaderCircle
            className="h-9 w-9 animate-spin text-[#00dbe9] motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>

        <h2
          id="global-loader-title"
          className="mt-5 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb]"
        >
          Processing Request
        </h2>

        <p
          id="global-loader-message"
          className="mt-2 text-sm leading-6 text-[#849495]"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00dbe9] motion-reduce:animate-none" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#00dbe9]">
            Please wait
          </span>
        </div>
      </div>
    </div>
  );
}

export default GlobalLoader;
