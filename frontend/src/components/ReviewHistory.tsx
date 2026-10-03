import { AlertCircle, ArrowRight, FileSearch, SearchX } from "lucide-react";
import { useGlobalLoader } from "../context/LoaderContext";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getReviews } from "../services/api";
import type { ReviewHistoryItem } from "../types/review";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function HistoryPage() {
  const [reviews, setReviews] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showLoader, hideLoader } = useGlobalLoader();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  useEffect(() => {
    const loadReviews = async () => {
      showLoader("Loading review history...");

      try {
        const data = await getReviews();
        setReviews([...data].reverse());
      } catch {
        setError("Failed to load review history.");
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    loadReviews();
  }, [showLoader, hideLoader]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        review.summary.toLowerCase().includes(searchText) ||
        review.repo_name?.toLowerCase().includes(searchText) ||
        review.repo_owner?.toLowerCase().includes(searchText) ||
        review.pull_number?.toString().includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        review.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "90+" && review.score >= 90) ||
        (scoreFilter === "70-89" && review.score >= 70 && review.score <= 89) ||
        (scoreFilter === "50-69" && review.score >= 50 && review.score <= 69) ||
        (scoreFilter === "below-50" && review.score < 50);

      return matchesSearch && matchesStatus && matchesScore;
    });
  }, [reviews, search, statusFilter, scoreFilter]);

  const statistics = useMemo(() => {
    const totalReviews = reviews.length;

    const completedReviews = reviews.filter(
      (review) => review.status.toLowerCase() === "completed",
    ).length;

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

    return {
      totalReviews,
      completedReviews,
      totalIssues,
      averageScore,
    };
  }, [reviews]);

  const trendData = useMemo(() => {
    return [...reviews].reverse().map((review, index) => ({
      name: review.pull_number
        ? `PR #${review.pull_number}`
        : `Review ${index + 1}`,
      score: review.score,
      issues: review.issues?.length ?? 0,
    }));
  }, [reviews]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setScoreFilter("all");
  };

  const getScoreStyle = (score: number) => {
    if (score >= 90) {
      return {
        text: "text-[#65f2b5]",
        border: "border-[#65f2b5]/30",
        bg: "bg-[#65f2b5]/10",
      };
    }

    if (score >= 70) {
      return {
        text: "text-[#00dbe9]",
        border: "border-[#00dbe9]/30",
        bg: "bg-[#00dbe9]/10",
      };
    }

    if (score >= 50) {
      return {
        text: "text-[#d0bcff]",
        border: "border-[#d0bcff]/30",
        bg: "bg-[#d0bcff]/10",
      };
    }

    return {
      text: "text-[#ffb4ab]",
      border: "border-[#ffb4ab]/30",
      bg: "bg-[#ffb4ab]/10",
    };
  };

  const getStatusStyle = (status: string) => {
    const value = status.toLowerCase();

    if (value === "completed") {
      return "border-[#65f2b5]/30 bg-[#65f2b5]/10 text-[#65f2b5]";
    }

    if (value === "failed") {
      return "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]";
    }

    return "border-[#d0bcff]/30 bg-[#d0bcff]/10 text-[#d0bcff]";
  };

  return (
    <div className="min-h-screen bg-[#0c1324] text-[#dce1fb]">
      {/* <div className="border-b border-[#3b494b] bg-[#0c1324]">
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

              <p className="mt-1 font-['Geist'] text-sm text-[#b9cacb]">
                Previous code analysis, review statistics and quality trends.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-[#65f2b5]/20 bg-[#65f2b5]/5 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5] shadow-[0_0_8px_#65f2b5]" />

              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.04em] text-[#65f2b5]">
                ARCHIVE ONLINE
              </span>
            </div>
          </div>
        </div>
      </div> */}

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
        {loading && (
          <div className="rounded-lg border border-[#3b494b] bg-[#191f31] p-10 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#3b494b] border-t-[#00dbe9]" />

            <p className="mt-4 font-mono text-xs uppercase tracking-[0.04em] text-[#849495] md:text-sm lg:text-base">
              Loading review archive...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-[#ffb4ab]/30 bg-[#ffb4ab]/5 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ffb4ab]/10 text-[#ffb4ab]">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>

              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.04em] text-[#ffb4ab] md:text-sm lg:text-base">
                  ARCHIVE ERROR
                </p>

                <p className="mt-1 font-['Geist'] text-sm text-[#b9cacb] md:text-base lg:text-lg">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[#3b494b] bg-[#191f31] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                    TOTAL REVIEWS
                  </p>

                  <span className="h-1.5 w-1.5 rounded-full bg-[#00dbe9]" />
                </div>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#dce1fb]">
                  {statistics.totalReviews}
                </p>

                <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                  ANALYSIS RUNS
                </p>
              </div>

              <div className="rounded-lg border border-[#3b494b] bg-[#191f31] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                    AVERAGE SCORE
                  </p>

                  <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
                </div>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#65f2b5]">
                  {statistics.averageScore}
                  <span className="ml-1 text-base text-[#849495] md:text-lg lg:text-xl">
                    /100
                  </span>
                </p>

                <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                  QUALITY INDEX
                </p>
              </div>

              <div className="rounded-lg border border-[#3b494b] bg-[#191f31] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                    ISSUES DETECTED
                  </p>

                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffb4ab]" />
                </div>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#ffb4ab]">
                  {statistics.totalIssues}
                </p>

                <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                  ACROSS ALL REVIEWS
                </p>
              </div>

              <div className="rounded-lg border border-[#3b494b] bg-[#191f31] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm">
                    COMPLETED
                  </p>

                  <span className="h-1.5 w-1.5 rounded-full bg-[#65f2b5]" />
                </div>

                <p className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold text-[#dce1fb]">
                  {statistics.completedReviews}
                </p>

                <p className="mt-1 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                  SUCCESSFUL ANALYSIS
                </p>
              </div>
            </section>

            <section className="mt-5 rounded-lg border border-[#3b494b] bg-[#191f31]">
              <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                      ARCHIVE QUERY
                    </p>

                    <h2 className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                      Filter Reviews
                    </h2>
                  </div>

                  <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    {filteredReviews.length} / {reviews.length} RECORDS
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="review-search"
                      className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm"
                    >
                      SEARCH
                    </label>

                    <div className="relative">
                      <input
                        id="review-search"
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Repository, PR, summary..."
                        className="w-full rounded-md border border-[#3b494b] bg-[#070d1f] px-3 py-2.5 font-mono text-xs text-[#dce1fb] outline-none transition placeholder:text-[#849495] focus:border-[#00dbe9]/60 focus:ring-1 focus:ring-[#00dbe9]/20 md:text-sm lg:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="status-filter"
                      className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm"
                    >
                      STATUS
                    </label>

                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="w-full rounded-md border border-[#3b494b] bg-[#070d1f] px-3 py-2.5 font-mono text-xs text-[#dce1fb] outline-none focus:border-[#00dbe9]/60 md:text-sm lg:text-base"
                    >
                      <option value="all">ALL STATUSES</option>
                      <option value="completed">COMPLETED</option>
                      <option value="failed">FAILED</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="score-filter"
                      className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#849495] md:text-xs lg:text-sm"
                    >
                      SCORE RANGE
                    </label>

                    <select
                      id="score-filter"
                      value={scoreFilter}
                      onChange={(event) => setScoreFilter(event.target.value)}
                      className="w-full rounded-md border border-[#3b494b] bg-[#070d1f] px-3 py-2.5 font-mono text-xs text-[#dce1fb] outline-none focus:border-[#00dbe9]/60 md:text-sm lg:text-base"
                    >
                      <option value="all">ALL SCORES</option>
                      <option value="90+">90 AND ABOVE</option>
                      <option value="70-89">70 - 89</option>
                      <option value="50-69">50 - 69</option>
                      <option value="below-50">BELOW 50</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-[#3b494b] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    SHOWING{" "}
                    <span className="text-[#dce1fb]">
                      {filteredReviews.length}
                    </span>{" "}
                    OF <span className="text-[#dce1fb]">{reviews.length}</span>{" "}
                    REVIEWS
                  </p>

                  {(search ||
                    statusFilter !== "all" ||
                    scoreFilter !== "all") && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-fit rounded-md border border-[#3b494b] bg-[#23293c] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#b9cacb] transition hover:border-[#00dbe9]/50 hover:text-[#00dbe9] md:text-xs lg:text-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </section>

            {reviews.length > 0 && (
              <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-lg border border-[#3b494b] bg-[#191f31]">
                  <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                      TREND ANALYSIS
                    </p>

                    <h2 className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                      Score Trend
                    </h2>

                    <p className="mt-1 font-['Geist'] text-sm text-[#849495] md:text-base lg:text-lg">
                      Review score across previous analysis runs.
                    </p>
                  </div>

                  <div className="h-72 w-full p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid stroke="#3b494b" strokeDasharray="3 3" />

                        <XAxis
                          dataKey="name"
                          stroke="#849495"
                          tick={{
                            fill: "#849495",
                            fontSize: 9,
                          }}
                          axisLine={{
                            stroke: "#3b494b",
                          }}
                          tickLine={false}
                        />

                        <YAxis
                          domain={[0, 100]}
                          allowDecimals={false}
                          stroke="#849495"
                          tick={{
                            fill: "#849495",
                            fontSize: 9,
                          }}
                          axisLine={{
                            stroke: "#3b494b",
                          }}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#070d1f",
                            border: "1px solid #3b494b",
                            borderRadius: "6px",
                            color: "#dce1fb",
                            fontSize: "10px",
                          }}
                          labelStyle={{
                            color: "#00dbe9",
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#00dbe9"
                          strokeWidth={2}
                          dot={{
                            r: 3,
                            fill: "#00dbe9",
                            stroke: "#00dbe9",
                          }}
                          activeDot={{
                            r: 5,
                            fill: "#7df4ff",
                            stroke: "#7df4ff",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-[#3b494b] bg-[#191f31]">
                  <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                      ISSUE ANALYSIS
                    </p>

                    <h2 className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                      Issues Trend
                    </h2>

                    <p className="mt-1 font-['Geist'] text-sm text-[#849495] md:text-base lg:text-lg">
                      Issues detected during each review.
                    </p>
                  </div>

                  <div className="h-72 w-full p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid stroke="#3b494b" strokeDasharray="3 3" />

                        <XAxis
                          dataKey="name"
                          stroke="#849495"
                          tick={{
                            fill: "#849495",
                            fontSize: 9,
                          }}
                          axisLine={{
                            stroke: "#3b494b",
                          }}
                          tickLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          stroke="#849495"
                          tick={{
                            fill: "#849495",
                            fontSize: 9,
                          }}
                          axisLine={{
                            stroke: "#3b494b",
                          }}
                          tickLine={false}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#070d1f",
                            border: "1px solid #3b494b",
                            borderRadius: "6px",
                            color: "#dce1fb",
                            fontSize: "10px",
                          }}
                          labelStyle={{
                            color: "#ffb4ab",
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="issues"
                          stroke="#ffb4ab"
                          strokeWidth={2}
                          dot={{
                            r: 3,
                            fill: "#ffb4ab",
                            stroke: "#ffb4ab",
                          }}
                          activeDot={{
                            r: 5,
                            fill: "#ffdad6",
                            stroke: "#ffdad6",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            <section className="mt-5 overflow-hidden rounded-lg border border-[#3b494b] bg-[#191f31]">
              <div className="border-b border-[#3b494b] bg-[#151b2d] px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                      REVIEW RECORDS
                    </p>

                    <h2 className="mt-1 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                      Analysis Archive
                    </h2>
                  </div>

                  <span className="rounded-md border border-[#3b494b] bg-[#070d1f] px-2.5 py-1.5 font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                    {filteredReviews.length} RECORDS
                  </span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="px-4 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[#3b494b] bg-[#070d1f] text-[#849495]">
                    <FileSearch className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <p className="mt-4 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                    No Reviews Found
                  </p>

                  <p className="mt-1 font-['Geist'] text-sm text-[#849495] md:text-base lg:text-lg">
                    Run a code review to create your first archive record.
                  </p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="px-4 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-[#3b494b] bg-[#070d1f] text-[#849495]">
                    <SearchX className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <p className="mt-4 font-['Space_Grotesk'] text-lg font-semibold text-[#dce1fb] md:text-xl lg:text-2xl">
                    No Matching Reviews
                  </p>

                  <p className="mt-1 font-['Geist'] text-sm text-[#849495] md:text-base lg:text-lg">
                    No review records match the current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="border-b border-[#3b494b] bg-[#070d1f]">
                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          ID
                        </th>

                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          Repository
                        </th>

                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          PR
                        </th>

                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          Score
                        </th>

                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          Issues
                        </th>

                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          Status
                        </th>

                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          Date
                        </th>

                        <th className="px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#849495] md:text-xs lg:text-sm">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredReviews.map((review) => {
                        const scoreStyle = getScoreStyle(review.score);

                        return (
                          <tr
                            key={review.id}
                            className="border-b border-[#3b494b] transition last:border-b-0 hover:bg-[#23293c]/50"
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-semibold text-[#00dbe9] md:text-sm lg:text-base">
                                #{review.id}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              {review.repo_name ? (
                                <div>
                                  <p className="font-mono text-xs text-[#dce1fb] md:text-sm lg:text-base">
                                    {review.repo_owner
                                      ? `${review.repo_owner}/`
                                      : ""}
                                    {review.repo_name}
                                  </p>
                                </div>
                              ) : (
                                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-base">
                                  -
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {review.pull_number ? (
                                <span className="rounded-sm border border-[#3b494b] bg-[#070d1f] px-2 py-1 font-mono text-[11px] text-[#b9cacb] md:text-xs lg:text-sm">
                                  PR #{review.pull_number}
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-[#849495] md:text-sm lg:text-base">
                                  CODE
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`rounded-md border px-2 py-1 font-mono text-[11px] font-semibold ${scoreStyle.border} ${scoreStyle.bg} ${scoreStyle.text} md:text-xs lg:text-sm`}
                              >
                                {review.score}/100
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="font-mono text-xs text-[#dce1fb] md:text-sm lg:text-base">
                                {review.issues?.length ?? 0}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`rounded-md border px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.03em] ${getStatusStyle(
                                  review.status,
                                )} md:text-xs lg:text-sm`}
                              >
                                {review.status}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="font-mono text-[11px] text-[#849495] md:text-xs lg:text-sm">
                                {review.created_at
                                  ? new Date(
                                      review.created_at,
                                    ).toLocaleDateString()
                                  : "-"}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <Link
                                to={`/history/${review.id}`}
                                className="inline-flex rounded-md border border-[#00dbe9]/20 bg-[#00dbe9]/5 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-[#00dbe9] transition hover:border-[#00dbe9]/50 hover:bg-[#00dbe9]/10 md:text-xs lg:text-sm"
                              >
                                View Details
                                <ArrowRight
                                  className="ml-1 inline h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default HistoryPage;
