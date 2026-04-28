import { Bed, ExternalLink, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  destination: string;
}

export function HotelsSection({ destination }: Props) {
  const q = encodeURIComponent(destination);

  const links = [
    {
      name: "Booking.com",
      desc: "Hotels, apartments & guesthouses",
      url: `https://www.booking.com/searchresults.html?ss=${q}`,
    },
    {
      name: "Airbnb",
      desc: "Stays from local hosts",
      url: `https://www.airbnb.com/s/${q}/homes`,
    },
    {
      name: "Google Hotels",
      desc: "Compare prices across sites",
      url: `https://www.google.com/travel/hotels/${q}`,
    },
    {
      name: "Hotels.com",
      desc: "Earn one free night per 10 booked",
      url: `https://www.hotels.com/Hotel-Search?destination=${q}`,
    },
  ];

  return (
    <Card className="overflow-hidden border-border/60 shadow-card">
      <CardHeader className="bg-secondary/40">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bed className="h-5 w-5 text-primary" />
          Where to stay in {destination}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {links.map((l) => (
          <a
            key={l.name}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-lg border border-border/60 p-3 transition hover:border-primary hover:bg-secondary/40"
          >
            <div className="min-w-0">
              <div className="font-semibold text-foreground">{l.name}</div>
              <div className="truncate text-xs text-muted-foreground">{l.desc}</div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
          </a>
        ))}
        <Button
          asChild
          variant="outline"
          className="sm:col-span-2"
        >
          <a
            href={`https://www.google.com/maps/search/hotels+in+${q}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Map className="mr-1.5 h-4 w-4" /> Browse hotels on Google Maps
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
