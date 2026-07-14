import { Calendar, Heart, MessageCircle, Plus } from "lucide-react";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

      <button className="rounded-2xl border p-5 text-center hover:bg-muted transition">
        <Plus className="mx-auto mb-2" />
        Log Today
      </button>

      <button className="rounded-2xl border p-5 text-center hover:bg-muted transition">
        <Heart className="mx-auto mb-2" />
        Symptoms
      </button>

      <button className="rounded-2xl border p-5 text-center hover:bg-muted transition">
        <Calendar className="mx-auto mb-2" />
        Calendar
      </button>

      <button className="rounded-2xl border p-5 text-center hover:bg-muted transition">
        <MessageCircle className="mx-auto mb-2" />
        AI Chat
      </button>

    </div>
  );
}