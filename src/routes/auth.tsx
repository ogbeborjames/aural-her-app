import { createFileRoute, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { ThemeToggle } from "@/components/theme-toggle";

const AUTH_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timeoutId));
}

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const location = useLocation();

  // If navigating to a child route (e.g. /auth/callback, /auth/verify-success),
  // render the child route via Outlet instead of the sign-in form.
  const isChildRoute = location.pathname !== "/auth";
  if (isChildRoute) {
    return <Outlet />;
  }

  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedEmail = email.trim();

      if (mode === "signup") {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: { name: name.trim() },
            },
          }),
          "Sign-up is taking too long. Please check your internet connection and try again.",
        );
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created. Please check your email to confirm it, then sign in.");
          return;
        }
        toast.success("Welcome to Aural Her!");
        router.navigate({ to: "/onboarding" });
      } else {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          }),
          "Sign-in is taking too long. Please check your internet connection and try again.",
        );
        if (error) throw error;
        if (!data.session) throw new Error("Sign-in did not return a session. Please try again.");

        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from("profiles")
            .select("onboarded")
            .eq("user_id", data.session.user.id)
            .maybeSingle(),
          "Signed in, but loading your profile took too long. Please try again.",
        );
        if (profileError) throw profileError;

        router.navigate({ to: profile?.onboarded ? "/app" : "/onboarding" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    try {
      const result = await withTimeout(
        lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        }),
        "Google sign-in is taking too long. Please check your internet connection and try again.",
      );
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Google sign-in did not return a session. Please try again.");

      const { data: profile, error: profileError } = await withTimeout(
        supabase
          .from("profiles")
          .select("onboarded")
          .eq("user_id", data.session.user.id)
          .maybeSingle(),
        "Signed in, but loading your profile took too long. Please try again.",
      );
      if (profileError) throw profileError;

      router.navigate({ to: profile?.onboarded ? "/app" : "/onboarding" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="fixed right-5 top-5">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <span className="bb-gradient-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl text-2xl">
          🌸
        </span>
        <h1 className="font-display text-3xl font-semibold">
          {mode === "signup" ? "Say hi to Aural Her" : "  Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup" ? "Create your account in seconds." : "Sign in to see your cycle."}
        </p>
      </div>

      <div className="bb-card mx-auto w-full max-w-md p-6 sm:p-7">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={google}
          disabled={loading}
        >
          Continue with Google
        </Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">First name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
           
        <div className="space-y-1.5">
   <Label htmlFor="password">Password</Label>

  <div className="relative">

    <Input
      id="password"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      minLength={6}
      className="pr-12"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary transition"
    >
      {showPassword ? (
        <EyeOff size={18} />
      ) : (
        <Eye size={18} />
      )}
    </button>

  </div>
</div>
      


{mode === "signin" && (
  <div className="mt-3 text-center">
    <button
      type="button"
      onClick={() => router.navigate({ to: "/auth/forgot-password" })}
      className="text-sm font-medium text-primary hover:underline"
      aria-label="Forgot Password"
    >
      Forgot Password?
    </button>
  </div>
)}

<Button
  type="submit"
  className="mt-4 w-full rounded-full"
  disabled={loading}
>
  {loading
    ? "Please wait..."
    : mode === "signup"
    ? "Create Account"
    : "Sign In"}
</Button>

</form>

<p className="mt-5 text-center text-sm text-muted-foreground">
  {mode === "signup"
    ? "Already have an account?"
    : "New here?"}{" "}
  <button
    type="button"
    className="font-semibold text-primary underline-offset-4 hover:underline"
    onClick={() =>
      setMode(mode === "signup" ? "signin" : "signup")
    }
  >
    {mode === "signup" ? "Sign in" : "Create one"}
  </button>
 </p>

      </div>
    </div>
  );
}

