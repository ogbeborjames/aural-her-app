interface InsightCardProps {
  title: string;
  description: string;
}

export default function InsightCard({
  title,
  description,
}: InsightCardProps) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}