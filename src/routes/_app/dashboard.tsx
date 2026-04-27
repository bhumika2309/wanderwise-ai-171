import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Compass, MapPin, MessageCircle, Plus, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type TripRow = {
  id: string;
  title: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  created_at: string;
};

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Planora AI" },
      { name: "description", content: "Your travel dashboard with trip stats and quick actions." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripRow[] | null>(null);
  const [chatCount, setChatCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: tripData, error: tripErr }, { count, error: chatErr }] = await Promise.all([
        supabase
          .from("trips")
          .select("id,title,destination,days,budget,interests,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }),
      ]);
      if (tripErr) toast.error(tripErr.message);
      if (chatErr) toast.error(chatErr.message);
      setTrips(tripData ?? []);
      setChatCount(count ?? 0);
    })();
  }, [user]);

  const totalTrips = trips?.length ?? 0;
  const totalDays = trips?.reduce((sum, t) => sum + (t.days ?? 0), 0) ?? 0;
  const destinations = new Set(trips?.map((t) => t.destination.toLowerCase()) ?? []).size;
  const recent = trips?.slice(0, 3) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="mt-2 text-muted-foreground">Here's an overview of your travel planning.</p>
        </div>
        <Button asChild className="bg-gradient-sunset shadow-warm hover:opacity-95">
          <Link to="/plan">
            <Plus className="mr-2 h-4 w-4" /> New trip
          </Link>
        </Button>
      </div>

      {trips === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Compass className="h-5 w-5" />} label="Total trips" value={totalTrips} />
            <StatCard icon={<Calendar className="h-5 w-5" />} label="Days planned" value={totalDays} />
            <StatCard icon={<MapPin className="h-5 w-5" />} label="Destinations" value={destinations} />
            <StatCard
              icon={<MessageCircle className="h-5 w-5" />}
              label="Chat messages"
              value={chatCount ?? 0}
            />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Card className="shadow-card lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent trips</CardTitle>
                  <CardDescription>Your latest planned adventures.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/trips">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No trips yet. Start planning your first adventure!
                  </p>
                ) : (
                  recent.map((t) => (
                    <Link
                      key={t.id}
                      to="/trips/$tripId"
                      params={{ tripId: t.id }}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3 transition hover:border-primary/40 hover:bg-accent/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.title}</p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {t.destination} · {t.days} days
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {t.budget}
                      </Badge>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Jump back into planning.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/plan">
                    <Sparkles className="mr-2 h-4 w-4" /> Plan new trip
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/trips">
                    <Compass className="mr-2 h-4 w-4" /> Browse my trips
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/chat">
                    <MessageCircle className="mr-2 h-4 w-4" /> Ask AI assistant
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-sunset text-white shadow-warm">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
