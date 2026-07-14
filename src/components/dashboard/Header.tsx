import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-3xl font-bold">
          🌸 Body Bestie
        </h1>

        <p className="text-muted-foreground">
          Welcome back! Let's check in today.
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="icon" variant="outline">
          <Bell className="h-5 w-5" />
        </Button>

        <Button size="icon" variant="outline">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}