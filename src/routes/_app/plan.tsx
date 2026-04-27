import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles, Save, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { generateTrip, regenerateDay } from "@/lib/trip.functions";
import type { Budget, ItineraryDay } from "@/lib/trip-types";
import { DayCard } from "@/components/day-card";
import { DestinationAutocomplete } from "@/components/destination-autocomplete";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const INTEREST_OPTIONS = [
  "Adventure",
  "Food",
  "Nature",
  "History",
  "Beaches",
  "Nightlife",
  "Art & Museums",
  "Shopping",
  "Wellness",
  "Family",
];

export const Route = createFileRoute("/_app/plan")({
  component: PlanPage,
});

function PlanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: addDays(today, 4),
  });
  const days =
    dateRange?.from && dateRange?.to
      ? Math.max(1, Math.min(14, differenceInCalendarDays(dateRange.to, dateRange.from) + 1))
      : 1;
  const [budget, setBudget] = useState<Budget>("medium");
  const [interests, setInterests] = useState<string[]>(["Food", "Nature"]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenIdx, setRegenIdx] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleGenerate = async () => {
    if (!destination.trim()) {
      toast.error("Tell us where you're going!");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateTrip({
        data: { destination: destination.trim(), days, budget, interests },
      });
      setTitle(result.title);
      setItinerary(result.days);
      toast.success("Your itinerary is ready ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate trip");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateDay = async (idx: number, hint: string) => {
    setRegenIdx(idx);
    try {
      const newDay = await regenerateDay({
        data: {
          destination,
          budget,
          interests,
          dayNumber: itinerary[idx].day,
          totalDays: itinerary.length,
          hint: hint || undefined,
        },
      });
      setItinerary((prev) => prev.map((d, i) => (i === idx ? newDay : d)));
      toast.success(`Day ${newDay.day} updated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setRegenIdx(null);
    }
  };

  const handleSave = async () => {
    if (!user || itinerary.length === 0) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        title: title || `Trip to ${destination}`,
        destination,
        days,
        budget,
        interests,
        itinerary: itinerary as unknown as never,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Trip saved!");
    navigate({ to: "/trips/$tripId", params: { tripId: data.id } });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Plan a new trip</h1>
        <p className="mt-2 text-muted-foreground">
          Tell us a few details and we'll craft a day-by-day itinerary.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Trip details</CardTitle>
          <CardDescription>Where to, how long, and what do you love?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dest">Destination</Label>
              <DestinationAutocomplete
                id="dest"
                value={destination}
                onChange={setDestination}
                placeholder="Start typing a city…"
              />
            </div>
            <div className="space-y-2">
              <Label>Travel dates</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} —{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick your dates</span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {days} day{days > 1 ? "s" : ""}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(r) => {
                      if (r?.from && r?.to) {
                        const span = differenceInCalendarDays(r.to, r.from) + 1;
                        if (span > 14) {
                          toast.error("Trips are limited to 14 days");
                          setDateRange({ from: r.from, to: addDays(r.from, 13) });
                          return;
                        }
                      }
                      setDateRange(r);
                    }}
                    numberOfMonths={1}
                    disabled={(d) =>
                      d < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    defaultMonth={dateRange?.from ?? today}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget</Label>
              <Select value={budget} onValueChange={(v) => setBudget(v as Budget)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — backpacker</SelectItem>
                  <SelectItem value="medium">Medium — comfortable</SelectItem>
                  <SelectItem value="high">High — luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((opt) => {
                  const active = interests.includes(opt);
                  return (
                    <Badge
                      key={opt}
                      onClick={() => toggleInterest(opt)}
                      className={`cursor-pointer select-none border px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "border-transparent bg-gradient-sunset text-white shadow-warm"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {opt}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            size="lg"
            className="w-full bg-gradient-sunset shadow-warm hover:opacity-95 sm:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Crafting your trip…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Generate itinerary
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {itinerary.length > 0 && (
        <div className="mt-10 space-y-6">
          {(() => {
            const tripTotal = itinerary.reduce(
              (sum, d) => sum + d.activities.reduce((s, a) => s + (a.costEstimate ?? 0), 0),
              0
            );
            return (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {days}-day {budget} budget trip to {destination}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Estimated total:{" "}
                    <span className="text-primary">
                      ${Math.round(tripTotal).toLocaleString()}
                    </span>{" "}
                    <span className="font-normal text-muted-foreground">/ person</span>
                  </p>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-sunset shadow-warm hover:opacity-95"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save trip
                </Button>
              </div>
            );
          })()}
          <div className="space-y-5">
            {itinerary.map((day, idx) => (
              <DayCard
                key={idx}
                day={day}
                regenerating={regenIdx === idx}
                onUpdate={(d) =>
                  setItinerary((prev) => prev.map((x, i) => (i === idx ? d : x)))
                }
                onRegenerate={(hint) => handleRegenerateDay(idx, hint)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
