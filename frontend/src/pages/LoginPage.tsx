import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { loginUser } from "../services/api";

type User = {
  id: number;
  name: string;
  email: string;
};

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser({
        email: email.trim(),
        password,
      });

      onLogin(data.user);
      navigate("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-[#0c1324] px-4 py-12 text-[#dce1fb] sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,219,233,0.09),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(132,148,149,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(132,148,149,0.15)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden border border-[#3b494b] bg-[#101729] shadow-[0_24px_100px_rgba(0,0,0,0.3)] md:grid-cols-[1fr_0.9fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[#3b494b] bg-[#070d1f] p-10 md:flex lg:p-12">
          <div className="absolute -right-20 top-1/4 h-64 w-64 rounded-full border border-[#00dbe9]/10" />
          <div className="absolute -right-10 top-[30%] h-44 w-44 rounded-full border border-[#00dbe9]/15" />
          <div className="absolute right-10 top-[36%] h-24 w-24 rounded-full border border-[#00dbe9]/20" />

          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center border border-[#00dbe9]/50 bg-[#00dbe9]/5">
                <div className="h-3 w-3 rounded-full bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />
                <div className="absolute h-7 w-7 rounded-full border border-[#00dbe9]/40" />
              </div>
              <div>
                <p className="font-['Space_Grotesk'] text-sm font-semibold tracking-wide md:text-base lg:text-lg">
                  AI CODE REVIEWER
                </p>
                <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-[#849495] md:text-xs lg:text-[13px]">
                  INTELLIGENT ANALYSIS
                </p>
              </div>
            </div>

            <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-[#00dbe9] md:text-sm lg:text[14px]">
              // Developer Intelligence Platform
            </p>
            <h1 className="max-w-md font-['Space_Grotesk'] text-4xl font-bold leading-tight tracking-[-0.04em] lg:text-5xl">
              Code better.
              <br />
              <span className="text-[#00dbe9]">Ship smarter.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#849495] md:text-lg md:leading-8 lg:text-xl">
              Analyze code, detect security risks, identify bugs, and review
              GitHub pull requests from one intelligent workspace.
            </p>
          </div>

          <div className="relative mt-14 border border-[#3b494b] bg-[#0c1324] p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#b9cacb] md:text-sm lg:text-base">
                Analysis Pipeline
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] text-[#65f2b5] md:text-xs lg:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
                READY
              </span>
            </div>

            <div className="space-y-4">
              {[
                {
                  code: "01",
                  name: "AI CODE ANALYSIS",
                  detail: "Pattern detection",
                },
                { code: "02", name: "ESLINT ENGINE", detail: "Code quality" },
                {
                  code: "03",
                  name: "SEMGREP ENGINE",
                  detail: "Security scanning",
                },
              ].map((engine) => (
                <div key={engine.code} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#00dbe9] md:text-sm lg:text-base">
                    {engine.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold tracking-wide text-[#dce1fb] md:text-sm lg:text-base">
                      {engine.name}
                    </p>
                    <p className="mt-1 text-xs text-[#849495] md:text-sm lg:text-base">
                      {engine.detail}
                    </p>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
                </div>
              ))}
            </div>
          </div>

          <p className="relative mt-6 font-mono text-[11px] tracking-wider text-[#849495] md:text-xs lg:text-sm">
            SYSTEM VERSION 1.0 // SECURE DEVELOPER WORKSPACE
          </p>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 md:hidden">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#00dbe9]/50 bg-[#00dbe9]/5">
                  <span className="h-3 w-3 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff]" />
                </div>
                <div>
                  <p className="font-['Space_Grotesk'] text-base font-semibold md:text-lg lg:text-xl">
                    AI CODE REVIEWER
                  </p>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.15em] text-[#849495] md:text-xs lg:text-sm">
                    DEVELOPER WORKSPACE
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 border border-[#3b494b] bg-[#151b2d] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#b9cacb] md:text-[12px] lg:text-[13px]">
                  Authentication / 01
                </span>
              </div>

              <h2 className="font-['Space_Grotesk'] text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                Welcome back<span className="text-[#00dbe9]">.</span>
              </h2>
              <p className="mt-3 text-base leading-6 text-[#849495] md:text-lg md:leading-7 lg:text-xl">
                Sign in to access your code review workspace.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 flex gap-3 border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 p-4"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#ffb4ab]">
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#ffb4ab] md:text-sm lg:text-base">
                    Authentication Failed
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#ffb4ab]/90 md:text-base md:leading-6 lg:text-lg">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#b9cacb] md:text-sm lg:text-base"
                >
                  Email Address
                </label>
                <div className="group flex items-center border border-[#3b494b] bg-[#070d1f] transition focus-within:border-[#00dbe9] focus-within:shadow-[0_0_0_1px_rgba(0,219,233,0.15)]">
                  <span className="pl-4 text-[#849495]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-[#dce1fb] outline-none placeholder:text-[#53636a] disabled:opacity-60 md:text-[15px] lg:text-[18px]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#b9cacb] md:text-sm lg:text-base"
                  >
                    Password
                  </label>
                </div>
                <div className="flex items-center border border-[#3b494b] bg-[#070d1f] transition focus-within:border-[#00dbe9] focus-within:shadow-[0_0_0_1px_rgba(0,219,233,0.15)]">
                  <span className="pl-4 text-[#849495]">
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-base text-[#dce1fb] outline-none placeholder:text-[#53636a] disabled:opacity-60 md:text-[15px] lg:text-[18px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="px-4 py-3.5 text-[#849495] transition hover:text-[#00dbe9]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-between border border-[#00dbe9] bg-[#00dbe9] px-5 py-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#002022] transition hover:bg-[#00f0ff] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm lg:text-base"
              >
                <span>
                  {loading ? "Authenticating..." : "Initialize Session"}
                </span>
                <span className="transition-transform group-hover:translate-x-1">
                  {loading ? (
                    "..."
                  ) : (
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
              </button>

              <p className="text-center font-mono text-[11px] leading-5 text-[#849495] md:text-xs lg:text-sm">
                AUTHORIZED ACCESS ONLY // YOUR CREDENTIALS REMAIN PRIVATE
              </p>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#3b494b]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#53636a] md:text-xs lg:text-sm">
                New to the workspace?
              </span>
              <div className="h-px flex-1 bg-[#3b494b]" />
            </div>

            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 border border-[#3b494b] bg-[#151b2d] px-4 py-3.5 text-base font-medium text-[#dce1fb] transition hover:border-[#00dbe9]/60 hover:bg-[#191f31] md:text-lg lg:text-xl"
            >
              Create an account
              <ArrowUpRight
                className="h-4 w-4 text-[#00dbe9]"
                aria-hidden="true"
              />
            </Link>

            <div className="mt-8 flex items-center justify-between border-t border-[#3b494b] pt-5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#53636a] md:text-xs lg:text-sm">
                Powered by AI + ESLint + Semgrep
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] text-[#65f2b5] md:text-xs lg:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
