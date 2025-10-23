"use client";

import Link from "next/link";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-primary">API Connections</p>
        <h1 className="text-3xl font-semibold md:text-4xl">Securely store provider API keys in your browser.</h1>
        <p className="max-w-3xl text-muted-foreground">
          Credentials never leave your device—they are stored in `localStorage` and attached to backend requests when you run
          metrics directly or via the LLM orchestrator.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <ApiKeyManager className="lg:col-span-2" />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Need ideas?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Providers you might connect:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li><strong>polygon</strong> — for options chains, volume, and market data.</li>
              <li><strong>unusual_whales</strong> — for options flow and gamma analytics.</li>
              <li><strong>custom</strong> — bring your own analytics feed.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end gap-4">
        <Button asChild variant="ghost">
          <Link href="/">Back</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Continue to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
