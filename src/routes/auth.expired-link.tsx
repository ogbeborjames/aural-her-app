import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/expired-link")({
  component: ExpiredLink,
});

function ExpiredLink() {
  const router = useRouter();
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      toast.info("Please sign in again to resend your verification email.");
      router.navigate({ to: "/auth", replace: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not redirect",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bb-responsive flex min-h-screen flex-col justify-center py-10">
      <div className="bb-card mx-auto w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="h-10 w-10 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl font-semibold">
          Verification link expired
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This verification link has expired or has already been used.
          Please sign in again to receive a new verification email.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.navigate({ to: "/auth" })}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Sign in
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {resending ? "Redirecting…" : "Sign in to resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
