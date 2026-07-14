 import { Outlet } from "@tanstack/react-router";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bb-responsive py-6">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}