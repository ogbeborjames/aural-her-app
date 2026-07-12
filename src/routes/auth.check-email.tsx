import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/check-email")({
  component: CheckEmailPage,
});

function CheckEmailPage() {
  const email =
    sessionStorage.getItem("reset-email") ?? "your email";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="bb-card w-full max-w-md rounded-3xl p-8 text-center">

        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
          📧
        </div>

        <h1 className="font-display text-3xl font-semibold">
          Check your email
        </h1>

        <p className="mt-4 text-muted-foreground">
          We've sent a secure password reset link to
        </p>

        <p className="mt-2 break-all font-semibold text-primary">
          {email}
        </p>

        <p className="mt-6 text-sm text-muted-foreground">
          Click the link in the email to create a new password.
        </p>

        <div className="mt-8 rounded-2xl border bg-muted/40 p-4 text-left text-sm">
          <p className="font-medium">
            Didn't receive it?
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Check your Spam or Junk folder</li>
            <li>Wait a minute for delivery</li>
            <li>Request another reset email if needed</li>
          </ul>
        </div>

        <Button
          asChild
          className="mt-8 w-full rounded-full"
        >
          <Link to="/auth">
            Back to Sign In
          </Link>
        </Button>
      </div>
    </div>
  );
}