import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, Download, Globe, Loader2, Lock, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { ItineraryDay } from "@/lib/trip-types";
import { DayCard } from "@/components/day-card";
import { regenerateDay } from "@/lib/trip.functions";
import { downloadTripPdf } from "@/lib/trip-pdf";

type TripRow = {
  id: string;
  title: string;
  destination: string;
  days: number;
  budget: "low" | "medium" | "high";
  interests: string[];
  itinerary: ItineraryDay[];
  share_token: string | null;
  is_public: boolean;
};

export const Route = createFileRoute("/_app/trips/$tripId")({
  component: TripDetailPage,
});

function TripDetailPage() {
  const { tripId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenIdx, setRegenIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id,title,destination,days,budget,interests,itinerary,share_token,is_public")
        .eq("id", tripId)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setTrip({
          ...data,
          budget: data.budget as TripRow["budget"],
          itinerary: (data.itinerary as unknown as ItineraryDay[]) ?? [],
          share_token: (data as { share_token: string | null }).share_token ?? null,
          is_public: (data as { is_public: boolean }).is_public ?? false,
        });
      }
      setLoading(false);
    })();
  }, [tripId, user]);

  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    trip?.share_token && typeof window !== "undefined"
      ? `${window.location.origin}/shared/${trip.share_token}`
      : "";

  const togglePublic = async (next: boolean) => {
    if (!trip) return;
    setShareLoading(true);
    const updates: { is_public: boolean; share_token?: string } = { is_public: next };
    if (next && !trip.share_token) {
      updates.share_token = crypto.randomUUID();
    }
    const { data, error } = await supabase
      .from("trips")
      .update(updates)
      .eq("id", trip.id)
      .select("share_token,is_public")
      .single();
    setShareLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTrip({
      ...trip,
      is_public: data.is_public ?? next,
      share_token: (data as { share_token: string | null }).share_token ?? trip.share_token,
    });
    toast.success(next ? "Trip is now shareable" : "Sharing disabled");
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const persist = async (next: ItineraryDay[]) => {
    if (!trip) return;
    setSaving(true);
    const { error } = await supabase
      .from("trips")
      .update({ itinerary: next as unknown as never })
      .eq("id", trip.id);
    setSaving(false);
    if (error) toast.error(error.message);
  };

  const updateDay = (idx: number, day: ItineraryDay) => {
    if (!trip) return;
    const next = trip.itinerary.map((d, i) => (i === idx ? day : d));
    setTrip({ ...trip, itinerary: next });
    persist(next);
  };

  const regen = async (idx: number, hint: string) => {
    if (!trip) return;
    setRegenIdx(idx);
    try {
      const newDay = await regenerateDay({
        data: {
          destination: trip.destination,
          budget: trip.budget,
          interests: trip.interests,
          dayNumber: trip.itinerary[idx].day,
          totalDays: trip.itinerary.length,
          hint: hint || undefined,
        },
      });
      const next = trip.itinerary.map((d, i) => (i === idx ? newDay : d));
      setTrip({ ...trip, itinerary: next });
      await persist(next);
      toast.success(`Day ${newDay.day} updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setRegenIdx(null);
    }
  };

  const remove = async () => {
    if (!trip || !confirm("Delete this trip?")) return;
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Trip deleted");
    navigate({ to: "/trips" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <Button asChild className="mt-4">
          <Link to="/trips">Back to trips</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/trips">
          <ArrowLeft className="mr-1 h-4 w-4" /> All trips
        </Link>
      </Button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{trip.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {trip.days}-day trip to {trip.destination}
          </p>
          {(() => {
            const tripTotal = trip.itinerary.reduce(
              (sum, d) => sum + d.activities.reduce((s, a) => s + (a.costEstimate ?? 0), 0),
              0
            );
            if (tripTotal <= 0) return null;
            return (
              <p className="mt-1 text-sm font-semibold text-foreground">
                Estimated total:{" "}
                <span className="text-primary">
                  ${Math.round(tripTotal).toLocaleString()}
                </span>{" "}
                <span className="font-normal text-muted-foreground">/ person</span>
              </p>
            );
          })()}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="capitalize">
              {trip.budget} budget
            </Badge>
            {trip.interests.map((i) => (
              <Badge key={i} variant="secondary">
                {i}
              </Badge>
            ))}
          </div>
        </div>
        <Button variant="outline" onClick={remove} className="text-destructive hover:text-destructive">
          <Trash2 className="mr-1.5 h-4 w-4" /> Delete trip
        </Button>
      </div>

      {saving && (
        <p className="mb-3 text-xs text-muted-foreground">Saving changes…</p>
      )}

      <div className="space-y-5">
        {trip.itinerary.map((day, idx) => (
          <DayCard
            key={idx}
            day={day}
            regenerating={regenIdx === idx}
            onUpdate={(d) => updateDay(idx, d)}
            onRegenerate={(hint) => regen(idx, hint)}
          />
        ))}
      </div>
    </div>
  );
}
