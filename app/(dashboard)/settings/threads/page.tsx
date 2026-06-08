import Link from "next/link";
import { Cable, ExternalLink, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemoUser, requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
  }>;
};

export default async function ThreadsSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
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
          displayName: true,
          profilePictureUrl: true,
          connectedAt: true,
          expiresAt: true,
          isActive: true,
        },
      });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings / Threads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect an account through the official Meta/Threads OAuth flow.
        </p>
      </div>

      {params.connected ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Threads account connected.
        </div>
      ) : null}
      {params.disconnected ? (
        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          Threads account disconnected.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Connection status</CardTitle>
              <CardDescription>
                Access tokens are never sent to the browser and are stored encrypted.
              </CardDescription>
            </div>
            <Badge className={account ? "bg-emerald-100 text-emerald-800" : ""}>
              {account ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {account ? (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-md border bg-secondary/40 p-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Username</div>
                  <div className="mt-1 font-medium">@{account.username ?? "unknown"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Threads user ID</div>
                  <div className="mt-1 font-medium">{account.threadsUserId}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Connected at</div>
                  <div className="mt-1 font-medium">
                    {account.connectedAt.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Token expiry</div>
                  <div className="mt-1 font-medium">
                    {account.expiresAt ? account.expiresAt.toLocaleString() : "Unknown"}
                  </div>
                </div>
              </div>
              <form action="/api/auth/threads/disconnect" method="post">
                <Button type="submit" variant="destructive">
                  <Power className="h-4 w-4" />
                  Disconnect
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use OAuth only. The app will redirect you to the official Meta/Threads authorization page.
              </p>
              <Button asChild>
                <Link href="/api/auth/threads/start">
                  <Cable className="h-4 w-4" />
                  Connect Threads Account
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
