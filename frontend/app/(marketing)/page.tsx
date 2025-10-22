"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [hasCreds, setHasCreds] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("apiCredentials");
      if (!stored) {
        setHasCreds(false);
        return;
      }
      const parsed = JSON.parse(stored);
      setHasCreds(Array.isArray(parsed) && parsed.length > 0);
    } catch (error) {
      console.error("Failed to read stored credentials", error);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 text-center">
      <div className="space-y-6">
        <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
          Trading Analytics Copilot
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Turn natural language into actionable market intelligence.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Pair a FastAPI tool registry with OpenAI’s function calling to deliver rich analytics for gamma exposure, implied vol,
          and more—all visualized in real time with ECharts.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/connect">Connect APIs</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!hasCreds}
        >
          <Link href="/dashboard">Open Dashboard</Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Save your API keys on the next page to unlock the interactive dashboard experience.
      </p>
    </main>
  );
}
