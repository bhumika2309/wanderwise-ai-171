import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, MessageSquare, Pencil, Sparkles, MapPin, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import heroImg from "@/assets/hero-sunset.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planora AI — Plan trips with AI in seconds" },
      {
        name: "description",
        content:
          "Planora AI turns your travel ideas into a polished day-by-day itinerary. Edit, regenerate, and chat with an AI travel assistant.",
      },
      { property: "og:title", content: "Planora AI — Plan trips with AI in seconds" },
      {
        property: "og:description",
        content:
          "Planora AI turns your travel ideas into a polished day-by-day itinerary. Edit, regenerate, and chat with an AI travel assistant.",
      },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? "/plan" : "/signup";

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by AI
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Plan your next trip with{" "}
              <span className="text-gradient-sunset">a single sentence.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Tell Planora AI where you're headed and what you love. We'll craft a
              day-by-day itinerary you can edit, regenerate, and save — all in seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-sunset shadow-warm hover:opacity-95">
                <Link to={ctaTo}>
                  Start planning <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={user ? "/chat" : "/login"}>Try the AI assistant</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-5 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-primary" /> 100+ destinations
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Personalized
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookmarkCheck className="h-4 w-4 text-primary" /> Save & revisit
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-sunset opacity-20 blur-3xl" />
            <img
              src={heroImg}
              alt="Coastal Mediterranean village glowing at sunset"
              width={1600}
              height={1024}
              className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-warm"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to plan smarter
          </h2>
          <p className="mt-3 text-muted-foreground">
            From inspiration to a fully-edited day plan.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "AI itineraries",
              text: "Get a structured day-by-day plan tailored to your destination, days, budget, and interests.",
            },
            {
              icon: Pencil,
              title: "Edit anything",
              text: "Tweak titles, swap activities, or regenerate any single day with a custom prompt.",
            },
            {
              icon: MessageSquare,
              title: "Chat assistant",
              text: "Ask Planora AI anything — visa tips, hidden gems, packing lists, weather, and more.",
            },
            {
              icon: BookmarkCheck,
              title: "Save & organize",
              text: "All your trips live in one place. Open, edit, and revisit them anytime.",
            },
            {
              icon: MapPin,
              title: "Local picks",
              text: "Suggestions feature specific neighborhoods, dishes, and lesser-known spots.",
            },
            {
              icon: Compass,
              title: "Built for any trip",
              text: "Weekend getaways or two-week journeys — Planora AI scales to whatever you plan.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-warm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-sunset shadow-warm">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-sunset p-8 shadow-warm sm:p-14">
          <div className="mx-auto max-w-2xl text-center text-white">
            <h2 className="text-3xl font-bold sm:text-4xl">Where to next?</h2>
            <p className="mt-3 text-white/90">
              Sign up free and let AI craft your perfect itinerary.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to={ctaTo}>
                Start planning now <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Planora AI</span>
          <span>Built with AI ✨</span>
        </div>
      </footer>
    </div>
  );
}
