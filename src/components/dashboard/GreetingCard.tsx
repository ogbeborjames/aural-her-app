interface GreetingCardProps {
  greeting: string;
  name: string;
}

export default function GreetingCard({
  greeting,
  name,
}: GreetingCardProps) {
  return (
    <div className="bb-card grid gap-5 rounded-[28px] p-5 sm:p-6 md:grid-cols-[1.3fr_0.7fr]">
      <div>
        <p className="text-sm text-muted-foreground sm:text-base">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
          {greeting}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Let's take care of your body today 🌸
        </p>
      </div>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-lg">
        {name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}