'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

type UiItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  publishedAt: string;
  engagementScore: number;
};

type UiTopic = {
  id: string;
  label: string;
  summary: string;
  score: number;
  keywords: string[];
  items: UiItem[];
};

type AggregationResponse = {
  topics: UiTopic[];
  stats: {
    totalSources: number;
    totalItems: number;
    filteredItems: number;
    generatedAt: string;
    runtimeMs: number;
  };
};

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(date: string): string {
  const now = Date.now();
  const value = new Date(date).getTime();
  const diff = value - now;
  const minutes = Math.round(diff / (1000 * 60));

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }

  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}

export default function Home() {
  const [data, setData] = useState<AggregationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryState, setDeliveryState] = useState<{
    telegram: boolean;
    email: boolean;
    sending: boolean;
    success: boolean | null;
  }>({
    telegram: true,
    email: false,
    sending: false,
    success: null,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/topics", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch topics");
      }
      const payload = (await response.json()) as AggregationResponse;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const deliver = useCallback(async () => {
    setDeliveryState((state) => ({ ...state, sending: true, success: null }));
    try {
      const response = await fetch("/api/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery: {
            telegram: { enabled: deliveryState.telegram },
            email: { enabled: deliveryState.email },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Delivery failed");
      }

      const payload = await response.json();
      const succeeded = payload.delivery.telegram || payload.delivery.email;
      setData(payload.aggregation);
      setDeliveryState((state) => ({ ...state, sending: false, success: succeeded }));
    } catch (err) {
      setDeliveryState((state) => ({ ...state, sending: false, success: false }));
      setError(err instanceof Error ? err.message : "Failed to deliver briefing");
    }
  }, [deliveryState.email, deliveryState.telegram]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const topKeywords = useMemo(() => {
    if (!data) {
      return [];
    }
    const frequency = new Map<string, number>();
    data.topics.forEach((topic) =>
      topic.keywords.forEach((keyword) => frequency.set(keyword, (frequency.get(keyword) ?? 0) + 1)),
    );
    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword, count]) => ({ keyword, count }));
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold sm:text-4xl">AI &amp; CS Intelligence Briefing</h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Aggregates fast-moving signals from Reddit, Hacker News, arXiv, and leading AI blogs. Highlights the most
            relevant discussions, filters out AI detection chatter, and prepares summaries for Telegram or email
            delivery.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg md:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={refresh}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800 disabled:text-slate-200"
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh topics"}
              </button>
              <button
                onClick={deliver}
                className="rounded-full border border-emerald-400/60 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-200 hover:text-emerald-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                disabled={deliveryState.sending}
              >
                {deliveryState.sending ? "Sending…" : "Send briefing"}
              </button>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                  checked={deliveryState.telegram}
                  onChange={(event) =>
                    setDeliveryState((state) => ({ ...state, telegram: event.target.checked }))
                  }
                />
                Telegram
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                  checked={deliveryState.email}
                  onChange={(event) => setDeliveryState((state) => ({ ...state, email: event.target.checked }))}
                />
                Email
              </label>

              {deliveryState.success !== null && (
                <span
                  className={
                    deliveryState.success
                      ? "text-xs font-medium text-emerald-300"
                      : "text-xs font-medium text-rose-400"
                  }
                >
                  {deliveryState.success ? "Briefing dispatched" : "Delivery skipped"}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Items processed</span>
                <span className="text-2xl font-semibold text-emerald-300">
                  {data ? data.stats.totalItems : "—"}
                  <span className="ml-2 text-xs text-slate-500">
                    filtered {data ? data.stats.filteredItems : "—"}
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Last generated</span>
                <span className="text-2xl font-semibold text-emerald-300">
                  {data ? timeAgo(data.stats.generatedAt) : "—"}
                </span>
                <span className="text-xs text-slate-500">Runtime {data ? `${data.stats.runtimeMs}ms` : "—"}</span>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-100">Trending keywords</h2>
            <div className="flex flex-wrap gap-2">
              {topKeywords.length === 0 && <span className="text-sm text-slate-500">No data yet</span>}
              {topKeywords.map(({ keyword, count }) => (
                <span
                  key={keyword}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-200"
                >
                  {keyword} · {count}
                </span>
              ))}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
              <p className="font-semibold text-slate-300">Filters in place</p>
              <p>AI detection chatter is filtered out unless flagged as highly novel or impactful.</p>
              <p className="mt-2">
                Sources are labelled and summaries are generated via an extractive scoring engine. Manual review
                recommended for high-risk decisions.
              </p>
            </div>
          </aside>
        </section>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        )}

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold text-slate-100">Priority topics</h2>
          {loading && !data && <p className="text-sm text-slate-400">Collecting latest signals…</p>}
          {data &&
            data.topics.map((topic) => (
              <article
                key={topic.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg transition hover:border-emerald-500/40"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-50">{topic.label}</h3>
                    <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                      score {topic.score.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{topic.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.keywords.map((keyword) => (
                      <span key={keyword} className="rounded-full bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {topic.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{item.source}</span>
                        <span>{timeAgo(item.publishedAt)}</span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm font-semibold text-emerald-200 hover:text-emerald-100"
                      >
                        {item.title}
                      </a>
                      <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
                      <p className="mt-3 text-xs text-slate-500">Engagement score {(item.engagementScore ?? 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
        </section>
      </div>
    </div>
  );
}
