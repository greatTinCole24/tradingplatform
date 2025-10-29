"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LogOut, Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import ApiForm from "@/components/ApiForm";
import QueryBox from "@/components/QueryBox";
import SavedDashboards from "@/components/SavedDashboards";

interface DashboardClientProps {
  session: Session;
}

export default function DashboardClient({ session }: DashboardClientProps) {
  const [showApiForm, setShowApiForm] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiConnected = () => {
    setShowApiForm(false);
    fetchConnections();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">QuantHub</h1>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* API Connections Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Connections</CardTitle>
                <CardDescription>
                  Connect your quant APIs to start querying data
                </CardDescription>
              </div>
              <Button onClick={() => setShowApiForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect API
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading connections...</p>
            ) : connections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No API connections yet. Add your first one to get started!
                </p>
                <Button onClick={() => setShowApiForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First API
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {connections.map((conn) => (
                  <Card key={conn.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{conn.name}</CardTitle>
                      <CardDescription className="truncate">
                        {conn.baseUrl}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {conn.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Section */}
        {connections.length > 0 && (
          <QueryBox connections={connections} />
        )}

        {/* Saved Dashboards */}
        <SavedDashboards />
      </main>

      {/* API Form Modal */}
      {showApiForm && (
        <ApiForm
          onClose={() => setShowApiForm(false)}
          onSuccess={handleApiConnected}
        />
      )}
    </div>
  );
}

