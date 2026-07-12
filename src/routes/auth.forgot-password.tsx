 import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        throw error;
      }

      // Save email so the next page can display it
      sessionStorage.setItem("reset-email", email.trim());

      // Navigate to the professional confirmation page
      router.navigate({
        to: "/auth/check-email",
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to send reset email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">

      <div className="bb-card w-full max-w-md rounded-3xl p-8">

        <div className="mb-6 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            🌸
          </div>

          <h1 className="font-display text-3xl font-semibold">
            Forgot your password?
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            Enter the email address associated with your Body Bestie account.
            We'll send you a secure link to reset your password.
          </p>

        </div>

        <form onSubmit={resetPassword} className="space-y-5">

          <div className="space-y-2">

            <Label htmlFor="email">
              Email Address
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

          </div>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={loading}
          >
            {loading
              ? "Sending reset link..."
              : "Send Reset Link"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-full"
            onClick={() =>
              router.navigate({
                to: "/auth",
              })
            }
          >
            Back to Sign In
          </Button>

        </form>

      </div>

    </div>
  );
}