import { useState } from "react";
import { MapPin, Pencil, RefreshCw, Sparkles, Sun, UtensilsCrossed, Sunset, Moon, Sunrise } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ItineraryDay, Activity } from "@/lib/trip-types";

function timeIcon(time: string) {
  const t = time.toLowerCase();
  if (t.includes("morning") || t.includes("breakfast")) return Sunrise;
  if (t.includes("lunch")) return UtensilsCrossed;
  if (t.includes("afternoon")) return Sun;
  if (t.includes("evening") || t.includes("dinner")) return Sunset;
  if (t.includes("night")) return Moon;
  return Sparkles;
}

interface Props {
  day: ItineraryDay;
  destination?: string;
  onUpdate: (day: ItineraryDay) => void;
  onRegenerate: (hint: string) => Promise<void>;
  regenerating: boolean;
}

export function DayCard({ day, destination, onUpdate, onRegenerate, regenerating }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenHint, setRegenHint] = useState("");
  const [draft, setDraft] = useState<ItineraryDay>(day);

  const openEdit = () => {
    setDraft(structuredClone(day));
    setEditOpen(true);
  };

  const saveEdit = () => {
    onUpdate(draft);
    setEditOpen(false);
  };

  const updateActivity = (i: number, patch: Partial<Activity>) => {
    setDraft((d) => ({
      ...d,
      activities: d.activities.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));
  };

  const addActivity = () => {
    setDraft((d) => ({
      ...d,
      activities: [
        ...d.activities,
        { time: "Afternoon", startTime: "14:00", title: "", description: "", costEstimate: 0 },
      ],
    }));
  };

  const removeActivity = (i: number) => {
    setDraft((d) => ({ ...d, activities: d.activities.filter((_, idx) => idx !== i) }));
  };

  const dayTotal = day.activities.reduce((sum, a) => sum + (a.costEstimate ?? 0), 0);
  const fmtMoney = (n: number) =>
    n >= 1 ? `$${Math.round(n).toLocaleString()}` : "Free";

  return (
    <>
      <Card className="overflow-hidden border-border/60 shadow-card transition hover:shadow-warm">
        <CardHeader className="bg-gradient-sunset text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-white/80">
                Day {day.day}
              </div>
              <h3 className="mt-1 text-xl font-bold">{day.title}</h3>
              <p className="mt-1 max-w-xl text-sm text-white/90">{day.summary}</p>
              <div className="mt-2 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur">
                Est. {fmtMoney(dayTotal)} / person
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={openEdit}
                className="bg-white/15 text-white backdrop-blur hover:bg-white/25"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRegenOpen(true)}
                disabled={regenerating}
                className="bg-white/15 text-white backdrop-blur hover:bg-white/25"
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`}
                />
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ol className="divide-y divide-border/60">
            {day.activities.map((act, i) => {
              const Icon = timeIcon(act.time);
              return (
                <li key={i} className="flex gap-4 p-4 sm:p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {act.startTime ? `${act.startTime} · ${act.time}` : act.time}
                        </span>
                        <span className="text-base font-semibold text-foreground">
                          {act.title}
                        </span>
                      </div>
                      {typeof act.costEstimate === "number" && (
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                          {fmtMoney(act.costEstimate)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{act.description}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${act.title}${destination ? `, ${destination}` : ""}`
                        )}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" /> View on Google Maps
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="flex items-center justify-between border-t border-border/60 bg-secondary/40 px-4 py-3 sm:px-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Day {day.day} total
            </span>
            <span className="text-sm font-bold text-foreground">
              {fmtMoney(dayTotal)} <span className="font-normal text-muted-foreground">/ person</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Day {day.day}</DialogTitle>
            <DialogDescription>Tweak the plan manually.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                rows={2}
                maxLength={400}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Activities</Label>
                <Button type="button" size="sm" variant="outline" onClick={addActivity}>
                  + Add
                </Button>
              </div>
              {draft.activities.map((act, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="time"
                      value={act.startTime ?? ""}
                      onChange={(e) => updateActivity(i, { startTime: e.target.value })}
                      className="w-28"
                    />
                    <Input
                      value={act.time}
                      onChange={(e) => updateActivity(i, { time: e.target.value })}
                      placeholder="Morning"
                      className="w-28"
                      maxLength={30}
                    />
                    <Input
                      value={act.title}
                      onChange={(e) => updateActivity(i, { title: e.target.value })}
                      placeholder="Title"
                      className="min-w-[140px] flex-1"
                      maxLength={120}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeActivity(i)}
                      className="text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Cost (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={act.costEstimate ?? 0}
                      onChange={(e) =>
                        updateActivity(i, { costEstimate: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-28"
                    />
                  </div>
                  <Textarea
                    value={act.description}
                    onChange={(e) => updateActivity(i, { description: e.target.value })}
                    rows={2}
                    maxLength={400}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} className="bg-gradient-sunset hover:opacity-95">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Day {day.day} with AI</DialogTitle>
            <DialogDescription>
              Optionally tell the AI what to change (e.g. "more food spots", "less walking").
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={regenHint}
            onChange={(e) => setRegenHint(e.target.value)}
            placeholder="Add anything you'd like different…"
            rows={3}
            maxLength={300}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setRegenOpen(false);
                await onRegenerate(regenHint);
                setRegenHint("");
              }}
              disabled={regenerating}
              className="bg-gradient-sunset hover:opacity-95"
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
