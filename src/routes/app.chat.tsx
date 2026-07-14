import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Send } from "lucide-react";
import { computeCycle } from "@/lib/cycle";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
});

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Why am I bloated today?",
  "Explain my current cycle phase",
  "What foods should I eat this week?",
  "Why am I craving sugar?",
  "Best workout for today?",
];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>("");
  const [nickname, setNickname] = useState<string>("bestie");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session!.user.id;
      const [profileRes, todayLogRes, historyRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", uid).single(),
        supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", uid)
          .eq("log_date", format(new Date(), "yyyy-MM-dd"))
          .maybeSingle(),
        supabase
          .from("ai_messages")
          .select("role, content")
          .eq("user_id", uid)
          .order("created_at")
          .limit(50),
      ]);
      const p = profileRes.data;
      if (p?.nickname) setNickname(p.nickname);
      const cycle = computeCycle(
        p?.last_period_date ? new Date(p.last_period_date) : null,
        p?.avg_cycle_length ?? 28,
        p?.avg_period_length ?? 5,
      );
      const ctx = [
        p?.nickname ? `Nickname: ${p.nickname}` : null,
        p?.date_of_birth ? `Age: ${new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()}` : null,
        cycle
          ? `Cycle day ${cycle.cycleDay} / ${cycle.cycleLength}, phase: ${cycle.phaseLabel}. Next period in ${cycle.daysUntilNextPeriod} days.`
          : "No cycle data yet.",
        todayLogRes.data?.moods?.length ? `Today's mood: ${todayLogRes.data.moods.join(", ")}` : null,
        todayLogRes.data?.symptoms?.length ? `Today's symptoms: ${todayLogRes.data.symptoms.join(", ")}` : null,
        todayLogRes.data?.sleep_hours ? `Slept: ${todayLogRes.data.sleep_hours}h` : null,
        p?.goals?.length ? `Goals: ${p.goals.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      setContext(ctx);
      if (historyRes.data?.length) {
        setMessages(historyRes.data as Msg[]);
      }
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session!.user.id;
      const projectUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${projectUrl}/functions/v1/bestie-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session!.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({ messages: next, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI error");
      const reply: Msg = { role: "assistant", content: data.reply };
      setMessages([...next, reply]);
      await supabase.from("ai_messages").insert([
        { user_id: uid, role: "user", content },
        { user_id: uid, role: "assistant", content: reply.content },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bestie is quiet right now");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bb-responsive flex min-h-[calc(100vh-8rem)] flex-col pb-8 md:min-h-[calc(100vh-10rem)]">
      <div className="mb-3 flex items-center gap-3">
        <div className="bb-gradient-primary flex h-11 w-11 items-center justify-center rounded-2xl">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold">Aural Her</h1>
          <p className="text-xs text-muted-foreground">
            Warm, educational guidance — never a replacement for medical care.
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="bb-card p-5">
            <p className="text-sm">
              Hi {nickname} 🌸 I'm Aural. Ask me anything about your cycle, mood,
              symptoms, or wellness. I use your logged data to personalize what I share.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className="max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] md:max-w-[70%]"
            style={
              m.role === "user"
                ? {
                    marginLeft: "auto",
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                    borderBottomRightRadius: "0.5rem",
                  }
                : {
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                    border: "1px solid var(--border)",
                    borderBottomLeftRadius: "0.5rem",
                  }
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div
            className="max-w-[75%] rounded-2xl px-4 py-3 text-sm sm:max-w-[65%]"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <span className="inline-flex gap-1">
              <Dot /> <Dot delay={150} /> <Dot delay={300} />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="sticky bottom-24 mt-3 flex w-full flex-nowrap items-end gap-3 sm:bottom-20"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={(e) => {
            const t = e.currentTarget as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = `${Math.min(200, t.scrollHeight)}px`;
          }}
          placeholder="Ask Aura…"
          rows={1}
          className="min-w-0 flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-5 outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <Button
          type="submit"
          className="shrink-0 h-12 w-12 rounded-full p-0"
          aria-label="Send message"
          disabled={loading || input.trim().length === 0}
        >
          {loading ? <Send className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
