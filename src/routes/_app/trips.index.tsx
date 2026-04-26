import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

type TripRow = {
  id: string;
  title: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  created_at: string;
};

export const Route = createFileRoute("/_app/trips/")({
  component: TripsPage,
});

function TripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripRow[] | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id,title,destination,days,budget,interests,created_at")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setTrips(data ?? []);
    })();
  }, [user]);

  const remove = async (id: string) => {
    if (!confirm("Delete this trip?")) return;
    setDeleting(id);
    const { error } = await supabase.from("trips").delete().eq("id", id);
    setDeleting(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTrips((t) => (t ? t.filter((x) => x.id !== id) : t));
    toast.success("Trip deleted");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My trips</h1>
          <p className="mt-2 text-muted-foreground">All your saved adventures.</p>
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
      ) : trips.length === 0 ? (
        <Card className="border-dashed py-12 text-center shadow-card">
          <CardContent>
            <p className="text-muted-foreground">No trips yet. Plan your first one!</p>
            <Button asChild className="mt-4 bg-gradient-sunset shadow-warm hover:opacity-95">
              <Link to="/plan">Plan a trip</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((t) => (
            <Card key={t.id} className="group overflow-hidden shadow-card transition hover:shadow-warm">
              <Link to="/trips/$tripId" params={{ tripId: t.id }} className="block">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{t.title}</CardTitle>
                  <CardDescription className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {t.destination}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {t.days} days
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="capitalize">
                      {t.budget} budget
                    </Badge>
                    {t.interests.slice(0, 3).map((i) => (
                      <Badge key={i} variant="secondary">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Link>
              <div className="flex justify-end border-t border-border/60 px-4 py-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(t.id)}
                  disabled={deleting === t.id}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
