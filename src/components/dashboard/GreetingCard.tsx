import ProfileAvatar from "./ProfileAvatar";

type GreetingCardProps = {
  greeting: string;
  name: string;
  avatarUrl?: string | null;
  avatarPath?: string | null;
};

export default function GreetingCard({ greeting, name, avatarUrl, avatarPath }: GreetingCardProps) {
  return (
    <div className="bb-card flex items-center justify-between gap-4 rounded-[28px] p-4 sm:p-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground sm:text-base">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        <h1 className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-snug sm:leading-tight wrap-break-word whitespace-normal">
          {greeting}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground max-w-full">
          Let's take care of your body 🌸
        </p>
      </div>

      <div className="shrink-0 ml-3">
        <ProfileAvatar size={56} name={name} currentUrl={avatarUrl ?? null} avatarPath={avatarPath ?? null} />
      </div>
    </div>
  );
}