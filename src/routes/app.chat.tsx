import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;

      if (!uid) {
        setContext("No active session yet.");
        return;
      }

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
        p?.date_of_birth
          ? `Age: ${new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()}`
          : null,
        cycle
          ? `Cycle day ${cycle.cycleDay} / ${cycle.cycleLength}, phase: ${cycle.phaseLabel}. Next period in ${cycle.daysUntilNextPeriod} days.`
          : "No cycle data yet.",
        todayLogRes.data?.moods?.length
          ? `Today's mood: ${todayLogRes.data.moods.join(", ")}`
          : null,
        todayLogRes.data?.symptoms?.length
          ? `Today's symptoms: ${todayLogRes.data.symptoms.join(", ")}`
          : null,
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

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    if (!scrollViewportRef.current) return;
    scrollViewportRef.current.scrollTo({
      top: scrollViewportRef.current.scrollHeight,
      behavior,
    });
  }

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    shouldAutoScrollRef.current = true;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const session = sess.session;
      const uid = session?.user?.id;

      if (!session?.access_token || !uid) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const projectUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${projectUrl}/functions/v1/bestie-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
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
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-20 shrink-0 rounded-[28px] border border-border/70 bg-background/90 px-3 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="bb-gradient-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-semibold sm:text-xl">Aural Her</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">
              Warm, educational guidance — never a replacement for medical care.
            </p>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollViewportRef}
          onScroll={() => {
            const el = scrollViewportRef.current;
            if (!el) return;
            shouldAutoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 120;
          }}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-1 py-1"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.length === 0 && (
              <div className="bb-card p-4 sm:p-5">
                <p className="text-[15px] leading-6 text-foreground sm:text-sm">
                  Hi {nickname} 🌸 I'm Aural. Ask me anything about your cycle, mood, symptoms, or
                  wellness. I use your logged data to personalize what I share.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
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
                className={[
                  "max-w-[86%] whitespace-pre-wrap wrap-break-word rounded-[24px] px-3.5 py-3 text-[15px] leading-6 shadow-sm sm:max-w-[78%] md:max-w-[72%]",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                    : "mr-auto border border-border bg-card text-card-foreground rounded-bl-md",
                ].join(" ")}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[78%] rounded-[24px] rounded-bl-md border border-border bg-card px-3.5 py-3 text-sm shadow-sm sm:max-w-[68%]">
                <span className="inline-flex items-center gap-1">
                  <Dot /> <Dot delay={150} /> <Dot delay={300} />
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="shrink-0 border-t border-border/60 bg-background/90 px-1 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-3 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => {
                const t = e.currentTarget as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(168, t.scrollHeight)}px`;
              }}
              placeholder="Ask Aural Her…"
              rows={1}
              className="max-h-40 min-h-11 flex-1 resize-none rounded-[22px] border border-border bg-card px-4 py-3 text-[15px] leading-5 shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              disabled={loading}
            />
            <Button
              type="submit"
              className="h-11 w-11 shrink-0 rounded-full p-0 shadow-sm"
              aria-label="Send message"
              disabled={loading || input.trim().length === 0}
            >
              {loading ? <Send className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </main>
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
