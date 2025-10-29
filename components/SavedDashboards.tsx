"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function SavedDashboards() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const res = await fetch("/api/dashboards");
      if (res.ok) {
        const data = await res.json();
        setDashboards(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboards/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Dashboard deleted",
          description: "Your dashboard has been removed",
        });
        fetchDashboards();
      } else {
        toast({
          title: "Failed to delete",
          description: "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return null;
  }

  if (dashboards.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Dashboards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{dashboard.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {dashboard.query}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created {formatDateTime(dashboard.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(dashboard.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

