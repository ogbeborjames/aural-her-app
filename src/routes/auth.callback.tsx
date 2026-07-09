import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (!code) {
          setStatus("error");
          setErrorMsg(
            "No verification code found. Please use the link from your email.",
          );
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[Auth Callback] Exchange failed:", error.message);

          if (
            error.message.includes("expired") ||
            error.message.includes("invalid") ||
            error.message.includes("already")
          ) {
            router.navigate({ to: "/auth/expired-link", replace: true });
            return;
          }

          setStatus("error");
          setErrorMsg(error.message);
          return;
        }

        // Success - session created, redirect to verification success page
        router.navigate({ to: "/auth/verify-success", replace: true });
      } catch (err) {
        console.error("[Auth Callback] Unexpected error:", err);
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    };

    handleAuth();
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying your email…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <span className="bb-gradient-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl text-2xl">
          🌸
        </span>
        <h1 className="font-display text-xl font-semibold">
          Verification failed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/auth"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
