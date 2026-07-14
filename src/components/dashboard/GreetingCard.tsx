interface GreetingCardProps {
  greeting: string;
  name: string;
  avatarUrl?: string | null;
}

export default function GreetingCard({ greeting, name, avatarUrl }: GreetingCardProps) {
  const initials = name?.trim().split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="bb-card flex items-center justify-between gap-4 rounded-[28px] p-5 sm:p-6">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground sm:text-base">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl truncate">
          {greeting}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground truncate">
          Let's take care of your body today 🌸
        </p>
      </div>

      <div className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${name} avatar`}
            className="h-12 w-12 rounded-full object-cover shadow-sm sm:h-14 sm:w-14"
            style={{ boxShadow: "0 6px 18px rgba(16,24,40,0.08)" }}
          />
        ) : (
          <div
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-sm sm:h-14 sm:w-14"
            style={{ boxShadow: "0 6px 18px rgba(16,24,40,0.08)" }}
          >
            {initials || name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}