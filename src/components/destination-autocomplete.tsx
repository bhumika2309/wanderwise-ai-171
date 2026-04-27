import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
};

export function DestinationAutocomplete({ value, onChange, id, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        const items: Suggestion[] = (data.results ?? []).map((r: { id: number; name: string; country?: string; admin1?: string }) => ({
          id: r.id,
          name: r.name,
          country: r.country,
          admin1: r.admin1,
          label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
        }));
        setSuggestions(items);
        setOpen(true);
        setActiveIdx(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (s: Suggestion) => {
    skipNextFetch.current = true;
    onChange(s.label);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => (i + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === "Enter" && activeIdx >= 0) {
              e.preventDefault();
              select(suggestions[activeIdx]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          autoComplete="off"
          className="pl-9"
          maxLength={100}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          <ul className="max-h-64 overflow-y-auto py-1">
            {suggestions.map((s, i) => (
              <li
                key={s.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                  activeIdx === i ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
