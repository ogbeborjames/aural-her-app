import { Calendar, Heart, MessageCircle, Plus } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

      <button className="rounded-[28px] border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-muted">
        <Plus className="mb-3 h-6 w-6" />
        <p className="text-base font-semibold">Log Today</p>
      </button>

      <button className="rounded-[28px] border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-muted">
        <Heart className="mb-3 h-6 w-6" />
        <p className="text-base font-semibold">Symptoms</p>
      </button>

      <button className="rounded-[28px] border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-muted">
        <Calendar className="mb-3 h-6 w-6" />
        <p className="text-base font-semibold">Calendar</p>
      </button>

      <button className="rounded-[28px] border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-muted">
        <MessageCircle className="mb-3 h-6 w-6" />
        <p className="text-base font-semibold">AI Chat</p>
      </button>

    </div>
  );
}