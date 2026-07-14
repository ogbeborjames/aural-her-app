import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

function Profile() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);
  const [lastPeriod, setLastPeriod] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      setEmail(sess.session.user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sess.session.user.id)
        .single();
      if (data) {
        setNickname(data.nickname ?? "");
        setCycleLen(data.avg_cycle_length ?? 28);
        setPeriodLen(data.avg_period_length ?? 5);
        setLastPeriod(data.last_period_date ?? "");
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session!.user.id;
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname,
          avg_cycle_length: cycleLen,
          avg_period_length: periodLen,
          last_period_date: lastPeriod || null,
        })
        .eq("user_id", uid);
      if (error) throw error;
      toast.success("Saved 💛");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="bb-card p-6 sm:p-7">
        <h1 className="font-display text-2xl font-semibold">You</h1>
      </div>

      <section className="bb-card p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
        <p className="mt-2 text-sm">{email}</p>
      </section>

      <section className="bb-card space-y-4 p-6 sm:p-7">
        <div className="space-y-1.5">
          <Label>Nickname</Label>
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Last period start</Label>
          <Input type="date" value={lastPeriod} onChange={(e) => setLastPeriod(e.target.value)} />
        </div>
        <div>
          <Label>Cycle length: {cycleLen} days</Label>
          <input
            type="range" min={20} max={40} value={cycleLen}
            onChange={(e) => setCycleLen(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>
        <div>
          <Label>Period length: {periodLen} days</Label>
          <input
            type="range" min={2} max={10} value={periodLen}
            onChange={(e) => setPeriodLen(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>
        <Button onClick={save} disabled={saving} className="w-full rounded-full">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </section>

      <section className="bb-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Privacy</p>
        <p className="text-sm text-muted-foreground">
          Your data is yours. It's stored securely with row-level access — only you can read it.
          Aural Her is an educational wellness tool and not a substitute for medical care.
        </p>
      </section>

      <Button variant="outline" className="h-12 w-full rounded-full" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
