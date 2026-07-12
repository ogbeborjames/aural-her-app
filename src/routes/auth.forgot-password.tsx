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

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      "Password reset email sent. Please check your inbox."
    );

    router.navigate({
      to: "/auth",
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">

      <div className="bb-card w-full p-6">

        <h1 className="mb-2 text-2xl font-bold">
          Forgot Password
        </h1>

        <p className="mb-6 text-sm text-muted-foreground">
          Enter your email address and we'll send you a password reset link.
        </p>

        <form onSubmit={resetPassword} className="space-y-4">

          <div>

            <Label>Email</Label>

            <Input
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

          </div>

          <Button
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

        </form>

      </div>

    </div>
  );
}