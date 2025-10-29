"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import ChartRenderer from "@/components/ChartRenderer";
import TablePreview from "@/components/TablePreview";

interface QueryBoxProps {
  connections: any[];
}

export default function QueryBox({ connections }: QueryBoxProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        toast({
          title: "Query executed!",
          description: "Your dashboard has been created",
        });
      } else {
        toast({
          title: "Query failed",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute query",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "Show me AAPL price vs SPY for the last 6 months",
    "Compare Bitcoin and Ethereum prices year-to-date",
    "What were the top gainers in tech sector this week?",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Ask a Question
        </CardTitle>
        <CardDescription>
          Query your connected APIs using natural language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="e.g., Show me AAPL stock price vs SPY for the last 6 months"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {examples.map((example, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => setQuery(example)}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={handleQuery} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Dashboard
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 pt-4">
            {result.rawData && <TablePreview data={result.rawData} />}
            {result.chartConfig && <ChartRenderer config={result.chartConfig} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

