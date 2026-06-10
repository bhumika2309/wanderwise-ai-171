import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { ItineraryDay } from "@/lib/trip-types";
import { downloadTripPdf } from "@/lib/trip-pdf";
import { useCurrency } from "@/lib/currency";

type SharedTrip = {
  title: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  itinerary: ItineraryDay[];
};

export const Route = createFileRoute("/shared/$shareToken")({
  component: SharedTripPage,
});

function SharedTripPage() {
  const { shareToken } = Route.useParams();
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const { format: fmtMoney, currency, toggle } = useCurrency();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("trips")
        .select("title,destination,days,budget,interests,itinerary,is_public,share_token")
        .eq("share_token", shareToken)
        .eq("is_public", true)
        .maybeSingle();
      if (data) {
        setTrip({
          title: data.title,
          destination: data.destination,
          days: data.days,
          budget: data.budget,
          interests: data.interests,
          itinerary: (data.itinerary as unknown as ItineraryDay[]) ?? [],
        });
      }
      setLoading(false);
    })();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Trip not available</h1>
        <p className="mt-2 text-muted-foreground">
          This shared link is invalid or the trip is no longer public.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const tripTotal = trip.itinerary.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + (a.costEstimate ?? 0), 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-sunset shadow-warm">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Planora AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggle} className="font-semibold">
              {currency === "USD" ? "$ USD" : "₹ INR"}
            </Button>
            <Button
              size="sm"
              onClick={() => downloadTripPdf(trip)}
              className="bg-gradient-sunset shadow-warm hover:opacity-95"
            >
              <Download className="mr-1.5 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <Badge variant="outline" className="mb-3">Shared itinerary</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{trip.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {trip.days}-day trip to {trip.destination}
          </p>
          {tripTotal > 0 && (
            <p className="mt-1 text-sm font-semibold">
              Estimated total:{" "}
              <span className="text-primary">{fmtMoney(tripTotal)}</span>{" "}
              <span className="font-normal text-muted-foreground">/ person</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="capitalize">{trip.budget} budget</Badge>
            {trip.interests.map((i) => (
              <Badge key={i} variant="secondary">{i}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {trip.itinerary.map((day, idx) => {
            const dayTotal = day.activities.reduce((s, a) => s + (a.costEstimate ?? 0), 0);
            return (
              <div key={idx} className="rounded-xl border bg-card p-5 shadow-card">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 className="text-xl font-bold">
                    Day {day.day} — {day.title}
                  </h2>
                  {dayTotal > 0 && (
                    <span className="text-sm font-semibold text-primary">
                      ${Math.round(dayTotal).toLocaleString()}
                    </span>
                  )}
                </div>
                {day.summary && (
                  <p className="mb-4 text-sm text-muted-foreground">{day.summary}</p>
                )}
                <ul className="space-y-3">
                  {day.activities.map((a, i) => (
                    <li key={i} className="border-l-2 border-primary/40 pl-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">
                          {a.startTime ? `${a.startTime} · ` : ""}
                          {a.time} — {a.title}
                        </p>
                        {a.costEstimate ? (
                          <span className="text-xs text-muted-foreground">
                            ~ ${Math.round(a.costEstimate).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      {a.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-xl border bg-secondary/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">Plan your own AI-powered trip</p>
          <Button asChild className="mt-3 bg-gradient-sunset shadow-warm hover:opacity-95">
            <Link to="/">Try Planora AI</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
