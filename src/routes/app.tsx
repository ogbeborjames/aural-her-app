import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("user_id", data.session.user.id)
      .maybeSingle();

    if (!profile?.onboarded) throw redirect({ to: "/onboarding" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
