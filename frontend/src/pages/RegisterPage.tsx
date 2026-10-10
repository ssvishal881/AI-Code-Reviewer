import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const autofillFix =
  "[&:-webkit-autofill]:shadow-[0_0_0_1000px_#070d1f_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#dce1fb] [&:-webkit-autofill:hover]:shadow-[0_0_0_1000px_#070d1f_inset] [&:-webkit-autofill:focus]:shadow-[0_0_0_1000px_#070d1f_inset] [&:-webkit-autofill:active]:shadow-[0_0_0_1000px_#070d1f_inset]";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Registration failed. Please try again.",
        );
      }

      setSuccess("Account created successfully. Redirecting to login...");
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-[#0c1324] px-4 py-10 text-[#dce1fb] sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,219,233,0.09),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(132,148,149,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(132,148,149,0.15)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden border border-[#3b494b] bg-[#101729] shadow-[0_24px_100px_rgba(0,0,0,0.3)] md:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[#3b494b] bg-[#070d1f] p-10 md:flex lg:p-12">
          <div className="absolute -right-16 top-1/4 h-64 w-64 rounded-full border border-[#00dbe9]/10" />
          <div className="absolute -right-8 top-[30%] h-44 w-44 rounded-full border border-[#00dbe9]/15" />
          <div className="absolute right-12 top-[36%] h-24 w-24 rounded-full border border-[#00dbe9]/20" />

          <div className="relative">
            <div className="mb-12 flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center border border-[#00dbe9]/50 bg-[#00dbe9]/5">
                <div className="h-3 w-3 rounded-full bg-[#00f0ff] shadow-[0_0_15px_#00f0ff]" />
                <div className="absolute h-7 w-7 rounded-full border border-[#00dbe9]/40" />
              </div>
              <div>
                <p className="font-['Space_Grotesk'] text-base font-semibold tracking-wide md:text-lg">
                  AI CODE REVIEWER
                </p>
                <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-[#849495] md:text-xs">
                  INTELLIGENT ANALYSIS
                </p>
              </div>
            </div>

            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#00dbe9] md:text-sm">
              // Create Your Workspace
            </p>
            <h1 className="max-w-md font-['Space_Grotesk'] text-4xl font-bold leading-tight tracking-[-0.04em] lg:text-5xl">
              Your code.
              <br />
              Your workflow.
              <br />
              <span className="text-[#00dbe9]">One platform.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#849495] md:text-lg md:leading-8">
              Set up your developer workspace to review code, find potential
              issues, and analyze GitHub pull requests.
            </p>
          </div>

          <div className="relative mt-14 space-y-3">
            {[
              {
                code: "01",
                title: "AI-POWERED REVIEWS",
                detail: "Understand code issues",
              },
              {
                code: "02",
                title: "SECURITY ANALYSIS",
                detail: "Identify potential risks",
              },
              {
                code: "03",
                title: "GITHUB INTEGRATION",
                detail: "Review pull requests",
              },
            ].map((feature) => (
              <div
                key={feature.code}
                className="flex items-center gap-4 border border-[#3b494b] bg-[#0c1324]/80 p-4"
              >
                <span className="font-mono text-sm text-[#00dbe9] md:text-base">
                  {feature.code}
                </span>
                <div>
                  <p className="font-mono text-xs font-semibold tracking-wide text-[#dce1fb] md:text-sm">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-sm text-[#849495] md:text-base">
                    {feature.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="relative mt-8 font-mono text-[11px] tracking-wider text-[#849495] md:text-xs">
            DEVELOPER WORKSPACE // VERSION 1.0
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
                  <p className="font-['Space_Grotesk'] text-base font-semibold md:text-lg">
                    AI CODE REVIEWER
                  </p>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.15em] text-[#849495] md:text-xs">
                    DEVELOPER WORKSPACE
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-7">
              <div className="mb-4 inline-flex items-center gap-2 border border-[#3b494b] bg-[#151b2d] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#b9cacb] md:text-xs">
                  Account Setup / 01
                </span>
              </div>

              <h2 className="font-['Space_Grotesk'] text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                Create account<span className="text-[#00dbe9]">.</span>
              </h2>
              <p className="mt-3 text-base leading-6 text-[#849495] md:text-lg">
                Get started with your intelligent code review workspace.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 p-4"
              >
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#ffb4ab] md:text-sm">
                  Registration Failed
                </p>
                <p className="mt-1 text-sm leading-5 text-[#ffb4ab]/90 md:text-base md:leading-6">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 border border-[#65f2b5]/30 bg-[#65f2b5]/5 p-4"
              >
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#65f2b5] md:text-sm">
                  Registration Successful
                </p>
                <p className="mt-1 text-sm leading-5 text-[#65f2b5]/90 md:text-base md:leading-6">
                  {success}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#b9cacb] md:text-sm"
                >
                  Full Name
                </label>
                <div className="flex items-center border border-[#3b494b] bg-[#070d1f] transition focus-within:border-[#00dbe9] focus-within:shadow-[0_0_0_1px_rgba(0,219,233,0.15)]">
                  <span className="pl-4 text-[#849495]">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    disabled={loading}
                    className={`min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-[#dce1fb] outline-none placeholder:text-[#53636a] disabled:opacity-60 md:text-lg ${autofillFix}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#b9cacb] md:text-sm"
                >
                  Email Address
                </label>
                <div className="flex items-center border border-[#3b494b] bg-[#070d1f] transition focus-within:border-[#00dbe9] focus-within:shadow-[0_0_0_1px_rgba(0,219,233,0.15)]">
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
                    className={`min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-[#dce1fb] outline-none placeholder:text-[#53636a] disabled:opacity-60 md:text-lg ${autofillFix}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#b9cacb] md:text-sm"
                >
                  Password
                </label>
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
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={loading}
                    className={`min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-[#dce1fb] outline-none placeholder:text-[#53636a] disabled:opacity-60 md:text-lg ${autofillFix}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="px-3 py-3 text-[#849495] transition hover:text-[#00dbe9]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#b9cacb] md:text-sm"
                >
                  Confirm Password
                </label>
                <div className="flex items-center border border-[#3b494b] bg-[#070d1f] transition focus-within:border-[#00dbe9] focus-within:shadow-[0_0_0_1px_rgba(0,219,233,0.15)]">
                  <span className="pl-4 text-[#849495]">
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={loading}
                    className={`min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-[#dce1fb] outline-none placeholder:text-[#53636a] disabled:opacity-60 md:text-lg ${autofillFix}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    className="px-3 py-3 text-[#849495] transition hover:text-[#00dbe9]"
                  >
                    {showConfirmPassword ? (
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
                className="group mt-2 flex w-full items-center justify-between border border-[#00dbe9] bg-[#00dbe9] px-5 py-4 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#002022] transition hover:bg-[#00f0ff] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              >
                <span>
                  {loading ? "Creating Account..." : "Create Account"}
                </span>
                <span className="transition-transform group-hover:translate-x-1">
                  {loading ? (
                    "..."
                  ) : (
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
              </button>

              <p className="text-center font-mono text-[11px] leading-5 text-[#849495] md:text-xs">
                ACCOUNT DETAILS ARE USED TO CREATE YOUR WORKSPACE
              </p>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#3b494b]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#53636a] md:text-xs">
                Already registered?
              </span>
              <div className="h-px flex-1 bg-[#3b494b]" />
            </div>

            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 border border-[#3b494b] bg-[#151b2d] px-4 py-3.5 text-base font-medium text-[#dce1fb] transition hover:border-[#00dbe9]/60 hover:bg-[#191f31] md:text-lg"
            >
              Sign in to your account
              <ArrowUpRight
                className="h-4 w-4 text-[#00dbe9]"
                aria-hidden="true"
              />
            </Link>

            <div className="mt-8 flex items-center justify-between border-t border-[#3b494b] pt-5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#53636a] md:text-xs">
                AI + ESLint + Semgrep
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] text-[#65f2b5] md:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
                SYSTEM READY
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
