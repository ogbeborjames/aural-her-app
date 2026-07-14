import ProfileAvatar from "./ProfileAvatar";

type GreetingCardProps = {
  greeting: string;
  name: string;
  avatarUrl?: string | null;
};

export default function GreetingCard({ greeting, name, avatarUrl }: GreetingCardProps) {
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
          Let's take care of your body 🌸
        </p>
      </div>

      <div className="shrink-0">
        <ProfileAvatar size={56} name={name} currentUrl={avatarUrl ?? null} />
      </div>
    </div>
  );
}