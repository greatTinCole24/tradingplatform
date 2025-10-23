"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Credential {
  provider: string;
  apiKey: string;
}

const STORAGE_KEY = "apiCredentials";

export function ApiKeyManager({ className }: { className?: string }) {
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [creds, setCreds] = useState<Credential[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCreds(parsed);
        }
      } catch (error) {
        console.error("Failed to parse stored credentials", error);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
  }, [creds]);

  const hasCreds = creds.length > 0;

  const displayCreds = useMemo(
    () =>
      creds.map((credential) => ({
        provider: credential.provider,
        masked: credential.apiKey ? `${credential.apiKey.slice(0, 4)}••••` : "",
      })),
    [creds]
  );

  const addCredential = () => {
    if (!provider || !apiKey) return;
    setCreds((prev) => [...prev, { provider, apiKey }]);
    setProvider("");
    setApiKey("");
  };

  const removeCredential = (index: number) => {
    setCreds((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Connect a Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              placeholder="polygon, unusual_whales, ..."
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="••••••••"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>
          <Button className="w-full" onClick={addCredential} disabled={!provider || !apiKey}>
            Save Credential
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasCreds ? (
            <ul className="space-y-3">
              {displayCreds.map((cred, index) => (
                <li
                  key={`${cred.provider}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                      {cred.provider}
                    </p>
                    <p className="text-xs text-muted-foreground">{cred.masked}</p>
                  </div>
                  <Button variant="ghost" onClick={() => removeCredential(index)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No credentials saved yet. Add one above to enable authenticated metrics.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function getStoredCredentials(): Credential[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as Credential[];
  } catch (error) {
    console.error("Failed to parse credentials from storage", error);
    return [];
  }
}
