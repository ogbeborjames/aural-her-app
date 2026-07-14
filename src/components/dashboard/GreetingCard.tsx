interface GreetingCardProps {
  greeting: string;
  name: string;
}

export default function GreetingCard({
  greeting,
  name,
}: GreetingCardProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        <h1 className="mt-1 font-display text-3xl font-bold">
          {greeting}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Let's take care of your body today 🌸
        </p>
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-lg">
        {name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}