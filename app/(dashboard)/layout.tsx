import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  CircleGauge,
  FilePenLine,
  LayoutDashboard,
  LogOut,
  Settings,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compose", label: "Compose", icon: FilePenLine },
  { href: "/scheduled", label: "Scheduled", icon: CalendarClock },
  { href: "/published", label: "Published", icon: CheckCircle2 },
  { href: "/failed", label: "Failed", icon: XCircle },
  { href: "/settings/threads", label: "Settings / Threads", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-secondary/35">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background p-4 md:block">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-3 font-semibold">
          <CircleGauge className="h-5 w-5" />
          <span>Threads Dashboard</span>
        </Link>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction} className="absolute bottom-4 left-4 right-4">
          <Button type="submit" variant="outline" className="w-full justify-start">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
