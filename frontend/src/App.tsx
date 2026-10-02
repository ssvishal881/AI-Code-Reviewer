import { useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import ReviewPage from "./pages/ReviewPage";
import HistoryPage from "./pages/HistoryPage";
import ReviewDetailsPage from "./pages/ReviewDetailsPage";
import GitHubReviewPage from "./pages/GitHubReviewPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";

type User = {
  id: number;
  name: string;
  email: string;
};

const getInitialUser = (): User | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

function AppNavigation({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    if (path === "/review") {
      return location.pathname === "/review";
    }

    if (path === "/history") {
      return (
        location.pathname === "/history" ||
        location.pathname.startsWith("/history/")
      );
    }

    return location.pathname === path;
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      code: "DB",
    },
    {
      path: "/review",
      label: "Review",
      code: "RV",
    },
    {
      path: "/history",
      label: "History",
      code: "HI",
    },
    {
      path: "/github-review",
      label: "GitHub PR",
      code: "GH",
    },
    {
      path: "/settings",
      label: "Settings",
      code: "ST",
    },
  ];

  const currentPage =
    navItems.find((item) => isActive(item.path))?.label ?? "SYSTEM";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#3b494b] bg-[#0c1324]/95 backdrop-blur">
      <div className="flex min-h-[64px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            to="/dashboard"
            className="group flex shrink-0 items-center gap-3"
          >
            <div className="relative flex h-9 w-9 items-center justify-center border border-[#00dbe9]/40 bg-[#00dbe9]/5">
              <span className="absolute h-2 w-2 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff]" />
              <span className="absolute h-5 w-5 rounded-full border border-[#00dbe9]/30" />
            </div>

            <div className="hidden sm:block">
              <div className="font-['Space_Grotesk'] text-sm md:text-md lg:text-lg font-semibold tracking-[-0.01em] text-[#dce1fb]">
                AI Code Reviewer
              </div>
            </div>
          </Link>

          {user && <div className="hidden h-7 w-px bg-[#3b494b] lg:block" />}

          {user && (
            <div className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center gap-2 px-3 py-2 transition ${
                      active
                        ? "text-[#00dbe9]"
                        : "text-[#849495] hover:text-[#dce1fb]"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] md:text-[11px] lg:text-[12px] font-semibold ${
                        active ? "text-[#00f0ff]" : "text-[#3b494b]"
                      }`}
                    >
                      {item.code}
                    </span>

                    <span className="font-mono text-[11px] md:text-[12px] lg:text-[13px] font-semibold uppercase tracking-[0.04em]">
                      {item.label}
                    </span>

                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-[#00f0ff] shadow-[0_0_7px_#00f0ff]" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2 border border-[#3b494b] bg-[#151b2d] px-3 py-2 md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />

                <span className="font-mono text-[11px] md:text-[12px] lg:text-[13px] uppercase tracking-[0.05em] text-[#65f2b5]">
                  SYSTEM ONLINE
                </span>
              </div>

              <div className="hidden border-l border-[#3b494b] pl-4 md:block">
                <p className="font-mono text-[10px] md:text-[11px] lg:text-[12px] uppercase tracking-[0.05em] text-[#849495]">
                  NODE
                </p>

                <p className="max-w-[140px] truncate font-mono text-[11px] md:text-[12px] lg:text-[13px] text-[#dce1fb]">
                  {user.name}
                </p>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 px-3 py-2 font-mono text-[10px] md:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.05em] text-[#ffb4ab] transition hover:bg-[#ffb4ab]/10"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <Link
                to="/login"
                className="border border-[#3b494b] bg-[#151b2d] px-3 py-2 font-mono text-[10px] md:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.05em] text-[#b9cacb] transition hover:border-[#00dbe9] hover:text-[#00dbe9]"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="border border-[#00dbe9] bg-[#00dbe9] px-3 py-2 font-mono text-[10px] md:text-[11px] lg:text-[12px] font-semibold uppercase tracking-[0.05em] text-[#002022] transition hover:bg-[#00f0ff]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="border-t border-[#3b494b] bg-[#070d1f] px-4 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`shrink-0 px-3 py-1.5 font-mono text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.04em] transition ${
                    active
                      ? "border border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#00dbe9]"
                      : "border border-transparent text-[#849495] hover:text-[#dce1fb]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {user && (
        <div className="hidden border-t border-[#3b494b] bg-[#070d1f] px-4 py-1.5 lg:block">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] md:text-[11px] lg:text-[12px] uppercase tracking-[0.08em] text-[#849495]">
                CURRENT NODE
              </span>

              <span className="font-mono text-[11px] md:text-[12px] lg:text-[13px] text-[#00dbe9]">
                {currentPage}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] md:text-[11px] lg:text-[12px] text-[#3b494b]">
                /
              </span>

              <span className="font-mono text-[10px] md:text-[11px] lg:text-[12px] uppercase tracking-[0.06em] text-[#849495]">
                AI + ESLINT + SEMGREP
              </span>

              <span className="h-1 w-1 rounded-full bg-[#65f2b5]" />

              <span className="font-mono text-[10px] md:text-[11px] lg:text-[12px] uppercase tracking-[0.06em] text-[#65f2b5]">
                READY
              </span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(getInitialUser);

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
        <AppNavigation user={user} onLogout={handleLogout} />

        <main className="w-full">
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={setUser} />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:id" element={<ReviewDetailsPage />} />
              <Route path="/github-review" element={<GitHubReviewPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
