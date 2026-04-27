import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { chatAssistant } from "@/lib/trip.functions";

type Msg = { id: string; role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/_app/chat")({
  component: ChatPage,
});

const SUGGESTIONS = [
  "Plan a 3-day Goa trip under $500",
  "Best time to visit Iceland?",
  "Hidden gems in Tokyo for foodies",
  "5-day family itinerary in Rome",
];

function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,role,content")
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    })();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text: string) => {
    if (!user) return;
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    // Persist user message
    void supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: trimmed,
    });

    try {
      const history = [...messages, userMsg].slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { reply } = await chatAssistant({ data: { messages: history } });
      const assistantMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content: reply };
      setMessages((m) => [...m, assistantMsg]);
      void supabase.from("chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: reply,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reach AI");
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    if (!user || messages.length === 0) return;
    if (!confirm("Clear conversation history?")) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    toast.success("Cleared");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI travel assistant</h1>
          <p className="text-sm text-muted-foreground">
            Ask anything — destinations, itineraries, tips.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-sunset shadow-warm">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-semibold">Hi, I'm Planora AI</p>
                <p className="text-sm text-muted-foreground">Try one of these to get started:</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-sunset text-white shadow-warm"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-headings:mt-2 prose-headings:mb-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-border/60 bg-background/60 p-3"
        >
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about a destination, itinerary, budget…"
              rows={1}
              maxLength={2000}
              className="max-h-32 min-h-[44px] resize-none"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-gradient-sunset shadow-warm hover:opacity-95"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
