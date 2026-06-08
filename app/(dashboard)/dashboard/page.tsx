import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoUser, requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getPostCount(userId: string, status: string) {
  if (isDemoUser(userId)) {
    return 0;
  }

  return prisma.post.count({
    where: {
      userId,
      status,
    },
  });
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const account = isDemoUser(user.id)
    ? null
    : await prisma.threadsAccount.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
        orderBy: {
          connectedAt: "desc",
        },
        select: {
          threadsUserId: true,
          username: true,
          connectedAt: true,
          expiresAt: true,
          isActive: true,
        },
      });

  const [drafts, scheduled, published, failed] = await Promise.all([
    getPostCount(user.id, "draft"),
    getPostCount(user.id, "scheduled"),
    getPostCount(user.id, "published"),
    getPostCount(user.id, "failed"),
  ]);

  const metrics = [
    { label: "Total drafts", value: drafts, icon: FileText },
    { label: "Scheduled posts", value: scheduled, icon: Clock3 },
    { label: "Published posts", value: published, icon: CheckCircle2 },
    { label: "Failed posts", value: failed, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connection and post status overview for your workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/threads">
            Manage Threads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Threads connection</CardTitle>
              <CardDescription>OAuth tokens stay encrypted on the server.</CardDescription>
            </div>
            <Badge className={account ? "bg-emerald-100 text-emerald-800" : ""}>
              {account ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {account ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <div className="font-medium text-foreground">@{account.username ?? "unknown"}</div>
                <div>Username</div>
              </div>
              <div>
                  <div className="font-medium text-foreground">{account.threadsUserId}</div>
                <div>Threads user ID</div>
              </div>
              <div>
                <div className="font-medium text-foreground">
                    {account.expiresAt ? account.expiresAt.toLocaleString() : "Unknown"}
                </div>
                <div>Token expiry</div>
              </div>
            </div>
          ) : (
            "Connect an official Threads account before building composer and scheduler features."
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
