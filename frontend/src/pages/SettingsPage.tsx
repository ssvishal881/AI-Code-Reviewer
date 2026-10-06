import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGlobalLoader } from "../context/LoaderContext";
import { getUser } from "../services/api";

type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  github_login?: string | null;
};

type ReviewPreferences = {
  security: boolean;
  bugs: boolean;
  performance: boolean;
  quality: boolean;
  bestPractice: boolean;
};

type ReviewDisplay = {
  showSeverity: boolean;
  showSource: boolean;
  showDescription: boolean;
  showSuggestions: boolean;
};

const defaultPreferences: ReviewPreferences = {
  security: true,
  bugs: true,
  performance: true,
  quality: true,
  bestPractice: true,
};

const defaultDisplay: ReviewDisplay = {
  showSeverity: true,
  showSource: true,
  showDescription: true,
  showSuggestions: true,
};

function SettingsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] =
    useState<ReviewPreferences>(defaultPreferences);
  const [display, setDisplay] = useState<ReviewDisplay>(defaultDisplay);
  const { showLoader, hideLoader } = useGlobalLoader();

  useEffect(() => {
    async function loadSettings() {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        navigate("/login", { replace: true });
        return;
      }

      showLoader("Loading account settings...");

      try {
        const parsedUser = JSON.parse(storedUser) as User;
        const latestUser = await getUser(parsedUser.id);

        setUser(latestUser);
        localStorage.setItem("user", JSON.stringify(latestUser));

        const preferenceKey = `reviewPreferences_${latestUser.id}`;
        const storedPreferences = localStorage.getItem(preferenceKey);

        if (storedPreferences) {
          try {
            setPreferences({
              ...defaultPreferences,
              ...JSON.parse(storedPreferences),
            });
          } catch {
            localStorage.setItem(
              preferenceKey,
              JSON.stringify(defaultPreferences),
            );
          }
        }

        const displayKey = `reviewDisplay_${latestUser.id}`;
        const storedDisplay = localStorage.getItem(displayKey);

        if (storedDisplay) {
          try {
            setDisplay({
              ...defaultDisplay,
              ...JSON.parse(storedDisplay),
            });
          } catch {
            localStorage.setItem(displayKey, JSON.stringify(defaultDisplay));
          }
        }
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      } finally {
        hideLoader();
      }
    }

    loadSettings();
  }, [navigate, showLoader, hideLoader]);

  function updatePreference(key: keyof ReviewPreferences, value: boolean) {
    if (!user) {
      return;
    }

    const updatedPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(updatedPreferences);

    localStorage.setItem(
      `reviewPreferences_${user.id}`,
      JSON.stringify(updatedPreferences),
    );
  }

  function updateDisplay(key: keyof ReviewDisplay, value: boolean) {
    if (!user) {
      return;
    }

    const updatedDisplay = {
      ...display,
      [key]: value,
    };

    setDisplay(updatedDisplay);

    localStorage.setItem(
      `reviewDisplay_${user.id}`,
      JSON.stringify(updatedDisplay),
    );
  }

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
    window.location.reload();
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c1324]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#3b494b] border-t-[#00f0ff]" />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
            Loading system configuration
          </p>
        </div>
      </div>
    );
  }

  const preferenceItems = [
    {
      key: "security" as const,
      title: "Security",
      description: "Security vulnerabilities and unsafe code.",
      code: "SEC",
      color: "#ffb4ab",
      active: preferences.security,
    },
    {
      key: "bugs" as const,
      title: "Bugs",
      description: "Logic errors and runtime problems.",
      code: "BUG",
      color: "#d0bcff",
      active: preferences.bugs,
    },
    {
      key: "performance" as const,
      title: "Performance",
      description: "Potential performance problems.",
      code: "PERF",
      color: "#00dbe9",
      active: preferences.performance,
    },
    {
      key: "quality" as const,
      title: "Code Quality",
      description: "Maintainability and code quality issues.",
      code: "QUAL",
      color: "#65f2b5",
      active: preferences.quality,
    },
    {
      key: "bestPractice" as const,
      title: "Best Practices",
      description: "Common development best-practice recommendations.",
      code: "BEST",
      color: "#00dbe9",
      active: preferences.bestPractice,
    },
  ];

  const displayItems = [
    {
      key: "showSeverity" as const,
      title: "Show Severity",
      description: "Display the severity level of each issue.",
      code: "SEV",
      active: display.showSeverity,
    },
    {
      key: "showSource" as const,
      title: "Show Source",
      description:
        "Display whether the issue came from AI, ESLint, or Semgrep.",
      code: "SRC",
      active: display.showSource,
    },
    {
      key: "showDescription" as const,
      title: "Show Description",
      description: "Display the detailed explanation of each issue.",
      code: "DESC",
      active: display.showDescription,
    },
    {
      key: "showSuggestions" as const,
      title: "Show Suggestions",
      description: "Display the suggested fix for each issue.",
      code: "FIX",
      active: display.showSuggestions,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      <div className="border-b border-[#3b494b] bg-[#0c1324]">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />

                <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#00dbe9] md:text-sm lg:text-base">
                  AST NEURAL PIPELINE
                </span>

                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-base">
                  /
                </span>

                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-base">
                  SYSTEM CONFIGURATION
                </span>
              </div>

              <h1 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.02em] text-[#dce1fb] sm:text-3xl lg:text-4xl">
                Settings
              </h1>

              <p className="mt-1 max-w-2xl font-['Geist'] text-base text-[#b9cacb] md:text-lg lg:text-xl">
                Manage your account, review analysis preferences, display
                settings, and GitHub connection.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-2 lg:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />

              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#65f2b5] md:text-xs lg:text-sm">
                CONFIGURATION ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#3b494b]" />

          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
            SYSTEM SETTINGS
          </span>

          <div className="h-px flex-1 bg-[#3b494b]" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="h-fit border border-[#3b494b] bg-[#151b2d]">
            <div className="border-b border-[#3b494b] px-5 py-5">
              <div className="flex h-14 w-14 items-center justify-center border border-[#00dbe9]/30 bg-[#00dbe9]/5">
                <span className="font-['Space_Grotesk'] text-xl font-semibold text-[#00dbe9] md:text-2xl lg:text-3xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <h2 className="mt-4 break-words font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                {user.name}
              </h2>

              <p className="mt-1 break-all font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                {user.email}
              </p>
            </div>

            <div className="divide-y divide-[#3b494b]">
              <div className="px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
                  USER ID
                </p>

                <p className="mt-1 font-mono text-sm text-[#b9cacb] md:text-base lg:text-lg">
                  USR-{String(user.id).padStart(4, "0")}
                </p>
              </div>

              <div className="px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
                  GITHUB
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      user.github_login
                        ? "bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]"
                        : "bg-[#849495]"
                    }`}
                  />

                  <span
                    className={`font-mono text-[11px] md:text-xs lg:text-sm ${
                      user.github_login ? "text-[#65f2b5]" : "text-[#849495]"
                    }`}
                  >
                    {user.github_login ? "CONNECTED" : "NOT CONNECTED"}
                  </span>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
                  ACTIVE ENGINES
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="border border-[#00dbe9]/20 bg-[#00dbe9]/5 px-2 py-1 font-mono text-[10px] text-[#00dbe9] md:text-[11px] lg:text-xs">
                    AI
                  </span>
                  <span className="border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-2 py-1 font-mono text-[10px] text-[#65f2b5] md:text-[11px] lg:text-xs">
                    ESLINT
                  </span>
                  <span className="border border-[#d0bcff]/20 bg-[#d0bcff]/5 px-2 py-1 font-mono text-[10px] text-[#d0bcff] md:text-[11px] lg:text-xs">
                    SEMGREP
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <section className="border border-[#3b494b] bg-[#151b2d]">
              <div className="border-b border-[#3b494b] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                    NODE S-01
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#849495]" />

                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#849495] md:text-xs lg:text-sm">
                    PROFILE
                  </span>
                </div>

                <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                  Profile
                </h2>

                <p className="mt-1 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                  Your account information.
                </p>
              </div>

              <div className="grid gap-px bg-[#3b494b] sm:grid-cols-2">
                <div className="bg-[#191f31] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
                    DISPLAY NAME
                  </p>

                  <p className="mt-2 break-words font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                    {user.name}
                  </p>
                </div>

                <div className="bg-[#191f31] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#849495] md:text-xs lg:text-sm">
                    EMAIL ADDRESS
                  </p>

                  <p className="mt-2 break-all font-mono text-base text-[#b9cacb] md:text-lg lg:text-xl">
                    {user.email}
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-[#3b494b] bg-[#151b2d]">
              <div className="border-b border-[#3b494b] px-5 py-4 sm:px-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                        NODE S-02
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#849495]" />

                      <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                        ANALYSIS FILTERS
                      </span>
                    </div>

                    <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                      Review Preferences
                    </h2>

                    <p className="mt-1 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                      Choose the types of issues you want to focus on.
                    </p>
                  </div>

                  <div className="border border-[#00dbe9]/20 bg-[#00dbe9]/5 px-3 py-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                      {Object.values(preferences).filter(Boolean).length}/5
                      ENGINES ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#3b494b]">
                {preferenceItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center justify-between gap-4 bg-[#151b2d] px-5 py-4 transition hover:bg-[#191f31] sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center border"
                        style={{
                          borderColor: `${item.color}33`,
                          backgroundColor: `${item.color}0d`,
                        }}
                      >
                        <span
                          className="font-mono text-[10px] font-semibold md:text-[11px] lg:text-xs"
                          style={{ color: item.color }}
                        >
                          {item.code}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                          {item.title}
                        </p>

                        <p className="mt-1 font-['Geist'] text-sm leading-6 text-[#849495] md:text-base lg:text-lg">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(event) =>
                        updatePreference(item.key, event.target.checked)
                      }
                      className="peer sr-only"
                    />

                    <span
                      className={`relative h-6 w-11 shrink-0 border transition ${
                        item.active
                          ? "border-[#00dbe9] bg-[#00dbe9]/20"
                          : "border-[#3b494b] bg-[#070d1f]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-3.5 w-3.5 transition ${
                          item.active
                            ? "left-6 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"
                            : "left-1 bg-[#849495]"
                        }`}
                      />
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="border border-[#3b494b] bg-[#151b2d]">
              <div className="border-b border-[#3b494b] px-5 py-4 sm:px-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                        NODE S-03
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#849495]" />

                      <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                        OUTPUT CONFIGURATION
                      </span>
                    </div>

                    <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                      Review Display
                    </h2>

                    <p className="mt-1 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                      Choose what information is displayed in review results.
                    </p>
                  </div>

                  <div className="border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#65f2b5] md:text-xs lg:text-sm">
                      {Object.values(display).filter(Boolean).length}/4 DISPLAY
                      FLAGS
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#3b494b]">
                {displayItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center justify-between gap-4 bg-[#151b2d] px-5 py-4 transition hover:bg-[#191f31] sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#00dbe9]/20 bg-[#00dbe9]/5">
                        <span className="font-mono text-[10px] font-semibold text-[#00dbe9] md:text-[11px] lg:text-xs">
                          {item.code}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                          {item.title}
                        </p>

                        <p className="mt-1 font-['Geist'] text-sm leading-6 text-[#849495] md:text-base lg:text-lg">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(event) =>
                        updateDisplay(item.key, event.target.checked)
                      }
                      className="peer sr-only"
                    />

                    <span
                      className={`relative h-6 w-11 shrink-0 border transition ${
                        item.active
                          ? "border-[#00dbe9] bg-[#00dbe9]/20"
                          : "border-[#3b494b] bg-[#070d1f]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-3.5 w-3.5 transition ${
                          item.active
                            ? "left-6 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"
                            : "left-1 bg-[#849495]"
                        }`}
                      />
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="border border-[#3b494b] bg-[#151b2d]">
              <div className="border-b border-[#3b494b] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#00dbe9] md:text-xs lg:text-sm">
                    NODE S-04
                  </span>

                  <span className="h-1 w-1 rounded-full bg-[#849495]" />

                  <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    EXTERNAL INTEGRATION
                  </span>
                </div>

                <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                  GitHub
                </h2>

                <p className="mt-1 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                  GitHub account connection status.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-5 border border-[#3b494b] bg-[#070d1f] p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center border border-[#3b494b] bg-[#151b2d]">
                      <GitBranch
                        className="h-5 w-5 text-[#dce1fb]"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <p className="font-['Space_Grotesk'] text-base font-semibold text-[#dce1fb] md:text-lg lg:text-xl">
                        Connection Status
                      </p>

                      <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                        {user.github_login
                          ? `CONNECTED AS @${user.github_login}`
                          : "GITHUB ACCOUNT NOT CONNECTED"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {user.github_login ? (
                      <span className="flex items-center gap-2 border border-[#65f2b5]/30 bg-[#65f2b5]/10 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#65f2b5] md:text-xs lg:text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />
                        Connected
                      </span>
                    ) : (
                      <>
                        <span className="border border-[#3b494b] bg-[#151b2d] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          Not Connected
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = `https://ai-code-reviewer-api-wrn1.onrender.com/auth/github/login?user_id=${user.id}`;
                          }}
                          className="border border-[#00dbe9] bg-[#00dbe9] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#002022] transition hover:bg-[#00f0ff] md:text-xs lg:text-sm"
                        >
                          Connect GitHub
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="border border-[#ffb4ab]/30 bg-[#151b2d]">
              <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#ffb4ab] md:text-xs lg:text-sm">
                      ACCOUNT CONTROL
                    </span>

                    <span className="h-1 w-1 rounded-full bg-[#849495]" />
                  </div>

                  <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-semibold text-[#dce1fb] md:text-2xl lg:text-3xl">
                    Sign Out
                  </h2>

                  <p className="mt-1 font-['Geist'] text-base text-[#849495] md:text-lg lg:text-xl">
                    Sign out from your AI Code Reviewer account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#ffb4ab] transition hover:bg-[#ffb4ab]/20 md:text-xs lg:text-sm"
                >
                  Logout
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
