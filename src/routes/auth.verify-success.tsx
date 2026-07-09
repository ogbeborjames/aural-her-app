import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/verify-success")({
  component: VerifySuccess,
});

function VerifySuccess() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          (async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("onboarded")
                .eq("user_id", data.session.user.id)
                .maybeSingle();
              router.navigate({
                to: profile?.onboarded ? "/app" : "/onboarding",
                replace: true,
              });
            } else {
              router.navigate({ to: "/auth", replace: true });
            }
          })();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="bb-card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sage/30">
          <svg
            className="h-10 w-10 text-sage-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl font-semibold">
          Email verified successfully ✓
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Welcome to Aural Her 🌸
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Redirecting to your dashboard in {countdown}…
        </p>

        <div className="mx-auto mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
