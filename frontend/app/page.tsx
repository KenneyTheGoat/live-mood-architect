"use client";

import { useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiOk = { affirmation: string };
type ApiErr = { detail?: string };

const PRESETS = [
  "anxious",
  "overwhelmed",
  "sad",
  "unmotivated",
  "stressed",
  "lonely",
  "frustrated",
  "tired",
];

function friendlyMessage(status?: number, detail?: string) {
  if (status === 400) return "Please enter your name and how you’re feeling.";
  if (status === 429) return "The AI service is busy right now. Please try again later.";
  if (status === 502 || status === 503 || status === 504)
    return "We couldn’t generate an affirmation right now. Please try again in a moment.";
  if (detail) return detail;
  return "Something went wrong. Please try again.";
}

export default function Home() {
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<string | null>(null);
  const [feeling, setFeeling] = useState("");
  const [details, setDetails] = useState("");
  const [slow, setSlow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const feelingFinal = useMemo(() => {
    const typed = feeling.trim();
    if (typed.length > 0) return typed;
    return preset ?? "";
  }, [feeling, preset]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && feelingFinal.trim().length > 0 && !loading;
  }, [name, feelingFinal, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAffirmation(null);

    if (!API_BASE) {
      setError("Missing API base URL. Set NEXT_PUBLIC_API_BASE_URL in your env vars.");
      return;
    }

    setLoading(true);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 6000);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s

        const res = await fetch(`${API_BASE}/api/affirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            feeling: feelingFinal.trim(),
            details: details.trim() || undefined,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);


      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ApiErr;
        setError(friendlyMessage(res.status, data.detail));
        return;
      }

      const data = (await res.json()) as ApiOk;
      setAffirmation(data.affirmation);
    } catch (err: any) {
        if (err?.name === "AbortError") {
          setError("This is taking longer than expected. Please try again.");
        } else {
          setError("Network error. Please check your connection and try again.");
        }
    } finally {
      setLoading(false);
      clearTimeout(slowTimer);

    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Live Mood Architect
          </h1>
          <p className="text-sm sm:text-base text-zinc-600">
            Share how you’re feeling — get a short, supportive affirmation tailored to you.
          </p>
        </header>

        <div className="mt-8 rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-zinc-100">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <input
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Kenneth"
                  maxLength={50}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Feeling (type or pick)</label>
                <input
                  disabled={loading}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-200"
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  placeholder="e.g., overwhelmed"
                  maxLength={280}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((m) => {
                const active = preset === m && feeling.trim().length === 0;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPreset(m)}
                    className={
                      "rounded-full px-3 py-1 text-sm border transition " +
                      (active
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50")
                    }
                    aria-pressed={active}
                  >
                    {m}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPreset(null)}
                className="rounded-full px-3 py-1 text-sm border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              >
                clear preset
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Details (optional)</label>
              <textarea
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-200"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What’s making you feel this way? (optional)"
                maxLength={600}
                rows={4}
              />
              <p className="text-xs text-zinc-500">
                Keep it short — the affirmation will be 2–4 sentences.
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (slow ? "Still working..." : "Generating...") : "Generate affirmation"}

            </button>
          </form>

          <section className="mt-6">
            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-100 min-h-[96px]">
              {error && (
                <div className="rounded-xl bg-white p-3 ring-1 ring-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {!error && !affirmation && (
                <p className="text-sm text-zinc-600">
                  Your affirmation will appear here.
                </p>
              )}

              {affirmation && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Your affirmation
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">{affirmation}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-8 text-xs text-zinc-500">
          This tool provides supportive affirmations and does not provide medical advice.
        </footer>
      </div>
    </main>
  );
}
